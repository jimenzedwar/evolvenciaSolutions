import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import NavigationBar from '../NavigationBar'
import ProductCarousel from '../ProductCarousel'
import { StoreProvider, type Product } from '../../context/StoreContext'

declare global {
  // eslint-disable-next-line no-var
  var setScreenWidth: (width: number) => void
}

function renderWithProvider(ui: ReactElement, products: Product[] = [createProduct()]) {
  return render(
    <StoreProvider supabaseClient={null} disableInitialFetch initialState={{ products }}>
      {ui}
    </StoreProvider>
  )
}

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod_1',
    name: 'Ambient Glow Lamp',
    slug: 'ambient-glow-lamp',
    price: 189,
    currency: 'USD',
    description: 'A warm light for cozy evenings.',
    gallery: ['https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=400&q=80'],
    category: 'Lighting',
    tags: ['featured'],
    featured: true,
    variants: [],
    ...overrides,
  }
}

describe('Responsive layout primitives', () => {
  beforeEach(() => {
    globalThis.setScreenWidth(1024)
  })

  it('renders hamburger navigation on small screens', () => {
    globalThis.setScreenWidth(480)
    renderWithProvider(<NavigationBar />)
    expect(screen.getByLabelText('Open navigation')).toBeInTheDocument()
    expect(screen.queryByText('Shop')).not.toBeInTheDocument()
  })

  it('renders inline navigation links on desktop screens', () => {
    globalThis.setScreenWidth(1280)
    renderWithProvider(<NavigationBar />)
    expect(screen.getByText('Shop')).toBeInTheDocument()
    expect(screen.queryByLabelText('Open navigation')).not.toBeInTheDocument()
  })

  it('enables scroll snapping for product carousel on mobile', () => {
    globalThis.setScreenWidth(600)
    const product = createProduct({ id: 'prod_mobile' })
    const { getByTestId } = renderWithProvider(
      <ProductCarousel title="Featured" products={[product]} />,
      [product]
    )
    expect(getByTestId('product-carousel-track')).toHaveStyle('scroll-snap-type: x mandatory')
  })

  it('disables scroll snapping for carousel on desktop', () => {
    globalThis.setScreenWidth(1400)
    const product = createProduct({ id: 'prod_desktop' })
    const { getByTestId } = renderWithProvider(
      <ProductCarousel title="Featured" products={[product]} />,
      [product]
    )
    expect(getByTestId('product-carousel-track')).toHaveStyle('scroll-snap-type: none')
  })
})
