import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, PackagePlus, PackageMinus, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const allItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: true },
  { to: '/products',  icon: Package,          label: 'Produits',  adminOnly: true },
  { to: '/entries',   icon: PackagePlus,       label: 'Entrées',   adminOnly: false, activeColor: 'text-emerald-600', activeBg: 'bg-emerald-50' },
  { to: '/exits',     icon: PackageMinus,      label: 'Sorties',   adminOnly: false, activeColor: 'text-rose-600',    activeBg: 'bg-rose-50'    },
  { to: '/inventory', icon: ClipboardList,     label: 'Inventaire',adminOnly: false, activeColor: 'text-amber-600',   activeBg: 'bg-amber-50'   },
]

const BottomNav = () => {
  const { isAdmin } = useAuth()
  const items = isAdmin ? allItems : allItems.filter(i => !i.adminOnly)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch justify-around h-16">
        {items.map(({ to, icon: Icon, label, activeColor, activeBg }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-semibold tracking-wide transition-colors ${
                isActive
                  ? (activeColor || 'text-blue-600 dark:text-blue-400')
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? (activeBg || 'bg-blue-50 dark:bg-blue-900/30') : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
