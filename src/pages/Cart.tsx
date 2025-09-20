import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function CartPage() {
  const {
    cart: { items, subtotal, updateItemQuantity, removeItem, clear },
  } = useStore()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Cart</p>
        <h1 className="text-3xl font-semibold text-white">Your bag</h1>
        <p className="text-sm text-slate-400">Review items before heading to checkout.</p>
      </header>

      {!items.length && (
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 text-sm text-slate-400">
          Your cart is empty. Browse the <Link to="/products" className="text-emerald-300 hover:text-emerald-200">shop</Link> to add products.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <ul className="space-y-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-4">
                <div className="h-32 w-32 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/70">
                  {item.product.gallery?.[0] ? (
                    <img src={item.product.gallery[0]} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.product.name}</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {item.product.category ?? 'General'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-slate-400 transition hover:text-emerald-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/60 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/60 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: item.product.currency ?? 'USD',
                      }).format(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6">
            <h2 className="text-lg font-semibold text-white">Summary</h2>
            <div className="flex justify-between text-sm text-slate-300">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}</span>
            </div>
            <p className="text-xs text-slate-500">Taxes and shipping are calculated during checkout.</p>
            <Link
              to="/checkout"
              className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Checkout
            </Link>
            <button
              type="button"
              onClick={clear}
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
