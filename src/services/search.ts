import type { Collection, Product } from './catalog'
import { formatPrice } from './format'
import { translate, type Lang } from './i18n'

export interface SearchEntry {
  title: string
  meta: string
  href: string
  image?: string
}

/** Minúsculas y sin tildes: «cerámica» encuentra «ceramica». */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export function searchEntries(query: string, lang: Lang, products: Product[], collections: Collection[]): SearchEntry[] {
  const q = normalize(query.trim())
  if (!q) return []

  const entries: [SearchEntry, string][] = [
    ...products.map((p) => {
      const price = p.price === null ? translate(lang, 'product.soon') : formatPrice(p.price, lang)
      const entry = { title: p.name, meta: `${p.kind[lang]}, ${price}`, href: `/${p.collection}#${p.slug}`, image: p.thumb }
      return [entry, [p.name, p.kind.es, p.kind.en, p.description.es, p.description.en].join(' ')] as [SearchEntry, string]
    }),
    ...collections.map((c): [SearchEntry, string] => [
      {
        title: c.name[lang],
        meta: c.emptyText ? translate(lang, 'product.soon') : c.description[lang],
        href: `/${c.slug}`,
      },
      [c.name.es, c.name.en].join(' '),
    ]),
    [
      { title: translate(lang, 'nav.custom'), meta: translate(lang, 'action.customOrder'), href: '/personalizar' },
      'personalizar a medida encargo custom order',
    ],
  ]

  return entries.filter(([, haystack]) => normalize(haystack).includes(q)).map(([entry]) => entry)
}
