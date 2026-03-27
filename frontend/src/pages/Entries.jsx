import React, { useEffect, useState } from 'react'
import { getEntries, createEntry, deleteEntry } from '../api/entries'
import { getProducts } from '../api/products'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Plus, X, Loader2, TrendingUp, Search, MapPin, Building2, Download, Printer, Trash2 } from 'lucide-react'
import { exportToExcel } from '../utils/exportUtils'
import Pagination from '../components/Pagination'
import ConfirmDialog from '../components/ConfirmDialog'

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
  { value: 'A', label: 'Catégorie A', sub: 'Moteurs électrogènes', color: 'bg-purple-100 text-purple-700', border: 'border-purple-400 bg-purple-50 text-purple-700' },
  { value: 'B', label: 'Catégorie B', sub: 'Gasoil (en L)',        color: 'bg-amber-100 text-amber-700',  border: 'border-amber-400 bg-amber-50 text-amber-700'  },
  { value: 'C', label: 'Catégorie C', sub: 'Standard',             color: 'bg-gray-100 text-gray-600',   border: 'border-blue-400 bg-blue-50 text-blue-700'   },
]

const emptyForm = {
  category: '',
  productName: '',
  dateEntry: today,
  quantity: '',
  comment: '',
  city: '',
  // Cat A
  code: '',
  serialNumber: '',
  brand: '',
  power: '',
  // Cat B
  station: '',
}

