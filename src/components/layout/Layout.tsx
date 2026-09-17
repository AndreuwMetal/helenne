import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import CartDrawer from '../cart/CartDrawer'
import Footer from './Footer'
import Header from './Header'

/** Estructura común: cabecera, página, pie y carrito. */
export default function Layout() {
  const { hash, pathname } = useLocation()
  // la portada es una escena a pantalla completa con su propio pie
  const isHome = pathname === '/'

  // enlaces del buscador del tipo /accesorios#hestia
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    target?.scrollIntoView({ block: 'center' })
  }, [hash, pathname])

  return (
    <>
      <Header overlay={isHome} />
      <main id="contenido">
        <Outlet />
      </main>
      {!isHome && <Footer />}
      <CartDrawer />
      <ScrollRestoration />
    </>
  )
}
