import React, { useEffect, useState } from 'react'
import { getExits, createExit, deleteExit } from '../api/exits'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'
import { getProducts } from '../api/products'
import { getSites } from '../api/sites'
import { useAuth } from '../context/AuthContext'
import { Plus, X, Loader2, TrendingDown, Search, Package, MapPin, Building2, Download, Printer, Trash2 } from 'lucide-react'
import { exportToExcel } from '../utils/exportUtils'
import Pagination from '../components/Pagination'

const today = new Date().toISOString().split('T')[0]

const CITIES = [
  { value: 'TANGER',     label: 'Tanger' },
  { value: 'MEKNES',     label: 'Meknès' },
  { value: 'CASABLANCA', label: 'Casablanca' },
]

const CITY_COLORS = {
  TANGER:     'bg-blue-100 text-blue-700',
  MEKNES:     'bg-emerald-100 text-emerald-700',
  CASABLANCA: 'bg-orange-100 text-orange-700',
}

const CATEGORIES = [
  { value: 'A', label: 'Catégorie A', sub: 'Moteurs électrogènes', border: 'border-purple-400 bg-purple-50 text-purple-700' },
  { value: 'B', label: 'Catégorie B', sub: 'Gasoil (en L)',        border: 'border-amber-400 bg-amber-50 text-amber-700'   },
  { value: 'C', label: 'Catégorie C', sub: 'Standard',             border: 'border-blue-400 bg-blue-50 text-blue-700'     },
]

const CAT_COLOR = {
  A: 'bg-purple-100 text-purple-700',
  B: 'bg-amber-100 text-amber-700',
  C: 'bg-gray-100 text-gray-600',
}

const emptyForm = {
  category:       '',
  productId:      '',
  dateExit:       today,
  quantity:       '',
  beneficiary:    '',
  comment:        '',
  city:           '',
  siteId:         '',
  code:           '',
  serialNumber:   '',
  gasoilType:     '',   // 'GE' or 'VEHICULE' for Cat B
  immatriculation: '',
}

