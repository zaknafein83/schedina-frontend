/**
 * Helper di seeding via API admin per il modello Calendario/Giornate.
 * I test creano lega/squadre/giornata/partite e scommesse extra via API.
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

export async function createTeam(token: string, leagueId: number, name = uniq('Squadra')) {
  return api.post('/admin/teams', { name, leagueId, isActive: true }, { token })
}

export async function createRule(token: string, winningThresholds: number[], name = uniq('Regola')) {
  return api.post('/admin/rules', { name, winningThresholds, isActive: true }, { token })
}

export async function createGiornata(token: string, opts: {
  name?: string
  ruleId?: number
  winningThresholds?: number[]
} = {}) {
  const openAt = toLocalDT(new Date(Date.now() - 60 * 60 * 1000))          // 1h fa
  const closeAt = toLocalDT(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // tra 7gg
  return api.post('/admin/giornate', {
    name: opts.name || uniq('Giornata'),
    ruleId: opts.ruleId,
    openAt,
    closeAt,
    winningThresholds: opts.winningThresholds,
  }, { token })
}

export async function createMatch(token: string, opts: {
  giornataId: number
  homeTeamId: number
  awayTeamId: number
  overUnderLine?: number
}) {
  return api.post('/admin/matches', {
    giornataId: opts.giornataId,
    homeTeamId: opts.homeTeamId,
    awayTeamId: opts.awayTeamId,
    scheduledAt: toLocalDT(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    overUnderLine: opts.overUnderLine ?? 2.5,
  }, { token })
}

export async function createScommessa(token: string, opts: {
  scope: 'SEASON' | 'GIORNATA'
  label?: string
  market?: string
  giornataId?: number
  seasonId?: number
  matchId?: number
  options?: { ref: string; label: string }[]
}) {
  return api.post('/admin/scommesse', {
    scope: opts.scope,
    label: opts.label || uniq('Scommessa'),
    market: opts.market || 'GOAL_NOGOAL',
    giornataId: opts.giornataId,
    seasonId: opts.seasonId,
    matchId: opts.matchId,
    options: opts.options,
  }, { token })
}

export const openGiornata    = (token: string, id: number) => api.post(`/admin/giornate/${id}/open`, undefined, { token })
export const closeGiornata   = (token: string, id: number) => api.post(`/admin/giornate/${id}/close`, undefined, { token })
export const processGiornata = (token: string, id: number) => api.post(`/admin/giornate/${id}/process`, undefined, { token })
export const setMatchResult  = (token: string, matchId: number, homeScore: number, awayScore: number) =>
  api.put(`/admin/matches/${matchId}/result`, { homeScore, awayScore }, { token })
export const resolveScommessa = (token: string, betId: number, officialResultRef: string) =>
  api.patch(`/admin/scommesse/${betId}/resolve`, { officialResultRef }, { token })

/**
 * Crea lega + 2 squadre + giornata (soglia [2]) + 1 partita, e apre la giornata.
 * Soglia 2 = entrambi i pronostici (1X2 + U/O) corretti su una partita.
 */
export async function bootstrapOpenGiornata(): Promise<{
  token: string
  leagueId: number
  giornataId: number
  matchId: number
  homeName: string
  awayName: string
  giornataName: string
}> {
  const token = await getAdminToken()
  const league = await createLeague(token, uniq('Lega-e2e'))
  const homeName = uniq('Casa')
  const awayName = uniq('Ospite')
  const home = await createTeam(token, league.id, homeName)
  const away = await createTeam(token, league.id, awayName)
  const rule = await createRule(token, [2], uniq('Regola-e2e'))
  const giornataName = uniq('Giornata-e2e')
  const giornata = await createGiornata(token, { name: giornataName, ruleId: rule.id })
  const match = await createMatch(token, { giornataId: giornata.id, homeTeamId: home.id, awayTeamId: away.id, overUnderLine: 2.5 })
  await openGiornata(token, giornata.id)
  return { token, leagueId: league.id, giornataId: giornata.id, matchId: match.id, homeName, awayName, giornataName }
}
