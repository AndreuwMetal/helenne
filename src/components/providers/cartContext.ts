import { createContext, useContext } from 'react'
import type { CartLine } from '../../services/cart'

export interface CartContextValue {
  lines: CartLine[]
  count: number
  /** Céntimos. */
  subtotal: number
  add: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
