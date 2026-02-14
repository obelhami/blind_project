import { Router } from 'express'
import OpenAI from 'openai'
import { db } from '../db/schema.js'

export const chatRouter = Router()
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

/** POST /api/chat - send user message + patientId, get LLM reply using patient data from DB */
chatRouter.post('/', async (req, res) => {
  const { message, patientId: rawId } = req.body
  const patientId = rawId != null ? parseInt(rawId, 10) : 1

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' })
  }

  if (!openai) {
    return res.status(503).json({
      error: 'LLM not configured',
      hint: 'Set OPENAI_API_KEY in server/.env to enable the patient chat.',
    })
  }

  try {
    let contextText = ''
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
    if (patient) {
      const antecedents = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(patientId)
      const cr = db.prepare('SELECT date, contenu FROM compte_rendus WHERE patient_id = ? ORDER BY date DESC').all(patientId)
      const ord = db.prepare('SELECT date, medecin, contenu FROM ordonnances WHERE patient_id = ? ORDER BY date DESC').all(patientId)
      const lines = [
        `Patient: ${patient.nom_complet}`,
        `Date de naissance: ${patient.date_naissance}, Sexe: ${patient.sexe}, Groupe sanguin: ${patient.groupe_sanguin || '—'}`,
        `N° Sécurité sociale: ${patient.numero_securite_sociale}`,
        `Adresse: ${patient.adresse_complete}`,
        `Coordonnées: ${patient.coordonnees}`,
        `Personne à contacter: ${patient.personne_a_contacter}`,
        '',
        'Antécédents personnels:',
        antecedents?.personnels || '—',
        '',
        'Antécédents familiaux:',
        antecedents?.familiaux || '—',
        '',
        'Comptes-rendus:',
        ...cr.map((r) => `[${r.date}] ${r.contenu}`),
        '',
        'Ordonnances:',
        ...ord.map((o) => `[${o.date}] ${o.medecin}\n${o.contenu}`),
      ]
      contextText = lines.join('\n')
    } else {
      contextText = 'Aucune fiche patient trouvée pour cet identifiant.'
    }

    const systemPrompt = `Tu es un assistant médical. Tu réponds uniquement à partir des données du dossier patient fournies ci-dessous. Réponds de façon concise et professionnelle, en français. Si les données ne permettent pas de répondre, dis-le clairement. Ne invente aucune donnée.

--- Données du dossier patient ---
${contextText}
--- Fin des données ---`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 1024,
    })

    const reply = completion.choices[0]?.message?.content ?? 'Aucune réponse.'
    res.json({ reply })
  } catch (e) {
    console.error('Chat error:', e)

    const isQuota = e.status === 429 || e.code === 'insufficient_quota' || (e.error && e.error.code === 'insufficient_quota')
    if (isQuota) {
      let fallbackSummary = 'Aucune fiche patient.'
      try {
        const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
        if (patient) {
          const ant = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(patientId)
          const lines = [
            `Patient : ${patient.nom_complet}.`,
            `Date de naissance : ${patient.date_naissance}, Sexe : ${patient.sexe}, Groupe sanguin : ${patient.groupe_sanguin || '—'}.`,
            `Antécédents personnels : ${ant?.personnels || '—'}`,
            `Antécédents familiaux : ${ant?.familiaux || '—'}`,
          ]
          fallbackSummary = lines.join('\n')
        }
      } catch (_) {}
      return res.status(200).json({ reply: fallbackSummary })
    }

    res.status(500).json({
      error: e.status === 429 ? 'Quota OpenAI dépassé. Vérifiez votre facturation sur platform.openai.com.' : "Erreur lors de l'appel au modèle.",
      detail: e.message || String(e),
    })
  }
})
