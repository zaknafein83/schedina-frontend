/**
 * Helper di seeding via API admin per il modello Scommessa/Schedina.
 * I test creano lega/regola/concorso/scommesse direttamente via API.
 */

import { api, login, uniq } from './api'
import { USERS } from './auth'

let cachedAdminToken: string | null = null

export async function getAdminToken(): Promise<string> {
  if (cachedAdminToken) return cachedAdminToken
  cachedAdminToken = await login(USERS.admin.email, USERS.admin.password)
  return cachedAdminToken
}

/** Converte una Date in stringa ISO_LOCAL_DATE_TIME (senza Z/millis). */
function toLocalDT(d: Date): string {
  return d.toISOString().slice(0, 19)
}

export async function createLeague(token: string, name = uniq('Lega')) {
  return api.post('/admin/leagues', { name, country: 'Italia' }, { token })
}

export async function createRule(token: string, requiredBets: number, leagueId?: number) {
  return api.post('/admin/rules', {
    name: uniq(`Regola-${requiredBets}`),
    description: 'Regola e2e',
    leagueId,
    requiredBets,
    winningThresholds: [requiredBets],
    fullCompletionRequired: true,
    isActive: true,
  }, { token })
}

export async function createConcorso(token: string, opts: {
  ruleId: number
  name?: string
  kind?: 'MATCHDAY' | 'SEASON'
}) {
  const openAt = toLocalDT(new Date(Date.now() - 60 * 60 * 1000))          // 1h fa
  const closeAt = toLocalDT(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // tra 7gg
  return api.post('/admin/concorsi', {
    name: opts.name || uniq('Concorso'),
    description: 'Concorso e2e',
    kind: opts.kind || 'MATCHDAY',
    ruleId: opts.ruleId,
    openAt,
    closeAt,
  }, { token })
}

export async function createScommessa(token: string, opts: {
  concorsoId: number
  label?: string
  market?: string
  options?: { ref: string; label: string }[]
  overUnderLine?: number
}) {
  return api.post('/admin/scommesse', {
    concorsoId: opts.concorsoId,
    label: opts.label || uniq('Scommessa'),
    market: opts.market || 'GOAL_NOGOAL',
    options: opts.options,
    overUnderLine: opts.overUnderLine,
  }, { token })
}

export const openConcorso    = (token: string, id: number) => api.post(`/admin/concorsi/${id}/open`, undefined, { token })
export const closeConcorso   = (token: string, id: number) => api.post(`/admin/concorsi/${id}/close`, undefined, { token })
export const processConcorso = (token: string, id: number) => api.post(`/admin/concorsi/${id}/process`, undefined, { token })
export const resolveScommessa = (token: string, betId: number, officialResultRef: string) =>
  api.patch(`/admin/scommesse/${betId}/resolve`, { officialResultRef }, { token })

/**
 * Crea lega + regola (1 scommessa richiesta) + concorso + 1 scommessa GOAL_NOGOAL, e apre il concorso.
 */
export async function bootstrapOpenConcorso(): Promise<{
  token: string
  leagueId: number
  ruleId: number
  concorsoId: number
  betId: number
  concorsoName: string
}> {
  const token = await getAdminToken()
  const league = await createLeague(token, uniq('Lega-e2e'))
  const rule = await createRule(token, 1, league.id)
  const concorsoName = uniq('Concorso-e2e')
  const concorso = await createConcorso(token, { ruleId: rule.id, name: concorsoName })
  const bet = await createScommessa(token, { concorsoId: concorso.id, label: 'Gol / No gol', market: 'GOAL_NOGOAL' })
  await openConcorso(token, concorso.id)
  return { token, leagueId: league.id, ruleId: rule.id, concorsoId: concorso.id, betId: bet.id, concorsoName }
}
