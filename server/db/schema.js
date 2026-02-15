import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'hospital.db')

export const db = new Database(dbPath)

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom_complet TEXT NOT NULL,
      date_naissance TEXT NOT NULL,
      sexe TEXT NOT NULL,
      groupe_sanguin TEXT DEFAULT '',
      numero_securite_sociale TEXT NOT NULL,
      adresse_complete TEXT NOT NULL,
      coordonnees TEXT NOT NULL,
      personne_a_contacter TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS antecedents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      personnels TEXT NOT NULL DEFAULT '',
      familiaux TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compte_rendus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      contenu TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ordonnances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      medecin TEXT NOT NULL,
      contenu TEXT NOT NULL,
      vendu INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `)
  try {
    db.exec(`ALTER TABLE patients ADD COLUMN groupe_sanguin TEXT DEFAULT ''`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE patients ADD COLUMN photo_identite TEXT DEFAULT ''`)
  } catch (_) {}
  try {
    db.prepare(`UPDATE patients SET groupe_sanguin = 'O+' WHERE id = 1 AND (COALESCE(groupe_sanguin, '') = '')`).run()
  } catch (_) {}
  return db
}
