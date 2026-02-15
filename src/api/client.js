import { config } from '../config/env.js'

const API_BASE = config.apiUrl

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.detail || res.statusText)
  }
  return res.json()
}

/** GET full patient data for dashboard (patient, antecedents, compteRendus, ordonnances) */
export async function getPatient(id) {
  return request(`/api/patients/${id}`)
}

/** POST new compte-rendu */
export async function addCompteRendu(patientId, { date, contenu }) {
  return request(`/api/patients/${patientId}/compte-rendus`, {
    method: 'POST',
    body: JSON.stringify({ date, contenu }),
  })
}

/** POST new ordonnance */
export async function addOrdonnance(patientId, { date, medecin, contenu }) {
  return request(`/api/patients/${patientId}/ordonnances`, {
    method: 'POST',
    body: JSON.stringify({ date, medecin, contenu }),
  })
}

/** DELETE compte-rendu (consultation) */
export async function deleteCompteRendu(patientId, crId) {
  const url = `${API_BASE}/api/patients/${patientId}/compte-rendus/${crId}`
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.detail || res.statusText)
  }
}

/** DELETE ordonnance */
export async function deleteOrdonnance(patientId, ordId) {
  const url = `${API_BASE}/api/patients/${patientId}/ordonnances/${ordId}`
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.detail || res.statusText)
  }
}

/** POST photo d'identité (body: { photo: "data:image/...;base64,..." }) */
export async function uploadPatientPhoto(patientId, dataUrl) {
  return request(`/api/patients/${patientId}/photo`, {
    method: 'POST',
    body: JSON.stringify({ photo: dataUrl }),
  })
}

/** POST chat message; returns { reply } */
export async function sendChatMessage(patientId, message) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, patientId }),
  })
}
