import React, { useEffect, useState } from 'react'
import { getInventories, createInventory, adjustStock } from '../api/inventory'
import { getProducts } from '../api/products'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/Pagination'
import { exportToExcel } from '../utils/exportUtils'
import {
  Plus, X, Loader2, ClipboardList,
  CheckCircle, TrendingUp, TrendingDown, Package, MapPin, Building2, FileDown
} from 'lucide-react'

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

const DiffBadge = ({ diff }) => {
  if (diff === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle size={11} /> Conforme
    </span>
  )
  if (diff < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <TrendingDown size={11} /> Manque {diff}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
      <TrendingUp size={11} /> Surplus +{diff}
    </span>
  )
}

const todayStr = new Date().toISOString().split('T')[0]
const emptyForm = { productId: '', realQuantity: '', comment: '', dateInventory: todayStr, city: '' }

const Inventory = () => {
  const { isAdmin, userCity } = useAuth()
  const [cityFilter, setCityFilter] = useState('')
  const [inventoriesPage, setInventoriesPage] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [adjustingId, setAdjustingId] = useState(null)
  const [filterDiff, setFilterDiff] = useState('all')
  const [adjustModal, setAdjustModal] = useState(null) // { id }
  const [adjustMotif, setAdjustMotif] = useState('')
  const [adjustMotifError, setAdjustMotifError] = useState('')

  const fetchAll = async (city, page = 0) => {
    setLoading(true)
    setError('')
    try {
      const [invRes, prodRes] = await Promise.all([getInventories(city || undefined, page, 20), getProducts()])
      setInventoriesPage(invRes.data)
      setProducts(prodRes.data)
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll(cityFilter, 0) }, [cityFilter])

  const selectedProduct = products.find(p => String(p.id) === String(form.productId)) || null

  // No live diff preview — the backend computes per-city stock at submission time.
  // Showing global product.quantity here would be misleading in a multi-city context.
  const previewDiff = null

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

  const validate = () => {
    const errs = {}
    if (isAdmin && !form.city) errs.city = 'La ville est requise'
    if (!form.productId) errs.productId = 'Veuillez sélectionner un produit'
    if (form.realQuantity === '') errs.realQuantity = 'La quantité réelle est requise'
    else if (isNaN(Number(form.realQuantity)) || Number(form.realQuantity) < 0)
      errs.realQuantity = 'Quantité invalide (min. 0)'
    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    setFormLoading(true)
    setFormError('')
    try {
      await createInventory({
        productName: selectedProduct.name,
        realQuantity: Number(form.realQuantity),
        comment: form.comment.trim() || null,
        dateInventory: form.dateInventory || null,
        city: isAdmin ? form.city : undefined,
      })
      closeModal()
      fetchAll(cityFilter, 0)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const openAdjustModal = (id) => {
    setAdjustModal({ id })
    setAdjustMotif('')
    setAdjustMotifError('')
  }

  const handleAdjustConfirm = async () => {
    if (!adjustMotif.trim()) {
      setAdjustMotifError('Le motif est obligatoire')
      return
    }
    setAdjustingId(adjustModal.id)
    try {
      await adjustStock(adjustModal.id, adjustMotif.trim())
      setAdjustModal(null)
      fetchAll(cityFilter, inventoriesPage.currentPage)
    } catch (err) {
      setAdjustMotifError(err.response?.data?.error || 'Erreur lors de l\'ajustement.')
    } finally {
      setAdjustingId(null)
    }
  }

  const handleExport = () => {
    exportToExcel(inventoriesPage.content, 'inventaire-stock', [
      { key: 'productName',    header: 'Produit',          width: 28 },
      { key: 'city',           header: 'Ville',            width: 14 },
      { key: 'realQuantity',   header: 'Qté réelle',       width: 12 },
      { key: 'systemQuantity', header: 'Qté système',      width: 14 },
      { key: 'difference',     header: 'Écart',            width: 10 },
      { key: 'dateInventory',  header: 'Date',             width: 14 },
      { key: 'createdBy',      header: 'Effectué par',     width: 18 },
      { key: 'adjustmentComment', header: 'Commentaire',   width: 30 },
    ], 'Rapport Inventaire de Stock — LOCSA SARL')
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const negCount  = inventoriesPage.content.filter(i => i.difference < 0).length
  const posCount  = inventoriesPage.content.filter(i => i.difference > 0).length
  const okCount   = inventoriesPage.content.filter(i => i.difference === 0).length

  const filtered = inventoriesPage.content.filter(i => {
    if (filterDiff === 'negative') return i.difference < 0
    if (filterDiff === 'positive') return i.difference > 0
    if (filterDiff === 'zero')     return i.difference === 0
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventaire</h1>
          <p className="text-gray-500 text-sm mt-1">{inventoriesPage.totalElements} inventaire(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <FileDown size={16} />
            Excel
          </button>
          <button onClick={openModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Nouvel Inventaire
          </button>
        </div>
      </div>

      {/* City filters — admin only, badge for user */}
      <div className="flex flex-wrap gap-2">
        {isAdmin ? (
          <>
            <button
              onClick={() => setCityFilter('')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                cityFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes les villes
            </button>
            {CITIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCityFilter(c.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  cityFilter === c.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
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

      {/* KPI Cards — ADMIN only */}
      {isAdmin && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilterDiff(filterDiff === 'negative' ? 'all' : 'negative')}
          className={`card flex items-center gap-4 text-left transition-all border-2 ${filterDiff === 'negative' ? 'border-red-400' : 'border-transparent'}`}
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Manques détectés</p>
            <p className="text-2xl font-bold text-red-600">{negCount}</p>
          </div>
        </button>

        <button
          onClick={() => setFilterDiff(filterDiff === 'positive' ? 'all' : 'positive')}
          className={`card flex items-center gap-4 text-left transition-all border-2 ${filterDiff === 'positive' ? 'border-orange-400' : 'border-transparent'}`}
        >
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Surplus détectés</p>
            <p className="text-2xl font-bold text-orange-500">{posCount}</p>
          </div>
        </button>

        <button
          onClick={() => setFilterDiff(filterDiff === 'zero' ? 'all' : 'zero')}
          className={`card flex items-center gap-4 text-left transition-all border-2 ${filterDiff === 'zero' ? 'border-green-400' : 'border-transparent'}`}
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Stocks conformes</p>
            <p className="text-2xl font-bold text-green-600">{okCount}</p>
          </div>
        </button>
      </div>}

      {isAdmin && filterDiff !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtre actif :</span>
          <span className="text-sm font-medium text-blue-600">
            {filterDiff === 'negative' ? 'Manques' : filterDiff === 'positive' ? 'Surplus' : 'Conformes'}
          </span>
          <button onClick={() => setFilterDiff('all')} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
            Effacer
          </button>
        </div>
      )}

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
            <ClipboardList size={40} className="text-gray-300" />
            <p className="text-gray-400">Aucun inventaire trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="table-header">Produit</th>
                  <th className="table-header">Ville</th>
                  {isAdmin && <th className="table-header text-center">Système</th>}
                  <th className="table-header text-center">Réel compté</th>
                  {isAdmin && <th className="table-header text-center">Écart</th>}
                  <th className="table-header">Date</th>
                  <th className="table-header">Effectué par</th>
                  <th className="table-header">Commentaire</th>
                  {isAdmin && <th className="table-header text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      inv.difference < 0 ? 'bg-red-50/40' :
                      inv.difference > 0 ? 'bg-orange-50/40' : ''
                    }`}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package size={13} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{inv.productName}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {inv.city && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${CITY_COLORS[inv.city] || 'bg-gray-100 text-gray-600'}`}>
                          <MapPin size={10} />
                          {CITIES.find(c => c.value === inv.city)?.label || inv.city}
                        </span>
                      )}
                    </td>
                    {isAdmin && <td className="table-cell text-center text-gray-600">{inv.systemQuantity}</td>}
                    <td className="table-cell text-center font-bold text-gray-800">{inv.realQuantity}</td>
                    {isAdmin && <td className="table-cell text-center"><DiffBadge diff={inv.difference} /></td>}
                    <td className="table-cell text-gray-500 text-sm">{formatDate(inv.dateInventory)}</td>
                    <td className="table-cell">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                        {inv.createdBy}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 max-w-xs truncate text-sm">
                      {inv.comment || <span className="italic text-gray-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-center">
                        {inv.difference !== 0 ? (
                          <button
                            onClick={() => openAdjustModal(inv.id)}
                            disabled={adjustingId === inv.id}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            {adjustingId === inv.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <CheckCircle size={11} />}
                            Ajuster
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs text-green-500 font-medium">✓ Ajusté</span>
                            {inv.adjustmentComment && (
                              <span className="text-[10px] text-gray-400 italic max-w-[100px] truncate" title={inv.adjustmentComment}>
                                {inv.adjustmentComment}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={inventoriesPage.currentPage}
          totalPages={inventoriesPage.totalPages}
          totalElements={inventoriesPage.totalElements}
          pageSize={inventoriesPage.pageSize}
          onPageChange={(p) => fetchAll(cityFilter, p)}
        />
      </div>

      {/* Adjust Motif Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Motif d'ajustement</h3>
              </div>
              <button onClick={() => setAdjustModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                Veuillez préciser le motif de la correction du stock. Ce motif sera enregistré dans l'historique.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adjustMotif}
                  onChange={e => { setAdjustMotif(e.target.value); setAdjustMotifError('') }}
                  className={`input-field resize-none ${adjustMotifError ? 'border-red-400' : ''}`}
                  placeholder="Ex: Comptage physique confirmé, perte constatée..."
                  rows={3}
                  autoFocus
                />
                {adjustMotifError && <p className="mt-1 text-xs text-red-500">{adjustMotifError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAdjustModal(null)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button
                  onClick={handleAdjustConfirm}
                  disabled={!!adjustingId}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {adjustingId ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Nouvel Inventaire</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}

              {/* Ville — admin seulement */}
              {isAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {CITIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => { setForm(prev => ({ ...prev, city: c.value, productId: '' })); setFormErrors(prev => ({ ...prev, city: '' })) }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                          form.city === c.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {c.label}
                      </button>
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

              {/* Product select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit <span className="text-red-500">*</span>
                </label>
                <select
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  className={`input-field ${formErrors.productId ? 'border-red-400' : ''}`}
                >
                  <option value="">— Sélectionner un produit —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {isAdmin ? `${p.name} (stock total : ${p.quantity})` : p.name}
                    </option>
                  ))}
                </select>
                {formErrors.productId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.productId}</p>
                )}
              </div>

              {/* System quantity note — per-city stock calculated by backend at save time */}
              {selectedProduct && isAdmin && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700 font-medium">
                    Le stock système par ville sera calculé automatiquement à l'enregistrement.
                  </span>
                </div>
              )}

              {/* Real quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité réelle comptée <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="realQuantity"
                  value={form.realQuantity}
                  onChange={handleChange}
                  className={`input-field ${formErrors.realQuantity ? 'border-red-400' : ''}`}
                  placeholder="0"
                  min="0"
                />
                {formErrors.realQuantity && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.realQuantity}</p>
                )}
              </div>

              {/* Live diff preview — visible ADMIN only */}
              {isAdmin && previewDiff !== null && (
                <div className={`p-3 rounded-lg border flex justify-between items-center ${
                  previewDiff < 0 ? 'bg-red-50 border-red-200' :
                  previewDiff > 0 ? 'bg-orange-50 border-orange-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <span className="text-sm font-medium text-gray-700">Écart calculé</span>
                  <DiffBadge diff={previewDiff} />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'inventaire <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateInventory"
                  value={form.dateInventory}
                  onChange={handleChange}
                  className="input-field"
                  max={todayStr}
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  className="input-field resize-none"
                  placeholder="Observations, remarques... (optionnel)"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {formLoading && <Loader2 size={16} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
