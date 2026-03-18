import React from 'react'
import logo from '../assets/logo.png'
import { Mail, Phone, MapPin, Shield } from 'lucide-react'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
      <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Logo + nom */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src={logo} alt="LOCSA" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
          <div className="hidden sm:block">
            <p className="text-xs text-blue-300 leading-tight">Energie · Service · Telecom</p>
          </div>
        </div>

        {/* Infos entreprise */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-blue-200">
          <span className="flex items-center gap-1.5">
            <Phone size={12} className="text-orange-400" />
            +212 XX XX XX XX
          </span>
          <span className="flex items-center gap-1.5">
            <Mail size={12} className="text-orange-400" />
            contact@locsa.ma
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-orange-400" />
            Maroc
          </span>
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-1.5 text-xs text-blue-400 flex-shrink-0">
          <Shield size={12} />
          <span>© {year} LOCSA SARL — v1.0</span>
        </div>

      </div>
    </footer>
  )
}

export default Footer
