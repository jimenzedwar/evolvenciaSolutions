import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductCarousel from '../components/ProductCarousel'
import { Product, useStore } from '../context/StoreContext'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const {
    catalog: { products, fetchProductBySlug, loading, error },
    cart: { addItem },
  } = useStore()

  const matchingProduct = useMemo(
    () => products.find((product) => product.slug === slug),
    [products, slug]
  )

  const [product, setProduct] = useState<Product | null>(matchingProduct ?? null)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    matchingProduct?.variants?.[0]?.id ?? undefined
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>(
    matchingProduct ? 'success' : loading ? 'loading' : 'idle'
  )

  useEffect(() => {
    setProduct(matchingProduct ?? null)
    setSelectedVariantId(matchingProduct?.variants?.[0]?.id ?? undefined)
    setStatus(matchingProduct ? 'success' : 'idle')
    setSelectedImageIndex(0)
  }, [matchingProduct])

  useEffect(() => {
    if (!slug || product) {
      return
    }

    setStatus('loading')
    fetchProductBySlug(slug)
      .then((fetched) => {
        if (fetched) {
          setProduct(fetched)
          setSelectedVariantId(fetched.variants?.[0]?.id ?? undefined)
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [fetchProductBySlug, product, slug])

  if (!slug) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-400">Product unavailable.</div>
  }

  if (status === 'loading') {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-400">Loading product details…</div>
  }

  if ((status === 'error' || error) && !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-slate-400">
        We couldn’t find this product in Supabase. It may have been removed.
      </div>
    )
  }

  if (!product) {
    return null
  }

  const priceLabel = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency ?? 'USD',
  }).format(product.price ?? 0)

  const variant = product.variants?.find((item) => item.id === selectedVariantId)

  const recommended = products.filter(
    (candidate) => candidate.id !== product.id && candidate.category === product.category
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70">
            {product.gallery?.[selectedImageIndex] ? (
              <img
                src={product.gallery[selectedImageIndex]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-slate-400">Image coming soon</div>
            )}
          </div>
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.gallery.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => {
                    setSelectedImageIndex(index)
                    if (product.variants && product.variants[index]) {
                      setSelectedVariantId(product.variants[index]?.id)
                    }
                  }}
                  className={`relative h-24 w-24 overflow-hidden rounded-2xl border transition ${
                    index === selectedImageIndex
                      ? 'border-emerald-400/80'
                      : 'border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <img src={image} alt="Product preview" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              {product.category ?? 'Collection'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{product.name}</h1>
            <p className="mt-3 text-base text-slate-300">{product.description}</p>
          </div>
          <div className="flex items-baseline gap-3 text-3xl font-semibold text-emerald-300">
            {priceLabel}
            {variant?.price && variant.price !== product.price && (
              <span className="text-base font-medium text-slate-400">
                Variant price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(variant.price)}
              </span>
            )}
          </div>
          {product.variants && product.variants.length > 0 && (
            <div className="grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Options</p>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedVariantId(item.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      item.id === selectedVariantId
                        ? 'bg-emerald-400 text-slate-950 shadow shadow-emerald-500/20'
                        : 'border border-slate-800/60 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-800/60 px-3 py-1">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 rounded-full text-lg text-slate-300 transition hover:bg-slate-900/80 hover:text-white"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-sm text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="h-8 w-8 rounded-full text-lg text-slate-300 transition hover:bg-slate-900/80 hover:text-white"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => addItem(product, quantity, selectedVariantId)}
              className="flex-1 rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Add to cart
            </button>
          </div>
          {product.inventory_status && (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.inventory_status}</p>
          )}
        </div>
      </div>

      {recommended.length > 0 && (
        <ProductCarousel
          title="You may also like"
          subtitle="Complementary products from the same collection"
          products={recommended.slice(0, 6)}
        />
      )}
    </div>
  )
}