const Entries = () => {
  const { isAdmin, userCity } = useAuth()
  const toast = useToast()
  const [cancelTarget, setCancelTarget] = useState(null) // { id, ref }
  const [entriesPage, setEntriesPage] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fetchAll = async (city, page = 0) => {
    setLoading(true)
    setError('')
    const productCity = isAdmin ? (city || undefined) : userCity
    try {
      const [entriesRes, productsRes] = await Promise.all([
        getEntries(city || undefined, dateFrom || undefined, dateTo || undefined, page, 20),
        getProducts(productCity),
      ])
      setEntriesPage(entriesRes.data)
      setProducts(productsRes.data)
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll(cityFilter, 0) }, [cityFilter, dateFrom, dateTo])

  const openModal = () => {
    setForm(emptyForm)
    setFormErrors({})
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(emptyForm)
    setFormErrors({})
    setFormError('')
  }

  // Suggestions filtered by chosen category
  const filteredSuggestions = form.productName.trim() && form.category
    ? products.filter(p =>
        p.name.toLowerCase().includes(form.productName.toLowerCase()) &&
        (p.category || 'C') === form.category
      )
    : []

  const validateForm = () => {
    const errs = {}
    if (!form.category) errs.category = 'Sélectionnez une catégorie'
    if (!form.productName.trim()) errs.productName = 'Le nom du produit est requis'
    if (!form.dateEntry) errs.dateEntry = 'La date est requise'
    if (!form.quantity) errs.quantity = 'La quantité est requise'
    else if (isNaN(Number(form.quantity)) || Number(form.quantity) < 1) errs.quantity = 'Quantité invalide (min. 1)'
    if (isAdmin && !form.city) errs.city = 'La ville est requise'
    // Cat A fields are optional
    if (form.category === 'B') {
      if (!form.station.trim()) errs.station = 'La station est requise'
    }
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    if (formError) setFormError('')
  }

  const selectCategory = (cat) => {
    setForm({ ...emptyForm, category: cat })
    setFormErrors({})
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }

    setFormLoading(true)
    setFormError('')
    try {
      const payload = {
        productName: form.productName.trim(),
        dateEntry:   form.dateEntry,
        quantity:    Number(form.quantity),
        comment:     form.comment.trim() || null,
        category:    form.category,
        ...(isAdmin && form.city ? { city: form.city } : {}),
      }
      if (form.category === 'A') {
        payload.code         = form.code.trim()
        payload.serialNumber = form.serialNumber.trim()
        payload.brand        = form.brand.trim()
        payload.power        = form.power.trim()
      }
      if (form.category === 'B') {
        payload.station = form.station.trim()
      }
      await createEntry(payload)
      closeModal()
      toast.success('Entrée enregistrée avec succès')
      fetchAll(cityFilter, 0)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancelEntry = async () => {
    if (!cancelTarget) return
    try {
      await deleteEntry(cancelTarget.id)
      toast.success(`Entrée ${cancelTarget.ref || ''} annulée`)
      fetchAll(cityFilter, entriesPage.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'annulation.")
    } finally {
      setCancelTarget(null)
    }
  }

  const handleExportCSV = () => {
    const rows = entriesPage.content
    exportToExcel(rows, 'entrees-stock', [
      { key: 'reference',       header: 'Réf',           width: 18 },
      { key: 'productName',     header: 'Produit',        width: 28 },
      { key: 'productCategory', header: 'Catégorie',      width: 12 },
      { key: 'city',            header: 'Ville',          width: 14 },
      { key: 'quantity',        header: 'Quantité',       width: 12 },
      { key: 'dateEntry',       header: 'Date',           width: 14 },
      { key: 'createdBy',       header: 'Effectué par',   width: 18 },
      { key: 'station',         header: 'Station',        width: 18 },
      { key: 'code',            header: 'Code',           width: 14 },
      { key: 'serialNumber',    header: 'N° Série',       width: 16 },
      { key: 'brand',           header: 'Marque',         width: 16 },
      { key: 'power',           header: 'Puissance',      width: 14 },
      { key: 'comment',         header: 'Commentaire',    width: 30 },
    ], 'Rapport Entrées de Stock — LOCSA SARL')
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null
  const cityLabel  = (c) => CITIES.find(x => x.value === c)?.label || c
  const catColor   = (c) => CATEGORIES.find(x => x.value === c)?.color || 'bg-gray-100 text-gray-600'

  const filtered = entriesPage.content.filter(e => {
    const matchSearch =
      e.productName?.toLowerCase().includes(search.toLowerCase()) ||
      (e.comment || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.serialNumber || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || e.productCategory === catFilter
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Entrées de Stock</h1>
          <p className="text-gray-500 text-sm mt-1">{entriesPage.totalElements} entrée(s) enregistrée(s)</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 no-print">
            <Download size={16} /> Exporter
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 no-print">
            <Printer size={16} /> Imprimer
          </button>
          <button onClick={openModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouvelle Entrée
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par produit, code, N° série..."
            className="input-field pl-9"
          />
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm" placeholder="Du" />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm" placeholder="Au" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-gray-600 underline">Effacer</button>
          )}
        </div>

        {/* Cat filter */}
        <div className="flex gap-1">
          {['', 'A', 'B', 'C'].map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                catFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === '' ? 'Toutes' : `Cat. ${c}`}
            </button>
          ))}
        </div>

        {isAdmin ? (
          <div className="flex gap-1">
            <button onClick={() => setCityFilter('')} className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${cityFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Toutes</button>
            {CITIES.map(c => (
              <button key={c.value} onClick={() => setCityFilter(c.value)} className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${cityFilter === c.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.label}</button>
            ))}
          </div>
        ) : (
          <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${CITY_COLORS[userCity] || 'bg-gray-100 text-gray-600'}`}>
            <Building2 size={13} />
            {CITIES.find(c => c.value === userCity)?.label || userCity}
          </div>
        )}
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
            <TrendingUp size={40} className="text-gray-300" />
            <p className="text-gray-400">Aucune entrée trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
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
                {filtered.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400 text-xs font-mono">{entry.reference || '—'}</td>
                    <td className="table-cell text-gray-400 text-xs">{idx + 1}</td>
                    <td className="table-cell font-semibold text-gray-800">{entry.productName}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${catColor(entry.productCategory)}`}>
                        {entry.productCategory || 'C'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${CITY_COLORS[entry.city] || 'bg-gray-100 text-gray-600'}`}>
                        <MapPin size={10} />
                        {cityLabel(entry.city)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                        <TrendingUp size={14} />
                        +{entry.quantity}{entry.productCategory === 'B' ? ' L' : ''}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500 max-w-xs">
                      {entry.productCategory === 'A' && (
                        <div className="space-y-0.5">
                          {entry.code         && <div><span className="text-gray-400">Code:</span> {entry.code}</div>}
                          {entry.serialNumber && <div><span className="text-gray-400">N° Série:</span> {entry.serialNumber}</div>}
                          {entry.brand        && <div><span className="text-gray-400">Marque:</span> {entry.brand}</div>}
                          {entry.power        && <div><span className="text-gray-400">Puissance:</span> {entry.power}</div>}
                        </div>
                      )}
                      {entry.productCategory === 'B' && entry.station && (
                        <span className="text-amber-600">Station: {entry.station}</span>
                      )}
                      {entry.productCategory === 'C' && <span className="italic text-gray-300">—</span>}
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      <div>{formatDate(entry.dateEntry)}</div>
                      {formatTime(entry.createdAt) && (
                        <div className="text-xs text-gray-400">{formatTime(entry.createdAt)}</div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="table-cell">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">{entry.createdBy}</span>
                      </td>
                    )}
                    <td className="table-cell text-gray-500 max-w-xs truncate text-sm">
                      {entry.comment || <span className="italic text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="table-cell">
                        <button
                          onClick={() => setCancelTarget({ id: entry.id, ref: entry.reference })}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Annuler cette entrée"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={entriesPage.currentPage}
          totalPages={entriesPage.totalPages}
          totalElements={entriesPage.totalElements}
          pageSize={entriesPage.pageSize}
          onPageChange={(p) => fetchAll(cityFilter, p)}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle Entrée de Stock</h3>
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
                  {isAdmin ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        {CITIES.map(c => (
                          <button key={c.value} type="button"
                            onClick={() => { setForm(prev => ({ ...prev, city: c.value })); setFormErrors(prev => ({ ...prev, city: '' })) }}
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
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produit <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="productName"
                      value={form.productName}
                      onChange={e => { handleChange(e); setShowSuggestions(true) }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      className={`input-field ${formErrors.productName ? 'border-red-400' : ''}`}
                      placeholder="Taper le nom du produit..."
                      autoComplete="off"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map(p => (
                          <li key={p.id}
                            onMouseDown={() => { setForm(prev => ({ ...prev, productName: p.name })); setShowSuggestions(false); setFormErrors(prev => ({ ...prev, productName: '' })) }}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center text-sm"
                          >
                            <span className="font-medium text-gray-800">{p.name}</span>
                            <span className="text-gray-400 text-xs">
                              stock{!isAdmin ? ` ${CITIES.find(c => c.value === userCity)?.label || ''}` : ''}: {p.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {formErrors.productName && <p className="mt-1 text-xs text-red-500">{formErrors.productName}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'entrée <span className="text-red-500">*</span></label>
                    <input type="date" name="dateEntry" value={form.dateEntry} onChange={handleChange}
                      max={today}
                      className={`input-field ${formErrors.dateEntry ? 'border-red-400' : ''}`} />
                    {formErrors.dateEntry && <p className="mt-1 text-xs text-red-500">{formErrors.dateEntry}</p>}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité {form.category === 'B' ? '(Litres)' : ''} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                        className={`input-field ${form.category === 'B' ? 'pr-10' : ''} ${formErrors.quantity ? 'border-red-400' : ''}`}
                        placeholder="0" min="1" step="1" />
                      {form.category === 'B' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-600">L</span>
                      )}
                    </div>
                    {formErrors.quantity && <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>}
                  </div>

                  {/* Cat A: specific fields */}
                  {form.category === 'A' && (
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
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Marque</label>
                          <input type="text" name="brand" value={form.brand} onChange={handleChange}
                            className="input-field text-sm" placeholder="Marque" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Puissance</label>
                          <input type="text" name="power" value={form.power} onChange={handleChange}
                            className="input-field text-sm" placeholder="ex: 5 kVA" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cat B: station */}
                  {form.category === 'B' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Station (source) <span className="text-red-500">*</span></label>
                      <input type="text" name="station" value={form.station} onChange={handleChange}
                        className={`input-field ${formErrors.station ? 'border-red-400' : ''}`} placeholder="Nom de la station" />
                      {formErrors.station && <p className="mt-1 text-xs text-red-500">{formErrors.station}</p>}
                    </div>
                  )}

                  {/* Comment (Cat C + optional others) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commentaire {form.category === 'C' ? '' : '(optionnel)'}
                    </label>
                    <textarea name="comment" value={form.comment} onChange={handleChange}
                      className="input-field resize-none" placeholder="Commentaire" rows={2} />
                  </div>

                  <div className="flex gap-3 pt-2">
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
        title="Annuler cette entrée ?"
        message={`L'entrée ${cancelTarget?.ref || ''} sera supprimée et le stock recalculé.`}
        confirmLabel="Annuler l'entrée"
        onConfirm={handleCancelEntry}
        onCancel={() => setCancelTarget(null)}
        variant="danger"
      />
    </div>
  )
}

export default Entries