const Exits = () => {
  const { isAdmin, userCity, userCities } = useAuth()
  const toast = useToast()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [exitsPage, setExitsPage]       = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 })
  const [products, setProducts] = useState([])
  const [sites, setSites]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [cityFilter, setCityFilter]   = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [formErrors, setFormErrors]   = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError]     = useState('')

  const isMultiCity = !isAdmin && userCities && userCities.length > 1

  const fetchAll = async (city, page = 0) => {
    setLoading(true)
    setError('')
    const productCity = isAdmin ? (city || undefined) : (city || userCity)
    try {
      const [exitsRes, productsRes, sitesRes] = await Promise.all([
        getExits(city || undefined, dateFrom || undefined, dateTo || undefined, page, 20),
        getProducts(productCity),
        getSites(),
      ])
      setExitsPage(exitsRes.data)
      setProducts(productsRes.data)
      setSites(sitesRes.data)
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll(cityFilter, 0) }, [cityFilter, dateFrom, dateTo])

  // Products filtered by selected category
  const availableProducts = products.filter(p =>
    !form.category || (p.category || 'C') === form.category
  )

  const selectedProduct = products.find(p => String(p.id) === String(form.productId)) || null
  const isCatA = form.category === 'A'
  const isCatB = form.category === 'B'
  const isGasoilGE      = isCatB && form.gasoilType === 'GE'
  const isGasoilVehicule = isCatB && form.gasoilType === 'VEHICULE'

  // Non-admin: always filter sites by their assigned city
  // Admin: filter by the city selected in the form
  const effectiveCity = isAdmin ? form.city : userCity
  const activeSites = sites.filter(s => s.active && (!effectiveCity || s.city === effectiveCity))

  const openModal  = () => { setForm(emptyForm); setFormErrors({}); setFormError(''); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setForm(emptyForm); setFormErrors({}); setFormError('') }

  const selectCategory = (cat) => {
    setForm({ ...emptyForm, category: cat })
    setFormErrors({})
    setFormError('')
  }

  const validateForm = () => {
    const errs = {}
    if (!form.category) errs.category = 'Sélectionnez une catégorie'
    if ((isAdmin || isMultiCity) && !form.city) errs.city = 'La ville est requise'
    if (!form.productId) errs.productId = 'Veuillez sélectionner un produit'
    if (!form.dateExit)  errs.dateExit  = 'La date est requise'
    if (!form.quantity)  errs.quantity  = 'La quantité est requise'
    else if (isNaN(Number(form.quantity)) || Number(form.quantity) < 1) errs.quantity = 'Quantité invalide (min. 1)'

    if (isCatA) {
      if (!form.beneficiary.trim()) errs.beneficiary = 'Le bénéficiaire est requis'
    } else if (isCatB) {
      if (!form.gasoilType) errs.gasoilType = 'Sélectionnez le type de gasoil'
      else if (form.gasoilType === 'GE' && !form.siteId) errs.siteId = 'Le site de destination est requis'
      else if (form.gasoilType === 'VEHICULE' && !form.immatriculation.trim()) errs.immatriculation = "L'immatriculation est requise"
    } else {
      if (!form.beneficiary.trim()) errs.beneficiary = 'Le bénéficiaire est requis'
    }
    return errs
  }

  const handleChange = (e) => {
    const { name } = e.target
    const value = name === 'immatriculation' ? e.target.value.toUpperCase() : e.target.value
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setFormLoading(true)
    setFormError('')
    try {
      const payload = {
        productId: Number(form.productId),
        dateExit:  form.dateExit,
        quantity:  Number(form.quantity),
        comment:   form.comment.trim() || null,
        ...((isAdmin || isMultiCity) && form.city ? { city: form.city } : {}),
      }
      if (isCatA) {
        payload.beneficiary  = form.beneficiary.trim()
        payload.code         = form.code.trim()
        payload.serialNumber = form.serialNumber.trim()
      } else if (isCatB) {
        payload.gasoilType = form.gasoilType
        if (form.gasoilType === 'GE') {
          payload.siteId = Number(form.siteId)
        } else {
          payload.immatriculation = form.immatriculation.trim()
        }
      } else {
        payload.beneficiary = form.beneficiary.trim()
      }
      await createExit(payload)
      closeModal()
      toast.success('Sortie enregistrée avec succès')
      fetchAll(cityFilter, 0)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancelExit = async () => {
    if (!cancelTarget) return
    try {
      await deleteExit(cancelTarget.id)
      toast.success(`Sortie ${cancelTarget.ref || ''} annulée`)
      fetchAll(cityFilter, exitsPage.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'annulation.")
    } finally {
      setCancelTarget(null)
    }
  }

  const handleExportCSV = () => {
    const rows = exitsPage.content
    exportToExcel(rows, 'sorties-stock', [
      { key: 'reference',       header: 'Réf',           width: 18 },
      { key: 'productName',     header: 'Produit',        width: 28 },
      { key: 'productCategory', header: 'Catégorie',      width: 12 },
      { key: 'city',            header: 'Ville',          width: 14 },
      { key: 'quantity',        header: 'Quantité',       width: 12 },
      { key: 'dateExit',        header: 'Date',           width: 14 },
      { key: 'beneficiary',     header: 'Bénéficiaire',   width: 22 },
      { key: 'createdBy',       header: 'Effectué par',   width: 18 },
      { key: 'code',            header: 'Code',           width: 14 },
      { key: 'serialNumber',    header: 'N° Série',       width: 16 },
      { key: 'gasoilType',      header: 'Type Gasoil',    width: 14 },
      { key: 'immatriculation', header: 'Immatriculation',width: 16 },
      { key: 'siteName',        header: 'Site',           width: 20 },
      { key: 'comment',         header: 'Commentaire',    width: 30 },
    ], 'Rapport Sorties de Stock — LOCSA SARL')
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null
  const cityLabel  = (c) => CITIES.find(x => x.value === c)?.label || c

  const filtered = exitsPage.content.filter(e => {
    const matchSearch =
      e.productName?.toLowerCase().includes(search.toLowerCase()) ||
      (e.beneficiary || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.comment || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.serialNumber || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || e.productCategory === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Sorties de Stock</h1>
          <p className="text-gray-500 text-sm mt-0.5">{exitsPage.totalElements} sortie(s)</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handleExportCSV} className="no-print flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <Download size={15} /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => window.print()} className="no-print flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
            <Printer size={15} /> <span className="hidden sm:inline">Imprimer</span>
          </button>
          <button onClick={openModal} className="btn-primary flex items-center gap-1.5 px-3">
            <Plus size={16} /> <span className="hidden sm:inline">Nouvelle Sortie</span><span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher produit, bénéficiaire, code..."
            className="input-field pl-9" />
        </div>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm flex-1" />
          <span className="text-gray-400 text-sm flex-shrink-0">→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm flex-1" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-gray-600 underline flex-shrink-0">Effacer</button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          {['', 'A', 'B', 'C'].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${catFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c === '' ? 'Toutes' : `Cat. ${c}`}
            </button>
          ))}
          {(isAdmin || isMultiCity) ? (
            <>
              {(isAdmin ? CITIES : CITIES.filter(c => userCities.includes(c.value))).map(c => (
                <button key={c.value} onClick={() => setCityFilter(cityFilter === c.value ? '' : c.value)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${cityFilter === c.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c.label}
                </button>
              ))}
            </>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${CITY_COLORS[userCity] || 'bg-gray-100 text-gray-600'}`}>
              <Building2 size={13} />
              {CITIES.find(c => c.value === userCity)?.label || userCity}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingDown size={40} className="text-gray-300" />
            <p className="text-gray-400">Aucune sortie trouvée</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((exit) => (
                <div key={exit.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{exit.productName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{exit.reference || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-rose-600 font-bold text-base">-{exit.quantity}{exit.productCategory === 'B' ? 'L' : ''}</span>
                      {isAdmin && (
                        <button onClick={() => setCancelTarget({ id: exit.id, ref: exit.reference })}
                          className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CAT_COLOR[exit.productCategory] || CAT_COLOR.C}`}>{exit.productCategory || 'C'}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${CITY_COLORS[exit.city] || 'bg-gray-100 text-gray-600'}`}>
                      <MapPin size={9} />{cityLabel(exit.city)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(exit.dateExit)}</span>
                    {isAdmin && exit.createdBy && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">{exit.createdBy}</span>
                    )}
                  </div>
                  {exit.productCategory === 'B' && exit.gasoilType && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${exit.gasoilType === 'GE' ? 'bg-yellow-100 text-yellow-700' : 'bg-sky-100 text-sky-700'}`}>
                        {exit.gasoilType === 'GE' ? '⚡ GE' : '🚗 Véhicule'}
                      </span>
                      {exit.gasoilType === 'GE' && exit.siteName && <span className="text-amber-600">Site: {exit.siteName}</span>}
                      {exit.gasoilType === 'VEHICULE' && exit.immatriculation && <span className="text-sky-600 font-mono">{exit.immatriculation}</span>}
                    </div>
                  )}
                  {exit.beneficiary && <p className="mt-1 text-xs text-blue-600">Bénéf.: {exit.beneficiary}</p>}
                  {exit.comment && <p className="mt-1 text-xs text-gray-400 truncate">{exit.comment}</p>}
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="table-header">Réf</th>
                    <th className="table-header">#</th>
                    <th className="table-header">Produit</th>
                    <th className="table-header">Cat.</th>
                    <th className="table-header">Ville</th>
                    <th className="table-header">Qté</th>
                    <th className="table-header">Détails</th>
                    <th className="table-header">Date</th>
                    {isAdmin && <th className="table-header">Par</th>}
                    <th className="table-header">Commentaire</th>
                    {isAdmin && <th className="table-header"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((exit, idx) => (
                    <tr key={exit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-gray-400 text-xs font-mono">{exit.reference || '—'}</td>
                      <td className="table-cell text-gray-400 text-xs">{idx + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                            <Package size={13} className="text-red-500" />
                          </div>
                          <span className="font-semibold text-gray-800">{exit.productName}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${CAT_COLOR[exit.productCategory] || CAT_COLOR.C}`}>{exit.productCategory || 'C'}</span>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${CITY_COLORS[exit.city] || 'bg-gray-100 text-gray-600'}`}>
                          <MapPin size={10} /> {cityLabel(exit.city)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1 font-bold text-red-500">
                          <TrendingDown size={14} />-{exit.quantity}{exit.productCategory === 'B' ? ' L' : ''}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500 max-w-xs">
                        {exit.productCategory === 'A' && (
                          <div className="space-y-0.5">
                            {exit.code         && <div><span className="text-gray-400">Code:</span> {exit.code}</div>}
                            {exit.serialNumber && <div><span className="text-gray-400">N° Série:</span> {exit.serialNumber}</div>}
                            {exit.beneficiary  && <div><span className="text-gray-400">Bénéf.:</span> {exit.beneficiary}</div>}
                          </div>
                        )}
                        {exit.productCategory === 'B' && (
                          <div className="space-y-0.5">
                            {exit.gasoilType && (
                              <div>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${exit.gasoilType === 'GE' ? 'bg-yellow-100 text-yellow-700' : 'bg-sky-100 text-sky-700'}`}>
                                  {exit.gasoilType === 'GE' ? '⚡ GE' : '🚗 Véhicule'}
                                </span>
                              </div>
                            )}
                            {exit.gasoilType === 'GE' && exit.siteName && <div className="text-amber-600">Site: {exit.siteName}</div>}
                            {exit.gasoilType === 'VEHICULE' && exit.immatriculation && <div className="text-sky-600 font-mono">{exit.immatriculation}</div>}
                            {!exit.gasoilType && (exit.siteName ? <span className="text-amber-600">Site: {exit.siteName}</span> : <span className="text-gray-500">{exit.beneficiary}</span>)}
                          </div>
                        )}
                        {(!exit.productCategory || exit.productCategory === 'C') && (
                          <span className={exit.beneficiary ? 'text-blue-600' : 'italic text-gray-300'}>{exit.beneficiary || '—'}</span>
                        )}
                      </td>
                      <td className="table-cell text-gray-500 text-sm">
                        <div>{formatDate(exit.dateExit)}</div>
                        {formatTime(exit.createdAt) && <div className="text-xs text-gray-400">{formatTime(exit.createdAt)}</div>}
                      </td>
                      {isAdmin && (
                        <td className="table-cell">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{exit.createdBy}</span>
                        </td>
                      )}
                      <td className="table-cell text-gray-500 max-w-xs truncate text-sm">
                        {exit.comment || <span className="italic text-gray-300">—</span>}
                      </td>
                      {isAdmin && (
                        <td className="table-cell">
                          <button onClick={() => setCancelTarget({ id: exit.id, ref: exit.reference })}
                            className="text-red-400 hover:text-red-600 transition-colors" title="Annuler cette sortie">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination
          currentPage={exitsPage.currentPage}
          totalPages={exitsPage.totalPages}
          totalElements={exitsPage.totalElements}
          pageSize={exitsPage.pageSize}
          onPageChange={(p) => fetchAll(cityFilter, p)}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">Nouvelle Sortie de Stock</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>
              )}

              {/* Step 1: Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => selectCategory(c.value)}
                      className={`py-3 rounded-xl border-2 text-center transition-all ${
                        form.category === c.value
                          ? c.border + ' border-2'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-base font-bold">{c.value}</div>
                      <div className="text-xs mt-0.5 leading-tight">{c.sub}</div>
                    </button>
                  ))}
                </div>
                {formErrors.category && <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>}
              </div>

              {form.category && (
                <>
                  {/* City */}
                  {(isAdmin || isMultiCity) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        {(isAdmin ? CITIES : CITIES.filter(c => userCities.includes(c.value))).map(c => (
                          <button key={c.value} type="button"
                            onClick={() => { setForm(prev => ({ ...prev, city: c.value, productId: '', siteId: '' })); setFormErrors(prev => ({ ...prev, city: '' })) }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${form.city === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >{c.label}</button>
                        ))}
                      </div>
                      {formErrors.city && <p className="mt-1 text-xs text-red-500">{formErrors.city}</p>}
                    </div>
                  ) : (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${CITY_COLORS[userCity] || 'bg-gray-100 text-gray-600'}`}>
                      <MapPin size={14} />
                      Ville : {CITIES.find(c => c.value === userCity)?.label || userCity}
                    </div>
                  )}

                  {/* Product */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produit <span className="text-red-500">*</span></label>
                    {availableProducts.length === 0 ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                        Aucun produit Cat. {form.category} en stock. Vérifiez les produits et catégories.
                      </div>
                    ) : (
                      <select name="productId" value={form.productId} onChange={handleChange}
                        className={`input-field ${formErrors.productId ? 'border-red-400' : ''}`}>
                        <option value="">— Sélectionner un produit —</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                            {p.quantity <= 0 ? '⚠ ' : ''}{p.name} — stock: {p.quantity}{isCatB ? ' L' : ''}{p.quantity <= 0 ? ' (épuisé)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {formErrors.productId && <p className="mt-1 text-xs text-red-500">{formErrors.productId}</p>}
                  </div>

                  {/* Stock badge */}
                  {selectedProduct && (
                    <div className={`p-3 rounded-lg flex justify-between items-center border ${
                      isCatA ? 'bg-purple-50 border-purple-200' :
                      isCatB ? 'bg-amber-50 border-amber-200' :
                               'bg-orange-50 border-orange-200'
                    }`}>
                      <span className="text-sm font-medium text-gray-700">
                        Stock disponible
                        {!isAdmin && (
                          <span className={`ml-1 text-xs font-normal ${CITY_COLORS[form.city || userCity] || ''}`}>
                            ({CITIES.find(c => c.value === (form.city || userCity))?.label || (form.city || userCity)})
                          </span>
                        )}
                      </span>
                      <span className={`text-xl font-bold ${selectedProduct.quantity <= 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {selectedProduct.quantity}{isCatB ? ' L' : ''}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de sortie <span className="text-red-500">*</span></label>
                    <input type="date" name="dateExit" value={form.dateExit} onChange={handleChange}
                      max={today}
                      className={`input-field ${formErrors.dateExit ? 'border-red-400' : ''}`} />
                    {formErrors.dateExit && <p className="mt-1 text-xs text-red-500">{formErrors.dateExit}</p>}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité {isCatB ? '(Litres)' : ''} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                        className={`input-field ${isCatB ? 'pr-10' : ''} ${formErrors.quantity ? 'border-red-400' : ''}`}
                        placeholder="0" min="1" step="1" />
                      {isCatB && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-600">L</span>}
                    </div>
                    {formErrors.quantity && <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>}
                  </div>

                  {/* Cat A: code + serial + beneficiary */}
                  {isCatA && (
                    <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Détails moteur électrogène <span className="font-normal normal-case text-purple-400">(optionnel)</span></p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                          <input type="text" name="code" value={form.code} onChange={handleChange}
                            className="input-field text-sm" placeholder="Code" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">N° Série</label>
                          <input type="text" name="serialNumber" value={form.serialNumber} onChange={handleChange}
                            className="input-field text-sm" placeholder="N° série" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bénéficiaire <span className="text-red-500">*</span></label>
                        <input type="text" name="beneficiary" value={form.beneficiary} onChange={handleChange}
                          className={`input-field text-sm ${formErrors.beneficiary ? 'border-red-400' : ''}`} placeholder="Bénéficiaire" />
                        {formErrors.beneficiary && <p className="mt-1 text-xs text-red-500">{formErrors.beneficiary}</p>}
                      </div>
                    </div>
                  )}

                  {/* Cat B: gasoil type selector + conditional fields */}
                  {isCatB && (
                    <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Type de gasoil <span className="text-red-500">*</span></p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'GE',       label: 'Groupe Électrogène', icon: '⚡' },
                          { value: 'VEHICULE', label: 'Véhicule',           icon: '🚗' },
                        ].map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, gasoilType: t.value, siteId: '', immatriculation: '' }))
                              setFormErrors(prev => ({ ...prev, gasoilType: '', siteId: '', immatriculation: '' }))
                            }}
                            className={`py-3 rounded-xl border-2 text-center transition-all ${
                              form.gasoilType === t.value
                                ? 'border-amber-500 bg-amber-100 text-amber-800'
                                : 'border-gray-200 text-gray-500 hover:border-amber-300 bg-white'
                            }`}
                          >
                            <div className="text-lg">{t.icon}</div>
                            <div className="text-xs font-semibold mt-0.5">{t.label}</div>
                          </button>
                        ))}
                      </div>
                      {formErrors.gasoilType && <p className="text-xs text-red-500">{formErrors.gasoilType}</p>}

                      {/* GE: site selector */}
                      {isGasoilGE && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Site de destination <span className="text-red-500">*</span></label>
                          <select name="siteId" value={form.siteId} onChange={handleChange}
                            className={`input-field text-sm ${formErrors.siteId ? 'border-red-400' : ''}`}>
                            <option value="">— Sélectionner un site —</option>
                            {activeSites.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({CITIES.find(c => c.value === s.city)?.label || s.city})
                              </option>
                            ))}
                          </select>
                          {formErrors.siteId && <p className="mt-1 text-xs text-red-500">{formErrors.siteId}</p>}
                        </div>
                      )}

                      {/* Véhicule: immatriculation */}
                      {isGasoilVehicule && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Immatriculation <span className="text-red-500">*</span></label>
                          <input type="text" name="immatriculation" value={form.immatriculation} onChange={handleChange}
                            className={`input-field text-sm uppercase ${formErrors.immatriculation ? 'border-red-400' : ''}`}
                            placeholder="Ex: 12345-A-1" />
                          {formErrors.immatriculation && <p className="mt-1 text-xs text-red-500">{formErrors.immatriculation}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cat C: beneficiary */}
                  {!isCatA && !isCatB && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire <span className="text-red-500">*</span></label>
                      <input type="text" name="beneficiary" value={form.beneficiary} onChange={handleChange}
                        className={`input-field ${formErrors.beneficiary ? 'border-red-400' : ''}`} placeholder="Nom du bénéficiaire" />
                      {formErrors.beneficiary && <p className="mt-1 text-xs text-red-500">{formErrors.beneficiary}</p>}
                    </div>
                  )}

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                    <textarea name="comment" value={form.comment} onChange={handleChange}
                      className="input-field resize-none" placeholder="Commentaire (optionnel)" rows={2} />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                    <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {formLoading && <Loader2 size={16} className="animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                </>
              )}

              {!form.category && (
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Annuler</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Annuler cette sortie ?"
        message={`La sortie ${cancelTarget?.ref || ''} sera supprimée et le stock recalculé.`}
        confirmLabel="Annuler la sortie"
        onConfirm={handleCancelExit}
        onCancel={() => setCancelTarget(null)}
        variant="danger"
      />
    </div>
  )
}

export default Exits
