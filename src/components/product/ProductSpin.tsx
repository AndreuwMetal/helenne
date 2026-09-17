import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { frameUrl, type Product } from '../../services/catalog'
import { useLanguage } from '../providers/languageContext'
import { FRAME_HEIGHT, FRAME_WIDTH, FrameSequence } from './frameSequence'
import styles from './ProductSpin.module.css'

const PLAY_MS_PER_FRAME = 55

interface ProductSpinProps {
  product: Product
  /** Carga inmediata (pieza visible al abrir la página). */
  eager?: boolean
  className?: string
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Pieza que se mueve sola una vez al aparecer y que se puede girar
 * arrastrando o con las flechas del teclado.
 */
export default function ProductSpin({ product, eager = false, className = '' }: ProductSpinProps) {
  const { t } = useLanguage()
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const seq = useRef<FrameSequence | null>(null)
  const animation = useRef(0)
  const drag = useRef<{ x: number; frame: number } | null>(null)

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return
    const s = new FrameSequence(canvas, product.slug, product.frames, () => {
      if (posterRef.current) posterRef.current.style.visibility = 'hidden'
    })
    seq.current = s
    let played = false

    const play = () => {
      const duration = s.last * PLAY_MS_PER_FRAME * 2
      const start = performance.now()
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / duration)
        s.draw(((1 - Math.cos(k * Math.PI * 2)) / 2) * s.last) // ida y vuelta
        if (k < 1) animation.current = requestAnimationFrame(tick)
      }
      animation.current = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) s.load()
          if (e.intersectionRatio >= 0.6 && !played) {
            played = true
            if (!reducedMotion()) play()
          }
        }
      },
      { rootMargin: '300px 0px', threshold: [0, 0.6] },
    )
    io.observe(box)
    if (eager) s.load()
    return () => {
      io.disconnect()
      cancelAnimationFrame(animation.current)
    }
  }, [product, eager])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!seq.current) return
    cancelAnimationFrame(animation.current)
    drag.current = { x: e.clientX, frame: seq.current.frame }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !seq.current) return
    const dx = (e.clientX - drag.current.x) / e.currentTarget.clientWidth
    seq.current.draw(drag.current.frame + dx * seq.current.last * 1.4)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = seq.current
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!s || !dir) return
    e.preventDefault()
    cancelAnimationFrame(animation.current)
    s.draw(Math.round(s.frame) + dir * Math.max(1, Math.round(s.last / 12)))
  }

  return (
    <div
      ref={boxRef}
      className={`${styles.piece} ${className}`}
      role="img"
      aria-label={`${product.name}. ${t('product.dragHint')}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={onKeyDown}
    >
      <img ref={posterRef} className={styles.layer} src={frameUrl(product.slug, 0)} alt="" loading={eager ? 'eager' : 'lazy'} />
      <canvas ref={canvasRef} className={styles.layer} width={FRAME_WIDTH} height={FRAME_HEIGHT} />
    </div>
  )
}
