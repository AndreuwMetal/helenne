import type { Lang } from './i18n'

const formatters: Partial<Record<Lang, Intl.NumberFormat>> = {}

/** 1200 → "12,00 €" (es) o "€12.00" (en). */
export function formatPrice(cents: number, lang: Lang): string {
  formatters[lang] ??= new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
  })
  return formatters[lang].format(cents / 100)
}
