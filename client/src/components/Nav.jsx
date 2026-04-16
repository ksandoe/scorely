import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav aria-label="Primary">
      <h2>Navigation</h2>
      <ul>
        <li>
          <NavLink to="/">Home</NavLink>
        </li>
        <li>
          <NavLink to="/account">Account</NavLink>
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
