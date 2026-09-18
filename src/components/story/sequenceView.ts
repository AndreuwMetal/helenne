import type { PieceView } from './storyAnimation'

/**
 * Pieza fotorrealista a partir de fotogramas (public/seq/<pieza>/<ancho>/):
 * un giro completo y, si lo hay (explode > 0), un despiece, recortados con su
 * sombra (scripts/sequence).
 * El scroll elige el fotograma; así la pieza se ve como en una foto de
 * producto y no como un modelo 3D.
 */
export const SEQUENCES: Record<string, { turn: number; explode: number }> = {
  azul: { turn: 96, explode: 63 },
  hestia: { turn: 96, explode: 0 },
  hada: { turn: 96, explode: 0 },
}

/** Anchos disponibles de cada fotograma: se usa el menor que llene el lienzo. */
const WIDTHS = [720, 1280]

const TAU = Math.PI * 2
/** Giro con el que empieza el vídeo (tres cuartos), el mismo que usa la escena. */
const START_TURN = -0.3

/** `onReady` avisa al dibujar el primer fotograma (para quitar la imagen fija). */
export function createSequenceView(canvas: HTMLCanvasElement, slug: string, onReady?: () => void) {
  const counts = SEQUENCES[slug]
  const ctx = canvas.getContext('2d')!
  const dpr = Math.min(2, devicePixelRatio)
  const need = (canvas.clientWidth || 960) * dpr
  const width = WIDTHS.find((w) => w >= need * 0.9) ?? WIDTHS[WIDTHS.length - 1]

  const load = (part: 'turn' | 'explode', n: number) =>
    Array.from({ length: n }, (_, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = `/seq/${slug}/${width}/${part}/${String(i).padStart(3, '0')}.webp`
      img.onload = () => draw()
      return img
    })
  const turn = load('turn', counts.turn)
  // el despiece se pide después, cuando el giro ya está en camino
  let explode: HTMLImageElement[] = []
  const later = counts.explode ? setTimeout(() => (explode = load('explode', counts.explode)), 1200) : 0

  const state = { turn: START_TURN, explode: 0 }

  const ready = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0

  /** Fotograma pedido, o el más cercano ya cargado. */
  const nearest = (frames: HTMLImageElement[], i: number, loop: boolean) => {
    const n = frames.length
    for (let d = 0; d < n; d++) {
      for (const j of [i - d, i + d]) {
        const img = frames[loop ? (j + n) % n : Math.min(n - 1, Math.max(0, j))]
        if (ready(img)) return img
      }
    }
    return undefined
  }

  const paint = (img: HTMLImageElement, alpha: number) => {
    // como object-fit: contain
    const s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    ctx.globalAlpha = alpha
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  }

  /**
   * Dibuja la posición exacta entre dos fotogramas: el siguiente se funde
   * sobre el anterior, así el scroll se ve continuo y no a saltos.
   */
  const draw = () => {
    const exploding = state.explode > 0 && explode.length > 0
    const frames = exploding ? explode : turn
    const pos = exploding
      ? state.explode * (explode.length - 1)
      : ((((state.turn - START_TURN) / TAU) % 1) + 1) % 1 * turn.length
    const i = Math.floor(pos)
    const f = pos - i
    const n = frames.length
    const a = nearest(frames, i, !exploding)
    const b = exploding ? explode[Math.min(n - 1, i + 1)] : turn[(i + 1) % n]

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!a) return
    paint(a, 1)
    if (f > 0.01 && ready(b) && b !== a) paint(b!, f)
    ctx.globalAlpha = 1
    onReady?.()
    onReady = undefined
  }

  const resize = () => {
    canvas.width = Math.round((canvas.clientWidth || 960) * dpr)
    canvas.height = Math.round((canvas.clientHeight || 600) * dpr)
    ctx.imageSmoothingQuality = 'high'
    draw()
  }
  resize()

  const view: PieceView & { resize: () => void; dispose: () => void } = {
    update(t, _tilt, e) {
      if (t === state.turn && e === state.explode) return
      Object.assign(state, { turn: t, explode: e })
      draw()
    },
    resize,
    dispose() {
      clearTimeout(later)
      for (const img of [...turn, ...explode]) img.onload = null
    },
  }
  return view
}
