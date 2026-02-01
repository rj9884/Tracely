import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tracely-backend-tn5u.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

export const privacyAPI = {
  // Events
  reportEvent: (data) => api.post('/events', data),
  
  // Sites
  getSiteScore: (domain) => api.get(`/site/${domain}/score`),
  getSiteDetails: (domain) => api.get(`/site/${domain}/details`),
  getSiteEvidence: (domain, params = {}) => api.get(`/site/${domain}/evidence`, { params }),
  getSiteAuditReport: (domain) => api.get(`/site/${domain}/audit-report`),
  
  // User's own sites
  getAllSites: () => api.get('/sites'),
  
  // Global aggregated stats (all users)
  getGlobalStats: () => api.get('/sites/global/stats'),
  
  // Trackers
  getTrackers: () => api.get('/trackers'),
  getTrackersByDomain: (domain) => api.get(`/trackers/domain/${domain}`),
  
  // Analytics
  getTopTrackers: () => api.get('/analytics/top-trackers'),
  getRiskTrends: () => api.get('/analytics/trends'),
  getTrackerNetwork: () => api.get('/analytics/network'),
  
  // Auth (if needed)
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
}

export default api
