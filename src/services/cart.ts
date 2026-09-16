/** Lógica pura del carrito: sin React ni almacenamiento, fácil de probar. */

export interface CartLine {
  id: string
  qty: number
}

export function addItem(lines: CartLine[], id: string, qty = 1): CartLine[] {
  const found = lines.find((l) => l.id === id)
  if (!found) return [...lines, { id, qty }]
  return lines.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
}

/** Cambia la cantidad; con 0 o menos quita la línea. */
export function setQty(lines: CartLine[], id: string, qty: number): CartLine[] {
  if (qty <= 0) return removeItem(lines, id)
  return lines.map((l) => (l.id === id ? { ...l, qty } : l))
}

export function removeItem(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((l) => l.id !== id)
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0)
}

/** Suma en céntimos; ignora productos sin precio o que ya no existen. */
export function subtotal(lines: CartLine[], priceOf: (id: string) => number | null | undefined): number {
  return lines.reduce((sum, l) => sum + (priceOf(l.id) ?? 0) * l.qty, 0)
}

/**
 * Lee el carrito guardado. Acepta el formato de la web antigua
 * ({ id, name, price, img, qty }) y descarta lo que no encaje.
 */
export function parseStored(raw: unknown, isKnown: (id: string) => boolean): CartLine[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const { id, qty } = item as Record<string, unknown>
    if (typeof id !== 'string' || !isKnown(id)) return []
    const n = Math.floor(Number(qty))
    return Number.isFinite(n) && n > 0 ? [{ id, qty: n }] : []
  })
}
