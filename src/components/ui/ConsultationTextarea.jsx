import { useState } from 'react'
import { Type, Mic } from 'lucide-react'
import VoiceInputButton from './VoiceInputButton'

export default function ConsultationTextarea({
  value,
  onChange,
  placeholder = 'Saisissez ou dictez...',
  minHeight = 120,
  mode = 'both',
}) {
  const [inputMode, setInputMode] = useState('manual')

  const handleVoiceText = (text) => {
    onChange?.(value ? `${value} ${text}` : text)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
        <span className="text-sm font-medium text-darkGreen/60">Mode saisie</span>
        <div className="flex rounded-xl p-1 bg-darkGreen/[0.04] w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              inputMode === 'manual'
                ? 'bg-primaryGreen text-white shadow-sm'
                : 'text-darkGreen/70 hover:text-darkGreen hover:bg-darkGreen/[0.04]'
            }`}
          >
            <Type className="w-4 h-4" strokeWidth={2} />
            Manuel
          </button>
          <button
            type="button"
            onClick={() => setInputMode('voice')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              inputMode === 'voice'
                ? 'bg-primaryGreen text-white shadow-sm'
                : 'text-darkGreen/70 hover:text-darkGreen hover:bg-darkGreen/[0.04]'
            }`}
          >
            <Mic className="w-4 h-4" strokeWidth={2} />
            Voix
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight: `${minHeight}px` }}
          className="flex-1 px-4 py-3 rounded-xl border border-darkGreen/10 bg-darkGreen/[0.02] text-darkGreen placeholder-darkGreen/40 focus:outline-none focus:ring-2 focus:ring-primaryGreen/20 focus:border-primaryGreen/50 focus:bg-white resize-y text-sm sm:text-base transition-colors"
        />
        {inputMode === 'voice' && <VoiceInputButton onTextReceived={handleVoiceText} />}
      </div>
    </div>
  )
}
