import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'

interface AdminOrderSummary {
  id: string
  status: string
  total_cents: number
  currency: string
  placed_at: string
  fulfilled_at?: string | null
  email: string | null
  full_name: string | null
  item_count: number
}

interface AdminOrderDetail {
  id: string
  status: string
  total_cents: number
  currency: string
  shipping_address?: Record<string, unknown> | null
  billing_address?: Record<string, unknown> | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
  customer_id: string
  placed_at: string
  fulfilled_at?: string | null
  cancelled_at?: string | null
  order_items: Array<{
    id: number
    quantity: number
    unit_price_cents: number
    subtotal_cents: number
    product_id: string
    products?: { name: string; slug: string }
  }>
}

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100)
}

export default function OrderFulfillmentPage() {
  const client = supabase
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const fetchOrders = useCallback(async () => {
    if (!client) {
      setError('Supabase client is not configured')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: queryError } = await client.from('admin_order_summary').select('*').order('placed_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    setOrders((data ?? []) as AdminOrderSummary[])
    setLoading(false)
  }, [client])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const fetchOrderDetail = useCallback(
    async (orderId: string) => {
      if (!client) return
      const { data, error: detailError } = await client
        .from('orders')
        .select('*, order_items(*, products:product_id(id, name, slug))')
        .eq('id', orderId)
        .maybeSingle()

      if (detailError) {
        setError(detailError.message)
        return
      }

      if (data) {
        setError(null)
        setSelectedOrder({
          ...(data as unknown as AdminOrderDetail),
          order_items: (data.order_items ?? []).map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            subtotal_cents: item.subtotal_cents,
            product_id: item.product_id,
            products: item.products ? { name: item.products.name, slug: item.products.slug } : undefined,
          })),
        })
      }
    },
    [client],
  )

  const handleSelectOrder = useCallback(
    (order: AdminOrderSummary) => {
      setSelectedOrder(null)
      setMessage(null)
      setNoteDraft('')
      void fetchOrderDetail(order.id)
    },
    [fetchOrderDetail],
  )

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: string) => {
      if (!client) return
      const confirmed = window.confirm(`Move order ${orderId.slice(0, 8)}… to ${nextStatus}? This action will be audit logged.`)
      if (!confirmed) return

      const { data, error: rpcError } = await client.rpc('admin_update_order_status', {
        p_order_id: orderId,
        p_status: nextStatus,
        p_notes: noteDraft.trim() || null,
      })

      if (rpcError) {
        setError(rpcError.message)
        setMessage(null)
        return
      }

      setError(null)
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)))
      setMessage(`Order status updated to ${nextStatus}`)
      if (selectedOrder && selectedOrder.id === orderId && data) {
        setSelectedOrder({
          ...selectedOrder,
          status: data.status,
          fulfilled_at: data.fulfilled_at,
          cancelled_at: data.cancelled_at,
          notes: data.notes ?? selectedOrder.notes,
        })
      }
      setNoteDraft('')
      await fetchOrders()
    },
    [client, fetchOrders, noteDraft, selectedOrder],
  )

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total_cents, 0), [orders])
  const openOrders = useMemo(() => orders.filter((order) => ['pending', 'processing'].includes(order.status)).length, [orders])

  if (loading) {
    return <div className="text-sm text-slate-300">Loading orders...</div>
  }

  if (!client) {
    return (
      <div className="rounded-md border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-200">
        Configure Supabase credentials to manage orders.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Order fulfillment</h1>
          <p className="text-sm text-slate-400">Review incoming orders, update statuses, and coordinate logistics.</p>
        </div>
        <div className="flex gap-4 text-sm text-slate-300">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Revenue (lifetime)</p>
            <p className="text-base font-semibold text-emerald-300">{formatCurrency(totalRevenue, orders[0]?.currency ?? 'USD')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Open orders</p>
            <p className="text-base font-semibold text-slate-100">{openOrders}</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => handleSelectOrder(order)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selectedOrder?.id === order.id
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                    : 'border-slate-800/70 bg-slate-950/40 text-slate-300 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-100">{order.full_name ?? order.email ?? 'Guest'}</p>
                  <span className="text-xs text-slate-500">{new Date(order.placed_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{order.item_count} items</span>
                  <span>{formatCurrency(order.total_cents, order.currency)}</span>
                </div>
                <span className="mt-2 inline-block rounded-full bg-slate-800/70 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                  {order.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Order detail</h2>
          {selectedOrder ? (
            <div className="mt-3 space-y-3 text-sm text-slate-300">
              <div className="rounded-md border border-slate-800/60 bg-slate-900/60 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Order ID</p>
                <p className="font-mono text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(event) => {
                    void handleStatusChange(selectedOrder.id, event.target.value)
                  }}
                  className="mt-1 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Leave an internal note</p>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Shipping label printed, awaiting carrier pickup"
                  className="mt-1 h-24 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Items</p>
                <ul className="mt-2 space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-md border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                      <div>
                        <p className="font-semibold text-slate-100">{item.products?.name ?? 'Product removed'}</p>
                        <p className="text-xs text-slate-500">{item.quantity} × {formatCurrency(item.unit_price_cents, selectedOrder.currency)}</p>
                      </div>
                      <p className="text-sm text-slate-200">{formatCurrency(item.subtotal_cents, selectedOrder.currency)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Select an order to review fulfillment details.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
