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

// ─── Giornate / Calendario (user) ────────────────────────────────────────────
export const giornataApi = {
  listOpen: () => apiClient.get('/giornate'),
  get: (id) => apiClient.get(`/giornate/${id}`),
  partite: (id) => apiClient.get(`/giornate/${id}/partite`),
}

// ─── Schedine (user) — 1X2 + Under/Over per partita della giornata ────────────
export const schedinaApi = {
  listMine: () => apiClient.get('/schedine'),
  get: (id) => apiClient.get(`/schedine/${id}`),
  create: (data) => apiClient.post('/schedine', data), // { giornataId, pronostici: [{ matchId, choice1x2, choiceUo }] }
  confirm: (id) => apiClient.post(`/schedine/${id}/confirm`),
  cancel: (id) => apiClient.delete(`/schedine/${id}`),
}

// ─── Scommesse extra (user) — giocate singole indipendenti ────────────────────
export const scommessaApi = {
  listOpen: () => apiClient.get('/scommesse'),
  listMine: () => apiClient.get('/scommesse/mine'),
  place: (scommessaId, choiceRef) => apiClient.post('/scommesse', { scommessaId, choiceRef }),
}

// ─── Listini pubblici (read-only, qualsiasi utente loggato) ──────────────────
export const listiniApi = {
  teams: (leagueId) =>
    apiClient.get('/listini/teams', { params: leagueId ? { leagueId } : {} }),
  players: (params) =>
    apiClient.get('/listini/players', { params: params || {} }),
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

  // Regole (soglie vincenti riusabili)
  getRules: () => apiClient.get('/admin/rules'),
  createRule: (data) => apiClient.post('/admin/rules', data),
  updateRule: (id, data) => apiClient.patch(`/admin/rules/${id}`, data),
  deleteRule: (id) => apiClient.delete(`/admin/rules/${id}`),

  // Giornate / Calendario
  getGiornate: () => apiClient.get('/admin/giornate'),
  getGiornata: (id) => apiClient.get(`/admin/giornate/${id}`),
  createGiornata: (data) => apiClient.post('/admin/giornate', data),
  updateGiornata: (id, data) => apiClient.patch(`/admin/giornate/${id}`, data),
  deleteGiornata: (id) => apiClient.delete(`/admin/giornate/${id}`),
  openGiornata: (id) => apiClient.post(`/admin/giornate/${id}/open`),
  closeGiornata: (id) => apiClient.post(`/admin/giornate/${id}/close`),
  reopenGiornata: (id) => apiClient.post(`/admin/giornate/${id}/reopen`),
  processGiornata: (id) => apiClient.post(`/admin/giornate/${id}/process`),

  // Scommesse extra (catalogo)
  getScommesse: (params) => apiClient.get('/admin/scommesse', { params: params || {} }),
  getScommessa: (id) => apiClient.get(`/admin/scommesse/${id}`),
  createScommessa: (data) => apiClient.post('/admin/scommesse', data),
  deleteScommessa: (id) => apiClient.delete(`/admin/scommesse/${id}`),
  resolveScommessa: (id, officialResultRef) =>
    apiClient.patch(`/admin/scommesse/${id}/resolve`, { officialResultRef }),
  unresolveScommessa: (id) => apiClient.post(`/admin/scommesse/${id}/unresolve`),
  voidScommessa: (id) => apiClient.post(`/admin/scommesse/${id}/void`),

  // Schedine (admin/mod: tutte le schedine di una giornata)
  getSchedineByGiornata: (giornataId) =>
    apiClient.get('/admin/schedine/by-giornata', { params: { giornataId } }),
  getSchedina: (id) => apiClient.get(`/admin/schedine/${id}`),

  // Matches (partite della giornata)
  getMatches: (params) =>
    apiClient.get('/admin/matches', { params: params || {} }),
  createMatch: (data) => apiClient.post('/admin/matches', data),
  updateMatch: (id, data) => apiClient.patch(`/admin/matches/${id}`, data),
  deleteMatch: (id) => apiClient.delete(`/admin/matches/${id}`),
  setMatchResult: (id, homeScore, awayScore) =>
    apiClient.put(`/admin/matches/${id}/result`, { homeScore, awayScore }),
  validateMatch: (id) => apiClient.post(`/admin/matches/${id}/validate`),

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

  // Export / Import (anagrafiche)
  exportLeagues: () => apiClient.get('/admin/export/leagues'),
  exportTeams:   () => apiClient.get('/admin/export/teams'),
  exportPlayers: () => apiClient.get('/admin/export/players'),
  exportAll:     () => apiClient.get('/admin/export/all'),
  importLeagues: (text) => apiClient.post('/admin/import/leagues', text, { headers: { 'Content-Type': 'text/plain' } }),
  importTeams:   (text) => apiClient.post('/admin/import/teams',   text, { headers: { 'Content-Type': 'text/plain' } }),
  importPlayers: (text) => apiClient.post('/admin/import/players', text, { headers: { 'Content-Type': 'text/plain' } }),
}

export default apiClient
