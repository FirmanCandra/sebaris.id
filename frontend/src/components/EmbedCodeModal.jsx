import { useState } from 'react'
import { IconClose } from './Icons'

export default function EmbedCodeModal({ isOpen, onClose, category }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  if (!isOpen || !category) return null

  const embedUrl = `${window.location.origin}/embed/voting/${category.slug || category.id}`
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="720"\n  frameborder="0"\n  style="border:none;border-radius:16px;max-width:100%;overflow:hidden;"\n  title="Voting ${category.name}"\n></iframe>`

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative my-auto">
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
              Embed Widget
            </span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
              Pasang Widget Voting ke Website
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Salin kode HTML iframe berikut dan tempelkan ke website penyelenggara untuk menampilkan voting langsung di halaman web Anda.
            </p>
          </div>

          {/* Target Sesi */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
            <span className="text-gray-400 block text-[10px]">Sesi Voting:</span>
            <strong className="text-gray-800 dark:text-gray-200">{category.name}</strong>
          </div>

          {/* Iframe Code Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Kode HTML Iframe:
            </label>
            <div className="relative">
              <pre className="p-3.5 bg-gray-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-gray-800">
                {iframeCode}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 bg-[#70B325] hover:bg-[#5E9B1F] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{copied ? '✓ Kode Tersalin!' : '📋 Salin Kode Embed'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="py-2.5 px-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {showPreview ? 'Tutup Preview' : '👁️ Preview'}
            </button>
          </div>

          {/* Live Preview If Toggled */}
          {showPreview && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2 animate-fadeIn">
              <span className="text-xs font-bold text-gray-500">Pratinjau Widget:</span>
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-gray-50">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="360"
                  frameBorder="0"
                  title="Preview Voting"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
