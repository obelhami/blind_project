import { useState, useRef, useEffect } from 'react'
import { Sparkles, Bot, User, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../../api/client'
import VoiceInputButton from '../ui/VoiceInputButton'
import { useCurrentPatient } from '../../context/CurrentPatientContext'
import { config, hasElevenLabs } from '../../config/env'

/** Speak reply: ElevenLabs TTS if key set, else browser TTS (French). */
async function speakReply(text) {
  const t = text?.trim()
  if (!t) return
  if (hasElevenLabs()) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': config.elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: t,
            model_id: 'eleven_multilingual_v2',
          }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      await audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch (err) {
      console.error('ElevenLabs TTS error:', err)
      fallbackSpeak(t)
    }
  } else {
    fallbackSpeak(t)
  }
}

function fallbackSpeak(text) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'fr-FR'
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}

export default function AIAssistantPanel({ isOpen, onClose }) {
  const { patientId, patientName } = useCurrentPatient()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleVoiceText = async (text) => {
    const trimmed = text?.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)
    setError(null)

    try {
      const { reply } = await sendChatMessage(patientId, trimmed)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      await speakReply(reply)
    } catch (e) {
      setError(e.message || "Erreur lors de l'envoi.")
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erreur: ${e.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-darkGreen/20 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 right-0 h-full lg:h-full z-40
          w-full sm:w-96 max-w-full
          bg-white border-l border-darkGreen/[0.06] shadow-card lg:shadow-none
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-darkGreen/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
            <h2 className="font-semibold text-darkGreen">Assistant vocal (dossier patient)</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-darkGreen/70 hover:bg-darkGreen/5"
          >
            <span className="text-lg">&times;</span>
          </button>
        </div>

        {patientName && (
          <p className="px-5 sm:px-6 py-3 text-xs text-darkGreen/60 border-b border-darkGreen/[0.06]">
            Dossier : <strong>{patientName}</strong>
          </p>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-darkGreen/50 py-6">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm font-medium text-darkGreen/70">Voix → Texte → Agent → Voix</p>
                <p className="text-xs mt-2">1. Appuyez sur le micro et parlez.</p>
                <p className="text-xs">2. Votre phrase est envoyée à l’agent (données dossier).</p>
                <p className="text-xs">3. La réponse est lue à voix haute.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-primaryGreen/15 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primaryGreen" strokeWidth={2} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-primaryGreen text-white'
                      : 'bg-darkGreen/[0.04] border border-darkGreen/10 text-darkGreen'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-darkGreen/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-darkGreen" strokeWidth={2} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-primaryGreen/15 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-3.5 h-3.5 text-primaryGreen animate-spin" strokeWidth={2} />
                </div>
                <div className="rounded-xl px-3 py-2 bg-darkGreen/[0.04] text-darkGreen/60 text-sm">
                  Réflexion...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-5 sm:px-6 py-3 bg-red-50 border-t border-red-100 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="p-5 sm:p-6 border-t border-darkGreen/[0.06] flex items-center gap-3">
            <VoiceInputButton onTextReceived={handleVoiceText} disabled={loading} />
            <span className="text-xs text-darkGreen/50">
              {hasElevenLabs() ? 'Micro (voix → texte → agent → voix)' : 'Micro (navigateur)'}
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
