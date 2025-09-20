import CheckoutForms from '../components/checkout/CheckoutForms'
import CheckoutStepper from '../components/checkout/CheckoutStepper'
import { useStore } from '../context/StoreContext'

export default function CheckoutPage() {
  const {
    checkout: { step, goToStep },
    cart: { items },
  } = useStore()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Checkout</p>
        <h1 className="text-3xl font-semibold text-white">Complete your order</h1>
        <p className="text-sm text-slate-400">Follow the guided steps to mirror CozyCommerce’s checkout flow.</p>
      </header>

      <CheckoutStepper currentStep={step} onStepChange={goToStep} />

      {!items.length && (
        <div className="rounded-3xl border border-amber-500/60 bg-amber-500/10 p-6 text-sm text-amber-200">
          Your cart is empty. Add items from the shop before checking out.
        </div>
      )}

      <CheckoutForms />
    </div>
  )
}
