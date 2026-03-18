import React, { useState } from 'react'
import { Menu, LogOut, ChevronDown, Shield, User2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-500">Système opérationnel</span>
        </div>
      </div>

      {/* Right - User menu */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
        >
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
            isAdmin ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'
          }`}>
            {isAdmin
              ? <Shield size={15} className="text-white" />
              : <User2 size={15} className="text-white" />
            }
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.username}</p>
            <p className={`text-xs font-medium leading-tight ${isAdmin ? 'text-orange-500' : 'text-blue-500'}`}>
              {isAdmin ? '⚡ Administrateur' : '👤 Utilisateur'}
            </p>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              <div className={`px-4 py-3 ${isAdmin ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isAdmin ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {isAdmin
                      ? <Shield size={14} className="text-white" />
                      : <User2 size={14} className="text-white" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user?.username}</p>
                    <p className={`text-xs font-medium ${isAdmin ? 'text-orange-600' : 'text-blue-600'}`}>
                      {isAdmin ? 'Administrateur' : 'Utilisateur'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                    <LogOut size={14} className="text-red-600" />
                  </div>
                  Se déconnecter
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
