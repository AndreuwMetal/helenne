import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

/** Medidas (cm) y acabados de una pieza: neceser o estuche. */
export interface ModelSpec {
  width: number
  height: number
  depth: number
  /** Radio de las esquinas. */
  radius: number
  /** Cuánto sube el centro de la tapa respecto a los extremos. */
  arch: number
  /** Cuánto se estrecha el cuerpo hacia la cremallera (0–1). */
  taper: number
  /** Cuánto se abomba el centro de las caras (0–1). */
  puff: number
  exterior: {
    map: THREE.Texture
    /** Tamaño real que cubre una repetición de la textura, en cm. */
    tile: [number, number]
    /** Relieve de acolchado (costuras cada `channel` cm). */
    quilt?: { bump: THREE.Texture; channel: number }
    sheen: string
    sheenAmount?: number
    roughness?: number
    /** Color de la cara interior al despiezar. */
    inside: string
  }
  /** Guata (solo en piezas acolchadas). */
  batting?: THREE.Texture
  lining: { map: THREE.Texture; inside: string }
  zipper: {
    tape: string
    teeth: string
    /** Dientes metálicos (estuches) o espiral de plástico (neceseres). */
    metal: boolean
    /** Tirador: anilla metálica o lengüeta de tela. */
    pull: 'ring' | 'tab'
  }
}

export interface PieceModel {
  group: THREE.Group
  /** 0 = cerrada, 1 = capas separadas. */
  setExplode: (amount: number) => void
  /** Base de la pieza (para apoyar la sombra). */
  bottom: number
  dispose: () => void
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Caja redondeada deformada hasta la silueta de la pieza. Las coordenadas de
 * textura están en cm: `u` recorre el contorno (el frente, de izquierda a
 * derecha, está centrado en u = (w + d) / 2) y `v` es la altura.
 */
function bodyGeometry(s: ModelSpec, inset: number) {
  const w = s.width - inset * 2
  const h = s.height - inset * 2
  const d = s.depth - inset * 2
  let geo: THREE.BufferGeometry = new RoundedBoxGeometry(w, h, d, 10, Math.max(0.4, Math.min(s.radius, h / 2, d / 2) - inset))
  geo.deleteAttribute('uv')
  geo.deleteAttribute('normal')
  geo = mergeVertices(geo)

  const channel = s.exterior.quilt?.channel
  const pos = geo.attributes.position as THREE.BufferAttribute
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const u = x / (w / 2)
    const v = y / (h / 2)

    const angle = Math.atan2(z / d, x / w)
    uv[i * 2] = (Math.PI - angle) * ((s.width + s.depth) / Math.PI)
    uv[i * 2 + 1] = y

    z *= 1 - s.taper * smooth(-0.1, 1, v)
    z *= 1 + s.puff * (1 - u * u) * (1 - v * v)
    if (channel) z *= 1 - 0.03 * Math.pow(Math.cos((Math.PI * (y + h / 2)) / channel), 8)
    y += s.arch * (1 - u * u) * smooth(0.2, 1, v)
    x *= 1 - 0.04 * smooth(0.3, 1, Math.abs(v))
    pos.setXYZ(i, x, y, z)
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  return geo
}

/**
 * Parte una geometría en mitad delantera (z ≥ 0) y trasera, y arregla los
 * triángulos que cruzan la costura de la textura (`period`, en cm).
 */
function splitFrontBack(geo: THREE.BufferGeometry, period: number): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const flat = geo.toNonIndexed()
  const pos = flat.attributes.position
  const uvs = flat.attributes.uv
  for (let t = 0; t < uvs.count; t += 3) {
    const us = [uvs.getX(t), uvs.getX(t + 1), uvs.getX(t + 2)]
    if (Math.max(...us) - Math.min(...us) > period / 2) {
      us.forEach((u, k) => u < period / 2 && uvs.setX(t + k, u + period))
    }
  }
  const halves: [number[], number[]] = [[], []]
  for (let t = 0; t < pos.count; t += 3) {
    const cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3
    halves[cz >= 0 ? 0 : 1].push(t, t + 1, t + 2)
  }
  return halves.map((idx) => {
    const g = new THREE.BufferGeometry()
    for (const [name, attr] of Object.entries(flat.attributes)) {
      const size = attr.itemSize
      const data = new Float32Array(idx.length * size)
      idx.forEach((src, k) => {
        for (let c = 0; c < size; c++) data[k * size + c] = attr.getComponent(src, c)
      })
      g.setAttribute(name, new THREE.BufferAttribute(data, size))
    }
    return g
  }) as [THREE.BufferGeometry, THREE.BufferGeometry]
}

/** Altura del borde superior en x. */
function topY(s: ModelSpec, x: number) {
  const r = Math.min(s.radius, s.height / 2)
  const u = x / (s.width / 2)
  let y = s.height / 2 + s.arch * (1 - u * u)
  const edge = Math.abs(x) - (s.width / 2 - r)
  if (edge > 0) y -= r - Math.sqrt(Math.max(0, r * r - edge * edge))
  return y
}

