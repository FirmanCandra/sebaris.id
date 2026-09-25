import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'

const blankValues = (fields) => Object.fromEntries(fields.map((field) => [field.name, field.type === 'select' ? '' : '']))
const EMPTY_OPTIONS = {}

function FormField({ field, value, onChange, options }) {
  const id = `field-${field.name}`
  if (field.type === 'textarea') {
    return <label htmlFor={id}>{field.label}<textarea id={id} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)} /></label>
  }
  if (field.type === 'select') {
    const choices = field.options ?? options[field.optionsKey] ?? []
    return <label htmlFor={id}>{field.label}<select id={id} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)}><option value="">Pilih {field.label.toLowerCase()}</option>{choices.map((item) => <option key={item.id ?? item.value} value={item.id ?? item.value}>{item.name ?? item.label}</option>)}</select></label>
  }
  if (field.type === 'file') {
    return <label htmlFor={id}>{field.label}<input id={id} type="file" accept="image/*" onChange={(event) => onChange(field.name, event.target.files?.[0] ?? '')} /></label>
  }
  return <label htmlFor={id}>{field.label}<input id={id} type={field.type ?? 'text'} value={value ?? ''} onChange={(event) => onChange(field.name, event.target.value)} /></label>
}

export default function ResourcePage({ title, description, endpoint, fields, columns, options = EMPTY_OPTIONS }) {
  const { token } = useAuth()
  const [items, setItems] = useState([])
  const [values, setValues] = useState(() => blankValues(fields))
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const optionRequests = useMemo(() => Object.entries(options), [options])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await api(endpoint, { token })
      setItems(response.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [endpoint, token])

  useEffect(() => {
    Promise.all(optionRequests.map(([key, source]) => api(source.endpoint, { token }).then((response) => [key, response.data])))
      .then((entries) => setOptionValues(Object.fromEntries(entries)))
      .catch(() => setOptionValues({}))
  }, [optionRequests, token])

  const [optionValues, setOptionValues] = useState({})

  function resetForm() {
    setValues(blankValues(fields))
    setEditing(null)
    setFieldErrors({})
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    try {
      const hasFile = fields.some((field) => field.type === 'file' && values[field.name] instanceof File)
      const normalized = Object.fromEntries(Object.entries(values)
        .filter(([key, value]) => fields.find((field) => field.name === key)?.type !== 'file' || value instanceof File)
        .map(([key, value]) => [key, ['event_id', 'category_id'].includes(key) && value ? Number(value) : value]))
      const body = hasFile ? Object.entries(normalized).reduce((form, [key, value]) => {
        if (value !== '' && value !== null) form.append(key, value)
        return form
      }, new FormData()) : normalized
      if (hasFile && editing) body.append('_method', 'PUT')
      await api(editing ? `${endpoint}/${editing.id}` : endpoint, { method: hasFile ? 'POST' : editing ? 'PUT' : 'POST', token, body })
      resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
      if (requestError instanceof ApiError) setFieldErrors(requestError.errors)
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Hapus ${item.name}?`)) return
    try {
      await api(`${endpoint}/${item.id}`, { method: 'DELETE', token })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function beginEdit(item) {
    setEditing(item)
    setValues(Object.fromEntries(fields.map((field) => [field.name, item[field.name] ?? ''])))
    setFieldErrors({})
  }

  return (
    <section className="resource-page">
      <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div></div>
      <div className="resource-layout">
        <form className="editor" onSubmit={submit}>
          <div className="editor-heading"><h2>{editing ? `Ubah ${title.toLowerCase()}` : `Tambah ${title.toLowerCase()}`}</h2>{editing && <button type="button" className="quiet-button" onClick={resetForm}>Batal</button>}</div>
          {fields.map((field) => <div key={field.name}><FormField field={field} value={values[field.name]} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} options={optionValues} />{fieldErrors[field.name]?.[0] && <small className="field-error">{fieldErrors[field.name][0]}</small>}</div>)}
          <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Menyimpan' : editing ? 'Simpan perubahan' : `Tambah ${title.toLowerCase()}`}</button>
        </form>
        <div className="data-panel" aria-live="polite">
          {error && <div className="notice error">{error}<button type="button" onClick={load}>Coba lagi</button></div>}
          {loading ? <p className="state">Memuat {title.toLowerCase()}...</p> : items.length === 0 ? <p className="state">Belum ada {title.toLowerCase()}. Gunakan formulir untuk membuat data pertama.</p> : <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}<th aria-label="Aksi" /></tr></thead><tbody>{items.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.label}>{column.render ? column.render(item) : item[column.key]}</td>)}<td className="row-actions"><button type="button" onClick={() => beginEdit(item)}>Ubah</button><button type="button" onClick={() => remove(item)}>Hapus</button></td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </section>
  )
}
