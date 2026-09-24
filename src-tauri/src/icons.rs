// icons.rs — Native Windows application icon extraction with multi-tier caching.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use parking_lot::Mutex;

#[cfg(target_os = "windows")]
use windows_sys::Win32::{
    Foundation::MAX_PATH,
    Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, GetObjectW,
        BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HDC,
    },
    UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON},
    UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, ICONINFO},
};

/// Service managing extraction, disk caching, and in-memory caching of application icons.
pub struct IconService {
    cache_dir: PathBuf,
    mem_cache: Mutex<HashMap<String, String>>, // lowercase exe -> data:image/png;base64,...
    path_cache: Mutex<HashMap<String, PathBuf>>, // lowercase exe -> resolved executable or shortcut PathBuf
}

impl IconService {
    pub fn new(cache_dir: PathBuf) -> Self {
        let _ = std::fs::create_dir_all(&cache_dir);
        let service = Self {
            cache_dir,
            mem_cache: Mutex::new(HashMap::new()),
            path_cache: Mutex::new(HashMap::new()),
        };

        service.preload_disk_cache();
        service.preload_common_paths();
        service
    }

    /// Load existing cached icons from disk into memory for instant startup access.
    fn preload_disk_cache(&self) {
        let mut mem = self.mem_cache.lock();
        if let Ok(entries) = std::fs::read_dir(&self.cache_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext.eq_ignore_ascii_case("png")) {
                    if let Some(stem) = path.file_stem() {
                        let key = stem.to_string_lossy().to_lowercase();
                        if let Ok(bytes) = std::fs::read(&path) {
                            let b64 = base64_encode(&bytes);
                            mem.insert(key, format!("data:image/png;base64,{}", b64));
                        }
                    }
                }
            }
        }
        log::info!("[icons] Preloaded {} icons from disk cache", mem.len());
    }

    /// Pre-populate common paths from Start Menu shortcuts for fast path resolution.
    fn preload_common_paths(&self) {
        let mut paths = self.path_cache.lock();
        let mut search_dirs = Vec::new();
        if let Ok(p) = std::env::var("ProgramData") {
            search_dirs.push(PathBuf::from(p).join(r"Microsoft\Windows\Start Menu\Programs"));
        }
        if let Ok(a) = std::env::var("APPDATA") {
            search_dirs.push(PathBuf::from(a).join(r"Microsoft\Windows\Start Menu\Programs"));
        }
        if let Ok(l) = std::env::var("LOCALAPPDATA") {
            search_dirs.push(PathBuf::from(l).join("Programs"));
        }

        for base in search_dirs {
            if base.exists() {
                self.scan_dir_for_paths(&base, &mut paths, 0);
            }
        }
    }

    fn scan_dir_for_paths(&self, dir: &Path, paths: &mut HashMap<String, PathBuf>, depth: usize) {
        if depth > 4 { return; }
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    self.scan_dir_for_paths(&p, paths, depth + 1);
                } else if p.extension().map_or(false, |e| e.eq_ignore_ascii_case("lnk")) {
                    if let Ok(bytes) = std::fs::read(&p) {
                        if let Some(exe) = extract_exe_from_bytes(&bytes) {
                            if !paths.contains_key(&exe) {
                                paths.insert(exe, p.clone());
                            }
                        }
                    }
                } else if p.extension().map_or(false, |e| e.eq_ignore_ascii_case("exe")) {
                    if let Some(name) = p.file_name() {
                        let exe = name.to_string_lossy().to_lowercase();
                        if !paths.contains_key(&exe) {
                            paths.insert(exe, p.clone());
                        }
                    }
                }
            }
        }
    }

    /// Retrieve the Data URL icon for an application by executable name or path.
    pub fn get_icon(&self, executable_or_path: &str) -> Option<String> {
        let clean_exe = clean_exe_key(executable_or_path);
        if clean_exe.is_empty() {
            return None;
        }

        // 1. Check in-memory cache
        {
            let mem = self.mem_cache.lock();
            if let Some(icon) = mem.get(&clean_exe) {
                return Some(icon.clone());
            }
        }

        // 2. Check disk cache
        let disk_path = self.cache_dir.join(format!("{}.png", clean_exe));
        if disk_path.exists() {
            if let Ok(bytes) = std::fs::read(&disk_path) {
                let data_url = format!("data:image/png;base64,{}", base64_encode(&bytes));
                let mut mem = self.mem_cache.lock();
                mem.insert(clean_exe.clone(), data_url.clone());
                return Some(data_url);
            }
        }

        // 3. Resolve executable full path
        let resolved_path = self.resolve_exe_path(executable_or_path);
        let path_to_extract = match resolved_path {
            Some(p) => p,
            None => {
                // If it's already an existing file path, use it directly
                let p = PathBuf::from(executable_or_path);
                if p.exists() { p } else { return None; }
            }
        };

        // 4. Extract native Windows icon
        #[cfg(target_os = "windows")]
        {
            if let Some(png_bytes) = extract_native_icon_png(&path_to_extract) {
                // Save to disk cache for persistence across restarts
                let _ = std::fs::write(&disk_path, &png_bytes);

                let data_url = format!("data:image/png;base64,{}", base64_encode(&png_bytes));
                let mut mem = self.mem_cache.lock();
                mem.insert(clean_exe, data_url.clone());
                return Some(data_url);
            }
        }

        None
    }

    /// Batch lookup for multiple executables.
    pub fn get_icons(&self, executables: &[String]) -> HashMap<String, String> {
        let mut result = HashMap::new();
        for exe in executables {
            if let Some(icon) = self.get_icon(exe) {
                result.insert(exe.clone(), icon);
            }
        }
        result
    }

    /// Record a known full path for an executable (e.g. from foreground tracking).
    pub fn register_path(&self, exe: &str, full_path: &Path) {
        let key = clean_exe_key(exe);
        if !key.is_empty() && full_path.exists() {
            let mut paths = self.path_cache.lock();
            paths.insert(key, full_path.to_path_buf());
        }
    }

    /// Attempt to resolve the physical path of an executable.
    fn resolve_exe_path(&self, executable: &str) -> Option<PathBuf> {
        let key = clean_exe_key(executable);

        // Check path cache
        {
            let paths = self.path_cache.lock();
            if let Some(p) = paths.get(&key) {
                if p.exists() {
                    return Some(p.clone());
                }
            }
        }

        // Check Windows App Paths Registry
        #[cfg(target_os = "windows")]
        if let Some(reg_path) = query_app_paths_registry(&key) {
            if reg_path.exists() {
                let mut paths = self.path_cache.lock();
                paths.insert(key.clone(), reg_path.clone());
                return Some(reg_path);
            }
        }

        // Check common system and program locations
        let candidates = [
            format!(r"C:\Program Files\{}\{}", strip_exe_suffix(&key), key),
            format!(r"C:\Program Files (x86)\{}\{}", strip_exe_suffix(&key), key),
            format!(r"C:\Windows\System32\{}", key),
            format!(r"C:\Windows\{}", key),
        ];

        for c in &candidates {
            let p = PathBuf::from(c);
            if p.exists() {
                let mut paths = self.path_cache.lock();
                paths.insert(key.clone(), p.clone());
                return Some(p);
            }
        }

        None
    }
}

