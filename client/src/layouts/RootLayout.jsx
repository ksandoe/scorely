import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function RootLayout() {
  return (
    <>
      <header className="topbar">
        <div className="topbarInner">
          <PageHeader />
          <div style={{ height: 10 }} />
          <Nav />
        </div>
      </header>

      <div className="container">
        <div className="stack">
          <Outlet />
        </div>
      </div>
    </>
  )
}
