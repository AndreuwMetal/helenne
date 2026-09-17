/**
 * Línea de tiempo del scroll de la portada: valores que cambian con el
 * progreso (0–1) y se interpolan entre claves. Sin DOM, fácil de probar.
 */

export type Value = number | readonly number[]
export type Keys<V extends Value> = readonly (readonly [progress: number, value: V])[]

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

/** Suave al entrar y al salir. */
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

export function lerp<V extends Value>(a: V, b: V, t: number): V {
  if (typeof a === 'number') return (a + ((b as number) - a) * t) as V
  return (a as readonly number[]).map((v, i) => v + ((b as readonly number[])[i] - v) * t) as unknown as V
}

/** Valor en `p`: se queda en la primera/última clave fuera del rango. */
export function at<V extends Value>(keys: Keys<V>, p: number): V {
  if (p <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i]
    if (p <= p1) {
      const [p0, v0] = keys[i - 1]
      return lerp(v0, v1, ease((p - p0) / (p1 - p0)))
    }
  }
  return keys[keys.length - 1][1]
}

/** Cuánto se ha recorrido el tramo [from, to]: 0 antes, 1 después. */
export const within = (p: number, from: number, to: number) => clamp((p - from) / (to - from))

/**
 * Visibilidad de un panel que ocupa [from, to]: aparece y desaparece en `fade`.
 * `from <= 0` = visible desde el principio; `to >= 1` = no desaparece.
 */
export function panelOpacity(p: number, from: number, to: number, fade = 0.025): number {
  const fadeIn = from <= 0 ? 1 : within(p, from - fade, from)
  const fadeOut = to >= 1 ? 1 : 1 - within(p, to, to + fade)
  return Math.min(fadeIn, fadeOut)
}

export const rgb = (c: readonly number[]) => `rgb(${c.map(Math.round).join(' ')})`
