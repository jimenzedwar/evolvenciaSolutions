import { ChangeEvent } from 'react'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'

export default function ProductListPage() {
  const {
    catalog: { filteredProducts, categories, filters, loading, error, setFilters },
  } = useStore()

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchTerm: event.target.value })
  }

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters({ category: event.target.value as typeof filters.category })
  }

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFilters({ sort: event.target.value as typeof filters.sort })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Shop the collection</p>
          <h1 className="text-3xl font-semibold text-white">All products</h1>
          <p className="text-sm text-slate-400">
            Filter by category, search, or sort to explore the CozyCommerce catalog fetched from Supabase.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Search
            <input
              type="search"
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="Search products"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Category
            <select
              value={filters.category}
              onChange={handleCategoryChange}
              className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All products' : category}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Sort
            <select
              value={filters.sort}
              onChange={handleSortChange}
              className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
      </header>

      {loading && <p className="text-sm text-slate-400">Loading catalog from Supabase…</p>}

      {error && (
        <div className="rounded-3xl border border-rose-500/70 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
      )}

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {!loading && !filteredProducts.length && (
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 text-sm text-slate-400">
          No products match your filters. Try adjusting your search or category selection.
        </div>
      )}
    </div>
  )
}
