import { useEffect } from 'react'

/** Título de la pestaña: «Sección — Helenne». */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Helenne` : 'Helenne — Estuches y neceseres cosidos a mano'
  }, [title])
}
