export type Lang = 'es' | 'en'

/** Texto en los dos idiomas de la web. */
export type Localized = Record<Lang, string>

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]

/** Textos de la interfaz. Los del catálogo viven en catalog.ts. */
export const dictionary = {
  'nav.shop': { es: 'Tienda', en: 'Shop' },
  'nav.accessories': { es: 'Accesorios', en: 'Accessories' },
  'nav.custom': { es: 'Personalizar', en: 'Custom orders' },
  'nav.menu': { es: 'Menú', en: 'Menu' },
  'nav.home': { es: 'Inicio', en: 'Home' },

  'action.close': { es: 'Cerrar', en: 'Close' },
  'action.search': { es: 'Buscar', en: 'Search' },
  'action.addToCart': { es: 'Añadir al carrito', en: 'Add to cart' },
  'action.seePhotos': { es: 'Ver fotos', en: 'See photos' },
  'action.reserve': { es: 'Reservar por WhatsApp', en: 'Reserve on WhatsApp' },
  'action.shopCollection': { es: 'Ver la colección', en: 'Shop the collection' },
  'action.customOrder': { es: 'Encargar una pieza', en: 'Order a custom piece' },
  'action.seeAccessories': { es: 'Ver accesorios', en: 'See accessories' },

  'cart.title': { es: 'Carrito', en: 'Cart' },
  'cart.empty': { es: 'Tu carrito está vacío.', en: 'Your cart is empty.' },
  'cart.subtotal': { es: 'Subtotal', en: 'Subtotal' },
  'cart.checkout': { es: 'Pedir por WhatsApp', en: 'Order on WhatsApp' },
  'cart.note': {
    es: 'El envío se calcula aparte. Te confirmamos el pedido por WhatsApp.',
    en: 'Shipping is calculated separately. We confirm your order on WhatsApp.',
  },
  'cart.remove': { es: 'Quitar', en: 'Remove' },
  'cart.less': { es: 'Quitar uno', en: 'One less' },
  'cart.more': { es: 'Añadir uno', en: 'One more' },
  'cart.open': { es: 'Abrir el carrito', en: 'Open cart' },

  'search.placeholder': { es: 'Busca un modelo o una colección', en: 'Search a model or collection' },
  'search.none': { es: 'No hay resultados para «{q}». Prueba con «estuche» o «neceser».', en: 'No results for “{q}”. Try “pouch” or “pencil case”.' },

  'product.soon': { es: 'Próximamente', en: 'Coming soon' },
  'product.shipping': { es: 'más envío', en: 'plus shipping' },
  'product.dragHint': { es: 'Arrastra para girarlo', en: 'Drag to turn it' },
  'product.photoOf': { es: 'Foto {n} de {total}', en: 'Photo {n} of {total}' },
  'product.prev': { es: 'Foto anterior', en: 'Previous photo' },
  'product.next': { es: 'Foto siguiente', en: 'Next photo' },

  'home.title': { es: 'Estuches y neceseres cosidos a mano', en: 'Hand-sewn pencil cases and pouches' },
  'home.lead': {
    es: 'Cosidos pieza a pieza, con telas seleccionadas y acabados cuidados.',
    en: 'Sewn piece by piece, with selected fabrics and careful finishes.',
  },
  'home.heroCaption': { es: 'Modelo Azul, neceser acolchado de rayas. Llega pronto.', en: 'The Azul model, a quilted striped pouch. Coming soon.' },
  'home.collectionTitle': { es: 'La colección', en: 'The collection' },
  'home.collectionLead': { es: 'Precios sin envío.', en: 'Prices exclude shipping.' },
  'home.detailTitle': { es: 'El Modelo Azul, de cerca', en: 'The Azul model, up close' },
  'home.detailLead': { es: 'Llega pronto. Escríbenos y te guardamos uno.', en: 'Coming soon. Message us and we’ll keep one for you.' },
  'home.customTitle': { es: '¿Otra tela u otro tamaño?', en: 'A different fabric or size?' },
  'home.customText': {
    es: 'Cosemos la pieza a tu medida: tú eliges el diseño, el formato, la tela y la cremallera.',
    en: 'We sew the piece to measure: you choose the design, size, fabric and zip.',
  },

  'shop.title': { es: 'Tienda', en: 'Shop' },
  'shop.pieces': { es: '{n} piezas', en: '{n} pieces' },

  'custom.title': { es: 'Personalizar', en: 'Custom orders' },
  'custom.p1': {
    es: 'En Helenne cada pieza puede hacerse a tu medida. Elige el diseño, el formato, la tela y la cremallera, y coseremos para ti una pieza única, pensada contigo desde el primer punto.',
    en: 'At Helenne every piece can be made to measure. Choose the design, size, fabric and zip, and we will sew a one-of-a-kind piece for you, planned together from the first stitch.',
  },
  'custom.p2': {
    es: 'Cuéntanos tu idea y te acompañamos en todo el proceso: te asesoramos sobre telas y acabados y te enviamos una propuesta sin compromiso.',
    en: 'Tell us your idea and we will guide you through the process: advice on fabrics and finishes, and a no-obligation proposal.',
  },
  'custom.name': { es: 'Nombre', en: 'Name' },
  'custom.phone': { es: 'Teléfono', en: 'Phone' },
  'custom.email': { es: 'Email', en: 'Email' },
  'custom.submit': { es: 'Enviar por WhatsApp', en: 'Send on WhatsApp' },
  'custom.hint': { es: 'Se abrirá WhatsApp con el mensaje listo para enviar.', en: 'WhatsApp will open with the message ready to send.' },

  'empty.title': { es: 'Próximamente', en: 'Coming soon' },

  'notFound.title': { es: 'Esta página no existe', en: 'This page does not exist' },
  'notFound.text': { es: 'Puede que el enlace esté mal escrito o que la página se haya movido.', en: 'The link may be mistyped, or the page may have moved.' },
  'notFound.back': { es: 'Volver al inicio', en: 'Back to home' },

  'footer.tagline': { es: 'Estuches y neceseres cosidos a mano.', en: 'Hand-sewn pencil cases and pouches.' },
  'footer.contact': { es: 'Escríbenos por WhatsApp', en: 'Message us on WhatsApp' },
  'footer.language': { es: 'Idioma', en: 'Language' },
} satisfies Record<string, Localized>

export type TextKey = keyof typeof dictionary

/** Traduce una clave y rellena los huecos {nombre}. */
export function translate(lang: Lang, key: TextKey, vars: Record<string, string | number> = {}): string {
  return dictionary[key][lang].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

/** Acepta el valor guardado por la web antigua ("Español"/"English"). */
export function parseLang(raw: string | null): Lang {
  if (raw === 'en' || raw === 'English') return 'en'
  return 'es'
}
