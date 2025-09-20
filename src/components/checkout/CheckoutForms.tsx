import { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'

export default function CheckoutForms() {
  const {
    cart,
    checkout: {
      step,
      shipping,
      payment,
      status,
      error,
      updatePayment,
      updateShipping,
      goToStep,
      placeOrder,
    },
  } = useStore()

  const handleShippingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    goToStep('payment')
  }

  const handlePaymentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    goToStep('review')
  }

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await placeOrder()
  }

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {step === 'shipping' && (
        <form
          className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6"
          onSubmit={handleShippingSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Full name
              <input
                required
                type="text"
                value={shipping.name}
                onChange={(event) => updateShipping({ name: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Email
              <input
                required
                type="email"
                value={shipping.email}
                onChange={(event) => updateShipping({ email: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Phone number
              <input
                required
                type="tel"
                value={shipping.phone}
                onChange={(event) => updateShipping({ phone: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Country
              <input
                required
                type="text"
                value={shipping.country}
                onChange={(event) => updateShipping({ country: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300 sm:col-span-2">
              Address line 1
              <input
                required
                type="text"
                value={shipping.address1}
                onChange={(event) => updateShipping({ address1: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300 sm:col-span-2">
              Address line 2
              <input
                type="text"
                value={shipping.address2 ?? ''}
                onChange={(event) => updateShipping({ address2: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              City
              <input
                required
                type="text"
                value={shipping.city}
                onChange={(event) => updateShipping({ city: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              Postal code
              <input
                required
                type="text"
                value={shipping.postalCode}
                onChange={(event) => updateShipping({ postalCode: event.target.value })}
                className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Continue to payment
            </button>
          </div>
        </form>
      )}

      {step === 'payment' && (
        <form
          className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6"
          onSubmit={handlePaymentSubmit}
        >
          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="sr-only">Payment method</legend>
            {['card', 'paypal', 'apple-pay'].map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
                  payment.method === method
                    ? 'border-emerald-400/80 bg-emerald-400/10 text-emerald-200'
                    : 'border-slate-800/60 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method}
                  checked={payment.method === method}
                  onChange={() => updatePayment({ method: method as typeof payment.method })}
                  className="sr-only"
                />
                <span className="font-semibold capitalize">{method.replace('-', ' ')}</span>
                <span className="text-xs text-slate-400">
                  {method === 'card' && 'Pay securely using your credit card.'}
                  {method === 'paypal' && 'You will be redirected to PayPal to complete payment.'}
                  {method === 'apple-pay' && 'Pay quickly with Apple Pay supported devices.'}
                </span>
              </label>
            ))}
          </fieldset>

          {payment.method === 'card' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-300 sm:col-span-2">
                Cardholder name
                <input
                  required
                  type="text"
                  value={payment.cardholder}
                  onChange={(event) => updatePayment({ cardholder: event.target.value })}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Card number
                <input
                  required
                  inputMode="numeric"
                  value={payment.cardNumber}
                  onChange={(event) => updatePayment({ cardNumber: event.target.value })}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                Expiry
                <input
                  required
                  placeholder="MM/YY"
                  value={payment.expiry}
                  onChange={(event) => updatePayment({ expiry: event.target.value })}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                CVC
                <input
                  required
                  type="password"
                  value={payment.cvc}
                  onChange={(event) => updatePayment({ cvc: event.target.value })}
                  className="rounded-xl border border-slate-800/60 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => goToStep('shipping')}
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Back to shipping
            </button>
            <button
              type="submit"
              className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Review order
            </button>
          </div>
        </form>
      )}

      {step === 'review' && (
        <form
          className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6"
          onSubmit={handlePlaceOrder}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Shipping to</h3>
              <p className="text-sm text-slate-300">
                {shipping.name} · {shipping.address1}, {shipping.city} {shipping.postalCode}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Payment method</h3>
              <p className="text-sm text-slate-300 capitalize">{payment.method.replace('-', ' ')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Order summary</h3>
              <ul className="space-y-3">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm text-slate-300">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: item.product.currency ?? 'USD',
                      }).format(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between border-t border-slate-800/60 pt-4 text-sm text-white">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cart.subtotal)}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => goToStep('payment')}
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Back to payment
            </button>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
            >
              {status === 'submitting' ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </form>
      )}

      {step === 'confirmation' && (
        <div className="space-y-4 rounded-3xl border border-emerald-500/60 bg-emerald-500/10 p-6 text-center">
          <h3 className="text-2xl font-semibold text-white">Thank you for your order!</h3>
          <p className="text-sm text-emerald-100">
            A confirmation email is on its way. You can keep track of your orders from the account page.
          </p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => goToStep('shipping')}
              className="rounded-full border border-emerald-300 px-6 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
            >
              Start a new order
            </button>
            <LinkButton to="/account">View orders</LinkButton>
          </div>
        </div>
      )}
    </div>
  )
}

interface LinkButtonProps {
  to: string
  children: ReactNode
}

function LinkButton({ to, children }: LinkButtonProps) {
  return (
    <Link
      to={to}
      className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
    >
      {children}
    </Link>
  )
}
