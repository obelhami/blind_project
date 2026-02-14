import { Sparkles } from 'lucide-react'

export default function FloatingAIButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-primaryGreen text-white shadow-card-hover flex items-center justify-center transition-all duration-200 hover:opacity-95 active:scale-95 lg:hidden"
      aria-label="Open AI Assistant"
    >
      <Sparkles className="w-6 h-6" strokeWidth={2} />
    </button>
  )
}
