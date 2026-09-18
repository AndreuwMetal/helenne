import { at, clamp, ease, panelOpacity, rgb, within, type Keys } from '../../services/timeline'
/** Lo que la escena necesita de la pieza protagonista (modelo 3D). */
export interface PieceView {
  update: (turn: number, tilt: number, explode: number) => void
}

/** Tramo del scroll (0–1) en el que se ve cada sección. */
export const RANGES = {
  hero: [0, 0.07],
  notes: [0.16, 0.37],
  detail: [0.44, 0.57],
  collection: [0.665, 0.855],
  reserve: [0.9, 1],
} as const

const CREAM = [243, 238, 225]
const DARK = [23, 20, 15]
const MIST = [196, 189, 174] // gris cálido que aparece al pasar de oscuro a crema

const background: Keys<readonly number[]> = [
  [0, CREAM],
  [0.39, CREAM],
  [0.44, DARK],
  [0.57, DARK],
  [0.61, MIST],
  [0.65, CREAM],
  [0.86, CREAM],
  [0.9, DARK],
  [1, DARK],
]

const TAU = Math.PI * 2

/**
 * Giro de la pieza (radianes): tres cuartos, una vuelta entera al entrar en
 * «La pieza» para llegar al despiece en la misma postura en que empieza el
 * vídeo del despiece, la espalda en la sección oscura y otra vuelta hasta la
 * tarjeta de la colección.
 */
const turn: Keys<number> = [
  [0, -0.3],
  [0.06, -0.3],
  [0.16, TAU - 0.3],
  [0.39, TAU - 0.3],
  [0.57, TAU + Math.PI - 0.3],
  [0.66, 2 * TAU - 0.3],
  [1, 2 * TAU - 0.3],
]

/** Despiece de capas: se abre en «La pieza» y se vuelve a cerrar. */
const explode: Keys<number> = [
  [0, 0],
  [0.16, 0],
  [0.21, 1],
  [0.33, 1],
  [0.39, 0],
  [1, 0],
]

const tilt: Keys<number> = [
  [0, 0.04],
  [0.19, 0.14],
  [0.34, 0.14],
  [0.41, 0.04],
  [1, 0.04],
]

/** Pieza: [x vw, y vh, escala, giro en grados, opacidad]. */
type Pose = readonly [number, number, number, number, number]

const desktop: Keys<Pose> = [
  [0, [2, 12, 0.78, 0, 1]],
  [0.06, [2, 12, 0.78, 0, 1]],
  [0.16, [11, 9, 1, 0, 1]], // a la derecha: el despiece se abre hacia la izquierda
  [0.37, [11, 9, 1, 0, 1]],
  [0.44, [19, 3, 0.72, -3, 1]],
  [0.57, [19, 3, 0.72, 3, 1]],
  [0.62, [4, 14, 0.5, -6, 1]],
  // de 0.62 a 0.68 viaja hasta la primera tarjeta (se calcula al vuelo)
  [0.87, [0, 30, 0.3, 0, 0]],
  [0.905, [0, 25, 0.3, 0, 1]],
  [1, [0, 25, 0.3, 0, 1]],
]

const mobile: Keys<Pose> = [
  [0, [0, 16, 1.05, 0, 1]],
  [0.06, [0, 16, 1.05, 0, 1]],
  [0.16, [0, 3, 0.95, 0, 1]],
  [0.37, [0, 3, 0.95, 0, 1]],
  [0.44, [0, 30, 0.55, -3, 1]],
  [0.57, [0, 30, 0.55, 3, 1]],
  [0.62, [0, 20, 0.5, -6, 1]],
  [0.87, [0, 30, 0.45, 0, 0]],
  [0.905, [0, 24, 0.45, 0, 1]],
  [1, [0, 24, 0.45, 0, 1]],
]

const HANDOFF = [0.62, 0.685] as const // la pieza vuela a su tarjeta
const TRACK = [0.7, 0.85] as const // el carrusel avanza
const NOTE_STARTS = [0.19, 0.22, 0.25, 0.28]
const FACT_STARTS = [0.46, 0.475, 0.49, 0.505]

interface Card {
  canvas: HTMLCanvasElement
  view: PieceView
}

/**
 * Engancha la animación al scroll. Devuelve la función de limpieza.
 * Todo se escribe directamente en estilos para no re-renderizar React.
 */
