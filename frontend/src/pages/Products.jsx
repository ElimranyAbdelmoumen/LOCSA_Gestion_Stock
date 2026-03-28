import React, { useEffect, useState } from 'react'
import { getProducts, getProductsPaginated, createProduct, updateProduct, deleteProduct, getProductHistory } from '../api/products'
import { getStockByProduct } from '../api/dashboard'
import { getEntries } from '../api/entries'
import { getExits } from '../api/exits'
import AlertBadge from '../components/AlertBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/Pagination'
import { exportToExcel, exportToExcelMultiSheet } from '../utils/exportUtils'
import { Plus, Pencil, Trash2, X, Loader2, Search, Package, History, TrendingUp, TrendingDown, ClipboardList, FileDown, LayoutGrid, MapPin, CalendarRange } from 'lucide-react'

const CATEGORIES = [
  { value: 'A', label: 'Catégorie A', color: 'bg-purple-100 text-purple-700' },
  { value: 'B', label: 'Catégorie B (Gasoil)', color: 'bg-amber-100 text-amber-700' },
  { value: 'C', label: 'Catégorie C', color: 'bg-gray-100 text-gray-600' },
]

const emptyForm = { name: '', description: '', quantity: '', category: 'C', minQuantity: '0' }

const CITIES = [
  { value: 'TANGER',     label: 'Tanger' },
  { value: 'MEKNES',     label: 'Meknès' },
  { value: 'CASABLANCA', label: 'Casablanca' },
]

