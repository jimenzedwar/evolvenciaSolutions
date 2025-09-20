import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultSupabase } from '../supabaseClient'

export interface ProductVariant {
  id: string
  name: string
  price?: number
  sku?: string
  stock?: number | null
  option_values?: Record<string, string>
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  currency?: string
  description?: string
  image_url?: string | null
  gallery?: string[]
  category?: string | null
  tags?: string[] | null
  created_at?: string
  rating?: number | null
  featured?: boolean
  inventory_status?: string | null
  variants?: ProductVariant[] | null
  metadata?: Record<string, unknown> | null
}

export interface CatalogFilters {
  searchTerm: string
  category: string | 'all'
  priceRange: [number, number]
  sort: 'featured' | 'price-asc' | 'price-desc' | 'newest'
  tags: string[]
}

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  product: Product
}

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review' | 'confirmation'

export interface ShippingDetails {
  name: string
  email: string
  phone: string
  address1: string
  address2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface PaymentDetails {
  method: 'card' | 'paypal' | 'apple-pay'
  cardholder: string
  cardNumber: string
  expiry: string
  cvc: string
}

export interface OrderSummary {
  id: string
  status: string
  total: number
  currency: string
  created_at: string
  items: CartItem[]
}

export interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string | null
}

interface CatalogState {
  products: Product[]
  productCache: Record<string, Product>
  loading: boolean
  error?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

interface CheckoutState {
  step: CheckoutStep
  shipping: ShippingDetails
  payment: PaymentDetails
  lastOrder?: OrderSummary
  status: 'idle' | 'submitting' | 'success' | 'error'
  error?: string
}

interface AccountState {
  profile?: Profile
  loading: boolean
  error?: string
  orders: OrderSummary[]
}

interface StoreContextValue {
  catalog: {
    products: Product[]
    featuredProducts: Product[]
    filteredProducts: Product[]
    categories: string[]
    filters: CatalogFilters
    loading: boolean
    error?: string
    refresh: () => Promise<void>
    setFilters: (filters: Partial<CatalogFilters>) => void
    fetchProductBySlug: (slug: string) => Promise<Product | null>
  }
  cart: {
    items: CartItem[]
    count: number
    subtotal: number
    isOpen: boolean
    addItem: (product: Product, quantity?: number, variantId?: string) => void
    updateItemQuantity: (id: string, quantity: number) => void
    removeItem: (id: string) => void
    clear: () => void
    open: () => void
    close: () => void
    toggle: () => void
  }
  checkout: {
    step: CheckoutStep
    shipping: ShippingDetails
    payment: PaymentDetails
    lastOrder?: OrderSummary
    status: 'idle' | 'submitting' | 'success' | 'error'
    error?: string
    goToStep: (step: CheckoutStep) => void
    updateShipping: (details: Partial<ShippingDetails>) => void
    updatePayment: (details: Partial<PaymentDetails>) => void
    placeOrder: () => Promise<void>
    reset: () => void
  }
  account: {
    profile?: Profile
    loading: boolean
    error?: string
    orders: OrderSummary[]
    refreshOrders: () => Promise<void>
    signInWithOtp: (email: string) => Promise<void>
    signOut: () => Promise<void>
  }
}

interface StoreProviderProps {
  children: ReactNode
  supabaseClient?: SupabaseClient | null
  initialState?: {
    products?: Product[]
    cartItems?: CartItem[]
    profile?: Profile
    orders?: OrderSummary[]
  }
  disableInitialFetch?: boolean
}

const defaultFilters: CatalogFilters = {
  searchTerm: '',
  category: 'all',
  priceRange: [0, 2000],
  sort: 'featured',
  tags: [],
}

const emptyShipping: ShippingDetails = {
  name: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
}

const emptyPayment: PaymentDetails = {
  method: 'card',
  cardholder: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

const StoreContext = createContext<StoreContextValue | null>(null)

function applyCatalogFilters(products: Product[], filters: CatalogFilters) {
  const [minPrice, maxPrice] = filters.priceRange
  let result = products.filter((product) => {
    const price = product.price ?? 0
    const matchesCategory = filters.category === 'all' || product.category === filters.category
    const matchesSearch = filters.searchTerm
      ? product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (product.description ?? '').toLowerCase().includes(filters.searchTerm.toLowerCase())
      : true
    const matchesTags = filters.tags.length
      ? (product.tags ?? []).some((tag) => filters.tags.includes(tag))
      : true
    return matchesCategory && matchesSearch && matchesTags && price >= minPrice && price <= maxPrice
  })

  switch (filters.sort) {
    case 'price-asc':
      result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      break
    case 'price-desc':
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      break
    case 'newest':
      result = [...result].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })
      break
    default:
      result = [...result].sort((a, b) => {
        const aFeatured = a.featured || (a.tags ?? []).includes('featured')
        const bFeatured = b.featured || (b.tags ?? []).includes('featured')
        if (aFeatured === bFeatured) {
          return (b.rating ?? 0) - (a.rating ?? 0)
        }
        return aFeatured ? -1 : 1
      })
  }

