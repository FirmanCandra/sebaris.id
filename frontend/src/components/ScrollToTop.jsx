import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // When routing changes, if there is no hash anchor, always jump to the top of the page immediately
    if (!window.location.hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      })
    }
  }, [pathname, search])

  return null
}
