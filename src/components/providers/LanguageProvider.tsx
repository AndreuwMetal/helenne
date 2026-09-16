import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseLang, translate, type Lang } from '../../services/i18n'
import { readString, STORAGE_KEYS, write } from '../../services/storage'
import { LanguageContext, type LanguageContextValue } from './languageContext'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => parseLang(readString(STORAGE_KEYS.lang)))

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    write(STORAGE_KEYS.lang, next)
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      pick: (text) => text[lang],
    }),
    [lang, setLang],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
