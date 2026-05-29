/**
 * Client API "raw" — chiamate dirette al backend di test su :8081
 * senza passare dall'interfaccia grafica. Utile per:
 *   - login: ottenere un token e iniettarlo in localStorage
 *   - setup/teardown dati: creare leghe/squadre/concorsi per uno scenario
 *   - cleanup: cancellare tutto quello che il test ha creato
 *
 * Non usa axios per non aggiungere dipendenze al test runner.
 */

export const API_URL = process.env.E2E_API_URL || 'http://localhost:8081'

type FetchOpts = {
  token?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request(method: string, path: string, opts: FetchOpts = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opts.headers || {}),
  }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }

  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return json
}

export const api = {
  get:    (path: string, opts: FetchOpts = {}) => request('GET',    path, opts),
  post:   (path: string, body?: unknown, opts: FetchOpts = {}) => request('POST',   path, { ...opts, body }),
  put:    (path: string, body?: unknown, opts: FetchOpts = {}) => request('PUT',    path, { ...opts, body }),
  patch:  (path: string, body?: unknown, opts: FetchOpts = {}) => request('PATCH',  path, { ...opts, body }),
  delete: (path: string, opts: FetchOpts = {}) => request('DELETE', path, opts),
}

/** Login via API: restituisce l'accessToken JWT. */
export async function login(email: string, password: string): Promise<string> {
  const res = await api.post('/auth/login', { email, password })
  return res.accessToken
}

/** Suffisso univoco per i dati di test (evita collisioni tra run). */
export function uniq(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