function zipperGroup(s: ModelSpec) {
  const z = s.zipper
  const group = new THREE.Group()
  const r = Math.min(s.radius, s.height / 2)
  const half = s.width / 2 - r * 0.55
  const tapeMat = new THREE.MeshStandardMaterial({ color: z.tape, roughness: 0.85 })
  const teethMat = z.metal
    ? new THREE.MeshStandardMaterial({ color: z.teeth, metalness: 0.9, roughness: 0.35 })
    : new THREE.MeshPhysicalMaterial({ color: z.teeth, roughness: 0.35, clearcoat: 0.4 })

  // cinta que sigue el arco de la tapa
  const tapeWidth = z.metal ? 1.5 : 1.2
  const tape = new THREE.BoxGeometry(half * 2, 0.14, tapeWidth, 80, 1, 1)
  const tp = tape.attributes.position
  for (let i = 0; i < tp.count; i++) tp.setY(i, tp.getY(i) + topY(s, tp.getX(i)) + 0.04)
  tape.computeVertexNormals()
  group.add(new THREE.Mesh(tape, tapeMat))

  // dientes: metálicos y más gruesos en los estuches
  const step = z.metal ? 0.3 : 0.22
  const tooth = z.metal ? new THREE.BoxGeometry(0.16, 0.2, 0.72) : new THREE.BoxGeometry(0.1, 0.12, 0.42)
  const count = Math.floor((half * 2) / step)
  const teeth = new THREE.InstancedMesh(tooth, teethMat, count)
  const m = new THREE.Matrix4()
  for (let i = 0; i < count; i++) {
    const x = -half + i * step
    // en los metálicos los dientes se alternan como en una cremallera real
    m.makeTranslation(x, topY(s, x) + 0.18, z.metal ? (i % 2 ? 0.08 : -0.08) : 0)
    teeth.setMatrixAt(i, m)
  }
  group.add(teeth)

  // cursor
  const sliderX = z.pull === 'ring' ? -half + 0.9 : half - 1.6
  const slider = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.55, 1.05, 3, 0.18), teethMat)
  slider.position.set(sliderX, topY(s, sliderX) + 0.38, 0)
  group.add(slider)

  if (z.pull === 'ring') {
    // anilla colgando del cursor, por fuera del extremo
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 12, 40), teethMat)
    ring.position.set(sliderX - 1.6, topY(s, sliderX) - 0.2, 0)
    ring.rotation.set(0, Math.PI / 2, 0.5)
    group.add(ring)
  } else {
    const tab = new THREE.Mesh(new RoundedBoxGeometry(0.85, 2.4, 0.14, 2, 0.06), tapeMat)
    tab.position.set(-s.width / 2 - 0.05, s.height / 2 - 1.8, 0)
    tab.rotation.z = 0.12
    group.add(tab)
  }

  group.traverse((o) => (o.castShadow = true))
  return group
}

export function buildPieceModel(s: ModelSpec): PieceModel {
  const group = new THREE.Group()
  const period = 2 * (s.width + s.depth)

  /**
   * Material de tela con su textura a escala real. Cada ficha crea sus
   * propias texturas, así que se ajustan directamente (sin copiarlas).
   */
  const fabric = (map: THREE.Texture, tile: [number, number], extra: THREE.MeshPhysicalMaterialParameters = {}) => {
    map.repeat.set(1 / tile[0], 1 / tile[1])
    // el centro de la textura cae en el centro del frente
    map.offset.set(0.5 - (s.width + s.depth) / 2 / tile[0], 0.5)
    return new THREE.MeshPhysicalMaterial({ map, roughness: 0.92, ...extra })
  }

  const e = s.exterior
  let bump: THREE.Texture | undefined
  if (e.quilt) {
    bump = e.quilt.bump
    bump.repeat.set(1, 1 / e.quilt.channel)
  }
  const exteriorMat = fabric(e.map, e.tile, {
    ...(bump && { bumpMap: bump, bumpScale: 2.2 }),
    roughness: e.roughness ?? 0.92,
    sheen: e.sheenAmount ?? 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(e.sheen),
  })

  const plainTile: [number, number] = [5, 5]
  const specs = [
    { inset: 0, mat: exteriorMat, inside: e.inside },
    ...(s.batting
      ? [{ inset: 0.35, mat: fabric(s.batting, plainTile, { roughness: 1, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') }), inside: '#e6ddca' }]
      : []),
    { inset: s.batting ? 0.7 : 0.35, mat: fabric(s.lining.map, plainTile, { roughness: 0.75 }), inside: s.lining.inside },
  ]
  // al despiezar, la mitad trasera se queda quieta y la delantera de cada
  // capa se separa hacia delante; la exterior es la que más se aleja
  const gap = Math.max(10, s.depth * 1.1)
  const layers = specs.map(({ inset, mat, inside }, i) => {
    const [front, back] = splitFrontBack(bodyGeometry(s, inset), period)
    const meshes = [front, back].map((g) => {
      const mesh = new THREE.Mesh(g, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: inside, roughness: 1, side: THREE.BackSide })))
      group.add(mesh)
      return mesh
    })
    return { meshes, spread: gap * (specs.length - i), inner: i > 0 }
  })

  const zipper = zipperGroup(s)
  group.add(zipper)

  const setExplode = (amount: number) => {
    const k = Math.min(1, Math.max(0, amount))
    for (const layer of layers) {
      layer.meshes[0].position.z = layer.spread * k
      // las capas interiores solo se ven al abrirse
      for (const mesh of layer.meshes) mesh.visible = !layer.inner || k > 0.01
    }
    zipper.position.y = (s.height * 0.4 + 2) * k
    zipper.position.z = gap * 0.6 * k
  }
  setExplode(0)

  return {
    group,
    setExplode,
    bottom: -s.height / 2,
    dispose: () =>
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((mm: THREE.Material) => {
            for (const v of Object.values(mm)) if (v instanceof THREE.Texture) v.dispose()
            mm.dispose()
          })
        }
      }),
  }
}
