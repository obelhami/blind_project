import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads', 'patients')

export const patientsRouter = Router()

/** GET /api/patients - list patients (id, nom_complet) */
patientsRouter.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, nom_complet FROM patients ORDER BY id').all()
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** GET /api/patients/:id - full patient for dashboard (camelCase for frontend) */
patientsRouter.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const antecedents = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(id)
    const compteRendus = db
      .prepare('SELECT id, date, contenu FROM compte_rendus WHERE patient_id = ? ORDER BY date DESC')
      .all(id)
    const ordonnances = db
      .prepare('SELECT id, date, medecin, contenu, vendu FROM ordonnances WHERE patient_id = ? ORDER BY date DESC')
      .all(id)

    res.json({
      patient: {
        id: patient.id,
        nomComplet: patient.nom_complet,
        dateNaissance: patient.date_naissance,
        sexe: patient.sexe,
        groupeSanguin: patient.groupe_sanguin ?? '',
        numeroSecuriteSociale: patient.numero_securite_sociale,
        adresseComplete: patient.adresse_complete,
        coordonnees: patient.coordonnees,
        personneAContacter: patient.personne_a_contacter,
        photoIdentite: patient.photo_identite ?? '',
      },
      antecedents: antecedents
        ? { personnels: antecedents.personnels, familiaux: antecedents.familiaux }
        : { personnels: '', familiaux: '' },
      compteRendus: compteRendus.map((cr) => ({ id: cr.id, date: cr.date, contenu: cr.contenu })),
      ordonnances: ordonnances.map((o) => ({
        id: o.id,
        date: o.date,
        medecin: o.medecin,
        contenu: o.contenu,
        vendu: Boolean(o.vendu),
      })),
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** POST /api/patients/:id/photo - set photo d'identité (body: { photo: "data:image/jpeg;base64,..." }) */
patientsRouter.post('/:id/photo', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(id)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const { photo } = req.body
    if (!photo || typeof photo !== 'string') {
      return res.status(400).json({ error: 'photo (data URL or base64) is required' })
    }

    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/)
    const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'jpg'
    const base64 = match ? match[2] : photo
    const buf = Buffer.from(base64, 'base64')
    if (buf.length === 0) return res.status(400).json({ error: 'Invalid photo data' })

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const filename = `${id}.${ext}`
    const filepath = path.join(uploadsDir, filename)
    fs.writeFileSync(filepath, buf)
    const photoPath = `/uploads/patients/${filename}`

    db.prepare('UPDATE patients SET photo_identite = ? WHERE id = ?').run(photoPath, id)
    res.json({ photoIdentite: photoPath })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** POST /api/patients/:id/compte-rendus - add a new compte-rendu */
patientsRouter.post('/:id/compte-rendus', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { date, contenu } = req.body
    if (!contenu || typeof contenu !== 'string') {
      return res.status(400).json({ error: 'contenu is required' })
    }
    const d = date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    db.prepare('INSERT INTO compte_rendus (patient_id, date, contenu) VALUES (?, ?, ?)').run(id, d, contenu.trim())
    const row = db.prepare('SELECT id, date, contenu FROM compte_rendus WHERE id = last_insert_rowid()').get()
    res.status(201).json({ id: row.id, date: row.date, contenu: row.contenu })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** POST /api/patients/:id/ordonnances - add a new ordonnance */
patientsRouter.post('/:id/ordonnances', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { date, medecin, contenu } = req.body
    if (!contenu || typeof contenu !== 'string') {
      return res.status(400).json({ error: 'contenu is required' })
    }
    const d = date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const med = medecin || 'Dr. Martin'
    db.prepare('INSERT INTO ordonnances (patient_id, date, medecin, contenu, vendu) VALUES (?, ?, ?, ?, 0)').run(id, d, med, contenu.trim())
    const row = db.prepare('SELECT id, date, medecin, contenu, vendu FROM ordonnances WHERE id = last_insert_rowid()').get()
    res.status(201).json({ id: row.id, date: row.date, medecin: row.medecin, contenu: row.contenu, vendu: Boolean(row.vendu) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** DELETE /api/patients/:id/compte-rendus/:crId - delete a compte-rendu */
patientsRouter.delete('/:id/compte-rendus/:crId', (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10)
    const crId = parseInt(req.params.crId, 10)
    const row = db.prepare('SELECT id FROM compte_rendus WHERE id = ? AND patient_id = ?').get(crId, patientId)
    if (!row) return res.status(404).json({ error: 'Compte-rendu not found' })
    db.prepare('DELETE FROM compte_rendus WHERE id = ?').run(crId)
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** DELETE /api/patients/:id/ordonnances/:ordId - delete an ordonnance */
patientsRouter.delete('/:id/ordonnances/:ordId', (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10)
    const ordId = parseInt(req.params.ordId, 10)
    const row = db.prepare('SELECT id FROM ordonnances WHERE id = ? AND patient_id = ?').get(ordId, patientId)
    if (!row) return res.status(404).json({ error: 'Ordonnance not found' })
    db.prepare('DELETE FROM ordonnances WHERE id = ?').run(ordId)
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

/** GET /api/patients/:id/full - raw text summary for LLM context */
patientsRouter.get('/:id/full', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })

    const antecedents = db.prepare('SELECT personnels, familiaux FROM antecedents WHERE patient_id = ?').get(id)
    const compteRendus = db
      .prepare('SELECT date, contenu FROM compte_rendus WHERE patient_id = ? ORDER BY date DESC')
      .all(id)
    const ordonnances = db
      .prepare('SELECT date, medecin, contenu FROM ordonnances WHERE patient_id = ? ORDER BY date DESC')
      .all(id)

    const lines = [
      `Patient: ${patient.nom_complet}`,
      `Date de naissance: ${patient.date_naissance}`,
      `Sexe: ${patient.sexe}`,
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
      ...compteRendus.map((cr) => `[${cr.date}] ${cr.contenu}`),
      '',
      'Ordonnances:',
      ...ordonnances.map((o) => `[${o.date}] ${o.medecin}\n${o.contenu}`),
    ]

    res.json({ text: lines.join('\n') })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
