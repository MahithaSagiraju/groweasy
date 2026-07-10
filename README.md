# GrowEasy AI CSV Importer

An intelligent AI-powered CSV importer that converts CSV files from any source into GrowEasy CRM records using LLM-based field mapping.

## Features

- **AI-Powered Field Mapping** - Automatically maps CSV columns to CRM fields using Google Gemini AI
- **Multi-Source Support** - Handles CSVs from Facebook Leads, Google Ads, Excel, CRM exports, and more
- **Smart Data Extraction** - Extracts emails, phone numbers, names, and other fields from unstructured CSV data
- **Preview & Validate** - Client-side CSV parsing with preview table before import
- **Batch Processing** - Splits large CSVs into configurable batches for efficient AI processing
- **Retry Mechanism** - Automatic retry on transient AI failures
- **Dark Mode** - Full dark mode support
- **Responsive Design** - Works on desktop and mobile
- **Export Results** - Export imported records as JSON or download skipped records as CSV

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Dropzone
- PapaParse
- TanStack Table & Virtual

### Backend
- Node.js + Express
- TypeScript
- Multer
- PapaParse
- Zod
- Google Gemini AI SDK
- Pino (logging)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Google Gemini API key (or OpenAI API key)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd groweasy
```

2. Set up the backend:
```bash
cd backend
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm install
npm run dev
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Open http://localhost:3000 in your browser.

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `GEMINI_API_KEY` | Google Gemini API key | (required) |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MAX_FILE_SIZE_MB` | Max upload size | `50` |
| `BATCH_SIZE` | Records per AI batch | `10` |
| `MAX_RETRIES` | AI retry attempts | `3` |
| `RETRY_DELAY_MS` | Delay between retries | `1000` |

#### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001/api` |

## Usage

1. **Upload CSV** - Drag and drop or click to select a CSV file
2. **Preview** - Review parsed data, search across columns, verify column detection
3. **Confirm Import** - Click "Confirm Import" to start AI-powered processing
4. **View Results** - See imported records, skipped records with reasons
5. **Export** - Download imported records as JSON or skipped records as CSV

## API Endpoints

### `POST /api/upload`
Upload a CSV file. Returns parsed preview and metadata.

### `POST /api/import`
Process uploaded CSV data through AI. Returns imported and skipped records.

### `GET /api/import/:id/progress`
Get import progress status.

### `GET /api/health`
Health check endpoint.

## Docker

```bash
# Build and run with docker compose
GEMINI_API_KEY=your_key_here docker compose up --build

# Or run services individually
docker build -f Dockerfile.backend -t groweasy-backend .
docker build -f Dockerfile.frontend -t groweasy-frontend .
```

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo to Vercel
3. Set root directory to `frontend`
4. Add `NEXT_PUBLIC_API_URL` environment variable
5. Deploy

### Backend (Render)

1. Push to GitHub
2. Create new Web Service on Render
3. Connect repo
4. Set build command: `cd backend && npm ci && npm run build`
5. Set start command: `cd backend && node dist/index.js`
6. Add environment variables (GEMINI_API_KEY, CORS_ORIGIN, etc.)

## Testing

```bash
cd backend
npm test
```

## License

MIT
