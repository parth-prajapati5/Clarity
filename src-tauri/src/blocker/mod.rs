// blocker/mod.rs
//
// Hosts-file based website blocking for Windows.
//
// DESIGN
// ──────
// Clarity adds entries of this form to %WINDIR%\System32\drivers\etc\hosts:
//
//   0.0.0.0 youtube.com        # CLARITY_BLOCK
//   0.0.0.0 www.youtube.com    # CLARITY_BLOCK
//
// All Clarity-owned lines carry the "# CLARITY_BLOCK" marker so the module
// can rewrite exactly those lines without touching anything else in the file.
//
// When a domain is unblocked, every line ending in "# CLARITY_BLOCK" that
// maps to that domain is removed.  All other existing content is preserved
// byte-for-byte.
//
// SUBDOMAINS
// ──────────
// Blocking "youtube.com" also blocks "www.youtube.com" (the two most common
// forms).  Additional subdomains (m.youtube.com, music.youtube.com, etc.)
// are NOT automatically blocked — a wildcard would require a local DNS server
// which is out of scope.  This is documented behavior.
//
// PRIVILEGE DETECTION
// ────────────────────
// The hosts file requires write access (typically Administrator).  If the
// write fails due to a permission error the function returns a descriptive
// Err rather than panicking, and the UI can display the reason.
//
// DNS CACHE FLUSH
// ───────────────
// After every write the module flushes the Windows DNS resolver cache via
// `ipconfig /flushdns` so that newly blocked/unblocked domains take effect
// immediately without a system restart.  Browser-internal DNS caches (e.g.
// Chrome's) may still hold the old record for up to 60 s; users can visit
// chrome://net-internals/#dns to clear them manually if needed.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

const CLARITY_MARKER: &str = "# CLARITY_BLOCK";
const REDIRECT_IP:    &str = "0.0.0.0";

// ── Locate hosts file ────────────────────────────────────────

fn hosts_path() -> PathBuf {
    // On all modern Windows: C:\Windows\System32\drivers\etc\hosts
    let windir = std::env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".into());
    Path::new(&windir)
        .join("System32")
        .join("drivers")
        .join("etc")
        .join("hosts")
}

// ── Domain normalisation ─────────────────────────────────────

/// Strip scheme, www., path, query, fragment and return the bare domain.
/// Returns None for obviously invalid input (empty, IP address, localhost,
/// domains that would be dangerous to block).
pub fn normalize_domain(input: &str) -> Option<String> {
    let mut s = input.trim();
    if s.is_empty() { return None; }

    // Strip common schemes
    for prefix in &["https://", "http://", "ftp://"] {
        if let Some(rest) = s.strip_prefix(prefix) { s = rest; break; }
    }

    // Strip www. prefix
    if let Some(rest) = s.strip_prefix("www.") { s = rest; }

    // Strip path / query / fragment
    let end = s.find(|c: char| c == '/' || c == '?' || c == '#' || c == ':')
               .unwrap_or(s.len());
    let domain = s[..end].trim().to_lowercase();

    // Basic validation
    if domain.is_empty()              { return None; }
    if domain == "localhost"          { return None; }
    if domain == "127.0.0.1"         { return None; }
    if domain == "0.0.0.0"           { return None; }
    if domain == "::1"               { return None; }
    if !domain.contains('.')         { return None; } // bare word — not a domain
    if domain.contains(' ')          { return None; } // typed search text
    // Reject raw IPv4/IPv6 addresses
    if domain.chars().all(|c| c.is_ascii_digit() || c == '.') { return None; }

    Some(domain)
}

// ── hosts file reader / writer ───────────────────────────────

fn read_hosts(path: &Path) -> io::Result<String> {
    fs::read_to_string(path)
}

/// Write `content` to the hosts file.
/// Returns a permission-friendly error message if access is denied.
fn write_hosts(path: &Path, content: &str) -> Result<(), String> {
    fs::write(path, content).map_err(|e| {
        if e.kind() == io::ErrorKind::PermissionDenied {
            format!(
                "Permission denied writing to {}. \
                 Please run Clarity as Administrator to enable website blocking.",
                path.display()
            )
        } else {
            format!("Failed to write hosts file: {}", e)
        }
    })
}

// ── DNS cache flush ──────────────────────────────────────────

fn flush_dns() {
    match Command::new("ipconfig").arg("/flushdns").output() {
        Ok(out) => {
            if out.status.success() {
                log::info!("[blocker] DNS cache flushed successfully");
            } else {
                log::warn!(
                    "[blocker] ipconfig /flushdns exited with non-zero status: {}",
                    String::from_utf8_lossy(&out.stderr)
                );
            }
        }
        Err(e) => log::warn!("[blocker] Could not run ipconfig /flushdns: {}", e),
    }
}

// ── Public API ───────────────────────────────────────────────

