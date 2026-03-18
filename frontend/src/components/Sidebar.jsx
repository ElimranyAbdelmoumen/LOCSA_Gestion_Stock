import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

const navItems = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Tableau de Bord',
    color: 'text-white',
    bg: 'bg-white/20',
    activeBg: 'bg-white/30',
  },
  {
    to: '/products',
    icon: Package,
    label: 'Produits',
    color: 'text-white',
    bg: 'bg-white/20',
    activeBg: 'bg-white/30',
  },
  {
    to: '/entries',
    icon: PackagePlus,
    label: 'Entrées de Stock',
    color: 'text-emerald-300',
    bg: 'bg-emerald-400/30',
    activeBg: 'bg-emerald-500',
  },
  {
    to: '/exits',
    icon: PackageMinus,
    label: 'Sorties de Stock',
    color: 'text-rose-300',
    bg: 'bg-rose-400/30',
    activeBg: 'bg-rose-500',
  },
  {
    to: '/inventory',
    icon: ClipboardList,
    label: 'Inventaire',
    color: 'text-amber-300',
    bg: 'bg-amber-400/30',
    activeBg: 'bg-amber-500',
  },
]

const adminItems = [
  {
    to: '/users',
    icon: Users,
    label: 'Utilisateurs',
    color: 'text-white',
    bg: 'bg-white/20',
    activeBg: 'bg-white/30',
  },
]

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </div>
    </>
  )
}

const SidebarContent = () => {
  const { isAdmin } = useAuth()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center px-4 py-6 border-b border-white/10">
        <img src={logo} alt="LOCSA" className="h-14 w-auto object-contain" />
        <span className="mt-2 text-xs text-slate-400 font-medium tracking-widest uppercase">Gestion de Stock</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-widest px-3 mb-3">Menu principal</p>

        {navItems.filter(item => isAdmin || !['/', '/dashboard', '/products'].includes(item.to)).map(({ to, icon: Icon, label, color, bg, activeBg }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isActive ? `${activeBg} shadow-lg` : bg
                }`}>
                  <Icon size={17} className={isActive ? 'text-white' : color} />
                </div>
                <span className="font-medium">{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-widest">Administration</p>
            </div>
            {adminItems.map(({ to, icon: Icon, label, color, bg, activeBg }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive ? `${activeBg} shadow-lg` : bg
                    }`}>
                      <Icon size={17} className={isActive ? 'text-white' : color} />
                    </div>
                    <span className="font-medium">{label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-slate-500 text-center tracking-wide">© {new Date().getFullYear()} LOCSA SARL — v1.0</p>
      </div>
    </div>
  )
}

export default Sidebar
