import React, { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import AlertBadge from '../components/AlertBadge'
import { Plus, Pencil, Trash2, X, Loader2, Search, Package } from 'lucide-react'

const emptyForm = { name: '', description: '', quantity: '' }

const Products = () => {
  const [products, setProducts] = useState([])
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
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getProducts()
      setProducts(res.data)
    } catch {
      setError('Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

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
      }
      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      closeModal()
      fetchProducts()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Impossible de supprimer ce produit.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} produit(s) au total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau Produit
        </button>
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
                  <th className="table-header">Description</th>
                  <th className="table-header">Quantité</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-semibold text-gray-800">{product.name}</td>
                    <td className="table-cell text-gray-500 max-w-xs truncate">
                      {product.description || <span className="italic text-gray-300">—</span>}
                    </td>
                    <td className="table-cell">
                      <AlertBadge quantity={product.quantity} />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-500 text-sm mb-6">
              Voulez-vous vraiment supprimer <strong>{deleteTarget.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary flex-1"
                disabled={deleteLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
                disabled={deleteLoading}
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
