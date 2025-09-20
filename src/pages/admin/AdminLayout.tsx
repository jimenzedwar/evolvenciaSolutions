import { NavLink, Outlet } from 'react-router-dom'
import { useAdminSession } from '../../hooks/useAdminSession'
import { supabase } from '../../supabaseClient'

const navItems = [
  {
    to: '/admin/catalog',
    title: 'Catalog',
    description: 'Products, categories, inventory adjustments',
  },
  {
    to: '/admin/orders',
    title: 'Orders',
    description: 'Monitor order queues and fulfillment tasks',
  },
  {
    to: '/admin/analytics',
    title: 'Analytics',
    description: 'Sales performance, conversion rates, and trends',
  },
  {
    to: '/admin/content',
    title: 'Content',
    description: 'Homepage, merchandising blocks, and media assets',
  },
]

export default function AdminLayout() {
  const { session } = useAdminSession()

  const handleSignOut = async () => {
    if (!supabase) return
    const confirmed = window.confirm('Sign out of the admin console?')
    if (!confirmed) return
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-800/60 bg-slate-950/70 px-6 py-8 lg:block">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider text-slate-500">Evolvencia Admin</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">Operations Console</p>
        </div>
        <nav className="space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg border px-4 py-3 text-sm transition ${
                  isActive
                    ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200 shadow'
                    : 'border-slate-800/60 bg-slate-950/40 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-200'
                }`
              }
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex flex-col gap-3 border-b border-slate-800/70 bg-slate-950/80 px-6 py-4 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Signed in as</p>
            <p className="text-base font-semibold text-slate-100">{session?.user.email ?? 'Unknown user'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Admin
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-700/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-rose-500/50 hover:text-rose-200"
            >
              Sign out
            </button>
          </div>
        </header>
        <section className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
