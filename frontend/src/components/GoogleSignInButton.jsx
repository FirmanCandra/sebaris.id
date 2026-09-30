import { useEffect, useRef } from 'react'

export default function GoogleSignInButton({
  onCredentialResponse,
  text = 'continue_with',
  theme = 'outline',
  size = 'large',
  width = 280,
}) {
  const btnRef = useRef(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (window.google?.accounts?.id && btnRef.current) {
        clearInterval(interval)
        try {
          if (!window.__gsi_initialized_id || window.__gsi_initialized_id !== clientId) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: (res) => {
                if (res?.credential) {
                  window.dispatchEvent(new CustomEvent('sebaris-google-credential', { detail: res.credential }))
                }
              },
            })
            window.__gsi_initialized_id = clientId
          }

          btnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(btnRef.current, {
            type: 'standard',
            theme,
            size,
            width,
            text,
            shape: 'rectangular',
            logo_alignment: 'left',
          })
        } catch (e) {
          console.error('Google button render error:', e)
        }
      } else if (attempts > 30) {
        clearInterval(interval)
      }
    }, 200)

    const onCred = (e) => {
      if (onCredentialResponse && e.detail) {
        onCredentialResponse(e.detail)
      }
    }
    window.addEventListener('sebaris-google-credential', onCred)

    return () => {
      clearInterval(interval)
      window.removeEventListener('sebaris-google-credential', onCred)
    }
  }, [clientId, onCredentialResponse, theme, size, width, text])

  if (!clientId) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg text-center">
        Google Client ID belum diatur di .env
      </div>
    )
  }

  return <div ref={btnRef} className="flex justify-center min-h-[42px]" />
}
