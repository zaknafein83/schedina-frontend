import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
// Non redirigere su /login per le chiamate auth (login/register),
// altrimenti l'errore viene intercettato prima del catch nel form
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
}

// ─── Contests (user) ─────────────────────────────────────────────────────────
export const contestApi = {
  listOpen: () => apiClient.get('/contests'),
  getMatches: (id) => apiClient.get(`/contests/${id}/matches`),
  getMatchSideBets: (matchId) => apiClient.get(`/contests/matches/${matchId}/side-bets`),
}

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const couponApi = {
  list: () => apiClient.get('/coupons'),
  listByContest: () => apiClient.get('/coupons/by-contest'),
  create: (data) => apiClient.post('/coupons', data),
  get: (id) => apiClient.get(`/coupons/${id}`),
  confirm: (id) => apiClient.post(`/coupons/${id}/confirm`),
  cancel: (id) => apiClient.delete(`/coupons/${id}`),
}

// ─── Listini pubblici (read-only, qualsiasi utente loggato) ──────────────────
export const listiniApi = {
  teams: (leagueId) =>
    apiClient.get('/listini/teams', { params: leagueId ? { leagueId } : {} }),
  players: (params) =>
    apiClient.get('/listini/players', { params: params || {} }),
}

// ─── Season Pool (user) ──────────────────────────────────────────────────────
export const seasonPoolApi = {
  listOpen: () => apiClient.get('/season-pools'),
  get: (id) => apiClient.get(`/season-pools/${id}`),
  getBets: (id) => apiClient.get(`/season-pools/${id}/bets`),
}

