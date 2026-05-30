/**
 * Helper di seeding via API admin per il redesign #3:
 * Giornata di campionato (per-lega) → Concorso (selezione partite) → Schedina.
 */

import { api, login, uniq } from './api'
import { USERS } from './auth'

let cachedAdminToken: string | null = null

export async function getAdminToken(): Promise<string> {
  if (cachedAdminToken) return cachedAdminToken
  cachedAdminToken = await login(USERS.admin.email, USERS.admin.password)
  return cachedAdminToken
}

function toLocalDT(d: Date): string { return d.toISOString().slice(0, 19) }

export async function createLeague(token: string, name = uniq('Lega')) {
  return api.post('/admin/leagues', { name, country: 'Italia' }, { token })
}
export async function createTeam(token: string, leagueId: number, name = uniq('Squadra')) {
  return api.post('/admin/teams', { name, leagueId, isActive: true }, { token })
}
export async function createRule(token: string, winningThresholds: number[], name = uniq('Regola')) {
  return api.post('/admin/rules', { name, winningThresholds, isActive: true }, { token })
}
export async function createGiornata(token: string, opts: { leagueId: number; number: number; name?: string }) {
  return api.post('/admin/giornate', { leagueId: opts.leagueId, number: opts.number, name: opts.name || uniq('Giornata') }, { token })
}
export async function createMatch(token: string, opts: { giornataId: number; homeTeamId: number; awayTeamId: number; overUnderLine?: number }) {
  return api.post('/admin/matches', {
    giornataId: opts.giornataId, homeTeamId: opts.homeTeamId, awayTeamId: opts.awayTeamId,
    scheduledAt: toLocalDT(new Date(Date.now() + 24 * 60 * 60 * 1000)), overUnderLine: opts.overUnderLine ?? 2.5,
  }, { token })
}
export async function createConcorso(token: string, opts: { number: number; name?: string; ruleId?: number }) {
  const openAt = toLocalDT(new Date(Date.now() - 60 * 60 * 1000))
  const closeAt = toLocalDT(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  return api.post('/admin/concorsi', { name: opts.name || uniq('Concorso'), number: opts.number, ruleId: opts.ruleId, openAt, closeAt }, { token })
}

export const addConcorsoMatch = (token: string, concorsoId: number, matchId: number) =>
  api.post(`/admin/concorsi/${concorsoId}/matches`, { matchId }, { token })
export const openConcorso = (token: string, id: number) => api.post(`/admin/concorsi/${id}/open`, undefined, { token })
export const closeConcorso = (token: string, id: number) => api.post(`/admin/concorsi/${id}/close`, undefined, { token })
export const reopenConcorso = (token: string, id: number) => api.post(`/admin/concorsi/${id}/reopen`, undefined, { token })
export const processConcorso = (token: string, id: number) => api.post(`/admin/concorsi/${id}/process`, undefined, { token })
export const setMatchResult = (token: string, matchId: number, homeScore: number, awayScore: number) =>
  api.put(`/admin/matches/${matchId}/result`, { homeScore, awayScore }, { token })

/**
 * Crea lega + 2 squadre + giornata (turno 1) + 1 partita + regola [2] + concorso (turno 1)
 * con la partita selezionata, e apre il concorso.
 */
export async function bootstrapOpenConcorso(): Promise<{
  token: string; leagueId: number; giornataId: number; concorsoId: number; matchId: number
  homeName: string; awayName: string; concorsoName: string
}> {
  const token = await getAdminToken()
  const league = await createLeague(token, uniq('Lega-e2e'))
  const homeName = uniq('Casa'); const awayName = uniq('Ospite')
  const home = await createTeam(token, league.id, homeName)
  const away = await createTeam(token, league.id, awayName)
  const giornata = await createGiornata(token, { leagueId: league.id, number: 1, name: uniq('Giornata-e2e') })
  const match = await createMatch(token, { giornataId: giornata.id, homeTeamId: home.id, awayTeamId: away.id })
  const rule = await createRule(token, [2], uniq('Regola-e2e'))
  const concorsoName = uniq('Concorso-e2e')
  const concorso = await createConcorso(token, { number: 1, name: concorsoName, ruleId: rule.id })
  await addConcorsoMatch(token, concorso.id, match.id)
  await openConcorso(token, concorso.id)
  return { token, leagueId: league.id, giornataId: giornata.id, concorsoId: concorso.id, matchId: match.id, homeName, awayName, concorsoName }
}
