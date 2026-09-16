import { describe, expect, it } from 'vitest'
import { addItem, countItems, parseStored, removeItem, setQty, subtotal } from './cart'
import { products } from './catalog'
import { orderMessage } from './whatsapp'

const prices: Record<string, number | null> = { a: 1200, b: 1600, soon: null }
const priceOf = (id: string) => prices[id]

describe('carrito', () => {
  it('suma unidades al añadir el mismo producto', () => {
    const lines = addItem(addItem([], 'a'), 'a')
    expect(lines).toEqual([{ id: 'a', qty: 2 }])
    expect(countItems(addItem(lines, 'b'))).toBe(3)
  })

  it('quita la línea cuando la cantidad baja a cero', () => {
    const lines = addItem([], 'a')
    expect(setQty(lines, 'a', 0)).toEqual([])
    expect(setQty(lines, 'a', 4)).toEqual([{ id: 'a', qty: 4 }])
    expect(removeItem(lines, 'a')).toEqual([])
  })

  it('calcula el subtotal en céntimos e ignora lo que no tiene precio', () => {
    const lines = [{ id: 'a', qty: 2 }, { id: 'b', qty: 1 }, { id: 'soon', qty: 1 }, { id: 'gone', qty: 3 }]
    expect(subtotal(lines, priceOf)).toBe(4000)
  })

  it('lee el formato antiguo y descarta basura', () => {
    const legacy = [
      { id: 'a', name: 'Modelo A', price: 1200, img: 'x.jpg', qty: 2 },
      { id: 'desconocido', qty: 1 },
      { id: 'b', qty: -1 },
      null,
      'texto',
    ]
    expect(parseStored(legacy, (id) => id in prices)).toEqual([{ id: 'a', qty: 2 }])
    expect(parseStored('no es una lista', () => true)).toEqual([])
  })
})

describe('mensaje de pedido', () => {
  it('lista las piezas y el total en el idioma elegido', () => {
    const msg = orderMessage([{ id: 'modelo-hestia', qty: 2 }, { id: 'modelo-hada', qty: 1 }], products, 'es')
    expect(msg).toContain('Modelo Hestia ×2')
    expect(msg).toMatch(/Total: 40,00\s€/)
  })

  it('no incluye piezas que aún no se venden', () => {
    const msg = orderMessage([{ id: 'modelo-azul', qty: 1 }], products, 'en')
    expect(msg).not.toContain('Modelo Azul')
    expect(msg).toContain('Total: €0.00')
  })
})
