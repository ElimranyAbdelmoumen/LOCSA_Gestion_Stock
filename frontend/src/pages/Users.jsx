import React, { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, changePassword, toggleActive, deleteUser, uploadAvatar } from '../api/users'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Plus, X, Loader2, Users as UsersIcon, Trash2, ShieldCheck, User,
  MapPin, Pencil, KeyRound, PowerOff, Power, AlertTriangle, Camera
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

const emptyCreateForm = { username: '', password: '', role: 'USER', city: '' }

const Users = () => {
  const { user: currentUser, updateAvatar } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(null) // userId being uploaded

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createErrors, setCreateErrors] = useState({})
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit modal
  const [editUser, setEditUser] = useState(null) // user object
  const [editForm, setEditForm] = useState({ username: '', role: '', city: '' })
  const [editErrors, setEditErrors] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Password modal
  const [pwdUser, setPwdUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // Suspend confirm
  const [suspendUser, setSuspendUser] = useState(null)
  const [suspendLoading, setSuspendLoading] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
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

  const handleAvatarUpload = async (userId, file) => {
    if (!file) return
    setAvatarUploading(userId)
    try {
      const res = await uploadAvatar(userId, file)
      const newUrl = res.data.avatarUrl + '?t=' + Date.now()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl: newUrl } : u))
      // If uploading for ourselves, update the context too
      if (currentUser?.id === userId) updateAvatar(newUrl)
    } catch {
      alert('Erreur lors de l\'upload de la photo.')
    } finally {
      setAvatarUploading(null)
    }
  }

  /* ── CREATE ── */
  const validateCreate = () => {
    const errs = {}
    if (!createForm.username.trim()) errs.username = "Le nom d'utilisateur est requis"
    else if (createForm.username.trim().length < 3) errs.username = "Minimum 3 caractères"
    if (!createForm.password) errs.password = 'Le mot de passe est requis'
    else if (createForm.password.length < 6) errs.password = 'Minimum 6 caractères'
    if (createForm.role === 'USER' && !createForm.city) errs.city = 'La ville est requise'
    return errs
  }

  const handleCreateChange = (e) => {
    const { name, value } = e.target
    const update = { [name]: value }
    if (name === 'role' && value === 'ADMIN') update.city = ''
    setCreateForm(prev => ({ ...prev, ...update }))
    if (createErrors[name]) setCreateErrors(prev => ({ ...prev, [name]: '' }))
    if (createError) setCreateError('')
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    const errs = validateCreate()
    if (Object.keys(errs).length > 0) { setCreateErrors(errs); return }
    setCreateLoading(true)
    setCreateError('')
    try {
      await createUser({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role,
        city: createForm.role === 'USER' ? createForm.city : null,
      })
      setShowCreate(false)
      setCreateForm(emptyCreateForm)
      fetchUsers()
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setCreateLoading(false)
    }
  }

  /* ── EDIT ── */
  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ username: u.username, role: u.role, city: u.city || '' })
    setEditErrors({})
    setEditError('')
  }

  const validateEdit = () => {
    const errs = {}
    if (!editForm.username.trim()) errs.username = "Le nom d'utilisateur est requis"
    else if (editForm.username.trim().length < 3) errs.username = "Minimum 3 caractères"
    if (editForm.role === 'USER' && !editForm.city) errs.city = 'La ville est requise pour un utilisateur'
    return errs
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    const update = { [name]: value }
    if (name === 'role' && value === 'ADMIN') update.city = ''
    setEditForm(prev => ({ ...prev, ...update }))
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }))
    if (editError) setEditError('')
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const errs = validateEdit()
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    setEditLoading(true)
    setEditError('')
    try {
      await updateUser(editUser.id, {
        username: editForm.username.trim(),
        role: editForm.role,
        city: editForm.role === 'USER' ? editForm.city : null,
      })
      setEditUser(null)
      fetchUsers()
    } catch (err) {
      setEditError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setEditLoading(false)
    }
  }

  /* ── PASSWORD ── */
  const openPwd = (u) => { setPwdUser(u); setNewPassword(''); setPwdError('') }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) { setPwdError('Minimum 6 caractères'); return }
    setPwdLoading(true)
    setPwdError('')
    try {
      await changePassword(pwdUser.id, newPassword)
      setPwdUser(null)
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Une erreur est survenue.')
    } finally {
      setPwdLoading(false)
    }
  }

  /* ── SUSPEND ── */
  const handleToggleActive = async () => {
    setSuspendLoading(true)
    try {
      await toggleActive(suspendUser.id)
      setSuspendUser(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur.')
    } finally {
      setSuspendLoading(false)
    }
  }

  /* ── DELETE ── */
  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteUser(deleteId)
      setDeleteId(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const activeCount   = users.filter(u => u.active).length
  const suspendCount  = users.filter(u => !u.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} compte(s) — <span className="text-green-600">{activeCount} actif(s)</span>
            {suspendCount > 0 && <span className="text-orange-500"> · {suspendCount} suspendu(s)</span>}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nouvel Utilisateur
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
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Utilisateur</th>
                  <th className="table-header">Rôle</th>
                  <th className="table-header">Ville</th>
                  <th className="table-header">Statut</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u, idx) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? 'opacity-60' : ''}`}>
                    <td className="table-cell text-gray-400 text-xs">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar with upload button */}
                        <div className="relative flex-shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.username}
                              className={`w-10 h-10 rounded-xl object-cover ring-2 ${u.active ? 'ring-blue-200' : 'ring-gray-200'}`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              {u.role === 'ADMIN'
                                ? <ShieldCheck size={16} className={u.active ? 'text-purple-600' : 'text-gray-400'} />
                                : <User size={16} className={u.active ? 'text-blue-600' : 'text-gray-400'} />
                              }
                            </div>
                          )}
                          {/* Camera badge — always visible */}
                          <label
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors"
                            title="Changer la photo"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files[0] && handleAvatarUpload(u.id, e.target.files[0])}
                            />
                            {avatarUploading === u.id
                              ? <Loader2 size={10} className="text-white animate-spin" />
                              : <Camera size={10} className="text-white" />
                            }
                          </label>
                        </div>
                        <span className={`font-semibold ${u.active ? 'text-gray-800' : 'text-gray-400'}`}>{u.username}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <ShieldCheck size={11} /> Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <User size={11} /> Utilisateur
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      {u.city ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${CITY_COLORS[u.city] || 'bg-gray-100 text-gray-600'}`}>
                          <MapPin size={10} />
                          {CITIES.find(c => c.value === u.city)?.label || u.city}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block"></span> Suspendu
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        {/* Change password */}
                        <button
                          onClick={() => openPwd(u)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Changer le mot de passe"
                        >
                          <KeyRound size={15} />
                        </button>
                        {/* Suspend / Activate — not for ADMIN */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setSuspendUser(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.active
                                ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                                : 'text-orange-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={u.active ? 'Suspendre' : 'Réactiver'}
                          >
                            {u.active ? <PowerOff size={15} /> : <Power size={15} />}
                          </button>
                        )}
                        {/* Delete — not for ADMIN */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setDeleteId(u.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Nouvel Utilisateur</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{createError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input type="text" name="username" value={createForm.username} onChange={handleCreateChange}
                  className={`input-field ${createErrors.username ? 'border-red-400' : ''}`} placeholder="ex: jean.dupont" autoComplete="off" />
                {createErrors.username && <p className="mt-1 text-xs text-red-500">{createErrors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input type="password" name="password" value={createForm.password} onChange={handleCreateChange}
                  className={`input-field ${createErrors.password ? 'border-red-400' : ''}`} placeholder="Mot de passe" />
                {createErrors.password && <p className="mt-1 text-xs text-red-500">{createErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                <select name="role" value={createForm.role} onChange={handleCreateChange} className="input-field">
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              {createForm.role === 'USER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {CITIES.map(c => (
                      <button key={c.value} type="button"
                        onClick={() => { setCreateForm(prev => ({ ...prev, city: c.value })); setCreateErrors(prev => ({ ...prev, city: '' })) }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                          createForm.city === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>{c.label}</button>
                    ))}
                  </div>
                  {createErrors.city && <p className="mt-1 text-xs text-red-500">{createErrors.city}</p>}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={createLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {createLoading && <Loader2 size={16} className="animate-spin" />} Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Modifier — {editUser.username}</h3>
              </div>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{editError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input type="text" name="username" value={editForm.username} onChange={handleEditChange}
                  className={`input-field ${editErrors.username ? 'border-red-400' : ''}`} />
                {editErrors.username && <p className="mt-1 text-xs text-red-500">{editErrors.username}</p>}
              </div>
              {editUser.role !== 'ADMIN' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                    <select name="role" value={editForm.role} onChange={handleEditChange} className="input-field">
                      <option value="USER">Utilisateur</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                  </div>
                  {editForm.role === 'USER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        {CITIES.map(c => (
                          <button key={c.value} type="button"
                            onClick={() => { setEditForm(prev => ({ ...prev, city: c.value })); setEditErrors(prev => ({ ...prev, city: '' })) }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                              editForm.city === c.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>{c.label}</button>
                        ))}
                      </div>
                      {editErrors.city && <p className="mt-1 text-xs text-red-500">{editErrors.city}</p>}
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {editLoading && <Loader2 size={16} className="animate-spin" />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PASSWORD MODAL ── */}
      {pwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">Nouveau mot de passe</h3>
              </div>
              <button onClick={() => setPwdUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handlePwdSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Réinitialiser le mot de passe de <strong>{pwdUser.username}</strong>.</p>
              {pwdError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{pwdError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwdError('') }}
                  className={`input-field ${pwdError ? 'border-red-400' : ''}`} placeholder="Minimum 4 caractères" autoFocus />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPwdUser(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={pwdLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {pwdLoading && <Loader2 size={16} className="animate-spin" />} Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SUSPEND MODAL ── */}
      {suspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${suspendUser.active ? 'bg-orange-100' : 'bg-green-100'}`}>
                <AlertTriangle size={20} className={suspendUser.active ? 'text-orange-500' : 'text-green-600'} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {suspendUser.active ? 'Suspendre le compte' : 'Réactiver le compte'}
              </h3>
            </div>
            <p className="text-gray-500 text-sm">
              {suspendUser.active
                ? <>Le compte <strong>{suspendUser.username}</strong> sera suspendu. L'utilisateur ne pourra plus se connecter.</>
                : <>Le compte <strong>{suspendUser.username}</strong> sera réactivé. L'utilisateur pourra à nouveau se connecter.</>
              }
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSuspendUser(null)} className="btn-secondary flex-1">Annuler</button>
              <button
                onClick={handleToggleActive}
                disabled={suspendLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                  suspendUser.active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {suspendLoading ? <Loader2 size={16} className="animate-spin" /> : suspendUser.active ? <PowerOff size={16} /> : <Power size={16} />}
                {suspendUser.active ? 'Suspendre' : 'Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer le compte"
        message="Cette action est irréversible. Toutes les données liées à cet utilisateur seront conservées mais le compte sera supprimé."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

export default Users
