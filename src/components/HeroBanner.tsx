import { Link } from 'react-router-dom'

interface HeroBannerProps {
  eyebrow?: string
  title: string
  description: string
  backgroundImage?: string
  primaryCta: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  align?: 'left' | 'center'
}

export default function HeroBanner({
  eyebrow,
  title,
  description,
  backgroundImage,
  primaryCta,
  secondaryCta,
  align = 'center',
}: HeroBannerProps) {
  const alignmentClasses =
    align === 'left'
      ? 'items-start text-left sm:items-start sm:text-left'
      : 'items-center text-center sm:items-center sm:text-center'

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/80 p-10 shadow-2xl shadow-emerald-500/10 sm:p-16">
      {backgroundImage && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.7)), url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className={`relative z-10 mx-auto flex max-w-3xl flex-col gap-6 ${alignmentClasses}`}>
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="text-lg text-slate-300 sm:text-xl">{description}</p>
        <div className={`flex flex-wrap gap-4 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
          <Link
            to={primaryCta.to}
            className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              to={secondaryCta.to}
              className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
