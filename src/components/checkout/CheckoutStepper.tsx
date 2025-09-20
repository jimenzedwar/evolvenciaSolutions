import { CheckoutStep } from '../../context/StoreContext'

const steps: { id: CheckoutStep; label: string }[] = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
  { id: 'confirmation', label: 'Confirmation' },
]

interface CheckoutStepperProps {
  currentStep: CheckoutStep
  onStepChange?: (step: CheckoutStep) => void
}

export default function CheckoutStepper({ currentStep, onStepChange }: CheckoutStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <nav aria-label="Checkout steps" className="flex flex-col gap-4">
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex
          const isActive = index === currentIndex
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onStepChange?.(step.id)}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
                  isActive
                    ? 'border-emerald-400/80 bg-emerald-400/10 text-emerald-200'
                    : isComplete
                    ? 'border-slate-700 bg-slate-900/70 text-slate-200'
                    : 'border-slate-800/60 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-current text-xs font-semibold uppercase tracking-widest">
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
