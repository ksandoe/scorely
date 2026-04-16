import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function RootLayout() {
  return (
    <div className="container">
      <header className="card">
        <PageHeader />
      </header>

      <div style={{ height: 12 }} />

      <header className="card">
        <Nav />
      </header>

      <div style={{ height: 12 }} />

      <div className="card">
        <Outlet />
      </div>
    </div>
  )
}
