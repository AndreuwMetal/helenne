import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { frameUrl, type Product } from '../../services/catalog'
import { useLanguage } from '../providers/languageContext'
import styles from './ProductSpin.module.css'

const WIDTH = 960
const HEIGHT = 600
const PLAY_MS_PER_FRAME = 55

interface ProductSpinProps {
  product: Product
  /**
   * `play`: se mueve solo una vez al aparecer en pantalla.
   * `scroll`: el fotograma lo decide `progress` (0–1).
   */
  mode?: 'play' | 'scroll'
  progress?: number
  /** Carga inmediata (pieza visible al abrir la página). */
  eager?: boolean
  /** Muestra la indicación «Arrastra para girarlo». */
  hint?: boolean
  size?: 'default' | 'large'
  className?: string
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Pieza sobre su escenario de estudio. Pinta en un canvas la secuencia de
 * public/frames/<slug>/ y funde cada fotograma con el siguiente para que el
 * giro sea continuo aunque haya pocos.
 */
export default function ProductSpin({
  product,
  mode = 'play',
  progress = 0,
  eager = false,
  hint = false,
  size = 'default',
  className = '',
}: ProductSpinProps) {
  const { t } = useLanguage()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const images = useRef<HTMLImageElement[]>([])
  const frame = useRef(0)
  const played = useRef(false)
  const animation = useRef(0)
  const [near, setNear] = useState(eager)
  const last = product.frames - 1

  const draw = useCallback((f: number) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    frame.current = f
    const i = Math.floor(f)
    const a = images.current[i]
    const b = images.current[Math.min(i + 1, last)]
    const ready = (img?: HTMLImageElement) => img?.complete && img.naturalWidth > 0
    if (!ready(a)) return
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.globalAlpha = 1
    ctx.drawImage(a, 0, 0, WIDTH, HEIGHT)
    const mix = f - i
    if (mix > 0.02 && ready(b)) {
      ctx.globalAlpha = mix
      ctx.drawImage(b, 0, 0, WIDTH, HEIGHT)
      ctx.globalAlpha = 1
    }
    // a partir de aquí manda el canvas: el póster sobraría detrás
    if (posterRef.current) posterRef.current.style.visibility = 'hidden'
  }, [last])

  // 1. cargar la secuencia cuando la pieza se acerca a la pantalla
  useEffect(() => {
    if (near) return
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) return
    images.current = Array.from({ length: product.frames }, (_, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = frameUrl(product.slug, i)
      // repinta en cuanto llega el fotograma que toca
      img.onload = () => {
        if (Math.floor(frame.current) === i || Math.ceil(frame.current) === i) draw(frame.current)
      }
      return img
    })
  }, [near, product, draw])

  // 2. modo scroll: el fotograma sigue al progreso
  useEffect(() => {
    if (mode === 'scroll') draw(Math.min(1, Math.max(0, progress)) * last)
  }, [mode, progress, last, draw])

  // 3. modo play: una ida y vuelta la primera vez que se ve
  const play = useCallback(() => {
    cancelAnimationFrame(animation.current)
    const duration = last * PLAY_MS_PER_FRAME * 2
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = (1 - Math.cos(t * Math.PI * 2)) / 2 // 0 → 1 → 0, suave en los extremos
      draw(eased * last)
      if (t < 1) animation.current = requestAnimationFrame(tick)
    }
    animation.current = requestAnimationFrame(tick)
  }, [last, draw])

  useEffect(() => {
    if (mode !== 'play' || !near) return
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played.current) return
        played.current = true
        if (!reducedMotion()) play()
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(animation.current)
    }
  }, [mode, near, play])

  // 4. girar a mano: arrastrar o flechas del teclado
  const drag = useRef<{ x: number; frame: number } | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (mode === 'scroll') return
    cancelAnimationFrame(animation.current)
    played.current = true
    drag.current = { x: e.clientX, frame: frame.current }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const width = e.currentTarget.clientWidth
    const f = drag.current.frame + ((e.clientX - drag.current.x) / width) * last * 1.4
    draw(Math.min(last, Math.max(0, f)))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step || mode === 'scroll') return
    e.preventDefault()
    cancelAnimationFrame(animation.current)
    draw(Math.min(last, Math.max(0, Math.round(frame.current) + step * Math.max(1, Math.round(last / 12)))))
  }

  const interactive = mode === 'play'

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div
        ref={stageRef}
        className={`${styles.stage} ${styles[size]} ${interactive ? styles.interactive : ''}`}
        style={{ '--tint': product.tint } as CSSProperties}
        role="img"
        aria-label={`${product.name}${interactive ? `. ${t('product.dragHint')}` : ''}`}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
      >
        {/* primer fotograma como imagen normal: se ve aunque el canvas aún no haya pintado */}
        <img ref={posterRef} className={styles.poster} src={frameUrl(product.slug, 0)} alt="" loading={eager ? 'eager' : 'lazy'} />
        <canvas ref={canvasRef} className={styles.canvas} width={WIDTH} height={HEIGHT} />
      </div>
      {hint && interactive && <p className={styles.hint}>{t('product.dragHint')}</p>}
    </div>
  )
}
