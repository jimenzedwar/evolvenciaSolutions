import HeroBanner from '../components/HeroBanner'
import ProductCarousel from '../components/ProductCarousel'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'

export default function HomePage() {
  const {
    catalog: { products, featuredProducts, filteredProducts, loading, error },
  } = useStore()

  const newArrivals = products
    .filter((product) => (product.tags ?? []).includes('new'))
    .slice(0, 6)
  const editorPicks = filteredProducts.slice(0, 6)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
      <HeroBanner
        eyebrow="New collection"
        title="Thoughtfully curated home goods"
        description="Bring the CozyCommerce experience into your projects with Supabase-powered catalog data and frictionless checkout flows."
        primaryCta={{ label: 'Shop the collection', to: '/products' }}
        secondaryCta={{ label: 'View cart', to: '/cart' }}
        backgroundImage="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80"
        align="left"
      />

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6"
            >
              <div className="mb-4 h-40 rounded-2xl bg-slate-800/70" />
              <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-800/70" />
              <div className="h-4 w-1/2 rounded-full bg-slate-800/60" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-rose-500/70 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && featuredProducts.length > 0 && (
        <ProductCarousel
          title="Featured pieces"
          subtitle="Handpicked hero products from the CozyCommerce demo"
          products={featuredProducts}
        />
      )}

      {!loading && !error && newArrivals.length > 0 && (
        <ProductCarousel
          title="New arrivals"
          subtitle="Fresh designs that just landed in store"
          products={newArrivals}
        />
      )}

      <section className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 sm:grid-cols-2">
        {editorPicks.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} showDescription />
        ))}
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {["Warm lighting", 'Soft textiles', 'Plant-forward living'].map((title, index) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/30"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Inspiration {index + 1}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Recreate the CozyCommerce aesthetic with curated lighting, textiles, and botanicals designed to glow across any screen size.
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
