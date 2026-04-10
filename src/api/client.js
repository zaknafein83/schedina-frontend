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
}

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const couponApi = {
  list: () => apiClient.get('/coupons'),
  create: (data) => apiClient.post('/coupons', data),
  get: (id) => apiClient.get(`/coupons/${id}`),
  confirm: (id) => apiClient.post(`/coupons/${id}/confirm`),
  cancel: (id) => apiClient.delete(`/coupons/${id}`),
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

  // Rules
  getRules: () => apiClient.get('/admin/rules'),
  createRule: (data) => apiClient.post('/admin/rules', data),
  updateRule: (id, data) => apiClient.patch(`/admin/rules/${id}`, data),
  deleteRule: (id) => apiClient.delete(`/admin/rules/${id}`),

  // Contests
  getContests: () => apiClient.get('/admin/contests'),
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
  setMatchResult: (id, officialResult) =>
    apiClient.put(`/admin/matches/${id}/result`, { officialResult }),

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

  // Export
  exportLeagues:  () => apiClient.get('/admin/export/leagues'),
  exportTeams:    () => apiClient.get('/admin/export/teams'),
  exportRules:    () => apiClient.get('/admin/export/rules'),
  exportContests: () => apiClient.get('/admin/export/contests'),
  exportAll:      () => apiClient.get('/admin/export/all'),

  // Import (invia il testo grezzo del file, rilevamento auto JSON/CSV)
  importLeagues:  (text) => apiClient.post('/admin/import/leagues',  text, { headers: { 'Content-Type': 'text/plain' } }),
  importTeams:    (text) => apiClient.post('/admin/import/teams',    text, { headers: { 'Content-Type': 'text/plain' } }),
  importRules:    (text) => apiClient.post('/admin/import/rules',    text, { headers: { 'Content-Type': 'text/plain' } }),
  importContests: (text) => apiClient.post('/admin/import/contests', text, { headers: { 'Content-Type': 'text/plain' } }),
}

export default apiClient
