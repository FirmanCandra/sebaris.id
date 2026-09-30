import { useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth/AuthProvider"

let isOneTapPromptPending = false

export default function GoogleOneTap() {
  const { user, token, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // 1. One Tap hanya aktif di halaman beranda '/' saat pengunjung belum login
    // Jangan jalankan di /voting, /categories, /embed, /login, /register, /admin
    if (
      location.pathname !== '/' ||
      user ||
      token ||
      !clientId
    ) {
      return
    }

    // 2. Cegah trigger berulang jika sudah pernah ditutup/ditolak oleh user di sesi ini
    try {
      if (sessionStorage.getItem('sebaris_onetap_dismissed') === '1') {
        return
      }
    } catch {
      // ignore
    }

    // 3. Cegah multiple prompt requests aktif bersamaan (menghindari error "Only one navigator.credentials.get")
    if (hasTriggeredRef.current || isOneTapPromptPending) {
      return
    }
    hasTriggeredRef.current = true

    let cancelled = false

    async function handleCredential(response) {
      if (cancelled || !response?.credential) return
      try {
        const payload = await loginWithGoogle(response.credential)
        if (payload?.role === "admin" || payload?.role === "superadmin") {
          navigate("/admin/categories", { replace: true })
        }
      } catch (err) {
        console.warn("[OneTap] Login gagal:", err)
      }
    }

    function initOneTap() {
      if (cancelled || !window.google?.accounts?.id || isOneTapPromptPending) return

      try {
        isOneTapPromptPending = true
        // Batalkan request kredensial sebelumnya yang mungkin masih aktif di browser
        try {
          window.google.accounts.id.cancel()
        } catch {
          // ignore
        }

        if (!window.__gsi_initialized_id || window.__gsi_initialized_id !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => {
              handleCredential(res)
              if (res?.credential) {
                window.dispatchEvent(new CustomEvent('sebaris-google-credential', { detail: res.credential }))
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            context: "signin",
            itp_support: true,
          })
          window.__gsi_initialized_id = clientId
        }

        window.google.accounts.id.prompt((notification) => {
          isOneTapPromptPending = false
          if (
            notification?.isNotDisplayed?.() ||
            notification?.isSkippedMoment?.() ||
            notification?.isDismissedMoment?.()
          ) {
            try {
              sessionStorage.setItem('sebaris_onetap_dismissed', '1')
            } catch {
              // ignore
            }
          }
        })
      } catch (e) {
        isOneTapPromptPending = false
      }
    }

    if (window.google?.accounts?.id) {
      initOneTap()
    } else {
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initOneTap()
        } else if (attempts > 25) {
          clearInterval(interval)
        }
      }, 200)

      return () => {
        cancelled = true
        clearInterval(interval)
        isOneTapPromptPending = false
        try {
          window.google?.accounts?.id?.cancel()
        } catch {
          // ignore
        }
      }
    }

    return () => {
      cancelled = true
      isOneTapPromptPending = false
      try {
        window.google?.accounts?.id?.cancel()
      } catch {
        // ignore
      }
    }
  }, [user, token, clientId, loginWithGoogle, navigate, location.pathname])

  return null
}
