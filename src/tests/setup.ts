import '@testing-library/jest-dom'
import { vi } from 'vitest'

type MatchMediaQuery = {
  matches: boolean
  media: string
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null
  addEventListener: (type: 'change', listener: (event: MediaQueryListEvent) => void) => void
  removeEventListener: (type: 'change', listener: (event: MediaQueryListEvent) => void) => void
  addListener: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener: (listener: (event: MediaQueryListEvent) => void) => void
  dispatchEvent: (event: Event) => boolean
}

function createMatchMedia(width: number) {
  return (query: string): MatchMediaQuery => {
    const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query)
    const minWidth = minWidthMatch ? Number.parseInt(minWidthMatch[1] ?? '0', 10) : 0
    const matches = width >= minWidth
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: (_type, listener) => {
        listeners.add(listener)
      },
      removeEventListener: (_type, listener) => {
        listeners.delete(listener)
      },
      addListener: (listener) => listeners.add(listener),
      removeListener: (listener) => listeners.delete(listener),
      dispatchEvent: (event) => {
        listeners.forEach((listener) => listener(event as MediaQueryListEvent))
        return true
      },
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var setScreenWidth: (width: number) => void
}

const initialWidth = 1024

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn(createMatchMedia(initialWidth)),
})

globalThis.setScreenWidth = (width: number) => {
  window.matchMedia = vi.fn(createMatchMedia(width))
}
