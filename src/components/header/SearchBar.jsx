/**
 * SearchBar.jsx
 * Rounded search input with inset icon — matches Stitch design exactly.
 */

import MaterialIcon from '../ui/MaterialIcon'

const SearchBar = ({ placeholder = 'Search insights...' }) => {
  return (
    <div className="relative group">
      <MaterialIcon
        name="search"
        size="text-xl"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors"
      />
      <input
        type="text"
        placeholder={placeholder}
        className="
          bg-surface-variant/40 border-none rounded-full
          pl-10 pr-4 py-1.5 w-64
          focus:outline-none focus:ring-1 focus:ring-primary
          text-sm font-body-md text-on-surface
          placeholder:text-outline
        "
      />
    </div>
  )
}

export default SearchBar
