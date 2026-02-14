import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext'
import { CurrentPatientProvider } from './context/CurrentPatientContext'
import DashboardLayout from './components/layout/DashboardLayout'
import HospitalDashboard from './pages/HospitalDashboard'
import AppConfirmation from './pages/AppConfirmation'
import { USE_CASE_STORAGE_KEY, getUseCaseById } from './config/testUseCases'

const CONFIRMED_KEY = 'app_confirmed'

function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const confirmed = sessionStorage.getItem(CONFIRMED_KEY) === 'true'
      const useCaseId = sessionStorage.getItem(USE_CASE_STORAGE_KEY) || null
      return { confirmed, useCaseId }
    } catch {
      return { confirmed: false, useCaseId: null }
    }
  })

  const handleConfirm = (loggedInUseCaseId) => {
    const id = loggedInUseCaseId || auth.useCaseId
    try {
      sessionStorage.setItem(CONFIRMED_KEY, 'true')
      if (id) sessionStorage.setItem(USE_CASE_STORAGE_KEY, id)
    } catch {}
    setAuth({ confirmed: true, useCaseId: id || null })
  }

  const handleLock = () => {
    try {
      sessionStorage.removeItem(CONFIRMED_KEY)
      sessionStorage.removeItem(USE_CASE_STORAGE_KEY)
    } catch {}
    setAuth({ confirmed: false, useCaseId: null })
  }

  if (!auth.confirmed) {
    return <AppConfirmation onConfirm={handleConfirm} />
  }

  const currentUser = getUseCaseById(auth.useCaseId)

  return (
    <PatientProvider>
      <CurrentPatientProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout onLock={handleLock} currentUser={currentUser} />}>
            <Route index element={<HospitalDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CurrentPatientProvider>
    </PatientProvider>
  )
}

export default App
