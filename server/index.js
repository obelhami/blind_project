import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db/schema.js'
import { patientsRouter } from './routes/patients.js'
import { chatRouter } from './routes/chat.js'

initDb()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.use('/api/patients', patientsRouter)
app.use('/api/chat', chatRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`)
})
