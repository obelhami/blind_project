import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext'
import { CurrentPatientProvider } from './context/CurrentPatientContext'
import DashboardLayout from './components/layout/DashboardLayout'
import HospitalDashboard from './pages/HospitalDashboard'
import AppConfirmation from './pages/AppConfirmation'

const CONFIRMED_KEY = 'app_confirmed'

function App() {
  const [confirmed, setConfirmed] = useState(() => {
    try {
      return sessionStorage.getItem(CONFIRMED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const handleConfirm = () => {
    try {
      sessionStorage.setItem(CONFIRMED_KEY, 'true')
    } catch {}
    setConfirmed(true)
  }

  const handleLock = () => {
    try {
      sessionStorage.removeItem(CONFIRMED_KEY)
    } catch {}
    setConfirmed(false)
  }

  if (!confirmed) {
    return <AppConfirmation onConfirm={handleConfirm} />
  }

  return (
    <PatientProvider>
      <CurrentPatientProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout onLock={handleLock} />}>
            <Route index element={<HospitalDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CurrentPatientProvider>
    </PatientProvider>
  )
}

export default App
