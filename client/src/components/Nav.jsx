import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav aria-label="Primary">
      <ul className="navPills">
        <li>
          <NavLink to="/">Home</NavLink>
        </li>
        <li>
          <NavLink to="/discover">Discover</NavLink>
        </li>
        <li>
          <NavLink to="/songs">Songs</NavLink>
        </li>
        <li>
          <NavLink to="/history">History</NavLink>
        </li>
        <li>
          <NavLink to="/bookmarks">Bookmarks</NavLink>
        </li>
        <li>
          <NavLink to="/friends">Friends</NavLink>
        </li>
      </ul>
    </nav>
  )
}
