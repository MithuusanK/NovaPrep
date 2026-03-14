# NovaPrep Backend

Express API for interview question generation, answer evaluation, and final session summary.

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

- `POST /api/generate-question`
- `POST /api/evaluate-answer`
- `POST /api/final-summary`

## Notes

- Set `USE_MOCK_AI=true` in `.env` if you want to demo without AWS credentials.
- When `USE_MOCK_AI=false`, the app calls Amazon Bedrock with the model in `NOVA_MODEL_ID`.
