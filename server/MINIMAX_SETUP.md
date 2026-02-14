# Use MiniMax as LLM for the chat (voice → text → agent → voice)

The chatbot now uses **MiniMax** instead of OpenAI. The flow is unchanged:

1. **Voice** → ElevenLabs STT → text  
2. **Text** → sent to `/api/chat` with `patientId`  
3. **Backend** loads patient data from the DB and calls **MiniMax** with that context  
4. **Reply** → shown in the UI and read aloud (ElevenLabs TTS)

## Setup

### 1. Get a MiniMax API key

1. Go to [MiniMax Platform](https://platform.minimax.io/).  
2. Sign up or log in.  
3. Open **Account Management → API Keys** (or [Interface Key](https://platform.minimax.io/user-center/basic-information/interface-key)).  
4. Create or copy your **API key**.

### 2. Configure the server

In the **server** folder, create or edit `server/.env`:

```env
PORT=3001
MINIMAX_API_KEY=your-minimax-api-key-here
```

Optional:

```env
MINIMAX_MODEL=M2-her
```

(Default model is `M2-her`.)

### 3. Restart the server

```bash
cd server
npm run dev
```

## Voice: “Give me all data for this patient”

You can say things like:

- *“Donne-moi toutes les données du patient”*  
- *“Résumé complet du dossier”*  
- *“Toutes les infos sur ce patient”*

The assistant is instructed to answer with the full patient data from the DB in those cases. The same data is also returned if MiniMax is not configured or if the API fails (fallback = full patient summary from the database).

## Summary

| Before   | After    |
|----------|----------|
| OpenAI   | MiniMax  |
| `OPENAI_API_KEY` in `server/.env` | `MINIMAX_API_KEY` in `server/.env` |
| Same voice flow (STT → chat → TTS) | Unchanged |

No frontend or env changes are required besides using `MINIMAX_API_KEY` on the server.
