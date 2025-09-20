import { Link } from 'react-router-dom'
import { Product } from '../context/StoreContext'
import { useStore } from '../context/StoreContext'

interface ProductCardProps {
  product: Product
  showDescription?: boolean
}

export default function ProductCard({ product, showDescription = false }: ProductCardProps) {
  const {
    cart: { addItem },
  } = useStore()

  const primaryImage = product.gallery?.[0] ?? product.image_url
  const priceLabel = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency ?? 'USD',
  }).format(product.price ?? 0)

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg transition hover:-translate-y-1 hover:shadow-emerald-500/20">
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900">
            <span className="text-sm text-slate-500">Image coming soon</span>
          </div>
        )}
        {(product.tags ?? []).includes('new') && (
          <span className="absolute left-4 top-4 rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-950">
            New
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              <Link to={`/products/${product.slug}`} className="transition hover:text-emerald-300">
                {product.name}
              </Link>
            </h3>
            <span className="text-sm font-semibold text-emerald-300">{priceLabel}</span>
          </div>
          {product.inventory_status && (
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
              {product.inventory_status}
            </span>
          )}
          {showDescription && product.description && (
            <p className="text-sm text-slate-400">{product.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => addItem(product, 1)}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Add to cart
        </button>
      </div>
    </article>
  )
}
