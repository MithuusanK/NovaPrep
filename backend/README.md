# NovaPrep Backend

Express API for interview question generation, answer evaluation, and final session summary.
Includes optional resume parsing to personalize interview questions and feedback.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Start development server:

```bash
npm run dev
```

Server runs on `http://localhost:4000` by default.

## Required Routes

- `POST /api/parse-resume`
- `POST /api/generate-question`
- `POST /api/evaluate-answer`
- `POST /api/final-summary`

## Voice Routes (Nova Sonic)

- `POST /api/voice/transcribe` with `{ "audioBase64": "..." }`
- `POST /api/voice/speak` with `{ "text": "..." }`

## Notes

- Set `USE_MOCK_AI=true` in `.env` if you want to demo without AWS credentials.
- When `USE_MOCK_AI=false`, the app calls Amazon Bedrock with the model in `NOVA_MODEL_ID`.
- Voice routes use `NOVA_SONIC_MODEL_ID` (recommended: `amazon.nova-2-sonic-v1:0`).
- `NOVA_SONIC_VOICE_ID` is required for reliable output. Start with `matthew`.
- Resume parsing supports:
  - `resumeText` in JSON body, or
  - multipart form-data upload field `resumeFile` (`.pdf` or `.txt`)
