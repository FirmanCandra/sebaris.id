import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { IconClose, IconPlus, IconTrash } from './Icons'

const DEFAULT_TEMPLATE = [
  { amount: 2, price: 10000, label: '2 Suara', popular: false },
  { amount: 5, price: 25000, label: '5 Suara', popular: false },
  { amount: 10, price: 50000, label: '10 Suara', popular: true },
  { amount: 20, price: 100000, label: '20 Suara', popular: false },
  { amount: 50, price: 250000, label: '50 Suara', popular: false },
  { amount: 100, price: 500000, label: '100 Suara', popular: false },
]

export default function VotePackagesModal({ isOpen, onClose, category, onSuccess }) {
  const { token } = useAuth()
  const [packages, setPackages] = useState(() => {
    if (category?.vote_packages && Array.isArray(category.vote_packages) && category.vote_packages.length > 0) {
      return category.vote_packages
    }
    return DEFAULT_TEMPLATE
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !category) return null

  function handlePackageChange(index, field, value) {
    const updated = [...packages]
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' || field === 'price' ? Number(value) : value,
    }
    setPackages(updated)
  }

  function handleAddPackage() {
    const basePrice = category.price_per_vote || 5000
    const nextAmount = (packages[packages.length - 1]?.amount || 10) * 2
    setPackages([
      ...packages,
      {
        amount: nextAmount,
        price: nextAmount * basePrice,
        label: `${nextAmount} Suara`,
        popular: false,
      },
    ])
  }

  function handleRemovePackage(index) {
    if (packages.length <= 1) {
      setError('Minimal harus ada 1 paket suara')
      return
    }
    setPackages(packages.filter((_, i) => i !== index))
  }

  function handleResetTemplate() {
    const basePrice = category.price_per_vote || 5000
    setPackages(
      DEFAULT_TEMPLATE.map((p) => ({
        ...p,
        price: p.amount * basePrice,
      }))
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await api(`/admin/categories/${category.id}`, {
        method: 'PUT',
        token,
        body: {
          vote_packages: packages,
        },
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan konfigurasi paket suara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 relative my-auto max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <IconClose className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#70B325] bg-[#EAF5DE] px-2.5 py-0.5 rounded-full">
              Konfigurasi Harga
            </span>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              Atur Paket Suara Voting
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sesuaikan pilihan nominal dan jumlah suara yang tampil pada modal voting pemilih untuk kategori{' '}
              <strong>{category.name}</strong>.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Package Rows */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-gray-500 uppercase px-1">
              <span className="col-span-3">Jumlah Suara</span>
              <span className="col-span-3">Harga (Rp)</span>
              <span className="col-span-4">Label Tampilan</span>
              <span className="col-span-2 text-center">Favorit</span>
            </div>

            {packages.map((pkg, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                {/* Amount */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="1"
                    value={pkg.amount}
                    onChange={(e) => handlePackageChange(index, 'amount', e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#70B325] focus:outline-none font-bold"
                  />
                </div>

                {/* Price */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={pkg.price}
                    onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#70B325] focus:outline-none font-bold text-[#70B325]"
                  />
                </div>

                {/* Label */}
                <div className="col-span-4">
                  <input
                    type="text"
                    value={pkg.label}
                    onChange={(e) => handlePackageChange(index, 'label', e.target.value)}
                    placeholder="Contoh: 10 Suara"
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#70B325] focus:outline-none"
                  />
                </div>

                {/* Popular checkbox & Delete action */}
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(pkg.popular)}
                    onChange={(e) => handlePackageChange(index, 'popular', e.target.checked)}
                    className="rounded text-[#70B325] focus:ring-[#70B325] w-4 h-4 cursor-pointer"
                    title="Tandai sebagai Paket Terpopuler/Favorit"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(index)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                    title="Hapus paket ini"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Package & Reset Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddPackage}
              className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <IconPlus className="w-3.5 h-3.5" />
              <span>Tambah Paket</span>
            </button>

            <button
              type="button"
              onClick={handleResetTemplate}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline cursor-pointer"
            >
              Kembalikan ke Template Default
            </button>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="py-2 px-5 rounded-xl bg-[#70B325] hover:bg-[#5E9B1F] text-white text-xs font-bold transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi Paket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