const Products = () => {
  const toast = useToast()
  const { isAdmin, userCity, userCities } = useAuth()

  // Export filtré modal
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFilters, setExportFilters] = useState({ city: '', dateFrom: '', dateTo: '' })
  const [exportLoading, setExportLoading] = useState(false)
  const [exportErrors, setExportErrors] = useState({})
  const [view, setView] = useState('catalogue') // 'catalogue' | 'stock-ville'
  const [stockByProduct, setStockByProduct] = useState([])
  const [stockLoading, setStockLoading] = useState(false)
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
  const [deleteCityPicker, setDeleteCityPicker] = useState(null) // product waiting for city choice
  const [confirmDelete, setConfirmDelete] = useState(null)       // { product, city }
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

  const fetchStockByProduct = async () => {
    setStockLoading(true)
    try {
      const res = await getStockByProduct()
      setStockByProduct(res.data)
    } catch {
      toast.error('Impossible de charger le stock par ville.')
    } finally {
      setStockLoading(false)
    }
  }

  const switchView = (v) => {
    setView(v)
    if (v === 'stock-ville' && stockByProduct.length === 0) fetchStockByProduct()
  }

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
        toast.success('Produit modifié avec succès')
      } else {
        await createProduct(payload)
        toast.success('Produit créé avec succès')
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
      await deleteProduct(confirmDelete.product.id, confirmDelete.city || null)
      toast.success(confirmDelete.city
        ? `Données de ${confirmDelete.city} supprimées`
        : 'Produit supprimé (toutes villes)')
      setConfirmDelete(null)
      fetchProducts(productsPage.currentPage)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Impossible de supprimer.')
      setConfirmDelete(null)
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

  const openExportModal = () => {
    const defaultCity = !isAdmin ? (userCity || '') : ''
    setExportFilters({ city: defaultCity, dateFrom: '', dateTo: '' })
    setExportErrors({})
    setShowExportModal(true)
  }

  const handleExportFiltered = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!exportFilters.dateFrom) errs.dateFrom = 'Date de début requise'
    if (!exportFilters.dateTo)   errs.dateTo   = 'Date de fin requise'
    if (exportFilters.dateFrom && exportFilters.dateTo && exportFilters.dateFrom > exportFilters.dateTo)
      errs.dateTo = 'La date de fin doit être après la date de début'
    if (Object.keys(errs).length > 0) { setExportErrors(errs); return }

    setExportLoading(true)
    try {
      const city = exportFilters.city || undefined
      const [entriesRes, exitsRes] = await Promise.all([
        getEntries(city, exportFilters.dateFrom, exportFilters.dateTo, 0, 2000),
        getExits(city, exportFilters.dateFrom, exportFilters.dateTo, 0, 2000),
      ])
      const entries = entriesRes.data.content ?? entriesRes.data
      const exits   = exitsRes.data.content ?? exitsRes.data

      const cityLabel = exportFilters.city
        ? CITIES.find(c => c.value === exportFilters.city)?.label || exportFilters.city
        : 'Toutes villes'
      const period = `${exportFilters.dateFrom} → ${exportFilters.dateTo}`

      await exportToExcelMultiSheet([
        {
          name: 'Entrées',
          title: `Entrées de Stock — ${cityLabel} — ${period}`,
          rows: entries,
          columns: [
            { key: 'reference',       header: 'Réf.',          width: 18 },
            { key: 'productName',     header: 'Produit',        width: 28 },
            { key: 'productCategory', header: 'Cat.',           width: 8  },
            { key: 'city',            header: 'Ville',          width: 14 },
            { key: 'quantity',        header: 'Qté',            width: 10 },
            { key: 'dateEntry',       header: 'Date',           width: 14 },
            { key: 'createdBy',       header: 'Effectué par',   width: 18 },
            { key: 'station',         header: 'Station',        width: 18 },
            { key: 'code',            header: 'Code',           width: 14 },
            { key: 'serialNumber',    header: 'N° Série',       width: 16 },
            { key: 'brand',           header: 'Marque',         width: 16 },
            { key: 'power',           header: 'Puissance',      width: 14 },
            { key: 'comment',         header: 'Commentaire',    width: 30 },
          ],
        },
        {
          name: 'Sorties',
          title: `Sorties de Stock — ${cityLabel} — ${period}`,
          rows: exits,
          columns: [
            { key: 'reference',       header: 'Réf.',          width: 18 },
            { key: 'productName',     header: 'Produit',        width: 28 },
            { key: 'productCategory', header: 'Cat.',           width: 8  },
            { key: 'city',            header: 'Ville',          width: 14 },
            { key: 'quantity',        header: 'Qté',            width: 10 },
            { key: 'dateExit',        header: 'Date',           width: 14 },
            { key: 'beneficiary',     header: 'Bénéficiaire',   width: 22 },
            { key: 'createdBy',       header: 'Effectué par',   width: 18 },
            { key: 'siteName',        header: 'Site',           width: 20 },
            { key: 'gasoilType',      header: 'Type gasoil',    width: 14 },
            { key: 'immatriculation', header: 'Immatriculation',width: 16 },
            { key: 'code',            header: 'Code',           width: 14 },
            { key: 'serialNumber',    header: 'N° Série',       width: 16 },
            { key: 'comment',         header: 'Commentaire',    width: 30 },
          ],
        },
      ], `rapport-stock-${exportFilters.city || 'all'}-${exportFilters.dateFrom}`)

      toast.success(`Export réussi — ${entries.length} entrées, ${exits.length} sorties`)
      setShowExportModal(false)
    } catch {
      toast.error("Erreur lors de l'export.")
    } finally {
      setExportLoading(false)
    }
  }

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
          {view === 'catalogue' && (
            <>
              <button onClick={openExportModal} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                <CalendarRange size={15} /> Rapport filtré
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                <FileDown size={15} /> Catalogue
              </button>
              {isAdmin && (
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Nouveau Produit
                </button>
              )}
            </>
          )}
          {view === 'stock-ville' && (
            <button onClick={fetchStockByProduct} className="btn-secondary flex items-center gap-2">
              <Loader2 size={16} className={stockLoading ? 'animate-spin' : ''} /> Actualiser
            </button>
          )}
        </div>
      </div>

      {/* View tabs — admin only */}
      {isAdmin && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => switchView('catalogue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'catalogue' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Package size={15} /> Catalogue
          </button>
          <button
            onClick={() => switchView('stock-ville')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'stock-ville' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <MapPin size={15} /> Stock par ville
          </button>
        </div>
      )}

      {/* Stock par ville — admin only */}
      {view === 'stock-ville' && (
        <div className="card p-0 overflow-hidden">
          {stockLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stockByProduct.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package size={40} className="text-gray-300" />
              <p className="text-gray-400">Aucune donnée de stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="table-header">Produit</th>
                    <th className="table-header text-center">
                      <span className="inline-flex items-center gap-1 text-blue-700"><MapPin size={12} /> Tanger</span>
                    </th>
                    <th className="table-header text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-700"><MapPin size={12} /> Meknès</span>
                    </th>
                    <th className="table-header text-center">
                      <span className="inline-flex items-center gap-1 text-orange-700"><MapPin size={12} /> Casablanca</span>
                    </th>
                    <th className="table-header text-center font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockByProduct.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-semibold text-gray-800">{row.productName}</td>
                      <td className="table-cell text-center">
                        <span className={`font-medium ${row.stockTanger > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                          {row.stockTanger > 0 ? row.stockTanger : '—'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`font-medium ${row.stockMeknes > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                          {row.stockMeknes > 0 ? row.stockMeknes : '—'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`font-medium ${row.stockCasablanca > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                          {row.stockCasablanca > 0 ? row.stockCasablanca : '—'}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 font-bold text-sm">
                          {row.totalStock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Catalogue view */}
      {view === 'catalogue' && <>
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
                          onClick={() => setDeleteCityPicker(product)}
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
      </>}

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

      {/* City picker modal */}
      {deleteCityPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer les données de</h3>
            <p className="text-sm text-gray-500 mb-5">
              Produit : <strong>{deleteCityPicker.name}</strong>
            </p>
            <div className="flex flex-col gap-2">
              {['TANGER', 'MEKNES', 'CASABLANCA'].map(city => (
                <button
                  key={city}
                  onClick={() => { setConfirmDelete({ product: deleteCityPicker, city }); setDeleteCityPicker(null) }}
                  className="w-full px-4 py-3 text-sm font-medium text-left bg-gray-50 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-xl transition-colors"
                >
                  🏙 {city.charAt(0) + city.slice(1).toLowerCase()} uniquement
                </button>
              ))}
              <button
                onClick={() => { setConfirmDelete({ product: deleteCityPicker, city: null }); setDeleteCityPicker(null) }}
                className="w-full px-4 py-3 text-sm font-bold text-left bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-colors mt-1"
              >
                🗑 Toutes les villes (supprimer le produit entier)
              </button>
              <button
                onClick={() => setDeleteCityPicker(null)}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.city ? `Supprimer données — ${confirmDelete.city}` : 'Supprimer le produit'}
        message={confirmDelete?.city
          ? `Supprimer toutes les entrées, sorties et inventaires de "${confirmDelete?.product?.name}" pour la ville ${confirmDelete.city} ? Cette action est irréversible.`
          : `Supprimer "${confirmDelete?.product?.name}" et toutes ses données (toutes villes) ? Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Export filtré Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarRange size={18} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Rapport de stock filtré</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleExportFiltered} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Génère un fichier Excel avec deux feuilles — <strong>Entrées</strong> et <strong>Sorties</strong> — pour la période et la ville sélectionnées.</p>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && (
                    <button type="button"
                      onClick={() => setExportFilters(p => ({ ...p, city: '' }))}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${exportFilters.city === '' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      Toutes
                    </button>
                  )}
                  {(isAdmin ? CITIES : CITIES.filter(c => (userCities || [userCity]).includes(c.value))).map(c => (
                    <button key={c.value} type="button"
                      onClick={() => setExportFilters(p => ({ ...p, city: c.value }))}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${exportFilters.city === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Du <span className="text-red-500">*</span></label>
                  <input type="date" value={exportFilters.dateFrom}
                    onChange={e => { setExportFilters(p => ({ ...p, dateFrom: e.target.value })); setExportErrors(p => ({ ...p, dateFrom: '' })) }}
                    className={`input-field text-sm ${exportErrors.dateFrom ? 'border-red-400' : ''}`} />
                  {exportErrors.dateFrom && <p className="mt-1 text-xs text-red-500">{exportErrors.dateFrom}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Au <span className="text-red-500">*</span></label>
                  <input type="date" value={exportFilters.dateTo}
                    onChange={e => { setExportFilters(p => ({ ...p, dateTo: e.target.value })); setExportErrors(p => ({ ...p, dateTo: '' })) }}
                    className={`input-field text-sm ${exportErrors.dateTo ? 'border-red-400' : ''}`} />
                  {exportErrors.dateTo && <p className="mt-1 text-xs text-red-500">{exportErrors.dateTo}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExportModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={exportLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                  {exportLoading ? 'Export en cours...' : 'Télécharger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
