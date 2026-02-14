import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react'
import { sendChatMessage } from '../../api/client'
import Card from '../ui/Card'

export default function PatientChat({ patientId, patientName }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    setError(null)

    try {
      const { reply } = await sendChatMessage(patientId, text)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'envoi.')
      setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="font-semibold text-darkGreen text-base sm:text-lg tracking-tight mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
        Poser une question sur ce patient
      </h3>
      {patientName && (
        <p className="text-sm text-darkGreen/60 mb-4">
          Données du dossier de <strong>{patientName}</strong> utilisées pour les réponses.
        </p>
      )}

      <div className="rounded-xl border border-darkGreen/10 bg-darkGreen/[0.02] flex flex-col min-h-[280px] max-h-[420px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-darkGreen/50 py-8">
              <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">Exemple : « Quels sont les antécédents ? » ou « Résume les ordonnances. »</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primaryGreen/15 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primaryGreen" strokeWidth={2} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primaryGreen text-white'
                    : 'bg-white border border-darkGreen/10 text-darkGreen'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-darkGreen/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-darkGreen" strokeWidth={2} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primaryGreen/15 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-primaryGreen animate-spin" strokeWidth={2} />
              </div>
              <div className="rounded-xl px-4 py-3 bg-white border border-darkGreen/10 text-darkGreen/60 text-sm">
                Réflexion...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="p-3 border-t border-darkGreen/10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Question sur le dossier patient..."
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-darkGreen/10 bg-white text-darkGreen placeholder-darkGreen/40 text-sm focus:outline-none focus:ring-2 focus:ring-primaryGreen/20 focus:border-primaryGreen/50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-primaryGreen text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
            aria-label="Envoyer"
          >
            <Send className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </Card>
  )
}
