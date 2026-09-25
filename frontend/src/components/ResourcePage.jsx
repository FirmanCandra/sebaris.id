import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconClose,
  IconTrophy,
  IconLayers,
  IconUsers,
  IconFlame,
} from './Icons'

const blankValues = (fields) =>
  Object.fromEntries(fields.map((field) => [field.name, field.type === 'select' ? '' : '']))
const EMPTY_OPTIONS = {}

function FormField({ field, value, onChange, options }) {
  const id = `field-${field.name}`

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {field.label}
        </label>
        <textarea
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(field.name, event.target.value)}
          rows={3}
          className="form-input text-xs sm:text-sm resize-y"
          placeholder={`Masukkan ${field.label.toLowerCase()}`}
        />
      </div>
    )
  }

  if (field.type === 'select') {
    const choices = field.options ?? options[field.optionsKey] ?? []
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {field.label}
        </label>
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="form-input text-xs sm:text-sm bg-[var(--neutral-surface)]"
        >
          <option value="">Pilih {field.label.toLowerCase()}</option>
          {choices.map((item) => (
            <option key={item.id ?? item.value} value={item.id ?? item.value}>
              {item.name ?? item.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'file') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {field.label}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={(event) => onChange(field.name, event.target.files?.[0] ?? '')}
            className="form-input text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--brand-primary-light)] file:text-[var(--brand-primary)] hover:file:bg-[var(--brand-primary)] hover:file:text-white file:transition-colors"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-gray-700 dark:text-gray-300">
        {field.label}
      </label>
      <input
        id={id}
        type={field.type ?? 'text'}
        value={value ?? ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        className="form-input text-xs sm:text-sm"
        placeholder={`Masukkan ${field.label.toLowerCase()}`}
      />
    </div>
  )
}

export default function ResourcePage({
  title,
  description,
  endpoint,
  fields,
  columns,
  options = EMPTY_OPTIONS,
}) {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [values, setValues] = useState(() => blankValues(fields))
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [optionValues, setOptionValues] = useState({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Aggregated KPI Stats
  const [kpiStats, setKpiStats] = useState({
    eventsCount: 0,
    activeEvents: 0,
    categoriesCount: 0,
    finalistsCount: 0,
    totalVotes: 0,
  })

  const optionRequests = useMemo(() => Object.entries(options), [options])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api(endpoint, { token })
      setItems(response.data)

      // Fetch global KPI stats concurrently for top cards
      const [allEvents, allCats, allFinalists] = await Promise.allSettled([
        api('/admin/events', { token }),
        api('/admin/categories', { token }),
        api('/admin/finalists', { token }),
      ])

      const evData = allEvents.status === 'fulfilled' ? allEvents.value?.data || [] : []
      const catData = allCats.status === 'fulfilled' ? allCats.value?.data || [] : []
      const finData = allFinalists.status === 'fulfilled' ? allFinalists.value?.data || [] : []

      const votesSum = finData.reduce((acc, f) => acc + (f.vote_count || 0), 0)
      const activeEv = evData.filter((e) => e.status === 'active').length

      setKpiStats({
        eventsCount: evData.length,
        activeEvents: activeEv,
        categoriesCount: catData.length,
        finalistsCount: finData.length,
        totalVotes: votesSum,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint, token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    Promise.all(
      optionRequests.map(([key, source]) =>
        api(source.endpoint, { token }).then((response) => [key, response.data])
      )
    )
      .then((entries) => setOptionValues(Object.fromEntries(entries)))
      .catch(() => setOptionValues({}))
  }, [optionRequests, token])

  // Keyboard shortcut for drawer: Esc to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  function openCreate() {
    setValues(blankValues(fields))
    setEditing(null)
    setFieldErrors({})
    setIsDrawerOpen(true)
  }

  function beginEdit(item) {
    setEditing(item)
    setValues(Object.fromEntries(fields.map((field) => [field.name, item[field.name] ?? ''])))
    setFieldErrors({})
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setEditing(null)
    setFieldErrors({})
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})

    try {
      const hasFile = fields.some(
        (field) => field.type === 'file' && values[field.name] instanceof File
      )
      const normalized = Object.fromEntries(
        Object.entries(values)
          .filter(
            ([key, value]) =>
              fields.find((field) => field.name === key)?.type !== 'file' || value instanceof File
          )
          .map(([key, value]) => [
            key,
            ['event_id', 'category_id'].includes(key) && value ? Number(value) : value,
          ])
      )

      const body = hasFile
        ? Object.entries(normalized).reduce((form, [key, value]) => {
            if (value !== '' && value !== null) form.append(key, value)
            return form
          }, new FormData())
        : normalized

      if (hasFile && editing) body.append('_method', 'PUT')

      await api(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: hasFile ? 'POST' : editing ? 'PUT' : 'POST',
        token,
        body,
      })

      closeDrawer()
      await load()
    } catch (requestError) {
      setError(requestError.message)
      if (requestError instanceof ApiError) setFieldErrors(requestError.errors)
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Hapus data ${item.name}? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await api(`${endpoint}/${item.id}`, { method: 'DELETE', token })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.event?.name && item.event.name.toLowerCase().includes(q)) ||
      (item.category?.name && item.category.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 4 Real-Data KPI Summary Cards (per Q2 preference) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Ringkasan Statistik">
        {/* Metric 1: Total Event */}
        <div className="card-base p-4 bg-[var(--neutral-surface)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Total Event
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--neutral-text-main)]">
                {kpiStats.eventsCount}
              </span>
              <span className="text-[10px] font-bold text-[#70B325] bg-[#F2F9EC] px-2 py-0.5 rounded-full">
                {kpiStats.activeEvents} aktif
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F2F9EC] text-[#70B325] flex items-center justify-center flex-shrink-0">
            <IconTrophy className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Kategori */}
        <div className="card-base p-4 bg-[var(--neutral-surface)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Kategori Terdaftar
            </span>
            <span className="text-2xl font-black text-[var(--neutral-text-main)] block">
              {kpiStats.categoriesCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <IconLayers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Total Finalis */}
        <div className="card-base p-4 bg-[var(--neutral-surface)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Total Finalis
            </span>
            <span className="text-2xl font-black text-[var(--neutral-text-main)] block">
              {kpiStats.finalistsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <IconUsers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Suara Masuk */}
        <div className="card-base p-4 bg-[var(--neutral-surface)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Suara Terverifikasi
            </span>
            <span className="text-2xl font-black text-[#70B325] block">
              {kpiStats.totalVotes.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <IconFlame className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--neutral-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--neutral-text-main)] tracking-tight">
            Manajemen {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 self-start sm:self-center"
        >
          <IconPlus className="w-4 h-4" />
          <span>Tambah {title}</span>
        </button>
      </div>

      {/* Notification Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs font-bold">{error}</span>
          <button
            type="button"
            onClick={load}
            className="text-xs font-bold underline bg-transparent border-none cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Table Section & Toolbar */}
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
              placeholder={`Cari nama ${title.toLowerCase()}...`}
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-xl focus:border-[var(--brand-primary)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{items.length}</strong> data
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Memuat daftar {title.toLowerCase()}...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                <IconPlus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Belum ada data {title.toLowerCase()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Klik tombol &quot;Tambah {title}&quot; untuk membuat data baru.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="btn-primary text-xs font-bold py-2 px-4 mx-auto"
              >
                Tambah {title} Baru
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Tidak ada data yang cocok dengan pencarian &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.label}>{column.label}</th>
                    ))}
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      {columns.map((column) => {
                        let cellContent = column.render ? column.render(item) : item[column.key]

                        // Custom renderers for known columns
                        if (column.key === 'status') {
                          const isActive = item.status === 'active'
                          cellContent = (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isActive
                                  ? 'bg-[#EAF5DE] text-[#4F7E1D]'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-[#70B325]' : 'bg-gray-400'
                                }`}
                              />
                              {isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          )
                        }

                        if (column.key === 'vote_count') {
                          cellContent = (
                            <span className="font-extrabold text-[#70B325]">
                              {(item.vote_count || 0).toLocaleString('id-ID')} suara
                            </span>
                          )
                        }

                        if (column.key === 'name' && item.photo) {
                          cellContent = (
                            <div className="flex items-center gap-3">
                              <img
                                src={item.photo}
                                alt={item.name}
                                className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                              />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {item.name}
                              </span>
                            </div>
                          )
                        }

                        return (
                          <td key={column.label} className="text-gray-800 dark:text-gray-200">
                            {cellContent}
                          </td>
                        )
                      })}

                      {/* Row Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => beginEdit(item)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors"
                            title="Ubah data"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Hapus data"
                          >
                            <IconTrash className="w-4 h-4" />
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
      </div>

      {/* Slide-Over Drawer for Adding / Editing Resource */}
      {isDrawerOpen && (
        <>
          <div onClick={closeDrawer} className="drawer-backdrop animate-fadeIn" />
          <div className="drawer-panel p-6 animate-slideLeft">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--neutral-border)]">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--neutral-text-main)]">
                  {editing ? `Ubah Data ${title}` : `Tambah ${title} Baru`}
                </h2>
                <p className="text-xs text-gray-400">
                  Lengkapi data formulir di bawah ini dengan lengkap.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Tutup formulir"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={submit} className="flex-1 overflow-y-auto py-5 space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <FormField
                    field={field}
                    value={values[field.name]}
                    onChange={(name, value) =>
                      setValues((current) => ({ ...current, [name]: value }))
                    }
                    options={optionValues}
                  />
                  {fieldErrors[field.name]?.[0] && (
                    <small className="text-red-600 text-[11px] block mt-1">
                      {fieldErrors[field.name][0]}
                    </small>
                  )}
                </div>
              ))}

              {/* Form Action Buttons */}
              <div className="pt-6 border-t border-[var(--neutral-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn-secondary text-xs font-bold py-2.5 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs font-bold py-2.5 px-5"
                >
                  {saving ? (
                    <span>Menyimpan...</span>
                  ) : editing ? (
                    <span>Simpan Perubahan</span>
                  ) : (
                    <span>Tambah {title}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
