import { Bell, User, Fingerprint, Mic } from 'lucide-react'

export default function Navbar({ onLock, onOpenAIPanel }) {
  return (
    <header className="h-16 flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-darkGreen/[0.06] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-darkGreen">Soins d'urgence</h1>

      <div className="flex items-center gap-2 sm:gap-4">
        {onOpenAIPanel && (
          <button
            onClick={onOpenAIPanel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-primaryGreen bg-primaryGreen/15 hover:bg-primaryGreen/25 transition-colors text-sm"
            title="Assistant vocal (dossier patient)"
          >
            <Mic className="w-5 h-5" strokeWidth={2} />
            <span className="hidden sm:inline">Assistant vocal</span>
          </button>
        )}
        <span className="hidden sm:inline text-sm font-medium text-darkGreen/80">
          Personnel hospitalier
        </span>
        <button
          onClick={onLock}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-darkGreen/70 hover:bg-darkGreen/5 hover:text-darkGreen transition-colors text-sm"
          title="Verrouiller / Réenregistrer empreinte"
        >
          <Fingerprint className="w-4 h-4" strokeWidth={2} />
          <span className="hidden md:inline">Verrouiller</span>
        </button>
        <button
          className="p-2 rounded-lg text-darkGreen/70 hover:bg-darkGreen/5 hover:text-darkGreen transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primaryGreen/15 flex items-center justify-center">
          <User className="w-4 h-4 text-primaryGreen" strokeWidth={2} />
        </div>
      </div>
    </header>
  )
}