// ─── Season Coupons (user) ───────────────────────────────────────────────────
export const seasonCouponApi = {
  list: () => apiClient.get('/season-coupons'),
  get: (id) => apiClient.get(`/season-coupons/${id}`),
  create: (data) => apiClient.post('/season-coupons', data),
  confirm: (id) => apiClient.post(`/season-coupons/${id}/confirm`),
  cancel: (id) => apiClient.delete(`/season-coupons/${id}`),
}

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => apiClient.get('/notifications'),
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  // Dashboard
  dashboard: () => apiClient.get('/admin/dashboard'),

  // Leagues
  getLeagues: () => apiClient.get('/admin/leagues'),
  createLeague: (data) => apiClient.post('/admin/leagues', data),
  updateLeague: (id, data) => apiClient.patch(`/admin/leagues/${id}`, data),
  deleteLeague: (id) => apiClient.delete(`/admin/leagues/${id}`),

  // Teams
  getTeams: (leagueId) =>
    apiClient.get('/admin/teams', { params: leagueId ? { leagueId } : {} }),
  createTeam: (data) => apiClient.post('/admin/teams', data),
  updateTeam: (id, data) => apiClient.patch(`/admin/teams/${id}`, data),
  deleteTeam: (id) => apiClient.delete(`/admin/teams/${id}`),

  // Tournaments
  getTournaments: (params) =>
    apiClient.get('/admin/tournaments', { params: params || {} }),
  createTournament: (data) => apiClient.post('/admin/tournaments', data),
  updateTournament: (id, data) => apiClient.patch(`/admin/tournaments/${id}`, data),
  deleteTournament: (id) => apiClient.delete(`/admin/tournaments/${id}`),

  // Season Pools
  getSeasonPools: (params) => apiClient.get('/admin/season-pools', { params: params || {} }),
  getSeasonPool: (id) => apiClient.get(`/admin/season-pools/${id}`),
  createSeasonPool: (data) => apiClient.post('/admin/season-pools', data),
  updateSeasonPool: (id, data) => apiClient.patch(`/admin/season-pools/${id}`, data),
  deleteSeasonPool: (id) => apiClient.delete(`/admin/season-pools/${id}`),
  openSeasonPool: (id) => apiClient.post(`/admin/season-pools/${id}/open`),
  closeSeasonPool: (id) => apiClient.post(`/admin/season-pools/${id}/close`),
  processSeasonPool: (id) => apiClient.post(`/admin/season-pools/${id}/process`),

  // Season Pool bets
  getSeasonBets: (poolId) => apiClient.get(`/admin/season-pools/${poolId}/bets`),
  createSeasonBet: (poolId, data) => apiClient.post(`/admin/season-pools/${poolId}/bets`, data),
  updateSeasonBet: (poolId, betId, data) =>
    apiClient.patch(`/admin/season-pools/${poolId}/bets/${betId}`, data),
  deleteSeasonBet: (poolId, betId) =>
    apiClient.delete(`/admin/season-pools/${poolId}/bets/${betId}`),
  resolveSeasonBet: (poolId, betId, officialResultRef) =>
    apiClient.patch(`/admin/season-pools/${poolId}/bets/${betId}/resolve`, { officialResultRef }),
  unresolveSeasonBet: (poolId, betId) =>
    apiClient.post(`/admin/season-pools/${poolId}/bets/${betId}/unresolve`),

  // Seasons
  getSeasons: () => apiClient.get('/admin/seasons'),
  getCurrentSeason: () => apiClient.get('/admin/seasons/current'),
  createSeason: (data) => apiClient.post('/admin/seasons', data),
  updateSeason: (id, data) => apiClient.patch(`/admin/seasons/${id}`, data),
  setCurrentSeason: (id) => apiClient.patch(`/admin/seasons/${id}/set-current`),
  deleteSeason: (id) => apiClient.delete(`/admin/seasons/${id}`),

  // Players
  getPlayers: (params) =>
    apiClient.get('/admin/players', { params: params || {} }),
  createPlayer: (data) => apiClient.post('/admin/players', data),
  updatePlayer: (id, data) => apiClient.patch(`/admin/players/${id}`, data),
  deletePlayer: (id) => apiClient.delete(`/admin/players/${id}`),

  // Rules
  getRules: () => apiClient.get('/admin/rules'),
  createRule: (data) => apiClient.post('/admin/rules', data),
  updateRule: (id, data) => apiClient.patch(`/admin/rules/${id}`, data),
  deleteRule: (id) => apiClient.delete(`/admin/rules/${id}`),

  // Contests
  getContests: () => apiClient.get('/admin/contests'),
  getContest: (id) => apiClient.get(`/admin/contests/${id}`),
  createContest: (data) => apiClient.post('/admin/contests', data),
  updateContest: (id, data) => apiClient.patch(`/admin/contests/${id}`, data),
  deleteContest: (id) => apiClient.delete(`/admin/contests/${id}`),
  openContest: (id) => apiClient.post(`/admin/contests/${id}/open`),
  closeContest: (id) => apiClient.post(`/admin/contests/${id}/close`),
  processContest: (id) => apiClient.post(`/admin/contests/${id}/process`),

  // Matches
  getMatches: (contestId) =>
    apiClient.get('/admin/matches', { params: { contestId } }),
  createMatch: (data) => apiClient.post('/admin/matches', data),
  updateMatch: (id, data) => apiClient.patch(`/admin/matches/${id}`, data),
  deleteMatch: (id) => apiClient.delete(`/admin/matches/${id}`),
  setMatchResult: (id, homeScore, awayScore) =>
    apiClient.put(`/admin/matches/${id}/result`, { homeScore, awayScore }),

  // Match side bets
  getMatchSideBets: (matchId) => apiClient.get(`/admin/matches/${matchId}/side-bets`),
  createMatchSideBet: (matchId, data) =>
    apiClient.post(`/admin/matches/${matchId}/side-bets`, data),
  deleteMatchSideBet: (matchId, sid) =>
    apiClient.delete(`/admin/matches/${matchId}/side-bets/${sid}`),
  resolveMatchSideBet: (matchId, sid, officialResult) =>
    apiClient.patch(`/admin/matches/${matchId}/side-bets/${sid}/resolve`, { officialResult }),

  // Users
  getUsers: () => apiClient.get('/admin/users'),
  setUserStatus: (id, isActive) =>
    apiClient.patch(`/admin/users/${id}/status`, { isActive }),
  setUserRole: (id, role) =>
    apiClient.patch(`/admin/users/${id}/role`, { role }),

  // Notifications
  getNotifications: (status) =>
    apiClient.get('/admin/notifications', { params: status ? { status } : {} }),
  resendNotification: (id) => apiClient.post(`/admin/notifications/${id}/resend`),

  // Coupons (admin/mod: tutte le schedine di tutti gli utenti)
  getCouponsByContest: () => apiClient.get('/admin/coupons/by-contest'),
  getCoupon: (id) => apiClient.get(`/admin/coupons/${id}`),

  // Export
  exportLeagues:  () => apiClient.get('/admin/export/leagues'),
  exportTeams:    () => apiClient.get('/admin/export/teams'),
  exportPlayers:  () => apiClient.get('/admin/export/players'),
  exportRules:    () => apiClient.get('/admin/export/rules'),
  exportContests: () => apiClient.get('/admin/export/contests'),
  exportAll:      () => apiClient.get('/admin/export/all'),

  // Import (invia il testo grezzo del file, rilevamento auto JSON/CSV)
  importLeagues:  (text) => apiClient.post('/admin/import/leagues',  text, { headers: { 'Content-Type': 'text/plain' } }),
  importTeams:    (text) => apiClient.post('/admin/import/teams',    text, { headers: { 'Content-Type': 'text/plain' } }),
  importPlayers:  (text) => apiClient.post('/admin/import/players',  text, { headers: { 'Content-Type': 'text/plain' } }),
  importRules:    (text) => apiClient.post('/admin/import/rules',    text, { headers: { 'Content-Type': 'text/plain' } }),
  importContests: (text) => apiClient.post('/admin/import/contests', text, { headers: { 'Content-Type': 'text/plain' } }),
}

export default apiClient
