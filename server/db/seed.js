import { db, initDb } from './schema.js'

initDb()

const patient = {
  nom_complet: 'Omar Belhamid',
  date_naissance: '15/03/1985',
  sexe: 'Masculin',
  groupe_sanguin: 'O+',
  numero_securite_sociale: '1 85 03 75 123 45 67',
  adresse_complete: '12 rue Mohammed V, 20000 Casablanca, Maroc',
  coordonnees: '06 12 34 56 78 — omar.belhamid@email.com',
  personne_a_contacter: 'Fatima Belhamid — 06 98 76 54 32 — Épouse',
}

const antecedents = {
  personnels: 'Allergie à la pénicilline (2010). Diabète de type 2 depuis 2018. Hypertension artérielle. Appendicectomie en 2005.',
  familiaux: 'Diabète familial (père, sœur). Cardiopathie (mère). Cancer colorectal (oncle maternel).',
}

const compteRendus = [
  {
    date: '14/02/2025',
    contenu: 'Patient conscient, orientation temporo-spatiale conservée.\nExamen clinique sans particularité.\nConclusion : Suivi habituel.',
  },
]

const ordonnances = [
  {
    date: '14/02/2025',
    medecin: 'Dr. Martin',
    contenu: 'Paracétamol 1000 mg : 1 comprimé x 3/jour pendant 5 jours\nMetformine 850 mg : 1 comprimé matin et soir',
    vendu: 0,
  },
]

const countPatients = db.prepare('SELECT COUNT(*) as n FROM patients').get()
if (countPatients.n === 0) {
  const insertPatient = db.prepare(`
    INSERT INTO patients (nom_complet, date_naissance, sexe, groupe_sanguin, numero_securite_sociale, adresse_complete, coordonnees, personne_a_contacter)
    VALUES (@nom_complet, @date_naissance, @sexe, @groupe_sanguin, @numero_securite_sociale, @adresse_complete, @coordonnees, @personne_a_contacter)
  `)
  insertPatient.run({
    nom_complet: patient.nom_complet,
    date_naissance: patient.date_naissance,
    sexe: patient.sexe,
    groupe_sanguin: patient.groupe_sanguin || '',
    numero_securite_sociale: patient.numero_securite_sociale,
    adresse_complete: patient.adresse_complete,
    coordonnees: patient.coordonnees,
    personne_a_contacter: patient.personne_a_contacter,
  })

  const { id: patientId } = db.prepare('SELECT last_insert_rowid() as id').get()

  db.prepare('INSERT INTO antecedents (patient_id, personnels, familiaux) VALUES (?, ?, ?)').run(
    patientId,
    antecedents.personnels,
    antecedents.familiaux
  )

  const insertCr = db.prepare('INSERT INTO compte_rendus (patient_id, date, contenu) VALUES (?, ?, ?)')
  for (const cr of compteRendus) {
    insertCr.run(patientId, cr.date, cr.contenu)
  }

  const insertOrd = db.prepare(
    'INSERT INTO ordonnances (patient_id, date, medecin, contenu, vendu) VALUES (?, ?, ?, ?, ?)'
  )
  for (const ord of ordonnances) {
    insertOrd.run(patientId, ord.date, ord.medecin, ord.contenu, ord.vendu)
  }

  console.log('Database seeded with patient id:', patientId)
} else {
  console.log('Database already has data, skip seed.')
}
