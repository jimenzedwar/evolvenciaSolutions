import { useEffect, useState } from 'react'

const breakpoints: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoint(key: keyof typeof breakpoints) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(`(min-width: ${breakpoints[key]}px)`).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQueryList = window.matchMedia(`(min-width: ${breakpoints[key]}px)`)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [key])

  return matches
}
