import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import Layout from './components/layout/Layout'
import { CartProvider } from './components/providers/CartProvider'
import { LanguageProvider } from './components/providers/LanguageProvider'
import CollectionPage from './pages/CollectionPage'
import CustomPage from './pages/CustomPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ShopPage from './pages/ShopPage'

/** Direcciones de la web antigua (estática) que siguen funcionando. */
const legacy: [string, string][] = [
  ['/index.html', '/'],
  ['/tienda.html', '/tienda'],
  ['/accesorios.html', '/accesorios'],
  ['/ropa.html', '/ropa'],
  ['/ceramica.html', '/ceramica'],
  ['/personalizar.html', '/personalizar'],
]

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tienda', element: <ShopPage /> },
      { path: 'personalizar', element: <CustomPage /> },
      { path: ':collection', element: <CollectionPage /> },
      ...legacy.map(([from, to]) => ({ path: from, element: <Navigate to={to} replace /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </LanguageProvider>
  )
}
