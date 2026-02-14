import { createContext, useContext, useState } from 'react'

const CurrentPatientContext = createContext({ patientId: 1, patientName: null, setCurrentPatient: () => {} })

export function CurrentPatientProvider({ children }) {
  const [patientId, setPatientId] = useState(1)
  const [patientName, setPatientName] = useState(null)
  const setCurrentPatient = (id, name) => {
    setPatientId(id ?? 1)
    setPatientName(name ?? null)
  }
  return (
    <CurrentPatientContext.Provider value={{ patientId, patientName, setCurrentPatient }}>
      {children}
    </CurrentPatientContext.Provider>
  )
}

export function useCurrentPatient() {
  return useContext(CurrentPatientContext)
}
