import type { TextKey } from '../../services/i18n'

/** Enlaces principales: cabecera, menú móvil y pie. */
export const mainLinks: { to: string; key: TextKey }[] = [
  { to: '/tienda', key: 'nav.shop' },
  { to: '/accesorios', key: 'nav.accessories' },
  { to: '/personalizar', key: 'nav.custom' },
]
