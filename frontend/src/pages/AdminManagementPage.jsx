import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClose,
  IconUsers,
  IconSearch,
} from '../components/Icons'

export default function AdminManagementPage() {
  const { token, admin: currentAdmin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
    is_active: true,
  })

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api('/admin/admins', { token })
      setAdmins(res.data || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar admin')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  function openCreate() {
    setEditingAdmin(null)
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'operator',
      is_active: true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  function openEdit(item) {
    setEditingAdmin(item)
    setForm({
      name: item.name,
      email: item.email,
      password: '',
      role: item.role || 'operator',
      is_active: item.is_active ?? true,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      if (editingAdmin) {
        const body = {
          name: form.name,
          role: form.role,
          is_active: form.is_active,
        }
        if (form.password) body.password = form.password

        await api(`/admin/admins/${editingAdmin.id}`, {
          method: 'PUT',
          token,
          body,
        })
      } else {
        await api('/admin/admins', {
          method: 'POST',
          token,
          body: form,
        })
      }

      setIsModalOpen(false)
      loadAdmins()
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFormErrors(err.errors)
      } else {
        setError(err.message || 'Gagal menyimpan data admin')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (item.id === currentAdmin?.id) {
      alert('Anda tidak dapat menghapus akun yang sedang aktif digunakan.')
      return
    }

    if (!window.confirm(`Hapus admin ${item.name} (${item.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      await api(`/admin/admins/${item.id}`, {
        method: 'DELETE',
        token,
      })
      loadAdmins()
    } catch (err) {
      alert(err.message || 'Gagal menghapus admin')
    }
  }

  const filteredAdmins = admins.filter((a) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--neutral-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--neutral-text-main)] tracking-tight">
            Manajemen Tim & Admin
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Kelola akun administrator, delegasikan akses ke panitia event (role operator), dan atur hak akses sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 self-start sm:self-center"
        >
          <IconPlus className="w-4 h-4" />
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold">{error}</span>
          <button
            type="button"
            onClick={loadAdmins}
            className="text-xs font-bold underline bg-transparent border-none cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="space-y-3">
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email admin..."
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-xl focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>

          <div className="text-xs text-gray-500">
            Total <strong>{filteredAdmins.length}</strong> akun admin
          </div>
        </div>

        {/* Table Container */}
        <div className="data-table-container">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Memuat daftar admin...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                <IconUsers className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Tidak ada data admin yang cocok
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama & Akun</th>
                    <th>Hak Akses (Role)</th>
                    <th>Status Akun</th>
                    <th>Tanggal Dibuat</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((item) => {
                    const isSelf = item.id === currentAdmin?.id
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-xs flex items-center justify-center flex-shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-[var(--neutral-text-main)] block">
                                  {item.name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-black text-[#70B325] bg-[#EAF5DE] px-2 py-0.2 rounded-full">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 block truncate">
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              item.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {item.role === 'superadmin' ? '⭐ Superadmin' : '🛡️ Panitia (Operator)'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.is_active !== false
                                ? 'bg-[#EAF5DE] text-[#4F7E1D]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active !== false ? 'bg-[#70B325]' : 'bg-red-500'
                              }`}
                            />
                            {item.is_active !== false ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>

                        <td className="text-xs text-gray-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>

                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors cursor-pointer"
                              title="Ubah data admin"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Hapus akun admin"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit Admin */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative my-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <IconClose className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#70B325] bg-[#EAF5DE] px-2.5 py-0.5 rounded-full">
                  {editingAdmin ? 'Ubah Akun' : 'Akun Baru'}
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                  {editingAdmin ? 'Edit Data Administrator' : 'Tambah Administrator Baru'}
                </h3>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="form-input text-xs sm:text-sm"
                />
                {formErrors.name && (
                  <p className="text-[11px] text-red-600 font-bold">{formErrors.name[0]}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingAdmin)}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="panitia@event.com"
                  className="form-input text-xs sm:text-sm disabled:opacity-60"
                />
                {formErrors.email && (
                  <p className="text-[11px] text-red-600 font-bold">{formErrors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {editingAdmin ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi (Minimal 8 karakter)'}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingAdmin ? '••••••••' : 'Masukkan password baru'}
                  className="form-input text-xs sm:text-sm"
                />
                {formErrors.password && (
                  <p className="text-[11px] text-red-600 font-bold">{formErrors.password[0]}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Tipe Akses (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      form.role === 'operator'
                        ? 'border-[#70B325] bg-[#F4F9EE] dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                      <input
                        type="radio"
                        name="role"
                        value="operator"
                        checked={form.role === 'operator'}
                        onChange={() => setForm({ ...form, role: 'operator' })}
                        className="text-[#70B325]"
                      />
                      <span>Operator (Panitia)</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Akses operasional data voting event
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                      form.role === 'superadmin'
                        ? 'border-[#70B325] bg-[#F4F9EE] dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                      <input
                        type="radio"
                        name="role"
                        value="superadmin"
                        checked={form.role === 'superadmin'}
                        onChange={() => setForm({ ...form, role: 'superadmin' })}
                        className="text-[#70B325]"
                      />
                      <span>Superadmin</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Akses penuh manajemen dan admin
                    </span>
                  </label>
                </div>
              </div>

              {/* Status Aktif */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded text-[#70B325] focus:ring-[#70B325] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Akun Aktif (Bisa Login ke Sistem)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 rounded-xl bg-[#70B325] hover:bg-[#5E9B1F] text-white text-xs font-bold transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : editingAdmin ? 'Simpan Perubahan' : 'Buat Akun Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
