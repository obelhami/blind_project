# API setup (ElevenLabs + MiniMax)

## MiniMax (chat / LLM)

The assistant chat uses **MiniMax** for replies (patient context + your message → MiniMax → reply).

### 1. Get an API key

1. Go to [MiniMax Platform](https://platform.minimax.io/).
2. Sign up or log in.
3. Open **Account Management → API Keys** (or [Interface Key](https://platform.minimax.io/user-center/basic-information/interface-key)).
4. Create or copy your API key.

### 2. Configure the server

Create or edit **`server/.env`**:

```env
PORT=3001
MINIMAX_API_KEY=your-minimax-api-key-here
```

Optional:

```env
MINIMAX_MODEL=M2-her
```

(Default model is `M2-her`.)

### 3. Restart the stack

```bash
make dev
```

This runs both the API (port 3001) and the frontend (port 5173) in one terminal. If you prefer two terminals: `make dev-server` and `make dev-client`.

If `MINIMAX_API_KEY` is missing, the chat still works but returns a simple patient summary from the database instead of an LLM reply.

---

## ElevenLabs (voice → text and text → voice)

- **Speech-to-text (STT):** microphone → ElevenLabs → text (used by the voice button).
- **Text-to-speech (TTS):** assistant reply → ElevenLabs → audio.

### 1. Get an API key

1. Go to [ElevenLabs](https://elevenlabs.io/).
2. Sign up and get your API key from the profile/settings.

### 2. Configure the frontend

Create or edit **`.env`** at the **project root** (next to `package.json`):

```env
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

Optional (TTS voice):

```env
VITE_ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

### 3. Restart the dev stack

```bash
make dev
```

If `VITE_ELEVENLABS_API_KEY` is missing, the voice button will show an error (the app uses only the ElevenLabs API for voice-to-text).
