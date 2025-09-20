import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/checkout', label: 'Checkout' },
  { to: '/account', label: 'Account' },
]

function CartIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437m0 0 1.35 5.062a2.25 2.25 0 0 0 2.183 1.666h8.964a2.25 2.25 0 0 0 2.183-1.666l1.218-4.569a1.125 1.125 0 0 0-1.087-1.415H6.766m0 0-1.46-5.477m4.71 18.102a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm9 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a9.028 9.028 0 0 1 15 0" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

export default function NavigationBar() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isDesktop = useBreakpoint('md')
  const {
    cart: { count, open },
  } = useStore()

  const toggleMenu = () => setMobileMenuOpen((openState) => !openState)
  const closeMenu = () => setMobileMenuOpen(false)

  const renderNavItems = (orientation: 'row' | 'column') => (
    <div
      className={
        orientation === 'row'
          ? 'flex items-center gap-2'
          : 'flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4'
      }
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white'
            }`
          }
          onClick={closeMenu}
          end={item.to === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )

  return (
    <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <div className="flex items-center gap-3">
          {!isDesktop && (
            <button
              type="button"
              onClick={toggleMenu}
              className="rounded-full border border-slate-800/80 bg-slate-900/70 p-2 text-slate-200 transition hover:border-slate-600 hover:text-white"
              aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          )}
          <Link to="/" className="text-lg font-semibold tracking-tight text-white">
            CozyCommerce
          </Link>
        </div>

        {isDesktop && renderNavItems('row')}

        <div className="flex items-center gap-3">
          <NavLink
            to="/account"
            className="rounded-full border border-transparent bg-slate-900/60 p-2 text-slate-200 transition hover:border-slate-700 hover:text-white"
            aria-label="Account"
          >
            <UserIcon />
          </NavLink>
          <button
            type="button"
            onClick={() => open()}
            className="relative rounded-full border border-transparent bg-emerald-400/20 p-2 text-emerald-300 transition hover:bg-emerald-400/30 hover:text-emerald-200"
            aria-label="Open cart"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-400 px-1 text-xs font-semibold text-slate-950">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {!isDesktop && isMobileMenuOpen && (
        <div className="border-t border-slate-800/60 bg-slate-950/90 px-4 py-4 md:hidden">
          {renderNavItems('column')}
        </div>
      )}
    </header>
  )
}
