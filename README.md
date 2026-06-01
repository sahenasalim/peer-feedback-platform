# Peer Feedback Platform

Peer Feedback Platform is a full-stack web app for anonymous teammate feedback in student group projects. Students review every teammate in an open feedback form, while the app stores submitter identity only for duplicate-prevention and never exposes it through student-facing views.

Admins can close a form and generate structured AI summaries for each student using Groq's OpenAI-compatible API. Students then see constructive summaries with sentiment, average rating, strengths, improvement areas, actionable advice, and a representative quote.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite
- Groq API via the `openai` npm package
- Zod validation
- react-hot-toast notifications

## Setup

```bash
cd smartsplitter
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open `https://peer-feedback-platform-fawn.vercel.app`.

Demo students:

- `alice@demo.com`
- `bob@demo.com`
- `carol@demo.com`
- `dave@demo.com`

Use the login page to continue as a student or admin. Students choose their name. Admins use the demo code `admin123`.

## Environment Variables

Create `.env.local` from `.env.local.example`:

```bash
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your-groq-api-key-from-console.groq.com"
```

To get a free Groq API key, go to `console.groq.com`, sign up, open API Keys, and create a new key.

## Architecture

The app uses Next.js server pages for the student and admin screens, with API route handlers for feedback submission and AI generation. Prisma manages local SQLite data, and the Groq integration is isolated in `lib/groq.ts` plus `/api/ai/summarize`.

```text
Student submits feedback
        |
        v
Stored anonymously for student views
        |
        v
Admin closes form
        |
        v
Admin triggers Groq AI
        |
        v
Summary shown to student
```

## Known Limitations

- SQLite is intended for local development; production Vercel deployments should move to a hosted database.
- AI summaries depend on Groq API availability and a valid `GROQ_API_KEY`.
- Future improvements could add instructor invites, richer rubric questions, exportable reports, and audit logs for admin activity.
