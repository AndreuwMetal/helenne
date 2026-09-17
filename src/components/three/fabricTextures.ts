import * as THREE from 'three'

/**
 * Texturas de tela generadas en código a partir de lo medido en los vídeos,
 * para que se repitan sin costuras. Cada textura cubre TILE_CM × TILE_CM.
 */
export const TILE_CM = 5

const SIZE = 1024

function canvas(draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  draw(c.getContext('2d')!)
  return c
}

/** Ruido fino de trama para que la tela no parezca plástico. */
function weave(ctx: CanvasRenderingContext2D, alpha: number) {
  const img = ctx.getImageData(0, 0, SIZE, SIZE)
  const d = img.data
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      // hilos cruzados: pequeñas variaciones en filas y columnas alternas
      const n = ((x + y) % 2 ? 1 : -1) * 6 + (Math.random() - 0.5) * 14
      d[i] += n * alpha
      d[i + 1] += n * alpha
      d[i + 2] += n * alpha
    }
  }
  ctx.putImageData(img, 0, 0)
}

export interface StripeSpec {
  /** Ancho de una pareja de rayas (oscura + clara), en mm. */
  periodMm: number
  dark: string
  light: string
  /** Fracción oscura de cada pareja. */
  darkShare?: number
}

/** Rayas verticales. */
export function stripeTexture({ periodMm, dark, light, darkShare = 0.5 }: StripeSpec) {
  const pairs = Math.round((TILE_CM * 10) / periodMm)
  const c = canvas((ctx) => {
    ctx.fillStyle = light
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = dark
    // bordes suavizados: evita el moaré al ver la tela de lejos
    ctx.filter = 'blur(1.2px)'
    const w = SIZE / pairs
    for (let i = 0; i < pairs; i++) {
      // borde ligeramente irregular, como un hilo teñido
      ctx.fillRect(i * w + (Math.random() - 0.5) * 0.6, 0, w * darkShare, SIZE)
    }
    ctx.filter = 'none'
    weave(ctx, 1)
  })
  return toTexture(c, true)
}

/** Color liso con trama (forro, guata). */
export function plainTexture(color: string, grain = 0.6) {
  const c = canvas((ctx) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, SIZE, SIZE)
    weave(ctx, grain)
  })
  return toTexture(c, true)
}

/**
 * Relieve del acolchado: una costura horizontal por baldosa (claro = alto).
 * La separación real se fija con `repeat` al aplicarla.
 */
export function quiltBump() {
  const c = canvas((ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, SIZE)
    g.addColorStop(0, '#fff')
    g.addColorStop(0.36, '#c8c8c8')
    g.addColorStop(0.5, '#3a3a3a')
    g.addColorStop(0.64, '#c8c8c8')
    g.addColorStop(1, '#fff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, SIZE, SIZE)
    // puntadas: 20 px de hilo y 12 de hueco (32 divide a 1024: sin cortes)
    ctx.fillStyle = '#222'
    for (let x = 0; x < SIZE; x += 32) ctx.fillRect(x, SIZE / 2 - 3, 20, 6)
  })
  return toTexture(c, false)
}

/**
 * Cuadro príncipe de Gales: zonas de pata de gallo alternas con rayas finas
 * y un sobrecuadro azul y rojo, como el del Modelo Hestia.
 */
export function glenCheckTexture() {
  const c = canvas((ctx) => {
    const light = '#cfccc5'
    const dark = '#34343a'
    ctx.fillStyle = light
    ctx.fillRect(0, 0, SIZE, SIZE)
    const block = SIZE / 2
    const unit = 16 // 4 unidades = un diente de la pata de gallo
    for (let by = 0; by < 2; by++) {
      for (let bx = 0; bx < 2; bx++) {
        const x0 = bx * block
        const y0 = by * block
        ctx.fillStyle = dark
        if ((bx + by) % 2 === 0) {
          // pata de gallo: patrón clásico de 8 × 8 hilos
          const tooth = [
            '11110000', '11110000', '11110000', '11110000',
            '00001111', '10001110', '11001100', '11101000',
          ]
          for (let y = 0; y < block; y += unit / 2) {
            for (let x = 0; x < block; x += unit / 2) {
              const row = tooth[(y / (unit / 2)) % 8]
              if (row[(x / (unit / 2)) % 8] === '1') ctx.fillRect(x0 + x, y0 + y, unit / 2, unit / 2)
            }
          }
        } else {
          // rayas finas cruzadas (2 hilos oscuros, 2 claros)
          for (let t = 0; t < block; t += unit) {
            ctx.globalAlpha = 0.75
            ctx.fillRect(x0 + t, y0, unit / 2, block)
            ctx.globalAlpha = 0.45
            ctx.fillRect(x0, y0 + t, block, unit / 2)
            ctx.globalAlpha = 1
          }
        }
      }
    }
    // sobrecuadro
    const line = (color: string, pos: number, width: number) => {
      ctx.fillStyle = color
      ctx.fillRect(pos, 0, width, SIZE)
      ctx.fillRect(0, pos, SIZE, width)
    }
    line('rgba(52, 78, 128, 0.85)', block - 6, 6)
    line('rgba(150, 52, 44, 0.6)', block + 40, 4)
    weave(ctx, 1)
  })
  return toTexture(c, true)
}

/** Foto de la tela real, repetida en espejo para que no se noten los cortes. */
export function photoTexture(url: string, onLoad: () => void) {
  const t = new THREE.TextureLoader().load(url, onLoad)
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function toTexture(c: HTMLCanvasElement, color: boolean) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (color) t.colorSpace = THREE.SRGBColorSpace
  return t
}
