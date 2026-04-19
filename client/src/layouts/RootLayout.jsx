import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function RootLayout() {
  return (
    <>
      <header className="topbar">
        <div className="topbarInner">
          <div className="topbarStack">
            <PageHeader />
            <Nav />
          </div>
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
