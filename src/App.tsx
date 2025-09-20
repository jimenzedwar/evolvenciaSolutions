import { Link, NavLink, Outlet } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          CozyCommerce Starter
        </h1>
        <p className="text-lg text-slate-300">
          Jump start a Supabase enabled storefront with Vite, React Router, and Tailwind CSS.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <NavLink
            to="/getting-started"
            className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
          >
            Explore the guide
          </NavLink>
          <a
            href="https://supabase.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            Supabase docs
          </a>
        </div>
      </section>
      <section className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-left shadow-xl shadow-slate-950/40 sm:grid-cols-2">
        <Feature
          title="Realtime data"
          description="Manage products, inventory, and orders with Supabase tables and subscriptions."
        />
        <Feature
          title="Beautiful UI"
          description="Tailwind CSS primitives let you recreate CozyCommerce screens quickly."
        />
        <Feature
          title="Client routing"
          description="React Router keeps navigation snappy and URL driven."
        />
        <Feature
          title="TypeScript first"
          description="The toolkit ships with strict TypeScript settings and path aliases."
        />
      </section>
    </div>
  )
}

export function GettingStartedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-16">
      <h2 className="text-3xl font-semibold text-white">Getting started</h2>
      <ol className="space-y-4 text-slate-300">
        <li>
          <strong className="text-white">1. Configure Supabase:</strong> Copy <code>.env.example</code> to <code>.env.local</code> and
          provide your project URL and anon key.
        </li>
        <li>
          <strong className="text-white">2. Run the dev server:</strong> Install dependencies with <code>npm install</code> then run <code>npm run dev</code>.
        </li>
        <li>
          <strong className="text-white">3. Build your flows:</strong> Use the Supabase client exported from <code>src/supabaseClient.ts</code>
          to fetch data, manage auth, and listen for realtime updates.
        </li>
      </ol>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold text-white">
            CozyCommerce
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `transition hover:text-white ${isActive ? 'text-white' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/getting-started"
              className={({ isActive }) =>
                `transition hover:text-white ${isActive ? 'text-white' : ''}`
              }
            >
              Getting started
            </NavLink>
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-6 text-center text-xs text-slate-500">
        Built with Vite, React, Tailwind CSS, and Supabase
      </footer>
    </div>
  )
}
