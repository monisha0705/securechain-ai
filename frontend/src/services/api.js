/**
 * services/api.js
 * Axios-based API client for SecureChain AI backend.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
})

// ─── Request interceptor (logging) ─────────────────────────────────────────

api.interceptors.request.use(config => {
  console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// ─── Response interceptor (error normalisation) ────────────────────────────

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

// ─── API Methods ────────────────────────────────────────────────────────────

/**
 * Upload a requirements.txt File object.
 * Returns: { scan_id, filename, message, package_count }
 */
export async function uploadRequirements(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Run full scan for a scan_id (vuln check + anomaly detection + risk score).
 * Returns the full ScanResponse payload.
 */
export async function runScan(scanId) {
  const { data } = await api.post(`/scan/${scanId}`)
  return data
}

/**
 * Run anomaly detection only.
 */
export async function runAnalysis(scanId) {
  const { data } = await api.post(`/analyze/${scanId}`)
  return data
}

/**
 * Retrieve persisted results for a scan_id.
 */
export async function getResults(scanId) {
  const { data } = await api.get(`/results/${scanId}`)
  return data
}

/**
 * List recent scans.
 */
export async function listScans(limit = 20) {
  const { data } = await api.get('/scans', { params: { limit } })
  return data
}

/**
 * Health check.
 */
export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}

export default api
