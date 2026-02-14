import { useState } from 'react'
import { Fingerprint, KeyRound } from 'lucide-react'
import { TEST_USE_CASES, validateAccessCode, USE_CASE_STORAGE_KEY } from '../config/testUseCases'

function persistUseCase(useCase) {
  try {
    if (useCase?.id) sessionStorage.setItem(USE_CASE_STORAGE_KEY, useCase.id)
  } catch {}
}

export default function AppConfirmation({ onConfirm }) {
  const [scanning, setScanning] = useState(false)
  const [mode, setMode] = useState('fingerprint') // 'fingerprint' | 'code'
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')

  const handleScan = () => {
    setError('')
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      const firstUser = TEST_USE_CASES[0]
      persistUseCase(firstUser)
      onConfirm(firstUser.id)
    }, 1500)
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    setError('')
    const useCase = validateAccessCode(codeInput)
    if (useCase) {
      persistUseCase(useCase)
      onConfirm(useCase.id)
    } else {
      setError('UID invalide. Utilisez USER-1 (Omar Belhamid) ou USER-2 (Lahcen Kazaz).')
    }
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
            {mode === 'fingerprint' ? (
              <Fingerprint
                className={`w-20 h-20 text-primaryGreen ${scanning ? 'animate-pulse' : ''}`}
                strokeWidth={1.5}
              />
            ) : (
              <KeyRound
                className="w-20 h-20 text-primaryGreen"
                strokeWidth={1.5}
              />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-darkGreen tracking-tight mb-3">
            Confirmer l'accès
          </h1>
          <p className="text-darkGreen/60 text-[15px] leading-relaxed mb-6">
            {mode === 'fingerprint'
              ? "Scannez votre empreinte ou utilisez un code pour accéder au système de soins d'urgence"
              : "Saisissez l'UID utilisateur (ex. USER-1, USER-2) pour accéder"}
          </p>

          {/* Toggle Fingerprint / Code */}
          <div className="flex rounded-xl p-1 bg-darkGreen/[0.04] w-full mb-6">
            <button
              type="button"
              onClick={() => { setMode('fingerprint'); setError(''); setCodeInput(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'fingerprint'
                  ? 'bg-primaryGreen text-white shadow-sm'
                  : 'text-darkGreen/70 hover:bg-darkGreen/[0.04]'
              }`}
            >
              <Fingerprint className="w-4 h-4" strokeWidth={2} />
              Empreinte
            </button>
            <button
              type="button"
              onClick={() => { setMode('code'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'code'
                  ? 'bg-primaryGreen text-white shadow-sm'
                  : 'text-darkGreen/70 hover:bg-darkGreen/[0.04]'
              }`}
            >
              <KeyRound className="w-4 h-4" strokeWidth={2} />
              Code / UID
            </button>
          </div>

          {mode === 'fingerprint' ? (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-3.5 px-6 rounded-xl bg-primaryGreen text-white font-medium text-[15px] hover:opacity-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {scanning ? 'Scan en cours...' : 'Scanner empreinte'}
            </button>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-3">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setError(''); }}
                placeholder="Ex: USER-1 ou fp_omar_belhamid"
                className="w-full px-4 py-3 rounded-xl border border-darkGreen/15 bg-darkGreen/[0.02] text-darkGreen placeholder-darkGreen/40 focus:outline-none focus:ring-2 focus:ring-primaryGreen/20 focus:border-primaryGreen/50 text-sm"
                autoComplete="off"
              />
              {error && (
                <p className="text-red-600 text-sm text-left">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-primaryGreen text-white font-medium text-[15px] hover:opacity-95 active:scale-[0.99] transition-all duration-200"
              >
                Accéder avec le code
              </button>
            </form>
          )}
        </div>

        {/* Test codes reference */}
        <details className="mt-6 text-left">
          <summary className="text-darkGreen/50 text-xs cursor-pointer hover:text-darkGreen/70 tracking-wide">
            Codes de test (cliquez pour afficher)
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs text-darkGreen/60 font-mono bg-white/80 rounded-xl p-3 border border-darkGreen/10">
            {TEST_USE_CASES.map((u) => (
              <li key={u.id}>
                <span className="font-semibold text-darkGreen/80">{u.uid}</span>
                {' · '}
                <span className="text-darkGreen/50">{u.name}</span>
                {' · '}
                <span className="text-darkGreen/40">{u.fingerprintId}</span>
              </li>
            ))}
          </ul>
        </details>

        <p className="text-center text-darkGreen/40 text-xs mt-6 tracking-wide">
          Personnel autorisé uniquement
        </p>
      </div>
    </div>
  )
}
