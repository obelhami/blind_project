import { useState, useRef, useEffect } from 'react'
import { Sparkles, Bot, User, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../../api/client'
import VoiceInputButton from '../ui/VoiceInputButton'
import Card from '../ui/Card'
import { config, hasElevenLabs } from '../../config/env'

async function speakWithElevenLabs(text) {
  if (!hasElevenLabs() || !text?.trim()) return
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
          text: text.trim(),
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
  }
}

export default function PatientVoiceChat({ patientId, patientName, speakReply = true }) {
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
      if (speakReply && hasElevenLabs()) {
        speakWithElevenLabs(reply)
      }
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
    <Card>
      <h3 className="font-semibold text-darkGreen text-base sm:text-lg tracking-tight mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primaryGreen" strokeWidth={2} />
        Poser une question à la voix (données du dossier)
      </h3>
      {patientName && (
        <p className="text-sm text-darkGreen/60 mb-4">
          Parlez pour interroger le dossier de <strong>{patientName}</strong>. Les réponses utilisent les données de la base.
        </p>
      )}

      <div className="rounded-xl border border-darkGreen/10 bg-darkGreen/[0.02] flex flex-col min-h-[280px] max-h-[420px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-darkGreen/50 py-8">
              <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">Appuyez sur le micro et posez votre question à voix haute.</p>
              <p className="text-xs mt-1">Ex. : « Quels sont les antécédents ? » — « Résume les ordonnances. »</p>
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

        <div className="p-3 border-t border-darkGreen/10 flex items-center gap-3">
          <VoiceInputButton onTextReceived={handleVoiceText} disabled={loading} />
          <span className="text-xs text-darkGreen/50">
            {hasElevenLabs() ? 'Micro ElevenLabs — réponses basées sur le dossier' : 'Utilisez le micro du navigateur'}
          </span>
        </div>
      </div>
    </Card>
  )
}
