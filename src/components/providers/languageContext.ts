import { createContext, useContext } from 'react'
import type { Lang, Localized, TextKey } from '../../services/i18n'

export interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Texto de la interfaz. */
  t: (key: TextKey, vars?: Record<string, string | number>) => string
  /** Texto del catálogo. */
  pick: (text: Localized) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider>')
  return ctx
}
