import { createContext, useContext, useState } from 'react'

const PatientContext = createContext(null)

const initialOrdonnances = [
  { id: 1, date: '14/02/2025', medecin: 'Dr. Martin', contenu: 'Paracétamol 1000 mg : 1 comprimé x 3/jour pendant 5 jours\nMetformine 850 mg : 1 comprimé matin et soir', vendu: false },
]

export function PatientProvider({ children }) {
  const [ordonnances, setOrdonnances] = useState(initialOrdonnances)

  const addOrdonnance = (ord) => {
    setOrdonnances((prev) => [...prev, { ...ord, vendu: false }])
  }

  const confirmerOrdonnance = (id) => {
    setOrdonnances((prev) =>
      prev.map((o) => (o.id === id ? { ...o, vendu: true } : o))
    )
  }

  return (
    <PatientContext.Provider value={{ ordonnances, addOrdonnance, confirmerOrdonnance }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const ctx = useContext(PatientContext)
  if (!ctx) throw new Error('usePatient must be used within PatientProvider')
  return ctx
}
