import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'

type RevenueBreakdown = Record<string, number>

type DailySales = Array<{ date: string; total: number }>

type InventoryEvent = {
  id: string
  product_id: string
  quantity_delta: number
  reason: string | null
  resulting_quantity: number
  created_at: string
}

type AuditLog = {
  id: number
  action: string
  target_table: string | null
  target_id: string | null
  created_at: string
  metadata: Record<string, unknown>
}

export default function AnalyticsPage() {
  const client = supabase
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenue, setRevenue] = useState<RevenueBreakdown>({})
  const [dailySales, setDailySales] = useState<DailySales>([])
  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>([])
  const [auditLog, setAuditLog] = useState<AuditLog[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!client) {
        setError('Supabase client is not configured')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [{ data: orderData, error: ordersError }, { data: eventData, error: eventError }, { data: auditData, error: auditError }]
        = await Promise.all([
          client
            .from('orders')
            .select('status, total_cents, placed_at')
            .gte('placed_at', thirtyDaysAgo.toISOString()),
          client
            .from('inventory_events')
            .select('id, product_id, quantity_delta, reason, resulting_quantity, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          client
            .from('admin_audit_logs')
            .select('id, action, target_table, target_id, created_at, metadata')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      if (ordersError || eventError || auditError) {
        setError(ordersError?.message ?? eventError?.message ?? auditError?.message ?? 'Unable to load analytics')
        setLoading(false)
        return
      }

      const revenueTotals: RevenueBreakdown = {}
      const dailyTotals = new Map<string, number>()

      for (const order of orderData ?? []) {
        const statusKey = order.status ?? 'unknown'
        const dateKey = new Date(order.placed_at).toISOString().slice(0, 10)
        revenueTotals[statusKey] = (revenueTotals[statusKey] ?? 0) + order.total_cents
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + order.total_cents)
      }

      const formattedDailySales: DailySales = Array.from(dailyTotals.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([date, total]) => ({ date, total }))

      setRevenue(revenueTotals)
      setDailySales(formattedDailySales)
      setInventoryEvents((eventData ?? []) as InventoryEvent[])
      setAuditLog((auditData ?? []) as AuditLog[])
      setLoading(false)
    }

    void fetchAnalytics()
  }, [client])

  const revenueTotal = useMemo(() => Object.values(revenue).reduce((sum, amount) => sum + amount, 0), [revenue])
  const formattedDailySales = useMemo(
    () =>
      dailySales.map((entry) => ({
        date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        total: entry.total / 100,
      })),
    [dailySales],
  )

  if (loading) {
    return <div className="text-sm text-slate-300">Loading analytics…</div>
  }

  if (!client) {
    return (
      <div className="rounded-md border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-200">
        Configure Supabase credentials to access analytics dashboards.
      </div>
    )
  }

  if (error) {
    return <div className="rounded-md border border-rose-500/60 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-50">Commerce analytics</h1>
        <p className="text-sm text-slate-400">Track performance, spot trends, and respond proactively.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Gross revenue (30d)</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenueTotal / 100)}
          </p>
        </div>
        {Object.entries(revenue).map(([status, amount]) => (
          <div key={status} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{status}</p>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100)}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Daily sales (last 30 days)</h2>
        {formattedDailySales.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No orders recorded in the selected range.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {formattedDailySales.map((entry) => (
              <li key={entry.date} className="rounded-md border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500">{entry.date}</p>
                <p className="mt-1 text-base font-semibold text-slate-100">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Recent inventory adjustments</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {inventoryEvents.map((event) => (
              <li key={event.id} className="rounded-md border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-100">{event.product_id.slice(0, 8)}…</p>
                  <span className={`text-xs font-semibold ${event.quantity_delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {event.quantity_delta >= 0 ? '+' : ''}
                    {event.quantity_delta}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                <p className="text-xs text-slate-400">{event.reason ?? 'No reason provided'}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Audit trail</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {auditLog.map((entry) => (
              <li key={entry.id} className="rounded-md border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                <p className="font-semibold text-slate-100">{entry.action}</p>
                <p className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                <p className="text-xs text-slate-400">
                  Target: {entry.target_table ?? '—'} {entry.target_id ? `(${entry.target_id.slice(0, 8)}…)` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
