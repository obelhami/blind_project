// import { useState, useRef } from 'react'
// import { Mic } from 'lucide-react'

// // ElevenLabs API key – set in .env as VITE_ELEVENLABS_API_KEY
// const ELEVENLABS_API_KEY = import.meta.env?.VITE_ELEVENLABS_API_KEY || ''

// export default function VoiceInputButton({ onTextReceived, disabled = false, className = '' }) {
//   const [recording, setRecording] = useState(false)
//   const mediaRecorderRef = useRef(null)
//   const recognitionRef = useRef(null)
//   const chunksRef = useRef([])

//   const startRecording = async () => {
//     if (ELEVENLABS_API_KEY) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//         const mediaRecorder = new MediaRecorder(stream)
//         chunksRef.current = []

//         mediaRecorder.ondataavailable = (e) => {
//           if (e.data.size > 0) chunksRef.current.push(e.data)
//         }

//         mediaRecorder.onstop = async () => {
//           stream.getTracks().forEach((t) => t.stop())
//           const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
//           const text = await transcribeWithElevenLabs(blob)
//           if (text) onTextReceived?.(text)
//         }

//         mediaRecorderRef.current = mediaRecorder
//         mediaRecorder.start()
//         setRecording(true)
//       } catch (err) {
//         console.error('Microphone access failed:', err)
//         onTextReceived?.('[Erreur: accès microphone refusé]')
//       }
//     } else {
//       startWebSpeech()
//     }
//   }

//   const transcribeWithElevenLabs = async (audioBlob) => {
//     try {
//       const formData = new FormData()
//       formData.append('audio', audioBlob, 'recording.webm')
//       const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
//         method: 'POST',
//         headers: { 'xi-api-key': ELEVENLABS_API_KEY },
//         body: formData,
//       })
//       if (!res.ok) throw new Error(await res.text())
//       const data = await res.json()
//       return data?.text ?? ''
//     } catch (err) {
//       console.error('ElevenLabs STT error:', err)
//       return ''
//     }
//   }

//   const startWebSpeech = () => {
//     const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
//     if (!supported) {
//       onTextReceived?.('Reconnaissance vocale non supportee.')
//       return
//     }
//     const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
//     const recognition = new Recognition()
//     recognition.lang = 'fr-FR'
//     recognition.continuous = true
//     recognition.interimResults = true
//     recognition.onresult = (e) => {
//       const last = e.results[e.results.length - 1]
//       if (last.isFinal) onTextReceived?.(last[0].transcript + ' ')
//     }
//     recognition.onend = () => setRecording(false)
//     recognitionRef.current = recognition
//     recognition.start()
//     setRecording(true)
//   }

//   const stopRecording = () => {
//     if (ELEVENLABS_API_KEY && mediaRecorderRef.current?.state !== 'inactive') {
//       mediaRecorderRef.current.stop()
//       setRecording(false)
//     } else if (recognitionRef.current) {
//       recognitionRef.current.stop()
//     }
//   }

//   const handleClick = () => (recording ? stopRecording() : startRecording())

//   return (
//     <button
//       type="button"
//       onClick={handleClick}
//       disabled={disabled}
//       className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 self-end transition-all duration-200 ${
//         recording ? 'bg-primaryGreen text-white animate-pulse' : 'bg-primaryGreen/15 text-primaryGreen hover:bg-primaryGreen/25'
//       } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
//       aria-label={recording ? 'Arrêter enregistrement' : 'Démarrer dictée vocale'}
//     >
//       <Mic className="w-5 h-5" strokeWidth={2} />
//     </button>
//   )
// }


import { useState, useRef } from 'react'
import { Mic, StopCircle } from 'lucide-react'
import { config, hasElevenLabs } from '../../config/env'

export default function VoiceInputButton({ 
  onTextReceived, 
  onInterimText, // NEW: For real-time partial results
  disabled = false, 
  className = '' 
}) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async () => {
    if (hasElevenLabs()) {
      // ElevenLabs mode (still has delay, but shows feedback)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        chunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop())
          setRecording(false)
          setTranscribing(true)
          
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const text = await transcribeWithElevenLabs(blob)
          
          setTranscribing(false)
          if (text) onTextReceived?.(text)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setRecording(true)
      } catch (err) {
        console.error('Microphone access failed:', err)
        alert('Erreur: accès microphone refusé')
      }
    } else {
      // Web Speech API mode (instant real-time)
      startWebSpeech()
    }
  }

  const transcribeWithElevenLabs = async (audioBlob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model_id', 'scribe_v2')
      formData.append('language_code', 'fr')
      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': config.elevenLabsApiKey },
        body: formData,
      })
      if (!res.ok) {
        const errText = await res.text()
        console.error('ElevenLabs STT response:', res.status, errText)
        throw new Error(errText || `STT error ${res.status}`)
      }
      const data = await res.json()
      return data?.text ?? ''
    } catch (err) {
      console.error('ElevenLabs STT error:', err)
      alert('Erreur de transcription: ' + (err.message || 'vérifiez votre clé API ElevenLabs'))
      return ''
    }
  }

  const startWebSpeech = () => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    if (!supported) {
      alert('Reconnaissance vocale non supportée sur ce navigateur')
      return
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true // CRITICAL: Enable interim results

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          // Final result - append immediately
          finalTranscript += transcript + ' '
        } else {
          // Interim result - show preview
          interimTranscript += transcript
        }
      }

      // Send final text immediately to the input
      if (finalTranscript) {
        onTextReceived?.(finalTranscript)
      }

      // Send interim text for preview (optional)
      if (interimTranscript && onInterimText) {
        onInterimText(interimTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setRecording(false)
      
      if (event.error === 'no-speech') {
        // Silent fail, just stop
        return
      }
      
      alert(`Erreur: ${event.error}`)
    }

    recognition.onend = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const stopRecording = () => {
    if (hasElevenLabs() && mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleClick = () => {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || transcribing}
      className={`
        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 self-end 
        transition-all duration-200 shadow-medical
        ${recording 
          ? 'bg-red-600 text-white animate-pulse' 
          : transcribing
          ? 'bg-yellow-500 text-white'
          : 'bg-primaryGreen text-white hover:bg-primaryGreen/90 hover:scale-105'
        } 
        disabled:opacity-50 disabled:cursor-not-allowed ${className}
      `}
      aria-label={
        transcribing 
          ? 'Transcription en cours...' 
          : recording 
          ? 'Arrêter enregistrement' 
          : 'Démarrer dictée vocale'
      }
    >
      {recording ? (
        <StopCircle className="w-5 h-5" strokeWidth={2.5} />
      ) : transcribing ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Mic className="w-5 h-5" strokeWidth={2.5} />
      )}
    </button>
  )
}