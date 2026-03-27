import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()
  const showSidebar = pathname.startsWith('/admin')
  const showNavbar = !showSidebar

  return (
    <div className="layout">
      {showNavbar && <Navbar />}
      <div className={`content${showSidebar ? '' : ' no-sidebar'}`}>
        {showSidebar && <Sidebar />}
        <div className="page">
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}

export default App
