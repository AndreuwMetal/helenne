import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildPieceModel } from './pieceModel'
import { specFor } from './specs'

export interface ModelView {
  /** Giro (radianes), inclinación y despiece (0–1). */
  update: (turn: number, tilt: number, explode: number) => void
  /** Imagen fija del modelo (para miniaturas). */
  snapshot: (turn: number) => string
  resize: () => void
  dispose: () => void
}

/**
 * Escena de estudio para el modelo de una pieza: luz principal suave con
 * sombra, reflejos de un entorno neutro y un suelo invisible que solo recibe
 * la sombra. Solo se dibuja cuando algo cambia.
 */
export function createModelView(canvas: HTMLCanvasElement, slug: string): ModelView {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.35

  const camera = new THREE.PerspectiveCamera(26, 16 / 10, 1, 400)

  const key = new THREE.DirectionalLight('#fff4e6', 1.7)
  key.position.set(-30, 60, 40)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.radius = 8
  key.shadow.bias = -0.0004
  Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 160 })
  scene.add(key)
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9cfbd', 0.55))

  let draw = () => {}
  const spec = specFor(slug, () => draw())
  const pouch = buildPieceModel(spec)
  // la cámara se aleja o acerca según el tamaño de la pieza
  const size = Math.max(spec.width * 0.8, spec.height * 1.3)
  const pivot = new THREE.Group()
  pivot.add(pouch.group)
  scene.add(pivot)

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.2 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = pouch.bottom - 0.02
  ground.receiveShadow = true
  scene.add(ground)

  // sombra de contacto: mancha difusa justo debajo
  const blob = document.createElement('canvas')
  blob.width = blob.height = 128
  const bctx = blob.getContext('2d')!
  const grad = bctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.55)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  bctx.fillStyle = grad
  bctx.fillRect(0, 0, 128, 128)
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.35, spec.depth * 1.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blob), transparent: true, depthWrite: false }),
  )
  contact.rotation.x = -Math.PI / 2
  contact.position.y = pouch.bottom + 0.01
  scene.add(contact)

  const state = { turn: 0, tilt: 0, explode: 0 }

  const place = () => {
    const w = canvas.clientWidth || 960
    const h = canvas.clientHeight || 600
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  /** Al despiezar, la cámara se aleja para que quepan todas las capas. */
  const frame = (explode: number) => {
    const k = size / 22
    camera.position.set(0, (18 + 8 * explode) * k, (78 + 34 * explode) * k)
    camera.lookAt(0, (0.5 + 2 * explode) * k, 0)
  }

  draw = () => {
    pivot.rotation.y = state.turn
    pivot.rotation.x = state.tilt
    // el conjunto despiezado gira alrededor de su centro, no del cuerpo
    pivot.position.set(0, 0, 0)
    pouch.group.position.z = -spec.depth * 1.25 * state.explode
    frame(state.explode)
    pouch.setExplode(state.explode)
    contact.material.opacity = 1 - state.explode * 0.7
    renderer.render(scene, camera)
  }

  place()
  draw()

  return {
    update(turn, tilt, explode) {
      if (turn === state.turn && tilt === state.tilt && explode === state.explode) return
      Object.assign(state, { turn, tilt, explode })
      draw()
    },
    snapshot(turn) {
      const prev = { ...state }
      Object.assign(state, { turn, tilt: 0, explode: 0 })
      draw()
      const url = canvas.toDataURL('image/png')
      Object.assign(state, prev)
      draw()
      return url
    },
    resize() {
      place()
      draw()
    },
    dispose() {
      pouch.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
