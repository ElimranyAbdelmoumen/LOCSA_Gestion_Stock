import React, { useEffect, useState } from 'react'
import { getUsers, createUser, deleteUser } from '../api/users'
import { Plus, X, Loader2, Users as UsersIcon, Trash2, ShieldCheck, User } from 'lucide-react'

const emptyForm = { username: '', password: '', role: 'USER' }

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers()
      setUsers(res.data)
    } catch {
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

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
    if (!form.username.trim()) errs.username = "Le nom d'utilisateur est requis"
    else if (form.username.trim().length < 3) errs.username = "Minimum 3 caractères"
    if (!form.password) errs.password = 'Le mot de passe est requis'
    else if (form.password.length < 4) errs.password = 'Minimum 4 caractères'
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
      await createUser({ username: form.username.trim(), password: form.password, role: form.role })
      closeModal()
      fetchUsers()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteLoading(true)
    try {
      await deleteUser(id)
      setDeleteId(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} compte(s) enregistré(s)</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UsersIcon size={40} className="text-gray-300" />
            <p className="text-gray-400">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Nom d'utilisateur</th>
                  <th className="table-header">Rôle</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400 text-xs">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <ShieldCheck size={11} />
                          Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <User size={11} />
                          Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvel Utilisateur</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={`input-field ${formErrors.username ? 'border-red-400' : ''}`}
                  placeholder="ex: jean.dupont"
                  autoComplete="off"
                />
                {formErrors.username && <p className="mt-1 text-xs text-red-500">{formErrors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`input-field ${formErrors.password ? 'border-red-400' : ''}`}
                  placeholder="Mot de passe"
                />
                {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Confirmer la suppression</h3>
            <p className="text-gray-500 text-sm">Cette action est irréversible. L'utilisateur ne pourra plus se connecter.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Annuler</button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
