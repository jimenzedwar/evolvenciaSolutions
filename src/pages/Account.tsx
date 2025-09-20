import { FormEvent, useEffect, useState } from 'react'
import { useStore } from '../context/StoreContext'

export default function AccountPage() {
  const {
    account: { profile, loading, error, orders, signInWithOtp, signOut, refreshOrders },
  } = useStore()
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    if (profile) {
      refreshOrders().catch((fetchError) => {
        console.error('Failed to refresh orders', fetchError)
      })
    }
  }, [profile, refreshOrders])

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await signInWithOtp(email)
    setOtpSent(true)
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Account</p>
        <h1 className="text-3xl font-semibold text-white">Your CozyCommerce account</h1>
        <p className="text-sm text-slate-400">
          Authenticate with Supabase and review your order history just like the demo.
        </p>
      </header>

      {error && (
        <div className="rounded-3xl border border-rose-500/70 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
      )}

      {!profile && (
        <form
          onSubmit={handleSignIn}
          className="flex flex-col gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6"
        >
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
          >
            {loading ? 'Sending magic link…' : 'Send magic link'}
          </button>
          {otpSent && !loading && (
            <p className="text-xs text-emerald-200">
              Check your inbox for the Supabase magic link to finish signing in.
            </p>
          )}
        </form>
      )}

      {profile && (
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Account details</h2>
            <p className="mt-2 text-sm text-slate-300">Signed in as {profile.email}</p>
            {profile.full_name && <p className="text-sm text-slate-400">{profile.full_name}</p>}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => refreshOrders()}
                disabled={loading}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white disabled:opacity-70"
              >
                Refresh orders
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Sign out
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Order history</h2>
                <p className="text-sm text-slate-400">Orders sync from Supabase in realtime.</p>
              </div>
            </div>
            {!orders.length && !loading && (
              <p className="mt-4 text-sm text-slate-400">No orders yet. Complete a checkout to see it here.</p>
            )}
            <ul className="mt-4 space-y-4">
              {orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-4">
                  <div className="flex flex-col gap-1 text-sm text-slate-300">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                      {order.status}
                    </span>
                    <span>
                      {new Date(order.created_at).toLocaleDateString()} ·{' '}
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
