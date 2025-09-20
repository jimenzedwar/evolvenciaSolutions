import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './App'
import './index.css'
import AccountPage from './pages/Account'
import CartPage from './pages/Cart'
import CheckoutPage from './pages/Checkout'
import HomePage from './pages/Home'
import ProductDetailPage from './pages/ProductDetail'
import ProductListPage from './pages/ProductList'
import AdminLayout from './pages/admin/AdminLayout'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import CatalogManagementPage from './pages/admin/CatalogManagementPage'
import ContentManagementPage from './pages/admin/ContentManagementPage'
import OrderFulfillmentPage from './pages/admin/OrderFulfillmentPage'
import ProtectedAdminRoute from './pages/admin/ProtectedAdminRoute'
import { StoreProvider } from './context/StoreContext'
import { supabase } from './supabaseClient'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { index: true, element: <CatalogManagementPage /> },
      { path: 'catalog', element: <CatalogManagementPage /> },
      { path: 'orders', element: <OrderFulfillmentPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'content', element: <ContentManagementPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StoreProvider supabaseClient={supabase ?? undefined} disableInitialFetch={!supabase}>
      <RouterProvider router={router} />
    </StoreProvider>
  </React.StrictMode>
)
