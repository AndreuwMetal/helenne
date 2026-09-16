/**
 * localStorage con red de seguridad: en modo privado o con el almacenamiento
 * bloqueado, leer o escribir puede lanzar una excepción.
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    // sin almacenamiento: la web sigue funcionando, solo no recuerda el dato
  }
}

export const STORAGE_KEYS = {
  cart: 'helenne-cart',
  lang: 'helenne-lang',
} as const
