import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthProvider"

export default function GoogleOneTap() {
  const { user, token, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (user || token || !clientId) return

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
      if (cancelled || !window.google?.accounts?.id) return
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
        })
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.info("[OneTap] Tidak ditampilkan:", notification.getNotDisplayedReason())
          }
        })
      } catch (e) {
        console.warn("[OneTap] Init error:", e)
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
        } else if (attempts > 30) {
          clearInterval(interval)
        }
      }, 200)
      return () => {
        cancelled = true
        clearInterval(interval)
        window.google?.accounts?.id?.cancel?.()
      }
    }

    return () => {
      cancelled = true
      window.google?.accounts?.id?.cancel?.()
    }
  }, [user, token, clientId, loginWithGoogle, navigate])

  return null
}
