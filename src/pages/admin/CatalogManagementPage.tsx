import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../../supabaseClient'

interface AdminCategory {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface AdminProduct {
  id: string
  name: string
  slug: string
  status: string
  price_cents: number
  currency: string
  inventory_count: number
  category_id: string | null
  category?: AdminCategory | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function CatalogManagementPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')

  const client = supabase

  const fetchCatalog = useCallback(async () => {
    if (!client) {
      setError('Supabase client is not configured')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const [{ data: productData, error: productError }, { data: categoryData, error: categoryError }] = await Promise.all([
      client
        .from('products')
        .select(
          'id, name, slug, status, price_cents, currency, inventory_count, category_id, categories:category_id (id, name, slug, description)',
        )
        .order('created_at', { ascending: false }),
      client.from('categories').select('id, name, slug, description').order('position', { ascending: true }),
    ])

    if (productError || categoryError) {
      setError(productError?.message ?? categoryError?.message ?? 'Unable to load catalog data')
      setLoading(false)
      return
    }

    setProducts(
      (productData ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        price_cents: product.price_cents,
        currency: product.currency,
        inventory_count: product.inventory_count,
        category_id: product.category_id,
        category: product.categories
          ? {
              id: product.categories.id,
              name: product.categories.name,
              slug: product.categories.slug,
              description: product.categories.description,
            }
          : null,
      })),
    )
    setCategories((categoryData ?? []) as AdminCategory[])
    setLoading(false)
  }, [client])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  const handleInventoryAdjust = useCallback(
    async (productId: string) => {
      if (!client) {
        setError('Supabase client is not configured')
        return
      }

      const deltaInput = window.prompt('Adjustment amount (use negative numbers to deduct)', '1')
      if (deltaInput === null) return

      const delta = Number.parseInt(deltaInput, 10)
      if (!Number.isFinite(delta) || Number.isNaN(delta)) {
        setError('Please provide a valid number')
        return
      }

      const confirmed = window.confirm(`Apply an adjustment of ${delta} units? This action will be logged.`)
      if (!confirmed) return

      const { data, error: rpcError } = await client.rpc('admin_adjust_inventory', {
        p_product_id: productId,
        p_quantity_delta: delta,
        p_reason: 'Manual admin adjustment',
        p_context: { source: 'admin-ui' },
      })

      if (rpcError) {
        setError(rpcError.message)
        setMessage(null)
        return
      }

      if (!data) {
        setError('Inventory update did not return a product record')
        setMessage(null)
        return
      }

      setError(null)
      setProducts((current) => current.map((p) => (p.id === productId ? { ...p, inventory_count: data.inventory_count } : p)))
      setMessage(`Inventory adjusted. New quantity: ${data.inventory_count}`)
    },
    [client],
  )

  const handleToggleStatus = useCallback(
    async (product: AdminProduct) => {
      if (!client) {
        setError('Supabase client is not configured')
        return
      }

      const nextStatus = product.status === 'active' ? 'draft' : 'active'
      const confirmed = window.confirm(`Switch ${product.name} to ${nextStatus}?`)
      if (!confirmed) return

      const { error: updateError } = await client
        .from('products')
        .update({ status: nextStatus })
        .eq('id', product.id)

      if (updateError) {
        setError(updateError.message)
        setMessage(null)
        return
      }

      setError(null)
      setProducts((current) => current.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)))
      setMessage(`${product.name} is now ${nextStatus}`)
    },
    [client],
  )

  const handleCreateCategory = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!client) {
        setError('Supabase client is not configured')
        return
      }

      const name = newCategoryName.trim()
      if (!name) {
        setError('Category name is required')
        return
      }

      const slug = slugify(name)
      const confirmed = window.confirm(`Create category “${name}”?`)
      if (!confirmed) return

      const { error: insertError } = await client.from('categories').insert({
        name,
        slug,
        description: newCategoryDescription.trim() || null,
      })

      if (insertError) {
        setError(insertError.message)
        setMessage(null)
        return
      }

      setError(null)
      setNewCategoryName('')
      setNewCategoryDescription('')
      setMessage('Category created successfully')
      await fetchCatalog()
    },
    [client, fetchCatalog, newCategoryDescription, newCategoryName],
  )

  const groupedProducts = useMemo(() => {
    const grouped = new Map<string, AdminProduct[]>()
    for (const product of products) {
      const key = product.category?.name ?? 'Uncategorized'
      const existing = grouped.get(key) ?? []
      existing.push(product)
      grouped.set(key, existing)
    }
    return Array.from(grouped.entries())
  }, [products])

  if (loading) {
    return <div className="text-sm text-slate-300">Loading catalog...</div>
  }

  if (!client) {
    return (
      <div className="rounded-md border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-200">
        Configure <code className="font-mono text-xs">VITE_SUPABASE_URL</code> and <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> to enable
        catalog management.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Catalog management</h1>
          <p className="text-sm text-slate-400">Track product health, adjust stock, and curate categories.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          {groupedProducts.map(([groupName, groupProducts]) => (
            <div key={groupName} className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h2 className="text-lg font-semibold text-slate-100">{groupName}</h2>
                <span className="text-xs text-slate-400">{groupProducts.length} products</span>
              </div>
              <ul className="divide-y divide-slate-800/60">
                {groupProducts.map((product) => (
                  <li key={product.id} className="py-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.slug}</p>
                        <p className="text-xs text-slate-400">
                          {currencyFormatter.format(product.price_cents / 100)} • Inventory{' '}
                          <span className={product.inventory_count === 0 ? 'text-rose-300' : 'text-emerald-300'}>
                            {product.inventory_count}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                            product.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-200'
                              : 'bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          {product.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void handleInventoryAdjust(product.id)
                          }}
                          className="rounded-md border border-slate-700/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-200"
                        >
                          Adjust stock
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleToggleStatus(product)
                          }}
                          className="rounded-md border border-slate-700/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-indigo-500/50 hover:text-indigo-200"
                        >
                          Toggle status
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Create category</h2>
            <p className="mt-1 text-xs text-slate-400">New categories instantly sync to the storefront navigation.</p>
            <form className="mt-4 space-y-3" onSubmit={handleCreateCategory}>
              <div>
                <label htmlFor="category-name" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </label>
                <input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="Mindful Living"
                />
              </div>
              <div>
                <label htmlFor="category-description" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={(event) => setNewCategoryDescription(event.target.value)}
                  className="mt-1 h-24 w-full rounded-md border border-slate-700/70 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                  placeholder="Optional summary displayed in admin tools"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Create category
              </button>
            </form>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Existing categories</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded-md border border-slate-800/70 px-3 py-2">
                  <span>
                    <p className="font-semibold text-slate-100">{category.name}</p>
                    <p className="text-xs text-slate-500">{category.slug}</p>
                  </span>
                  <span className="text-xs text-slate-500">{category.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}
