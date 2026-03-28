import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let _id = 0

const STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', bg: 'bg-white', icon_cls: 'text-emerald-500', border: 'border-emerald-100' },
  error:   { icon: XCircle,      bar: 'bg-red-500',     bg: 'bg-white', icon_cls: 'text-red-500',     border: 'border-red-100'     },
  warning: { icon: AlertTriangle, bar: 'bg-amber-500',  bg: 'bg-white', icon_cls: 'text-amber-500',   border: 'border-amber-100'   },
  info:    { icon: Info,          bar: 'bg-blue-500',    bg: 'bg-white', icon_cls: 'text-blue-500',    border: 'border-blue-100'    },
}

const Toast = ({ toast, onRemove }) => {
  const s = STYLES[toast.type] || STYLES.info
  const Icon = s.icon
  return (
    <div className={`flex items-start gap-3 ${s.bg} border ${s.border} rounded-xl shadow-lg px-4 py-3 min-w-[280px] max-w-sm overflow-hidden animate-slideIn`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />
      <Icon size={18} className={`${s.icon_cls} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-gray-700 flex-1 leading-snug pr-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_id
    setToasts(prev => [...prev.slice(-4), { id, message, type }]) // max 5 toasts
    if (duration > 0) setTimeout(() => remove(id), duration)
  }, [remove])

  const toast = {
    success: (msg) => add(msg, 'success', 4000),
    error:   (msg) => add(msg, 'error',   10000),
    warning: (msg) => add(msg, 'warning', 6000),
    info:    (msg) => add(msg, 'info',    4000),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto relative">
            <Toast toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
