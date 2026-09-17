import { describe, expect, it } from 'vitest'
import { at, panelOpacity, within } from './timeline'

describe('línea de tiempo', () => {
  const keys = [
    [0, 0],
    [0.5, 10],
    [1, 10],
  ] as const

  it('se queda en los extremos y pasa por las claves', () => {
    expect(at(keys, -1)).toBe(0)
    expect(at(keys, 0.5)).toBe(10)
    expect(at(keys, 2)).toBe(10)
    expect(at(keys, 0.25)).toBeCloseTo(5)
  })

  it('interpola listas (colores, posiciones)', () => {
    expect(at([[0, [0, 100]], [1, [10, 0]]] as const, 0.5)).toEqual([5, 50])
  })

  it('mide el avance de un tramo', () => {
    expect(within(0.1, 0.2, 0.4)).toBe(0)
    expect(within(0.3, 0.2, 0.4)).toBeCloseTo(0.5)
    expect(within(0.9, 0.2, 0.4)).toBe(1)
  })

  it('muestra un panel solo en su tramo', () => {
    expect(panelOpacity(0, 0, 0.2)).toBe(1)
    expect(panelOpacity(0.3, 0, 0.2)).toBe(0)
    expect(panelOpacity(0.5, 0.4, 0.6)).toBe(1)
    expect(panelOpacity(0.3, 0.4, 0.6)).toBe(0)
    expect(panelOpacity(0.99, 0.9, 1)).toBe(1)
  })
})