fn clean_exe_key(input: &str) -> String {
    let s = input.trim().to_lowercase();
    let name = Path::new(&s)
        .file_name()
        .map(|f| f.to_string_lossy().into_owned().to_lowercase())
        .unwrap_or(s);
    if name.ends_with(".exe") {
        name
    } else {
        format!("{}.exe", name)
    }
}

fn strip_exe_suffix(s: &str) -> &str {
    s.strip_suffix(".exe").unwrap_or(s)
}

/// Extract executable name from `.lnk` binary bytes.
fn extract_exe_from_bytes(bytes: &[u8]) -> Option<String> {
    let mut best_exe: Option<String> = None;

    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_graphic() || bytes[i] == b' ' {
            let start = i;
            while i < bytes.len() && (bytes[i].is_ascii_graphic() || bytes[i] == b' ') {
                i += 1;
            }
            let slice = &bytes[start..i];
            if slice.len() >= 5 {
                if let Ok(s) = std::str::from_utf8(slice) {
                    let s_lower = s.to_lowercase();
                    if s_lower.ends_with(".exe") {
                        let filename = Path::new(s)
                            .file_name()
                            .map(|f| f.to_string_lossy().into_owned())
                            .unwrap_or_else(|| s.to_string())
                            .to_lowercase();
                        if !filename.contains("uninstall") && !filename.contains("update") {
                            best_exe = Some(filename);
                        }
                    }
                }
            }
        } else {
            i += 1;
        }
    }

    best_exe
}

