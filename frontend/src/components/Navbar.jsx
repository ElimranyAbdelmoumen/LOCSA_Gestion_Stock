import React, { useState, useRef } from 'react'
import { Menu, LogOut, ChevronDown, Shield, User2, Moon, Sun, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { uploadAvatar } from '../api/users'

const Avatar = ({ avatarUrl, username, isAdmin, size = 8, rounded = 'rounded-xl' }) => {
  const [imgError, setImgError] = useState(false)
  const sizeClass = `w-${size} h-${size}`
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClass} ${rounded} object-cover shadow-sm`}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div className={`${sizeClass} ${rounded} flex items-center justify-center shadow-sm ${
      isAdmin ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'
    }`}>
      {isAdmin ? <Shield size={size * 2 - 1} className="text-white" /> : <User2 size={size * 2 - 1} className="text-white" />}
    </div>
  )
}

const Navbar = ({ onMenuClick }) => {
  const { user, logout, updateAvatar } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !user?.id) return
    setUploading(true)
    try {
      const res = await uploadAvatar(user.id, file)
      updateAvatar(res.data.avatarUrl + '?t=' + Date.now())
    } catch {
      alert('Erreur lors de l\'upload de la photo.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
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
          <span className="text-sm text-gray-500 dark:text-gray-400">Système opérationnel</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button onClick={toggleDarkMode} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all"
          >
            <Avatar avatarUrl={user?.avatarUrl} username={user?.username} isAdmin={isAdmin} size={8} />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user?.username}</p>
              <p className={`text-xs font-medium leading-tight ${isAdmin ? 'text-orange-500' : 'text-blue-500'}`}>
                {isAdmin ? '⚡ Administrateur' : '👤 Utilisateur'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 overflow-hidden">
                {/* Profile header */}
                <div className={`px-4 py-4 ${isAdmin ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                  <div className="flex items-center gap-3">
                    {/* Avatar with camera overlay */}
                    <div className="relative flex-shrink-0">
                      <Avatar avatarUrl={user?.avatarUrl} username={user?.username} isAdmin={isAdmin} size={12} />
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                        title="Changer ma photo"
                      >
                        {uploading
                          ? <Loader2 size={10} className="text-white animate-spin" />
                          : <Camera size={10} className="text-white" />
                        }
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.username}</p>
                      <p className={`text-xs font-medium ${isAdmin ? 'text-orange-600' : 'text-blue-600'}`}>
                        {isAdmin ? 'Administrateur' : 'Utilisateur'}
                      </p>
                      {user?.city && (
                        <p className="text-xs text-gray-400 mt-0.5">{user.city.charAt(0) + user.city.slice(1).toLowerCase()}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Cliquez sur 📷 pour changer votre photo</p>
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
                  >
                    <div className="w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <LogOut size={14} className="text-red-600" />
                    </div>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
