import { Outlet } from 'react-router-dom'
import CartDrawer from './components/CartDrawer'
import NavigationBar from './components/NavigationBar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <NavigationBar />
      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-8 text-center text-xs text-slate-500">
        Crafted with Supabase, React Router, and Tailwind CSS — inspired by CozyCommerce
      </footer>
      <CartDrawer />
    </div>
  )
}
