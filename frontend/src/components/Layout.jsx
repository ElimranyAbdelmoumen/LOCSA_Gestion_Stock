import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, X } from 'lucide-react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { sessionWarning, dismissWarning, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Session expiry warning banner */}
        {sessionWarning && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <span>Votre session expire dans moins de 5 minutes. Enregistrez votre travail.</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={logout} className="text-xs font-medium underline hover:no-underline">Se déconnecter</button>
              <button onClick={dismissWarning} className="text-amber-500 hover:text-amber-700"><X size={16} /></button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}

export default Layout
