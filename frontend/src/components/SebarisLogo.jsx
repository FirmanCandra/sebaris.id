import logoDark from '../assets/logo-sebaris-dark.png'
import logoWhite from '../assets/logo-sebaris-white.png'
import logoMark from '../assets/logo.png'

export default function SebarisLogo({
  variant = 'default',
  size = 'md',
  className = '',
  iconOnly = false,
}) {
  if (iconOnly) {
    const iconHeight = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-10' : 'h-8'
    return (
      <img
        src={logoMark}
        alt="sebaris.id icon"
        className={`${iconHeight} w-auto object-contain select-none ${className}`}
        loading="eager"
      />
    )
  }

  // Sizes:
  // sm: height ~28px
  // md: height ~34px
  // lg: height ~44px
  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : 'h-8.5'
  const logoSrc = variant === 'white' ? logoWhite : logoDark

  return (
    <div className={`sebaris-logo flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="sebaris.id"
        className={`${heightClass} w-auto object-contain block`}
        loading="eager"
      />
    </div>
  )
}
