# NovaPrep - AI Interview Coach

A full-stack application for practicing interviews with AI-powered feedback, resume analysis, and voice interaction.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **AWS Account** (for voice features & AI model access) - [Sign up](https://aws.amazon.com/)

## AWS Configuration

If you plan to use real AI models and voice features, configure AWS credentials:

### Option 1: Using AWS CLI (Recommended)

1. Install AWS CLI: [Download](https://aws.amazon.com/cli/)

2. Configure your credentials:
```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your AWS access key
- **AWS Secret Access Key**: Your AWS secret key
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

3. Verify setup:
```bash
aws sts get-caller-identity
```

### Option 2: Manual Environment Variables

Create a `.env` file in the backend folder with:
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

### Demo Mode (No AWS Required)

Skip AWS setup by setting in `backend/.env`:
```env
USE_MOCK_AI=true
```

This uses mock responses for testing without AWS credentials.

## Quick Start Guide

### 1. Clone or Navigate to the Project

```bash
cd path/to/Codex
```

### 2. Set Up Environment Variables

#### Backend Setup
```bash
cd backend
copy .env.example .env
```

Edit `.env` and configure your AWS credentials and model settings:
- `NOVA_MODEL_ID` - AWS Bedrock model (required if `USE_MOCK_AI=false`)
- `NOVA_SONIC_MODEL_ID` - Voice model (e.g., `amazon.nova-2-sonic-v1:0`)
- `NOVA_SONIC_VOICE_ID` - Voice character (e.g., `matthew`)
- `USE_MOCK_AI` - Set to `true` for demo without AWS credentials

#### Frontend Setup
```bash
cd frontend
copy .env.example .env
```

### 3. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 4. Start the Application

#### Option A: Run in Separate Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

#### Option B: Run Both with Single Command (Windows PowerShell)

From the root directory:
```powershell
$backend = Start-Process -NoNewWindow -PassThru npm -ArgumentList run dev -WorkingDirectory ./backend
$frontend = Start-Process -NoNewWindow -PassThru npm -ArgumentList run dev -WorkingDirectory ./frontend
```

Or using this script in PowerShell:
```powershell
# Start both concurrently
npm --prefix backend run dev & npm --prefix frontend run dev
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

```
Codex/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── app.js       # Express app configuration
│   │   ├── index.js     # Server entry point
│   │   ├── controllers/ # Route handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API endpoints
│   │   └── middleware/  # Express middleware
│   └── package.json
│
└── frontend/            # React + Vite + Tailwind app
    ├── src/
    │   ├── App.jsx      # Main app component
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable components
    │   └── services/    # API clients
    └── package.json
```

## API Endpoints

### Interview Preparation
- `POST /api/generate-question` - Generate AI interview question
- `POST /api/evaluate-answer` - Evaluate user's answer
- `POST /api/final-summary` - Get session summary

### Resume & Context
- `POST /api/parse-resume` - Parse resume for personalized questions

### Voice Interaction (Optional)
- `POST /api/voice/transcribe` - Convert audio to text
- `POST /api/voice/speak` - Convert text to speech

## Features

✅ AI-powered interview questions  
✅ Real-time answer evaluation  
✅ Resume parsing for personalized questions  
✅ Voice mode with speech recognition & synthesis  
✅ Detailed feedback and improvement suggestions  
✅ Session summary with performance metrics  

## Development Notes

- **API Proxy**: Frontend proxies API calls to `http://localhost:4000` (configured in Vite)
- **Mock Mode**: Set `USE_MOCK_AI=true` to demo without AWS credentials
- **Database**: Currently uses in-memory storage (no persistence)
- **Browser Support**: Chrome/Edge recommended for voice features

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 4000 (backend)
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Kill process using port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
```

### AWS Credentials Issues
- Ensure AWS credentials are set in environment variables or `.env`
- Use `USE_MOCK_AI=true` to skip AWS authentication during development

## Build for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

---

**Happy interviewing! 🚀**