/// Native Windows icon extraction via SHGetFileInfoW and GDI GetDIBits, encoded to PNG.
#[cfg(target_os = "windows")]
fn extract_native_icon_png(target_path: &Path) -> Option<Vec<u8>> {
    let wide_path: Vec<u16> = target_path
        .to_string_lossy()
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let mut sfi: SHFILEINFOW = std::mem::zeroed();
        let res = SHGetFileInfoW(
            wide_path.as_ptr(),
            0,
            &mut sfi,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON,
        );

        if res == 0 || sfi.hIcon.is_null() {
            return None;
        }

        let mut icon_info: ICONINFO = std::mem::zeroed();
        if GetIconInfo(sfi.hIcon, &mut icon_info) == 0 {
            DestroyIcon(sfi.hIcon);
            return None;
        }

        let mut bm: BITMAP = std::mem::zeroed();
        if GetObjectW(
            icon_info.hbmColor as _,
            std::mem::size_of::<BITMAP>() as i32,
            &mut bm as *mut _ as *mut _,
        ) == 0 {
            if !icon_info.hbmColor.is_null() { DeleteObject(icon_info.hbmColor as _); }
            if !icon_info.hbmMask.is_null() { DeleteObject(icon_info.hbmMask as _); }
            DestroyIcon(sfi.hIcon);
            return None;
        }

        let width = bm.bmWidth as u32;
        let height = bm.bmHeight as u32;
        if width == 0 || height == 0 || width > 256 || height > 256 {
            if !icon_info.hbmColor.is_null() { DeleteObject(icon_info.hbmColor as _); }
            if !icon_info.hbmMask.is_null() { DeleteObject(icon_info.hbmMask as _); }
            DestroyIcon(sfi.hIcon);
            return None;
        }

        let hdc: HDC = CreateCompatibleDC(std::ptr::null_mut());
        let mut bmi: BITMAPINFO = std::mem::zeroed();
        bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        bmi.bmiHeader.biWidth = width as i32;
        bmi.bmiHeader.biHeight = -(height as i32); // Negative for top-down DIB
        bmi.bmiHeader.biPlanes = 1;
        bmi.bmiHeader.biBitCount = 32;
        bmi.bmiHeader.biCompression = BI_RGB;

        let pixel_count = (width * height) as usize;
        let mut bgra = vec![0u8; pixel_count * 4];

        let scan_lines = GetDIBits(
            hdc,
            icon_info.hbmColor,
            0,
            height,
            bgra.as_mut_ptr() as *mut _,
            &mut bmi,
            DIB_RGB_COLORS,
        );

        DeleteDC(hdc);
        if !icon_info.hbmColor.is_null() { DeleteObject(icon_info.hbmColor as _); }
        if !icon_info.hbmMask.is_null() { DeleteObject(icon_info.hbmMask as _); }
        DestroyIcon(sfi.hIcon);

        if scan_lines == 0 {
            return None;
        }

        // Convert BGRA to RGBA
        let mut rgba = vec![0u8; pixel_count * 4];
        let mut has_alpha = false;

        for i in 0..pixel_count {
            let src = i * 4;
            let dst = i * 4;
            rgba[dst]     = bgra[src + 2]; // R
            rgba[dst + 1] = bgra[src + 1]; // G
            rgba[dst + 2] = bgra[src];     // B
            rgba[dst + 3] = bgra[src + 3]; // A
            if bgra[src + 3] > 0 {
                has_alpha = true;
            }
        }

        // If icon had no alpha channel (legacy 24-bit in 32-bit container), set all pixels fully opaque
        if !has_alpha {
            for i in 0..pixel_count {
                rgba[i * 4 + 3] = 255;
            }
        }

        // Encode to PNG bytes in memory
        let mut png_bytes = Vec::new();
        {
            let mut encoder = png::Encoder::new(&mut png_bytes, width, height);
            encoder.set_color(png::ColorType::Rgba);
            encoder.set_depth(png::BitDepth::Eight);
            let mut writer = encoder.write_header().ok()?;
            writer.write_image_data(&rgba).ok()?;
        }

        Some(png_bytes)
    }
}

