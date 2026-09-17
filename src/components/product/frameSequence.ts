import { frameUrl } from '../../services/catalog'

export const FRAME_WIDTH = 960
export const FRAME_HEIGHT = 600

/**
 * Secuencia de fotogramas pintada en un canvas. Funde cada fotograma con el
 * siguiente para que el movimiento sea continuo aunque haya pocos.
 */
export class FrameSequence {
  readonly count: number
  private canvas: HTMLCanvasElement
  private slug: string
  private images: HTMLImageElement[] = []
  private current = -1
  private ctx: CanvasRenderingContext2D | null
  private onFirstPaint?: () => void

  constructor(canvas: HTMLCanvasElement, slug: string, count: number, onFirstPaint?: () => void) {
    this.canvas = canvas
    this.slug = slug
    this.count = count
    this.ctx = canvas.getContext('2d')
    this.onFirstPaint = onFirstPaint
  }

  get last() {
    return this.count - 1
  }

  get frame() {
    return Math.max(0, this.current)
  }

  /** Descarga todos los fotogramas (el navegador los cachea). */
  load() {
    if (this.images.length) return
    this.images = Array.from({ length: this.count }, (_, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = frameUrl(this.slug, i)
      img.onload = () => {
        // repinta si acaba de llegar el fotograma que se está mostrando
        const f = this.frame
        if (Math.floor(f) === i || Math.ceil(f) === i) this.draw(f, true)
      }
      return img
    })
  }

  /** Pinta el fotograma `f` (admite decimales). */
  draw(f: number, force = false) {
    const ctx = this.ctx
    if (!ctx) return
    f = Math.min(this.last, Math.max(0, f))
    if (!force && Math.abs(f - this.current) < 0.005) return
    const i = Math.floor(f)
    const a = this.images[i]
    const b = this.images[Math.min(i + 1, this.last)]
    if (!ready(a)) return
    this.current = f
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.globalAlpha = 1
    ctx.drawImage(a, 0, 0, this.canvas.width, this.canvas.height)
    const mix = f - i
    if (mix > 0.02 && ready(b)) {
      ctx.globalAlpha = mix
      ctx.drawImage(b, 0, 0, this.canvas.width, this.canvas.height)
      ctx.globalAlpha = 1
    }
    this.onFirstPaint?.()
    this.onFirstPaint = undefined
  }
}

const ready = (img?: HTMLImageElement): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0
