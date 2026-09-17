import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { TILE_CM } from './fabricTextures'

/** Medidas y acabados de un neceser, en centímetros. */
export interface PouchSpec {
  width: number
  height: number
  depth: number
  /** Radio de las esquinas. */
  radius: number
  /** Cuánto sube el centro de la tapa respecto a los extremos. */
  arch: number
  /** Cuánto se estrecha el fondo hacia la cremallera (0–1). */
  taper: number
  /** Separación entre costuras del acolchado. */
  channel: number
  exterior: { map: THREE.Texture; bump: THREE.Texture; sheen: string }
  batting: THREE.Texture
  lining: THREE.Texture
  zipper: string
}

export interface Pouch {
  group: THREE.Group
  /** 0 = cerrado, 1 = capas separadas. */
  setExplode: (amount: number) => void
  /** Base de la pieza (para apoyar la sombra). */
  bottom: number
  dispose: () => void
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Deforma una caja redondeada hasta la silueta del neceser. */
function bodyGeometry(s: PouchSpec, inset: number) {
  const w = s.width - inset * 2
  const h = s.height - inset * 2
  const d = s.depth - inset * 2
  let geo: THREE.BufferGeometry = new RoundedBoxGeometry(w, h, d, 10, Math.max(0.5, s.radius - inset))
  geo.deleteAttribute('uv')
  geo.deleteAttribute('normal')
  geo = mergeVertices(geo)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const u = x / (w / 2)
    const v = y / (h / 2)

    // coordenadas de textura en cm alrededor del contorno (antes de deformar)
    const angle = Math.atan2(z / d, x / w)
    uv[i * 2] = angle * ((w + d) / Math.PI)
    uv[i * 2 + 1] = y

    // se estrecha hacia la cremallera y se abomba en el centro
    z *= 1 - s.taper * smooth(-0.1, 1, v)
    z *= 1 + 0.14 * (1 - u * u) * (1 - v * v)
    // acolchado: surcos suaves entre costuras
    const phase = (y + h / 2) / s.channel
    z *= 1 - 0.03 * Math.pow(Math.cos(Math.PI * phase), 8)
    // la tapa forma un arco
    y += s.arch * (1 - u * u) * smooth(0.2, 1, v)
    // los laterales ceden un poco, como tela blanda
    x *= 1 - 0.04 * smooth(0.3, 1, Math.abs(v))
    pos.setXYZ(i, x, y, z)
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geo.computeVertexNormals()
  return geo
}

/**
 * Parte una geometría en mitad delantera (z ≥ 0) y trasera. De paso arregla
 * los triángulos que cruzan la costura trasera de la textura (`period`, en cm).
 */
function splitFrontBack(geo: THREE.BufferGeometry, period: number): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const flat = geo.toNonIndexed()
  const pos = flat.attributes.position
  const uvs = flat.attributes.uv
  for (let t = 0; t < uvs.count; t += 3) {
    const us = [uvs.getX(t), uvs.getX(t + 1), uvs.getX(t + 2)]
    if (Math.max(...us) - Math.min(...us) > period / 2) {
      us.forEach((u, k) => u < 0 && uvs.setX(t + k, u + period))
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

/** Altura del borde superior en x (centro de la tapa). */
function topY(s: PouchSpec, x: number) {
  const u = x / (s.width / 2)
  let y = s.height / 2 + s.arch * (1 - u * u)
  const edge = Math.abs(x) - (s.width / 2 - s.radius)
  if (edge > 0) y -= s.radius - Math.sqrt(Math.max(0, s.radius * s.radius - edge * edge))
  return y
}

function zipperGroup(s: PouchSpec) {
  const group = new THREE.Group()
  const half = s.width / 2 - s.radius * 0.55
  const tapeMat = new THREE.MeshStandardMaterial({ color: s.zipper, roughness: 0.85 })
  const plastic = new THREE.MeshPhysicalMaterial({ color: s.zipper, roughness: 0.35, clearcoat: 0.4 })

  // cinta: una lámina fina que sigue el arco de la tapa
  const tape = new THREE.BoxGeometry(half * 2, 0.14, 1.2, 80, 1, 1)
  const tp = tape.attributes.position
  for (let i = 0; i < tp.count; i++) tp.setY(i, tp.getY(i) + topY(s, tp.getX(i)) + 0.04)
  tape.computeVertexNormals()
  group.add(new THREE.Mesh(tape, tapeMat))

  // dientes de espiral
  const step = 0.22
  const count = Math.floor((half * 2) / step)
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.12, 0.42), plastic, count)
  const m = new THREE.Matrix4()
  for (let i = 0; i < count; i++) {
    const x = -half + i * step
    m.makeTranslation(x, topY(s, x) + 0.16, 0)
    teeth.setMatrixAt(i, m)
  }
  group.add(teeth)

  // cursor y tirador de tela
  const sliderX = half - 1.6
  const slider = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.5, 0.95, 3, 0.18), plastic)
  slider.position.set(sliderX, topY(s, sliderX) + 0.35, 0)
  group.add(slider)

  const pull = new THREE.Mesh(new RoundedBoxGeometry(0.85, 2.4, 0.14, 2, 0.06), tapeMat)
  pull.position.set(-s.width / 2 - 0.05, s.height / 2 - 1.8, 0)
  pull.rotation.z = 0.12
  group.add(pull)

  group.traverse((o) => (o.castShadow = true))
  return group
}

