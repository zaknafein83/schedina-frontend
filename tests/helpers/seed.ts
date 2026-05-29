/**
 * Helper di seeding via API admin. I test che hanno bisogno di entità
 * concrete (lega/squadre/regole/concorsi) le creano qui, evitando di
 * dipendere da una migrazione SQL del backend che potrebbe non popolare
 * il DB di test (es. V10 skippa se mancano leghe).
 */

import { api, login, uniq } from './api'
import { USERS } from './auth'

let cachedAdminToken: string | null = null

export async function getAdminToken(): Promise<string> {
  if (cachedAdminToken) return cachedAdminToken
  cachedAdminToken = await login(USERS.admin.email, USERS.admin.password)
  return cachedAdminToken
}

export async function createLeague(token: string, name = uniq('Lega')) {
  return api.post('/admin/leagues', { name, country: 'Italia' }, { token })
}

export async function createTeam(token: string, leagueId: number, name: string, shortName?: string) {
  return api.post('/admin/teams', {
    name,
    shortName: shortName || name.slice(0, 3).toUpperCase(),
    leagueId,
    isActive: true,
  }, { token })
}

export async function createRule(token: string, leagueId: number, requiredMatches: number) {
  return api.post('/admin/rules', {
    name: uniq(`Regola-${requiredMatches}`),
    description: 'Regola e2e',
    leagueId,
    requiredMatches,
    winningThresholds: [requiredMatches],
    maxCouponsPerUser: 3,
    maxDoubles: 3,
    maxTriples: 1,
    fullCompletionRequired: true,
    isActive: true,
  }, { token })
}

export async function createContest(token: string, opts: {
  leagueId: number
  ruleId: number
  name?: string
  description?: string
  hoursOpen?: number
  daysClose?: number
}) {
  const openAt = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h fa
  const closeAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // tra 7gg
  return api.post('/admin/contests', {
    name: opts.name || uniq('Concorso'),
    description: opts.description || 'Concorso e2e',
    leagueId: opts.leagueId,
    ruleId: opts.ruleId,
    openAt,
    closeAt,
  }, { token })
}

export async function addMatch(token: string, opts: {
  contestId: number
  homeTeamId: number
  awayTeamId: number
  leagueId: number
  daysFromNow?: number
  betType?: 'RESULT_1X2' | 'UNDER_OVER'
  overUnderLine?: number
}) {
  const scheduledAt = new Date(
    Date.now() + (opts.daysFromNow ?? 1) * 24 * 60 * 60 * 1000
  ).toISOString()
  return api.post('/admin/matches', {
    homeTeamId: opts.homeTeamId,
    awayTeamId: opts.awayTeamId,
    leagueId: opts.leagueId,
    contestId: opts.contestId,
    scheduledAt,
    betType: opts.betType || 'RESULT_1X2',
    overUnderLine: opts.overUnderLine,
  }, { token })
}

export async function openContest(token: string, contestId: number) {
  return api.post(`/admin/contests/${contestId}/open`, undefined, { token })
}

export async function closeContest(token: string, contestId: number) {
  return api.post(`/admin/contests/${contestId}/close`, undefined, { token })
}

/**
 * Crea: 1 lega + N*2 squadre + regola + concorso con N partite + apertura.
 * Restituisce gli ID di tutti gli oggetti creati.
 */
export async function bootstrapOpenContest(opts?: { matches?: number }): Promise<{
  token: string
  leagueId: number
  ruleId: number
  contestId: number
  teamIds: number[]
  matchIds: number[]
}> {
  const n = opts?.matches ?? 3
  const token = await getAdminToken()

  const league = await createLeague(token, uniq('Lega-e2e'))
  const leagueId = league.id

  const teamIds: number[] = []
  for (let i = 0; i < n * 2; i++) {
    const t = await createTeam(token, leagueId, uniq(`Team${i}`))
    teamIds.push(t.id)
  }

  const rule = await createRule(token, leagueId, n)
  const ruleId = rule.id

  const contest = await createContest(token, { leagueId, ruleId })
  const contestId = contest.id

  const matchIds: number[] = []
  for (let i = 0; i < n; i++) {
    const m = await addMatch(token, {
      contestId,
      leagueId,
      homeTeamId: teamIds[i * 2],
      awayTeamId: teamIds[i * 2 + 1],
      daysFromNow: i + 1,
    })
    matchIds.push(m.id)
  }

  await openContest(token, contestId)

  return { token, leagueId, ruleId, contestId, teamIds, matchIds }
}
