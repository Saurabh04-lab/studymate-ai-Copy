# StudyMate AI

**An AI-powered study assistant that transforms notes into summaries, interactive quizzes, and flashcards.**

StudyMate AI helps students turn their study material into structured, interactive learning resources using generative AI.

**Live Demo:** https://studymate-ai-copy.vercel.app/

**Source Code:** https://github.com/Saurabh04-lab/studymate-ai-Copy

## Features

- **AI Summaries:** Convert study notes into concise, structured summaries.
- **Interactive Quizzes:** Generate multiple-choice questions with answer feedback, explanations, and scoring.
- **Flashcards:** Create question-and-answer cards with flipping and navigation controls.
- **Study History:** Access previously generated study material saved in the browser.
- **Copy and Download:** Copy or download generated study content.
- **Input Validation:** Validate requests and limit submitted notes to 15,000 characters.
- **Rate Limiting:** Protect the generation API using Upstash Redis, with a limit of 10 requests per IP address in a rolling 60-second window.
- **Responsive Interface:** Use the application on desktop and mobile-sized screens.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and API routes |
| React | Interactive user interface |
| Tailwind CSS | Styling and responsive layouts |
| Google Gemini API | AI-powered study content generation |
| `@google/genai` | Gemini API integration |
| Upstash Redis | Distributed rate-limit storage |
| `@upstash/ratelimit` | Server-side request rate limiting |
| Vercel | Application hosting and deployment |

## How It Works

1. Enter your study notes.
2. Select Summary, Quiz, or Flashcards.
3. Generate study material using the Gemini API.
4. Review, interact with, copy, or download the generated content.

The frontend sends generation requests to a Next.js API route. The server validates the input and checks the Upstash rate limit before making a request to Gemini.

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API key
- An Upstash Redis database with REST credentials

### 1. Clone the repository

```bash
git clone https://github.com/Saurabh04-lab/studymate-ai-Copy.git
cd studymate-ai-Copy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a file named `.env.local` in the project root and add your own credentials:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

Replace the placeholder values with your actual credentials. Do not commit `.env.local` or expose these secrets in frontend code.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On Windows PowerShell, use `npm.cmd` instead of `npm` if your execution policy blocks the npm PowerShell script.

## Project Structure

```text
studymate-ai-Copy/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── public/
├── .gitignore
├── package.json
└── README.md
```

- `app/page.js` — Main user interface and study interactions.
- `app/globals.css` — Global styling.
- `app/layout.js` — Root application layout and metadata.
- `app/api/generate/route.js` — Server-side content generation, input validation, Gemini integration, and rate limiting.

## Security and Reliability

- API credentials are read from server-side environment variables.
- Input validation rejects invalid requests and notes exceeding the configured length limit.
- The generation endpoint limits requests to 10 per IP address within a rolling 60-second window.
- Excess requests receive HTTP `429` responses with a `Retry-After` header.
- When the rate-limiting service is unavailable, the API returns HTTP `503` rather than bypassing rate limiting.
- Keep all API keys and database tokens private.

## Production Build

To run the available project checks:

```bash
npm run lint
npm run build
```

Configure the required environment variables in your deployment platform before using the production application.

## Future Improvements

Potential improvements include additional study modes, more flexible quiz settings, enhanced accessibility, and expanded study-progress tracking.

## License

No license has been specified yet. Contact the repository owner before reusing or redistributing this project.
