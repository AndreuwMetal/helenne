import type { CartLine } from './cart'
import { subtotal } from './cart'
import type { Product } from './catalog'
import { formatPrice } from './format'
import type { Lang } from './i18n'

/** Número de Helenne con prefijo de país, sin "+" ni espacios. */
export const WHATSAPP_NUMBER = '34623050329'
export const WHATSAPP_DISPLAY = '+34 623 05 03 29'

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}` + (text ? `?text=${encodeURIComponent(text)}` : '')

export function orderMessage(lines: CartLine[], products: Product[], lang: Lang): string {
  const byId = new Map(products.map((p) => [p.id, p]))
  const rows = lines.flatMap((l) => {
    const p = byId.get(l.id)
    if (!p || p.price === null) return []
    return [`• ${p.name} ×${l.qty} — ${formatPrice(p.price * l.qty, lang)}`]
  })
  const total = formatPrice(subtotal(lines, (id) => byId.get(id)?.price), lang)
  const intro = lang === 'es' ? 'Hola, me gustaría hacer un pedido en Helenne:' : 'Hi, I would like to place an order with Helenne:'
  return `${intro}\n\n${rows.join('\n')}\n\nTotal: ${total}`
}

export function reserveMessage(productName: string, lang: Lang): string {
  return lang === 'es'
    ? `Hola, me gustaría reservar el ${productName} de Helenne.`
    : `Hi, I would like to reserve the ${productName} from Helenne.`
}

export interface CustomOrder {
  name: string
  phone: string
  email: string
}

export function customOrderMessage({ name, phone, email }: CustomOrder, lang: Lang): string {
  const [intro, n, p] =
    lang === 'es'
      ? ['Hola, me gustaría encargar una pieza personalizada de Helenne.', 'Nombre', 'Teléfono']
      : ['Hi, I would like to order a custom piece from Helenne.', 'Name', 'Phone']
  return `${intro}\n\n${n}: ${name.trim()}\n${p}: ${phone.trim()}\nEmail: ${email.trim()}`
}
