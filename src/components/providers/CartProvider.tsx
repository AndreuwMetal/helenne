import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as cart from '../../services/cart'
import { findProduct } from '../../services/catalog'
import { readJson, STORAGE_KEYS, write } from '../../services/storage'
import { CartContext, type CartContextValue } from './cartContext'

const isSellable = (id: string) => findProduct(id)?.price != null

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState(() => cart.parseStored(readJson(STORAGE_KEYS.cart, []), isSellable))
  const [isOpen, setOpen] = useState(false)

  useEffect(() => write(STORAGE_KEYS.cart, lines), [lines])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cart.countItems(lines),
      subtotal: cart.subtotal(lines, (id) => findProduct(id)?.price),
      add: (id) => {
        setLines((l) => cart.addItem(l, id))
        setOpen(true)
      },
      setQty: (id, qty) => setLines((l) => cart.setQty(l, id, qty)),
      remove: (id) => setLines((l) => cart.removeItem(l, id)),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [lines, isOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
