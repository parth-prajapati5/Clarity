/**
 * UserProfile.jsx
 * User avatar chip in the top-right corner of the header.
 * Replace `avatarUrl` with a real asset path or Tauri-resolved local path.
 */

// Fallback avatar — a simple initial circle when no image is available
const FallbackAvatar = ({ name = 'A' }) => (
  <div className="w-full h-full flex items-center justify-center bg-primary-container/30 text-primary text-sm font-bold">
    {name.charAt(0).toUpperCase()}
  </div>
)

const UserProfile = ({ avatarUrl, name = 'Alex', onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`User profile — ${name}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Gracefully degrade to fallback if image fails
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <FallbackAvatar name={name} />
      )}
    </button>
  )
}

export default UserProfile
