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
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => {
              if (res?.credential && onCredentialResponse) {
                onCredentialResponse(res.credential)
              }
            },
          })
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

    return () => clearInterval(interval)
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