export function createStoryAnimation(root: HTMLElement, piece: PieceView, cards: Card[]) {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!
  const qa = <T extends HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)]

  const pieceEl = q('[data-piece]')
  const wordmark = q('[data-wordmark]')
  const panels = qa('[data-panel]')
  const notes = qa('[data-note]')
  const noteLines = qa('[data-note-line]')
  const facts = qa('[data-fact]')
  const track = q('[data-track]')
  const firstCard = q('[data-card="0"] [data-card-piece]')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = matchMedia('(max-width: 760px)')
  const docStyle = document.documentElement.style

  let target = 0
  let current = 0
  let raf = 0

  const progress = () => {
    const r = root.getBoundingClientRect()
    return clamp(-r.top / (root.offsetHeight - innerHeight))
  }

  /** Pose que coloca la pieza exactamente sobre la primera tarjeta. */
  const cardPose = (): Pose => {
    const r = firstCard.getBoundingClientRect()
    const base = pieceEl.offsetWidth
    const x = ((r.left + r.width / 2 - innerWidth / 2) / innerWidth) * 100
    const y = ((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * 100
    return [x, y, r.width / base, 0, 1]
  }

  const apply = (p: number) => {
    const vw = innerWidth / 100
    const vh = innerHeight / 100

    // fondo y color del texto (también el de la cabecera, que está fuera)
    const bg = at(background, p)
    const dark = bg[0] < 120
    root.style.setProperty('--bg', rgb(bg))
    // 0 en crema, 1 en oscuro: enciende el foco bajo la pieza (HomeStory.module.css)
    root.style.setProperty('--dark', String(clamp((CREAM[0] - bg[0]) / (CREAM[0] - DARK[0]))))
    root.dataset.tone = dark ? 'dark' : 'light'
    docStyle.setProperty('--header-fg', dark ? 'var(--paper)' : 'var(--ink)')

    // carrusel (se calcula antes que la pieza: su tarjeta es el destino)
    const travel = Math.max(0, track.scrollWidth - innerWidth)
    track.style.transform = `translate3d(${-travel * ease(within(p, ...TRACK))}px,0,0)`

    // pieza
    const keys = small.matches ? mobile : desktop
    let pose = at(keys, p)
    if (p > HANDOFF[0] && p < 0.87) {
      const from = at(keys, HANDOFF[0])
      const to = cardPose()
      const k = ease(within(p, ...HANDOFF))
      pose = from.map((v, i) => v + (to[i] - v) * k) as unknown as Pose
      // al llegar, la tarjeta toma el relevo
      pose = [pose[0], pose[1], pose[2], pose[3], p > HANDOFF[1] ? 0 : 1]
    }
    const [x, y, s, r, o] = pose
    pieceEl.style.transform = `translate3d(calc(-50% + ${x * vw}px), calc(-50% + ${y * vh}px), 0) scale(${s}) rotate(${r}deg)`
    pieceEl.style.opacity = String(o)
    firstCard.style.opacity = p > HANDOFF[1] && p < 0.9 ? '1' : '0'
    piece.update(at(turn, p), at(tilt, p), at(explode, p))

    // palabra gigante de fondo
    const w = within(p, 0.03, 0.12)
    wordmark.style.opacity = String(1 - w)
    wordmark.style.transform = `translate(-50%, calc(-50% - ${w * 18}vh))`

    // paneles: aparecen y se van hacia arriba, como al hacer scroll
    for (const el of panels) {
      const [from, to] = RANGES[el.dataset.panel as keyof typeof RANGES]
      const o2 = panelOpacity(p, from, to, 0.03)
      const leaving = p > to && to < 1 ? within(p, to, to + 0.03) : 0
      const entering = p < from ? 1 - within(p, from - 0.03, from) : 0
      el.style.opacity = String(o2)
      el.style.visibility = o2 > 0.01 ? 'visible' : 'hidden'
      el.style.transform = `translate3d(0, ${(entering - leaving) * 16 * vh}px, 0)`
    }

    // notas de la pieza: una tras otra, con su línea
    notes.forEach((n, i) => {
      const k = within(p, NOTE_STARTS[i], NOTE_STARTS[i] + 0.025)
      n.style.opacity = String(k)
      n.style.transform = `translate3d(0, ${(1 - k) * 12}px, 0)`
      noteLines[i].style.transform = `scaleX(${within(p, NOTE_STARTS[i] + 0.01, NOTE_STARTS[i] + 0.04)})`
    })

    facts.forEach((f, i) => {
      const k = within(p, FACT_STARTS[i], FACT_STARTS[i] + 0.02)
      f.style.opacity = String(k)
      f.style.transform = `translate3d(${(1 - k) * -16}px, 0, 0)`
    })

    // cada pieza del carrusel gira según su posición en pantalla
    for (const c of cards) {
      const r2 = c.canvas.getBoundingClientRect()
      if (r2.right < -200 || r2.left > innerWidth + 200) continue
      const center = (r2.left + r2.width / 2) / innerWidth // 1 a la derecha, 0 a la izquierda
      c.view.update(-0.3 + (0.6 - center) * Math.PI, 0.08, 0)
    }
  }

  const tick = () => {
    const diff = target - current
    current = reduced || Math.abs(diff) < 0.0004 ? target : current + diff * 0.12
    apply(current)
    raf = current === target ? 0 : requestAnimationFrame(tick)
  }

  const onScroll = () => {
    target = progress()
    if (!raf) raf = requestAnimationFrame(tick)
  }

  target = current = progress()
  apply(current)
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)

  return () => {
    cancelAnimationFrame(raf)
    removeEventListener('scroll', onScroll)
    removeEventListener('resize', onScroll)
    docStyle.removeProperty('--header-fg')
  }
}