export function buildPouch(s: PouchSpec): Pouch {
  const group = new THREE.Group()

  const fabric = (map: THREE.Texture, extra: THREE.MeshPhysicalMaterialParameters = {}) => {
    const t = map.clone()
    t.repeat.set(1 / TILE_CM, 1 / TILE_CM)
    t.needsUpdate = true
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.92, side: THREE.DoubleSide, ...extra })
  }

  const bump = s.exterior.bump.clone()
  bump.repeat.set(1, 1 / s.channel)
  bump.needsUpdate = true
  const exteriorMat = fabric(s.exterior.map, {
    bumpMap: bump,
    bumpScale: 2.2,
    sheen: 0.35,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(s.exterior.sheen),
  })
  const battingMat = fabric(s.batting, { roughness: 1, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') })
  const liningMat = fabric(s.lining, { roughness: 0.75 })

  // capas de fuera a dentro; cada una se separa una distancia al despiezar
  // cara interior de cada capa: color liso, no la tela de fuera
  const insideOf = (color: string) =>
    new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.BackSide })

  // capas de fuera a dentro. Al despiezar, la mitad trasera se queda quieta
  // y la delantera de cada capa se separa hacia delante.
  const layers = [
    { inset: 0, mat: exteriorMat, inside: '#c9ced8', spread: 30 },
    { inset: 0.35, mat: battingMat, inside: '#e6ddca', spread: 20 },
    { inset: 0.7, mat: liningMat, inside: '#b9bfcb', spread: 10 },
  ].map(({ inset, mat, inside, spread }) => {
    const [front, back] = splitFrontBack(bodyGeometry(s, inset), 2 * (s.width + s.depth))
    const meshes = [front, back].map((g) => {
      const mesh = new THREE.Mesh(g, mat.clone())
      ;(mesh.material as THREE.MeshPhysicalMaterial).side = THREE.FrontSide
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.add(new THREE.Mesh(g, insideOf(inside)))
      group.add(mesh)
      return mesh
    })
    return { meshes, spread, inner: inset > 0 }
  })

  const zipper = zipperGroup(s)
  group.add(zipper)

  const setExplode = (e: number) => {
    const k = Math.min(1, Math.max(0, e))
    for (const layer of layers) {
      layer.meshes[0].position.z = layer.spread * k
      // las capas interiores solo existen a la vista al abrirse
      for (const m of layer.meshes) m.visible = !layer.inner || k > 0.01
    }
    zipper.position.y = 7 * k
    zipper.position.z = 6 * k
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
          mats.forEach((mm: THREE.Material) => mm.dispose())
        }
      }),
  }
}
