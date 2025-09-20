import ProductCard from './ProductCard'
import { Product } from '../context/StoreContext'
import { useBreakpoint } from '../hooks/useBreakpoint'

interface ProductCarouselProps {
  title: string
  subtitle?: string
  products: Product[]
}

export default function ProductCarousel({ title, subtitle, products }: ProductCarouselProps) {
  const isDesktop = useBreakpoint('lg')

  if (!products.length) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div
        data-testid="product-carousel-track"
        className="flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollSnapType: isDesktop ? 'none' : 'x mandatory' }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-72 shrink-0 scroll-mx-6 scroll-smooth snap-start sm:w-80 lg:w-72 xl:w-80"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
