import React, { useEffect, useState } from 'react'
import { getProducts, getProductsPaginated, createProduct, updateProduct, deleteProduct, getProductHistory } from '../api/products'
import AlertBadge from '../components/AlertBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { exportToExcel } from '../utils/exportUtils'
import { Plus, Pencil, Trash2, X, Loader2, Search, Package, History, TrendingUp, TrendingDown, ClipboardList, FileDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'A', label: 'Catégorie A', color: 'bg-purple-100 text-purple-700' },
  { value: 'B', label: 'Catégorie B (Gasoil)', color: 'bg-amber-100 text-amber-700' },
  { value: 'C', label: 'Catégorie C', color: 'bg-gray-100 text-gray-600' },
]

const emptyForm = { name: '', description: '', quantity: '', category: 'C', minQuantity: '0' }

const Products = () => {
  const [productsPage, setProductsPage] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null) // null = create, object = edit
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // History modal
  const [historyProduct, setHistoryProduct] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyCity, setHistoryCity] = useState('')

  const fetchProducts = async (page = 0) => {
    setLoading(true)
    setError('')
    try {
      const res = await getProductsPaginated(page, 20)
      setProductsPage(res.data)
    } catch {
      setError('Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts(0) }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      quantity: String(product.quantity),
      category: product.category || 'C',
      minQuantity: String(product.minQuantity ?? 0),
    })
    setFormErrors({})
    setFormError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormError('')
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Le nom est requis'
    if (form.quantity === '') errs.quantity = 'La quantité est requise'
    else if (isNaN(Number(form.quantity)) || Number(form.quantity) < 0) errs.quantity = 'Quantité invalide'
    return errs
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
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
        name: form.name.trim(),
        description: form.description.trim() || null,
        quantity: Number(form.quantity),
        category: form.category,
        minQuantity: Number(form.minQuantity) || 0,
      }
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      closeModal()
      fetchProducts(productsPage.currentPage)
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setDeleteLoading(true)
    try {
      await deleteProduct(confirmDelete.id)
      setConfirmDelete(null)
      fetchProducts(productsPage.currentPage)
    } catch (err) {
      alert(err.response?.data?.error || 'Impossible de supprimer ce produit.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openHistory = async (product) => {
    setHistoryProduct(product)
    setHistoryData([])
    setHistoryCity('')
    setHistoryLoading(true)
    try {
      const res = await getProductHistory(product.id, '')
      setHistoryData(res.data.content ?? res.data)
    } catch {
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchHistory = async (product, city) => {
    setHistoryLoading(true)
    try {
      const res = await getProductHistory(product.id, city)
      setHistoryData(res.data.content ?? res.data)
    } catch {
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleHistoryCityChange = (city) => {
    setHistoryCity(city)
    fetchHistory(historyProduct, city)
  }

  const filtered = productsPage.content.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    exportToExcel(filtered, 'produits-stock', [
      { key: 'name',        header: 'Nom du produit',  width: 30 },
      { key: 'category',    header: 'Catégorie',        width: 12 },
      { key: 'description', header: 'Description',      width: 35 },
      { key: 'quantity',    header: 'Quantité',         width: 12 },
      { key: 'minQuantity', header: 'Seuil min.',       width: 12 },
    ], 'Catalogue Produits — LOCSA SARL')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
          <p className="text-gray-500 text-sm mt-1">{productsPage.totalElements} produit(s) au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <FileDown size={16} />
            Exporter Excel
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Nouveau Produit
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="input-field pl-9"
        />
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
            <Package size={40} className="text-gray-300" />
            <p className="text-gray-400">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Catégorie</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Quantité</th>
                  <th className="table-header">Seuil min.</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-semibold text-gray-800">{product.name}</td>
                    <td className="table-cell">
                      {(() => {
                        const cat = CATEGORIES.find(c => c.value === (product.category || 'C'))
                        return (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cat?.color}`}>
                            {cat?.label || product.category}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="table-cell text-gray-500 max-w-xs truncate">
                      {product.description || <span className="italic text-gray-300">—</span>}
                    </td>
                    <td className="table-cell">
                      <AlertBadge quantity={product.quantity} minQuantity={product.minQuantity} />
                    </td>
                    <td className="table-cell text-gray-500 text-sm">
                      {product.minQuantity > 0 ? product.minQuantity : <span className="italic text-gray-300">—</span>}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openHistory(product)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Historique"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(product)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={productsPage.currentPage}
          totalPages={productsPage.totalPages}
          totalElements={productsPage.totalElements}
          pageSize={productsPage.pageSize}
          onPageChange={(p) => fetchProducts(p)}
        />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editing ? 'Modifier le Produit' : 'Nouveau Produit'}
              </h3>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: c.value }))}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                        form.category === c.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {c.value}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {CATEGORIES.find(c => c.value === form.category)?.label}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className={`input-field ${formErrors.name ? 'border-red-400' : ''}`}
                  placeholder="Nom du produit"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="input-field resize-none"
                  placeholder="Description (optionnel)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleFormChange}
                  className={`input-field ${formErrors.quantity ? 'border-red-400' : ''}`}
                  placeholder="0"
                  min="0"
                />
                {formErrors.quantity && <p className="mt-1 text-xs text-red-500">{formErrors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte (qté min)</label>
                <input
                  type="number"
                  name="minQuantity"
                  value={form.minQuantity}
                  onChange={handleFormChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-400">Laisser à 0 pour désactiver l'alerte de stock</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Supprimer le produit"
        message={`Supprimer "${confirmDelete?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* History Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '85vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} className="text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Historique — {historyProduct.name}
                </h3>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <span className="text-sm text-gray-500">Filtrer par ville :</span>
              {['', 'TANGER', 'MEKNES', 'CASABLANCA'].map(c => (
                <button
                  key={c}
                  onClick={() => handleHistoryCityChange(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    historyCity === c
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {c === '' ? 'Toutes' : c}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-4">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <History size={36} className="text-gray-300" />
                  <p className="text-gray-400 text-sm">Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyData.map((item, i) => {
                    const isEntry    = item.type === 'ENTRY'
                    const isExit     = item.type === 'EXIT'
                    const isInv      = item.type === 'INVENTORY'
                    const iconColor  = isEntry ? 'text-emerald-600' : isExit ? 'text-red-500' : 'text-amber-500'
                    const bgColor    = isEntry ? 'bg-emerald-50 border-emerald-100' : isExit ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                    const label      = isEntry ? 'Entrée' : isExit ? 'Sortie' : 'Inventaire'
                    const labelColor = isEntry ? 'bg-emerald-100 text-emerald-700' : isExit ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    const Icon       = isEntry ? TrendingUp : isExit ? TrendingDown : ClipboardList
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${bgColor}`}>
                        <div className={`mt-0.5 ${iconColor}`}><Icon size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${labelColor}`}>{label}</span>
                            {item.reference && <span className="text-xs font-mono text-gray-400">{item.reference}</span>}
                            {item.city && <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.city}</span>}
                          </div>
                          <div className="mt-1 flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-gray-800 dark:text-gray-100">{item.quantity} {isInv ? '(réel)' : 'unités'}</span>
                            {item.details && <span className="text-xs text-gray-500 truncate max-w-xs">{item.details}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—'}</p>
                          <p className="text-xs text-gray-400">{item.createdBy}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {historyData.length} mouvement(s){historyCity ? ` — ${historyCity}` : ' — toutes villes'}
              </span>
              <span className="text-xs text-gray-400 italic">↕ Défiler pour voir tout l'historique</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
