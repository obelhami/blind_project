import { Router } from 'express'
import { db } from '../db/schema.js'

export const chatRouter = Router()

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'M2-her'

/** Call MiniMax chat completion API */
async function minimaxChat(systemPrompt, userMessage) {
  const res = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_completion_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let err
    try {
      err = JSON.parse(errText)
    } catch {
      err = { base_resp: { status_code: res.status, status_msg: errText } }
    }
    const code = err?.base_resp?.status_code ?? res.status
    const msg = err?.base_resp?.status_msg ?? errText
    const e = new Error(msg || `MiniMax API error ${res.status}`)
    e.status = res.status
    e.code = code === 1008 ? 'insufficient_quota' : undefined
    throw e
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return content ?? ''
}

/** Compute age: current date minus birthday. Supports DD/MM/YYYY and YYYY-MM-DD. */
function getAge(dateNaissance) {
  if (!dateNaissance) return null
  let birth
  if (dateNaissance.includes('/')) {
    const [d, m, y] = dateNaissance.split('/').map(Number)
    birth = new Date(y, m - 1, d)
  } else {
    birth = new Date(dateNaissance)
  }
  const today = new Date()
  const diffMs = today - birth
  const age = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
  return age >= 0 ? age : null
}

/** Build full patient summary (context for LLM) */
function getPatientSummary(patientId) {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
  if (!patient) return 'Aucune fiche patient.'
  const ant = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(patientId)
  const cr = db.prepare('SELECT date, contenu FROM compte_rendus WHERE patient_id = ? ORDER BY date DESC').all(patientId)
  const ord = db.prepare('SELECT date, medecin, contenu FROM ordonnances WHERE patient_id = ? ORDER BY date DESC').all(patientId)
  const lines = [
    `Patient : ${patient.nom_complet}.`,
    `Date de naissance : ${patient.date_naissance}, Sexe : ${patient.sexe}, Groupe sanguin : ${patient.groupe_sanguin || '—'}.`,
    `N° Sécurité sociale : ${patient.numero_securite_sociale}.`,
    `Adresse : ${patient.adresse_complete}.`,
    `Coordonnées : ${patient.coordonnees}.`,
    `Personne à contacter : ${patient.personne_a_contacter}.`,
    '',
    'Antécédents personnels :',
    ant?.personnels || '—',
    '',
    'Antécédents familiaux :',
    ant?.familiaux || '—',
    '',
    'Comptes-rendus :',
    ...cr.map((r) => `[${r.date}] ${r.contenu}`),
    '',
    'Ordonnances :',
    ...ord.map((o) => `[${o.date}] ${o.medecin}\n${o.contenu}`),
  ]
  return lines.join('\n')
}

/** Build essential patient info only: nom, âge, groupe sanguin, antécédents médicaux */
function getPatientEssentialInfo(patientId) {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
  if (!patient) return 'Aucune fiche patient.'
  const ant = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(patientId)
  const age = getAge(patient.date_naissance)
  const ageStr = age != null ? `${age} ans` : patient.date_naissance
  const lines = [
    `Nom : ${patient.nom_complet}`,
    `Âge : ${ageStr}`,
    `Groupe sanguin : ${patient.groupe_sanguin || 'Non renseigné'}`,
    '',
    'Antécédents médicaux :',
    `Personnels : ${ant?.personnels || 'Aucun'}`,
    `Familiaux : ${ant?.familiaux || 'Aucun'}`,
  ]
  return lines.join('\n')
}

/** POST /api/chat - send user message + patientId, get LLM reply using patient data from DB */
chatRouter.post('/', async (req, res) => {
  const { message, patientId: rawId } = req.body
  const patientId = rawId != null ? parseInt(rawId, 10) : 1

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' })
  }

  const userMessage = message.trim()

  if (!MINIMAX_API_KEY) {
    const fallbackSummary = getPatientEssentialInfo(patientId)
    return res.status(200).json({
      reply: fallbackSummary,
    })
  }

  try {
    const contextText = getPatientSummary(patientId)

    const systemPrompt = `Tu es un assistant médical. Tu réponds UNIQUEMENT en français. Réponds uniquement à partir des données du dossier patient fournies ci-dessous. Réponds de façon concise et professionnelle. Ne invente aucune donnée.

IMPORTANT: Quand l'utilisateur demande les infos du patient, un résumé, "donne-moi les données" ou équivalent, réponds UNIQUEMENT avec ces 4 informations (rien d'autre):
1. Nom complet
2. Âge (calculé à partir de la date de naissance)
3. Groupe sanguin
4. Antécédents médicaux (personnels et familiaux)

Tu dois afficher et dire uniquement ces informations essentielles, en français.

--- Données du dossier patient ---
${contextText}
--- Fin des données ---`

    const reply = await minimaxChat(systemPrompt, userMessage)
    const finalReply = (reply && reply.trim()) ? reply.trim() : getPatientEssentialInfo(patientId)
    res.json({ reply: finalReply })
  } catch (e) {
    console.error('Chat error:', e)

    const isQuota = e.status === 429 || e.code === 'insufficient_quota' || e.code === 1008
    if (isQuota) {
      const fallbackSummary = getPatientEssentialInfo(patientId)
      return res.status(200).json({ reply: fallbackSummary })
    }

    const fallbackSummary = getPatientEssentialInfo(patientId)
    return res.status(200).json({
      reply: fallbackSummary,
    })
  }
})
