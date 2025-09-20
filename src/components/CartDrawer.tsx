import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'

export default function CartDrawer() {
  const {
    cart: { items, subtotal, isOpen, close, updateItemQuantity, removeItem },
  } = useStore()

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition ${
        isOpen ? 'pointer-events-auto opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex-1 bg-slate-950/60 backdrop-blur" onClick={close} />
      <aside
        className={`flex h-full w-full max-w-md flex-col border-l border-slate-800/70 bg-slate-950 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        <header className="flex items-center justify-between border-b border-slate-800/70 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Your cart</h2>
            <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-slate-800/70 p-2 text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!items.length && (
            <p className="text-sm text-slate-400">Your cart is empty. Add products from the shop to get started.</p>
          )}
          <ul className="space-y-6">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/80">
                  {item.product.gallery?.[0] ? (
                    <img
                      src={item.product.gallery[0]}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.product.name}</p>
                      <p className="text-xs text-slate-400">{item.product.category ?? 'General'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-medium text-slate-400 transition hover:text-emerald-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/60 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800/60 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white"
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
        </div>
        <footer className="border-t border-slate-800/70 p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-lg font-semibold text-white">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Shipping and taxes calculated at checkout.</p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              to="/checkout"
              onClick={close}
              className="rounded-full bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Proceed to checkout
            </Link>
            <Link
              to="/cart"
              onClick={close}
              className="rounded-full border border-slate-700 px-4 py-3 text-center text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              View cart details
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  )
}
