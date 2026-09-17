import { glenCheckTexture, photoTexture, plainTexture, quiltBump, stripeTexture, TILE_CM } from './fabricTextures'
import type { ModelSpec } from './pieceModel'

/**
 * Fichas de los modelos 3D. Medidas y colores estimados a partir de los
 * vídeos de cada pieza; con las medidas reales basta con cambiar los números.
 * `onTexture` se llama cuando termina de cargar una textura fotográfica.
 */
const builders: Record<string, (onTexture: () => void) => ModelSpec> = {
  // neceser acolchado de rayas (frente 1,29 : 1, rayas cada 2,4 mm)
  azul: () => ({
    width: 22,
    height: 17,
    depth: 12,
    radius: 3.2,
    arch: 1.4,
    taper: 0.38,
    puff: 0.14,
    exterior: {
      map: stripeTexture({ periodMm: 2.4, dark: '#232a45', light: '#dde2ea', darkShare: 0.56 }),
      tile: [TILE_CM, TILE_CM],
      quilt: { bump: quiltBump(), channel: 4.2 },
      sheen: '#56607f',
      inside: '#c9ced8',
    },
    batting: plainTexture('#efe7d6', 2.2),
    lining: { map: plainTexture('#c9ced8', 0.8), inside: '#b9bfcb' },
    zipper: { tape: '#f4f3ef', teeth: '#f4f3ef', metal: false, pull: 'tab' },
  }),

  // estuche alargado de cuadro príncipe de Gales, forro blanco, cremallera de metal con anilla
  hestia: () => ({
    width: 21,
    height: 6.6,
    depth: 6.4,
    radius: 2.4,
    arch: 0.3,
    taper: 0.34,
    puff: 0.06,
    exterior: {
      map: glenCheckTexture(),
      tile: [2.2, 2.2],
      sheen: '#9a978f',
      sheenAmount: 0.25,
      inside: '#ecebe6',
    },
    lining: { map: plainTexture('#efeee9', 0.6), inside: '#dddcd6' },
    zipper: { tape: '#1b1b1e', teeth: '#8c6b3d', metal: true, pull: 'ring' },
  }),

  // estuche de encaje burdeos con brillo de terciopelo y forro a juego
  rose: (onTexture) => ({
    width: 20,
    height: 5.8,
    depth: 6,
    radius: 2.6,
    arch: 0.4,
    taper: 0.3,
    puff: 0.1,
    exterior: {
      map: photoTexture('/textures/rose.jpg', onTexture),
      tile: [11, 1.9],
      sheen: '#d0506a',
      sheenAmount: 0.7,
      roughness: 0.85,
      inside: '#5e1624',
    },
    lining: { map: plainTexture('#6b1a2b', 0.8), inside: '#521321' },
    zipper: { tape: '#22253a', teeth: '#8c6b3d', metal: true, pull: 'ring' },
  }),

  // neceser acolchado con estampado de cachemir: la foto del frente es la tela
  hada: (onTexture) => ({
    width: 19,
    height: 15.5,
    depth: 9,
    radius: 3,
    arch: 1,
    taper: 0.34,
    puff: 0.12,
    exterior: {
      map: photoTexture('/textures/hada.jpg', onTexture),
      tile: [19, 15.5],
      quilt: { bump: quiltBump(), channel: 3.6 },
      sheen: '#caa3a8',
      sheenAmount: 0.3,
      inside: '#e8e2d6',
    },
    batting: plainTexture('#efe7d6', 2.2),
    lining: { map: plainTexture('#e8e2d6', 0.8), inside: '#d8d1c3' },
    zipper: { tape: '#6d717a', teeth: '#6d717a', metal: false, pull: 'tab' },
  }),
}

export const hasModel = (slug: string) => slug in builders

export function specFor(slug: string, onTexture: () => void): ModelSpec {
  const build = builders[slug]
  if (!build) throw new Error(`No hay modelo 3D para «${slug}»`)
  return build(onTexture)
}
