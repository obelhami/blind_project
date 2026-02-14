import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { initDb } from './db/schema.js'
import { patientsRouter } from './routes/patients.js'
import { chatRouter } from './routes/chat.js'
import './db/seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
initDb()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.use('/api/patients', patientsRouter)
app.use('/api/chat', chatRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`)
})