  return result
}

export function StoreProvider({
  children,
  supabaseClient,
  initialState,
  disableInitialFetch = false,
}: StoreProviderProps) {
  const client = supabaseClient ?? defaultSupabase

  const [catalogState, setCatalogState] = useState<CatalogState>({
    products: initialState?.products ?? [],
    productCache: Object.fromEntries((initialState?.products ?? []).map((product) => [product.slug, product])),
    loading: false,
    error: undefined,
  })
  const [filters, setFiltersState] = useState<CatalogFilters>(defaultFilters)
  const [cartState, setCartState] = useState<CartState>({
    items: initialState?.cartItems ?? [],
    isOpen: false,
  })
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: 'shipping',
    shipping: emptyShipping,
    payment: emptyPayment,
    status: 'idle',
    error: undefined,
  })
  const [accountState, setAccountState] = useState<AccountState>({
    profile: initialState?.profile,
    loading: false,
    error: undefined,
    orders: initialState?.orders ?? [],
  })

  const [sessionUserId, setSessionUserId] = useState<string | null>(initialState?.profile?.id ?? null)

  const refreshCatalog = useCallback(async () => {
    if (!client) {
      return
    }
    setCatalogState((prev) => ({ ...prev, loading: true, error: undefined }))
    const { data, error } = await client
      .from('products')
      .select(
        `id, name, slug, description, price, currency, image_url, gallery, category, tags, featured, rating, created_at, inventory_status, metadata, variants:product_variants(id, name, price, sku, stock, option_values)`
      )
      .order('created_at', { ascending: false })

    if (error) {
      setCatalogState((prev) => ({ ...prev, loading: false, error: error.message }))
      return
    }

    const products: Product[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price ?? 0,
      currency: item.currency ?? 'USD',
      description: item.description ?? undefined,
      image_url: item.image_url ?? undefined,
      gallery: Array.isArray(item.gallery) ? item.gallery : item.image_url ? [item.image_url] : [],
      category: item.category ?? undefined,
      tags: item.tags ?? undefined,
      featured: Boolean(item.featured),
      rating: item.rating ?? null,
      created_at: item.created_at ?? undefined,
      inventory_status: item.inventory_status ?? undefined,
      variants: item.variants ?? undefined,
      metadata: item.metadata ?? undefined,
    }))

    setCatalogState((prev) => ({
      ...prev,
      loading: false,
      products,
      productCache: products.reduce<Record<string, Product>>((cache, product) => {
        cache[product.id] = product
        cache[product.slug] = product
        return cache
      }, {}),
    }))

    if (products.length) {
      const prices = products.map((product) => product.price ?? 0)
      const nextRange: [number, number] = [Math.min(...prices), Math.max(...prices)]
      setFiltersState((prev) => ({ ...prev, priceRange: nextRange }))
    }
  }, [client])

  const fetchProductBySlug = useCallback(
    async (slug: string) => {
      const cached = catalogState.productCache[slug]
      if (cached) {
        return cached
      }

      if (!client) {
        return null
      }

      setCatalogState((prev) => ({ ...prev, loading: true, error: undefined }))

      const { data, error } = await client
        .from('products')
        .select(
          `id, name, slug, description, price, currency, image_url, gallery, category, tags, featured, rating, created_at, inventory_status, metadata, variants:product_variants(id, name, price, sku, stock, option_values)`
        )
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        setCatalogState((prev) => ({ ...prev, loading: false, error: error.message }))
        return null
      }

      if (!data) {
        setCatalogState((prev) => ({ ...prev, loading: false }))
        return null
      }

      const product: Product = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        price: data.price ?? 0,
        currency: data.currency ?? 'USD',
        description: data.description ?? undefined,
        image_url: data.image_url ?? undefined,
        gallery: Array.isArray(data.gallery) ? data.gallery : data.image_url ? [data.image_url] : [],
        category: data.category ?? undefined,
        tags: data.tags ?? undefined,
        featured: Boolean(data.featured),
        rating: data.rating ?? null,
        created_at: data.created_at ?? undefined,
        inventory_status: data.inventory_status ?? undefined,
        variants: data.variants ?? undefined,
        metadata: data.metadata ?? undefined,
      }

      setCatalogState((prev) => ({
        ...prev,
        loading: false,
        products: prev.products.some((existing) => existing.id === product.id)
          ? prev.products.map((existing) => (existing.id === product.id ? product : existing))
          : [...prev.products, product],
        productCache: {
          ...prev.productCache,
          [product.id]: product,
          [product.slug]: product,
        },
      }))

      return product
    },
    [catalogState.productCache, client]
  )

  useEffect(() => {
    if (!client || disableInitialFetch) {
      return
    }
    refreshCatalog().catch((error) => {
      console.error('Failed to load catalog', error)
    })
  }, [client, disableInitialFetch, refreshCatalog])

  useEffect(() => {
    if (!client) {
      return
    }

    setAccountState((prev) => ({ ...prev, loading: true }))

    client.auth
      .getSession()
      .then(({ data }) => {
        const session = data.session
        if (session?.user) {
          setSessionUserId(session.user.id)
          setAccountState((prev) => ({
            ...prev,
            profile: {
              id: session.user.id,
              email: session.user.email ?? undefined,
              full_name: session.user.user_metadata?.full_name ?? undefined,
              avatar_url: session.user.user_metadata?.avatar_url ?? undefined,
            },
            loading: false,
            error: undefined,
          }))
        } else {
          setSessionUserId(null)
          setAccountState((prev) => ({ ...prev, profile: undefined, loading: false }))
        }
      })
      .catch((error) => {
        setAccountState((prev) => ({ ...prev, loading: false, error: error.message }))
      })

    const { data: authSubscription } = client.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setSessionUserId(session.user.id)
        setAccountState((prev) => ({
          ...prev,
          profile: {
            id: session.user.id,
            email: session.user.email ?? undefined,
            full_name: session.user.user_metadata?.full_name ?? undefined,
            avatar_url: session.user.user_metadata?.avatar_url ?? undefined,
          },
        }))
      } else {
        setSessionUserId(null)
        setAccountState((prev) => ({ ...prev, profile: undefined, orders: [] }))
      }
    })

    return () => {
      authSubscription?.subscription.unsubscribe()
    }
  }, [client])

  const refreshOrders = useCallback(async () => {
    if (!client || !sessionUserId) {
      return
    }

    setAccountState((prev) => ({ ...prev, loading: true, error: undefined }))

    const { data, error } = await client
      .from('orders')
      .select('id, status, total, currency, created_at')
      .eq('user_id', sessionUserId)
      .order('created_at', { ascending: false })

    if (error) {
      setAccountState((prev) => ({ ...prev, loading: false, error: error.message }))
      return
    }

    const orders: OrderSummary[] = (data ?? []).map((order) => ({
      id: order.id,
      status: order.status ?? 'processing',
      total: order.total ?? 0,
      currency: order.currency ?? 'USD',
      created_at: order.created_at ?? new Date().toISOString(),
      items: [],
    }))

    setAccountState((prev) => ({ ...prev, orders, loading: false }))
  }, [client, sessionUserId])

  useEffect(() => {
    if (!client || !sessionUserId) {
      return
    }

    const subscription = client
      .channel('orders-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setAccountState((prev) => {
          const existing = prev.orders.find((order) => order.id === payload.new.id)
          if (!existing) {
            return prev
          }
          return {
            ...prev,
            orders: prev.orders.map((order) =>
              order.id === payload.new.id
                ? {
                    ...order,
                    status: payload.new.status ?? order.status,
                    total: payload.new.total ?? order.total,
                  }
                : order
            ),
          }
        })
      })
      .subscribe()

    return () => {
      client.removeChannel(subscription)
    }
  }, [client, sessionUserId])

  const setFilters = useCallback((nextFilters: Partial<CatalogFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...nextFilters }))
  }, [])

  const addItemToCart = useCallback((product: Product, quantity = 1, variantId?: string) => {
    const unitPrice = variantId
      ? product.variants?.find((variant) => variant.id === variantId)?.price ?? product.price
      : product.price
    const id = variantId ? `${product.id}:${variantId}` : product.id

    setCartState((prev) => {
      const existing = prev.items.find((item) => item.id === id)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + quantity } : item
          ),
          isOpen: true,
        }
      }

      const nextItem: CartItem = {
        id,
        productId: product.id,
        variantId,
        quantity,
        unitPrice: unitPrice ?? product.price,
        product,
      }

      return {
        ...prev,
        items: [...prev.items, nextItem],
        isOpen: true,
      }
    })
  }, [])

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    setCartState((prev) => ({
      ...prev,
      items: prev.items
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    }))
  }, [])

  const removeItemFromCart = useCallback((id: string) => {
    setCartState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }, [])

  const clearCart = useCallback(() => {
    setCartState((prev) => ({ ...prev, items: [] }))
  }, [])

  const openCart = useCallback(() => {
    setCartState((prev) => ({ ...prev, isOpen: true }))
  }, [])

  const closeCart = useCallback(() => {
    setCartState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const toggleCart = useCallback(() => {
    setCartState((prev) => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  const subtotal = useMemo(
    () => cartState.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [cartState.items]
  )

  const count = useMemo(
    () => cartState.items.reduce((total, item) => total + item.quantity, 0),
    [cartState.items]
  )

  const goToStep = useCallback((step: CheckoutStep) => {
    setCheckoutState((prev) => ({ ...prev, step }))
  }, [])

  const updateShipping = useCallback((details: Partial<ShippingDetails>) => {
    setCheckoutState((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, ...details },
    }))
  }, [])

  const updatePayment = useCallback((details: Partial<PaymentDetails>) => {
    setCheckoutState((prev) => ({
      ...prev,
      payment: { ...prev.payment, ...details },
    }))
  }, [])

  const resetCheckout = useCallback(() => {
    setCheckoutState({
      step: 'shipping',
      shipping: emptyShipping,
      payment: emptyPayment,
      status: 'idle',
      error: undefined,
    })
  }, [])

  const placeOrder = useCallback(async () => {
    if (!client || !cartState.items.length) {
      return
    }

    setCheckoutState((prev) => ({ ...prev, status: 'submitting', error: undefined }))

    const optimisticOrder: OrderSummary = {
      id: `temp-${Date.now()}`,
      status: 'processing',
      total: subtotal,
      currency: 'USD',
      created_at: new Date().toISOString(),
      items: cartState.items,
    }

    setCheckoutState((prev) => ({ ...prev, lastOrder: optimisticOrder }))
    setAccountState((prev) => ({ ...prev, orders: [optimisticOrder, ...prev.orders] }))

    const payload = {
      user_id: sessionUserId,
      total: subtotal,
      currency: 'USD',
      status: 'processing',
      items: cartState.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      shipping_details: checkoutState.shipping,
      payment_method: checkoutState.payment.method,
    }

    const { data, error } = await client
      .from('orders')
      .insert(payload)
      .select('id, status, total, currency, created_at')
      .single()

    if (error) {
      setCheckoutState((prev) => ({ ...prev, status: 'error', error: error.message }))
      setAccountState((prev) => ({
        ...prev,
        orders: prev.orders.filter((order) => order.id !== optimisticOrder.id),
      }))
      return
    }

    const persistedOrder: OrderSummary = {
      id: data.id,
      status: data.status ?? 'processing',
      total: data.total ?? subtotal,
      currency: data.currency ?? 'USD',
      created_at: data.created_at ?? new Date().toISOString(),
      items: cartState.items,
    }

    setCheckoutState((prev) => ({
      ...prev,
      status: 'success',
      lastOrder: persistedOrder,
      step: 'confirmation',
    }))

    setAccountState((prev) => ({
      ...prev,
      orders: [persistedOrder, ...prev.orders.filter((order) => order.id !== optimisticOrder.id)],
    }))

    setCartState((prev) => ({ ...prev, items: [] }))
  }, [cartState.items, checkoutState.payment.method, checkoutState.shipping, client, sessionUserId, subtotal])

  const signInWithOtp = useCallback(
    async (email: string) => {
      if (!client) {
        return
      }
      setAccountState((prev) => ({ ...prev, loading: true, error: undefined }))
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      })
      if (error) {
        setAccountState((prev) => ({ ...prev, loading: false, error: error.message }))
      } else {
        setAccountState((prev) => ({ ...prev, loading: false }))
      }
    },
    [client]
  )

  const signOut = useCallback(async () => {
    if (!client) {
      return
    }
    setAccountState((prev) => ({ ...prev, loading: true, error: undefined }))
    const { error } = await client.auth.signOut()
    if (error) {
      setAccountState((prev) => ({ ...prev, loading: false, error: error.message }))
      return
    }
    setAccountState({ profile: undefined, loading: false, error: undefined, orders: [] })
    setSessionUserId(null)
  }, [client])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    for (const product of catalogState.products) {
      if (product.category) {
        unique.add(product.category)
      }
    }
    return ['all', ...Array.from(unique)]
  }, [catalogState.products])

  const filteredProducts = useMemo(
    () => applyCatalogFilters(catalogState.products, filters),
    [catalogState.products, filters]
  )

  const featuredProducts = useMemo(
    () =>
      catalogState.products.filter(
        (product) => product.featured || (product.tags ?? []).includes('featured')
      ),
    [catalogState.products]
  )

  const value = useMemo<StoreContextValue>(() => ({
    catalog: {
      products: catalogState.products,
      featuredProducts,
      filteredProducts,
      categories,
      filters,
      loading: catalogState.loading,
      error: catalogState.error,
      refresh: refreshCatalog,
      setFilters,
      fetchProductBySlug,
    },
    cart: {
      items: cartState.items,
      count,
      subtotal,
      isOpen: cartState.isOpen,
      addItem: addItemToCart,
      updateItemQuantity,
      removeItem: removeItemFromCart,
      clear: clearCart,
      open: openCart,
      close: closeCart,
      toggle: toggleCart,
    },
    checkout: {
      step: checkoutState.step,
      shipping: checkoutState.shipping,
      payment: checkoutState.payment,
      lastOrder: checkoutState.lastOrder,
      status: checkoutState.status,
      error: checkoutState.error,
      goToStep,
      updateShipping,
      updatePayment,
      placeOrder,
      reset: resetCheckout,
    },
    account: {
      profile: accountState.profile,
      loading: accountState.loading,
      error: accountState.error,
      orders: accountState.orders,
      refreshOrders,
      signInWithOtp,
      signOut,
    },
  }), [
    accountState.error,
    accountState.loading,
    accountState.orders,
    accountState.profile,
    addItemToCart,
    cartState.isOpen,
    cartState.items,
    categories,
    checkoutState.error,
    checkoutState.lastOrder,
    checkoutState.payment,
    checkoutState.shipping,
    checkoutState.status,
    checkoutState.step,
    clearCart,
    closeCart,
    count,
    fetchProductBySlug,
    featuredProducts,
    filteredProducts,
    filters,
    goToStep,
    openCart,
    placeOrder,
    refreshCatalog,
    refreshOrders,
    removeItemFromCart,
    resetCheckout,
    setFilters,
    subtotal,
    toggleCart,
    updateItemQuantity,
    updatePayment,
    updateShipping,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
