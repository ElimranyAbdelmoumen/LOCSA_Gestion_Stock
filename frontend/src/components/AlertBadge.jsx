import React from 'react'

const AlertBadge = ({ quantity }) => {
  if (quantity <= 5) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        {quantity} — Critique
      </span>
    )
  }
  if (quantity <= 10) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
        {quantity} — Faible
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      {quantity} — Normal
    </span>
  )
}

export default AlertBadge
