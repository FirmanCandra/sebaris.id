import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserAuth } from '../auth/AuthProvider'
import GoogleSignInButton from './GoogleSignInButton'
import SebarisLogo from './SebarisLogo'
import { IconClose, IconCheckVote, IconCalendar, IconUser } from './Icons'

export default function UserAuthModal({ isOpen, onClose }) {
  const { user, userVotes, loginUserWithGoogle, logoutUser, loadUserVotes } = useUserAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'votes'

  if (!isOpen) return null

  async function handleGoogleCredential(credential) {
    setLoading(true)
    setError('')
    try {
      await loginUserWithGoogle(credential)
      await loadUserVotes()
    } catch (err) {
      setError(err.message || 'Login dengan Google gagal. Silakan coba kembali.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <IconClose className="w-5 h-5" />
        </button>

        {!user ? (
          /* NOT LOGGED IN: SHOW GOOGLE SIGN IN FOR VOTERS */
          <div className="space-y-5 text-center pt-2">
            <div className="flex justify-center mb-1">
              <SebarisLogo size="md" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#262A25]">
                Masuk sebagai Pemilih
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed px-2">
                Gunakan akun Google Anda untuk memberikan suara dengan cepat, menyimpan bukti voting, dan memantau riwayat pemilihan secara transparan.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold text-left">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="pt-2 flex flex-col items-center">
              <GoogleSignInButton
                onCredentialResponse={handleGoogleCredential}
                text="continue_with"
                width={320}
              />
              {loading && (
                <p className="text-xs text-[#70B325] font-semibold mt-2 animate-pulse">
                  Memverifikasi akun Google...
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-[11px] text-gray-400">
                Akun yang masuk lewat Google terdaftar sebagai <strong>Pengguna / Pemilih</strong>.
              </p>
              <div className="text-xs text-gray-500">
                <span>Anda pengelola sistem? </span>
                <Link
                  to="/admin/login"
                  onClick={onClose}
                  className="font-bold text-[#70B325] hover:underline"
                >
                  Masuk Portal Admin
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* LOGGED IN: SHOW USER PROFILE & VOTING HISTORY */
          <div className="space-y-5">
            {/* Header User Card */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#70B325] shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#E9F3DF] text-[#558223] font-black text-xl flex items-center justify-center">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E9F3DF] text-[#558223]">
                    Akun Pemilih
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#262A25] truncate">
                  {user.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex border-b border-gray-100 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#70B325] text-[#70B325]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                Informasi Akun
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('votes')}
                className={`pb-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeTab === 'votes'
                    ? 'border-[#70B325] text-[#70B325]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <span>Riwayat Vote</span>
                <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                  {userVotes.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Profile Info */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-[#F8FAF7] border border-[#CADDB8]/50 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Metode Masuk</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Google OAuth2
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Peran Akun</span>
                    <span className="font-bold text-[#558223]">Pengguna / Pemilih Publik</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Suara Diberikan</span>
                    <span className="font-bold text-[#262A25]">{userVotes.length} vote</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Saat Anda memberikan suara pada finalis, nama dan email dari akun Google Anda otomatis digunakan untuk verifikasi keabsahan suara.
                </p>
              </div>
            )}

            {/* Tab 2: Voting History */}
            {activeTab === 'votes' && (
              <div className="space-y-3">
                {userVotes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 space-y-1">
                    <IconCheckVote className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-semibold">Belum ada riwayat suara.</p>
                    <p className="text-[11px] text-gray-400">
                      Suara yang Anda berikan pada kategori voting akan muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {userVotes.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl bg-[#F8FAF7] border border-gray-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-extrabold text-[#262A25] block truncate">
                            {v.finalist_name}
                          </span>
                          <span className="text-[11px] text-gray-500 block truncate">
                            {v.category_name}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {v.created_at}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7E3] text-[#48781B]">
                            {v.vote_amount} Suara Sah
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  logoutUser()
                  onClose()
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Keluar Akun Google
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#70B325] hover:bg-[#5F9A1E] text-white transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
