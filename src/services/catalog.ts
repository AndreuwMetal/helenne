import type { Localized } from './i18n'

export type CollectionSlug = 'accesorios' | 'ropa' | 'ceramica'

export interface Collection {
  slug: CollectionSlug
  name: Localized
  description: Localized
  image: string
  /** Texto para cuando la colección aún no tiene piezas. */
  emptyText?: Localized
}

export interface Product {
  id: string
  slug: string
  name: string
  collection: CollectionSlug
  kind: Localized
  description: Localized
  /** Precio en céntimos. `null` = todavía no se vende. */
  price: number | null
  /** Color del escenario donde gira la pieza. */
  tint: string
  /** Nº de fotogramas en public/frames/<slug>/. */
  frames: number
  photos: string[]
  thumb: string
}

const photos = (slug: string, n: number) =>
  Array.from({ length: n }, (_, i) => `/img/products/${slug}/${i + 1}.jpg`)

export const collections: Collection[] = [
  {
    slug: 'accesorios',
    name: { es: 'Accesorios', en: 'Accessories' },
    description: {
      es: 'Estuches y neceseres cosidos a mano, pieza a pieza, con telas seleccionadas y acabados cuidados.',
      en: 'Pencil cases and pouches sewn by hand, piece by piece, with selected fabrics and careful finishes.',
    },
    image: '/img/products/hestia/1.jpg',
  },
  {
    slug: 'ropa',
    name: { es: 'Ropa', en: 'Clothing' },
    description: {
      es: 'Prendas cosidas a mano en tejidos naturales, pensadas para durar y para llevarse a diario.',
      en: 'Hand-sewn garments in natural fabrics, made to last and to wear every day.',
    },
    image: 'https://images.unsplash.com/photo-1501127122-f385ca6ddd9d?w=900&h=900&q=80&auto=format&fit=crop',
    emptyText: {
      es: 'Estamos cosiendo las primeras piezas de esta colección. Muy pronto estarán aquí.',
      en: 'We are sewing the first pieces of this collection. They will be here soon.',
    },
  },
  {
    slug: 'ceramica',
    name: { es: 'Cerámica', en: 'Ceramics' },
    description: {
      es: 'Piezas de cerámica hechas a mano en tonos naturales, para acompañar los textiles de la casa.',
      en: 'Handmade ceramics in natural tones, to go with the textiles at home.',
    },
    image: 'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=900&h=900&q=80&auto=format&fit=crop',
    emptyText: {
      es: 'Esta colección está en camino. Muy pronto podrás verla aquí.',
      en: 'This collection is on its way. You will see it here soon.',
    },
  },
]

const pouch: Localized = { es: 'Neceser', en: 'Pouch' }
const pencilCase: Localized = { es: 'Estuche', en: 'Pencil case' }

export const products: Product[] = [
  {
    id: 'modelo-hestia',
    slug: 'hestia',
    name: 'Modelo Hestia',
    collection: 'accesorios',
    kind: pencilCase,
    description: {
      es: 'Tela de cuadros en tonos grises y azules, con cremallera metálica.',
      en: 'Grey and blue check fabric with a metal zip.',
    },
    price: 1200,
    tint: '#E6E5E1',
    frames: 50,
    photos: photos('hestia', 9),
    thumb: '/img/products/hestia/thumb.jpg',
  },
  {
    id: 'modelo-rose',
    slug: 'rose',
    name: 'Modelo Rose',
    collection: 'accesorios',
    kind: pencilCase,
    description: {
      es: 'Encaje en color burdeos, con cremallera metálica.',
      en: 'Burgundy lace with a metal zip.',
    },
    price: 1200,
    tint: '#EFE3E3',
    frames: 66,
    photos: photos('rose', 3),
    thumb: '/img/products/rose/thumb.jpg',
  },
  {
    id: 'modelo-hada',
    slug: 'hada',
    name: 'Modelo Hada',
    collection: 'accesorios',
    kind: pouch,
    description: {
      es: 'Acolchado de tela estampada en tonos frambuesa y gris.',
      en: 'Quilted printed fabric in raspberry and grey.',
    },
    price: 1600,
    tint: '#F0E6E4',
    frames: 15,
    photos: photos('hada', 5),
    thumb: '/img/products/hada/thumb.jpg',
  },
  {
    id: 'modelo-azul',
    slug: 'azul',
    name: 'Modelo Azul',
    collection: 'accesorios',
    kind: pouch,
    description: {
      es: 'Acolchado de rayas finas azules y blancas, con cremallera blanca.',
      en: 'Quilted fine blue-and-white stripes with a white zip.',
    },
    price: null,
    tint: '#E3E8F0',
    frames: 30,
    photos: [],
    thumb: '/frames/azul/000.webp',
  },
]

/** Detalles del Modelo Azul para la portada (solo lo que se ve en la pieza). */
export const azulDetails: { title: Localized; text: Localized }[] = [
  {
    title: { es: 'Rayas', en: 'Stripes' },
    text: { es: 'Tela de rayas finas en azul y blanco.', en: 'Fine blue-and-white striped fabric.' },
  },
  {
    title: { es: 'Acolchado', en: 'Quilting' },
    text: { es: 'Pespuntes paralelos que le dan cuerpo sin volverlo rígido.', en: 'Parallel stitching that gives it body without stiffness.' },
  },
  {
    title: { es: 'Cremallera', en: 'Zip' },
    text: { es: 'Blanca, con un tirador de tela a juego.', en: 'White, with a matching fabric pull.' },
  },
  {
    title: { es: 'Forro', en: 'Lining' },
    text: { es: 'Interior claro, para encontrar todo de un vistazo.', en: 'A light interior, so you can find everything at a glance.' },
  },
]

export const findProduct = (id: string) => products.find((p) => p.id === id)
export const findProductBySlug = (slug: string) => products.find((p) => p.slug === slug)
export const findCollection = (slug: string) => collections.find((c) => c.slug === slug)
export const productsIn = (slug: CollectionSlug) => products.filter((p) => p.collection === slug)

/** Ruta de un fotograma de la secuencia de giro. */
export const frameUrl = (slug: string, index: number) =>
  `/frames/${slug}/${String(index).padStart(3, '0')}.webp`