/// Add hosts-file entries for `domain` and `www.<domain>`.
/// Idempotent — if the entries already exist they are not duplicated.
pub fn block_domain(domain: &str) -> Result<(), String> {
    let path    = hosts_path();
    let content = read_hosts(&path).map_err(|e| format!("Cannot read hosts file: {}", e))?;

    let mut lines: Vec<String> = content.lines().map(str::to_owned).collect();

    // Entries we want to ensure are present
    let bare = domain.trim_start_matches("www.").to_lowercase();
    let www  = format!("www.{bare}");

    let entry_bare = format!("{REDIRECT_IP} {bare} {CLARITY_MARKER}");
    let entry_www  = format!("{REDIRECT_IP} {www} {CLARITY_MARKER}");

    let has_bare = lines.iter().any(|l| l.trim() == entry_bare.trim());
    let has_www  = lines.iter().any(|l| l.trim() == entry_www.trim());

    if has_bare && has_www {
        log::info!("[blocker] {} is already blocked — no hosts change needed", bare);
        return Ok(());
    }

    // Insert a blank separator before our block if the file doesn't already
    // end with a newline / blank line
    if !lines.last().map(|l| l.trim().is_empty()).unwrap_or(true) {
        lines.push(String::new());
    }

    if !has_bare { lines.push(entry_bare.clone()); }
    if !has_www  { lines.push(entry_www.clone());  }

    let new_content = lines.join("\n") + "\n";
    write_hosts(&path, &new_content)?;

    log::info!("[blocker] Blocked domain: {}", bare);
    flush_dns();
    Ok(())
}

/// Remove all Clarity-owned hosts entries for `domain`.
pub fn unblock_domain(domain: &str) -> Result<(), String> {
    let path    = hosts_path();
    let content = read_hosts(&path).map_err(|e| format!("Cannot read hosts file: {}", e))?;

    let bare = domain.trim_start_matches("www.").to_lowercase();
    let www  = format!("www.{bare}");

    // Keep every line that is NOT one of our entries
    let new_lines: Vec<&str> = content
        .lines()
        .filter(|line| {
            let trimmed = line.trim();
            let is_our_bare = trimmed == format!("{REDIRECT_IP} {bare} {CLARITY_MARKER}").as_str();
            let is_our_www  = trimmed == format!("{REDIRECT_IP} {www} {CLARITY_MARKER}").as_str();
            !(is_our_bare || is_our_www)
        })
        .collect();

    let new_content = new_lines.join("\n") + "\n";

    if new_content == content {
        log::info!("[blocker] No hosts entry found for {} — nothing removed", bare);
        return Ok(());
    }

    write_hosts(&path, &new_content)?;
    log::info!("[blocker] Unblocked domain: {}", bare);
    flush_dns();
    Ok(())
}

/// Remove ALL Clarity-owned entries from the hosts file.
/// Called during cleanup / uninstall — not exposed to the normal UI.
#[allow(dead_code)]
pub fn remove_all_clarity_entries() -> Result<(), String> {
    let path    = hosts_path();
    let content = read_hosts(&path).map_err(|e| format!("Cannot read hosts file: {}", e))?;

    let new_lines: Vec<&str> = content
        .lines()
        .filter(|line| !line.contains(CLARITY_MARKER))
        .collect();

    let new_content = new_lines.join("\n") + "\n";
    write_hosts(&path, &new_content)?;
    log::info!("[blocker] Removed all Clarity block entries from hosts file");
    flush_dns();
    Ok(())
}

/// Returns true if a Clarity-owned block entry exists for `domain`.
pub fn is_domain_blocked_in_hosts(domain: &str) -> bool {
    let path = hosts_path();
    let bare = domain.trim_start_matches("www.").to_lowercase();
    let entry = format!("{REDIRECT_IP} {bare} {CLARITY_MARKER}");
    match read_hosts(&path) {
        Ok(content) => content.lines().any(|l| l.trim() == entry.trim()),
        Err(_) => false,
    }
}

// ── Tests ────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::normalize_domain;

    #[test]
    fn test_normalize() {
        assert_eq!(normalize_domain("https://www.youtube.com/watch?v=123"),
                   Some("youtube.com".into()));
        assert_eq!(normalize_domain("youtube.com"),       Some("youtube.com".into()));
        assert_eq!(normalize_domain("www.youtube.com"),   Some("youtube.com".into()));
        assert_eq!(normalize_domain("YOUTUBE.COM"),       Some("youtube.com".into()));
        assert_eq!(normalize_domain("github.com/user"),   Some("github.com".into()));
        assert_eq!(normalize_domain("localhost"),          None);
        assert_eq!(normalize_domain("127.0.0.1"),          None);
        assert_eq!(normalize_domain("192.168.1.1"),        None);
        assert_eq!(normalize_domain("web"),                None); // no dot
        assert_eq!(normalize_domain("web development"),    None); // space
        assert_eq!(normalize_domain(""),                   None);
    }
}