/// Query Windows App Paths in Registry for an executable name.
#[cfg(target_os = "windows")]
fn query_app_paths_registry(exe: &str) -> Option<PathBuf> {
    use std::os::windows::ffi::OsStringExt;
    use std::ffi::OsString;

    // Use RegOpenKeyExW and RegQueryValueExW via windows-sys or simple path resolution
    // App Paths is located under HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\<exe>
    let subkey = format!(r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{}", exe);
    let wide_subkey: Vec<u16> = subkey.encode_utf16().chain(std::iter::once(0)).collect();

    // Try reading registry using basic Win32 Reg calls
    unsafe {
        use windows_sys::Win32::System::Registry::{
            RegOpenKeyExW, RegQueryValueExW, RegCloseKey,
            HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER, KEY_READ,
        };

        for &hroot in &[HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER] {
            let mut hkey = std::mem::zeroed();
            if RegOpenKeyExW(hroot, wide_subkey.as_ptr(), 0, KEY_READ, &mut hkey) == 0 {
                let mut buf = [0u16; MAX_PATH as usize];
                let mut size = (buf.len() * 2) as u32;
                let res = RegQueryValueExW(
                    hkey,
                    std::ptr::null(), // default value
                    std::ptr::null_mut(),
                    std::ptr::null_mut(),
                    buf.as_mut_ptr() as *mut _,
                    &mut size,
                );
                RegCloseKey(hkey);

                if res == 0 && size > 2 {
                    let len = (size as usize / 2).saturating_sub(1);
                    let os_str = OsString::from_wide(&buf[..len]);
                    let clean = os_str.to_string_lossy().trim_matches('"').to_string();
                    let path = PathBuf::from(clean);
                    if path.exists() {
                        return Some(path);
                    }
                }
            }
        }
    }

    None
}

/// Fast Base64 encoder avoiding external crate dependency.
pub fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        let n = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);
        out.push(CHARS[((n >> 18) & 63) as usize] as char);
        out.push(CHARS[((n >> 12) & 63) as usize] as char);
        if chunk.len() > 1 {
            out.push(CHARS[((n >> 6) & 63) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(CHARS[(n & 63) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64_encode() {
        assert_eq!(base64_encode(b"hello"), "aGVsbG8=");
        assert_eq!(base64_encode(b"world!"), "d29ybGQh");
        assert_eq!(base64_encode(b""), "");
    }

    #[test]
    fn test_clean_exe_key() {
        assert_eq!(clean_exe_key(r"C:\Program Files\Google\Chrome\Application\chrome.exe"), "chrome.exe");
        assert_eq!(clean_exe_key("Code.exe"), "code.exe");
        assert_eq!(clean_exe_key("Discord"), "discord.exe");
    }

    #[test]
    fn test_extract_native_icon_system_app() {
        let temp_dir = std::env::temp_dir().join("clarity_test_icons");
        let service = IconService::new(temp_dir.clone());

        // Test extracting icon from a standard Windows executable that always exists
        let notepad_icon = service.get_icon("notepad.exe");
        println!("Notepad icon present: {}", notepad_icon.is_some());
        if let Some(ref icon) = notepad_icon {
            assert!(icon.starts_with("data:image/png;base64,"));
        }

        // Test extracting from full path to cmd.exe or explorer.exe
        let explorer_path = std::path::PathBuf::from(r"C:\Windows\explorer.exe");
        if explorer_path.exists() {
            let icon = service.get_icon(explorer_path.to_str().unwrap());
            assert!(icon.is_some());
            assert!(icon.unwrap().starts_with("data:image/png;base64,"));
        }

        // Cleanup
        let _ = std::fs::remove_dir_all(temp_dir);
    }
}

