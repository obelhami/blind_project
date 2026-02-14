import { useState } from 'react'
import { Fingerprint } from 'lucide-react'

export default function AppConfirmation({ onConfirm }) {
  const [scanning, setScanning] = useState(false)

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      onConfirm()
    }, 1500)
  }

  return (
    <div className="h-screen min-h-screen bg-medicalWhite flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-2xl shadow-card border border-darkGreen/[0.04] p-10 text-center">
          <div
            className={`w-36 h-36 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-300 ${
              scanning ? 'bg-primaryGreen/15 scale-105' : 'bg-darkGreen/[0.04]'
            }`}
          >
            <Fingerprint
              className={`w-20 h-20 text-primaryGreen ${scanning ? 'animate-pulse' : ''}`}
              strokeWidth={1.5}
            />
          </div>
          <h1 className="text-2xl font-semibold text-darkGreen tracking-tight mb-3">
            Confirmer l'accès
          </h1>
          <p className="text-darkGreen/60 text-[15px] leading-relaxed mb-10">
            Scannez votre empreinte pour accéder au système de soins d'urgence
          </p>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-3.5 px-6 rounded-xl bg-primaryGreen text-white font-medium text-[15px] hover:opacity-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {scanning ? 'Scan en cours...' : 'Scanner empreinte'}
          </button>
        </div>
        <p className="text-center text-darkGreen/40 text-xs mt-8 tracking-wide">
          Personnel autorisé uniquement
        </p>
      </div>
    </div>
  )
}
