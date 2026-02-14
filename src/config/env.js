/**
 * Frontend env – all values from root .env (VITE_* only are exposed by Vite).
 * Optimize: single place to read env so components stay in sync with your .env.
 */
const env = import.meta.env

export const config = {
  /** API base URL. Empty in dev (Vite proxy). Set in production. */
  apiUrl: env.VITE_API_URL ?? '',

  /** ElevenLabs API key – STT (voice input) and TTS (voice output). */
  elevenLabsApiKey: env.VITE_ELEVENLABS_API_KEY ?? '',

  /** ElevenLabs voice ID for TTS. Default: Rachel. */
  elevenLabsVoiceId: env.VITE_ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM',

  /** ElevenLabs Conversational AI agent ID (optional, for future agent use). */
  elevenLabsAgentId: env.VITE_ELEVENLABS_AGENT_ID ?? '',
}

export const hasElevenLabs = () => Boolean(config.elevenLabsApiKey)
export const hasElevenLabsAgent = () => Boolean(config.elevenLabsApiKey && config.elevenLabsAgentId)
