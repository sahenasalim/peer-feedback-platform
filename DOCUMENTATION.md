# Peer Feedback Platform — Documentation

**Shortcut Asia Internship Challenge 2026**
**Built by:** Sahena Salim
**Live app:** https://peer-feedback-platform-fawn.vercel.app
**GitHub:** https://github.com/sahenasalim/peer-feedback-platform

---

## 1. How I planned and approached the app

When I read the brief for the Peer Feedback Platform, the two required features were anonymous feedback forms and a feedback summary view. Most submissions would stop there. I asked myself: what does a feedback platform actually need to feel complete and trustworthy?

Three things stood out - security (students need to trust their feedback is truly anonymous), structure (feedback needs to be meaningful, not just free text), and insight (raw feedback is hard to act on; a summary is far more useful).

I started by designing the database schema before writing any code. Getting the data model right meant I could reason clearly about every feature: how anonymity is enforced, how submissions are validated, how AI summaries connect back to students. Once the schema was solid, building the API routes and UI was straightforward.

I built in this order:
1. Database schema and migrations
2. Seed data for realistic testing
3. API routes with full validation
4. Admin panel for managing groups and forms
5. Student dashboard and feedback form
6. AI summarization with Groq
7. Authentication with bcrypt and role-based access
8. Welcome email via Resend
9. UI polish and deployment

---

## 2. Why I chose these tools

**Next.js 14 (App Router)**
Next.js gave me server components, API routes, and client components in one framework. Server components meant the dashboard and admin panel fetch data directly on the server - no loading spinners, no client-side fetch calls, no extra API round trips. This kept the codebase simple and fast.

**TypeScript**
TypeScript caught bugs before runtime. Combined with Prisma's generated client, every database query returned a fully typed object - I could never accidentally access a field that didn't exist.

**Prisma ORM**
Writing raw SQL for complex queries with joins, transactions, and nested includes would have been slow and error-prone. Prisma gave me a type-safe query builder that matched my schema exactly. The migration system also meant I could evolve the schema safely without manual SQL.

**Zod**
I centralised all input validation in one file - `lib/validators.ts`. Every API route imports the schema it needs and runs `safeParse` before touching the database. This means malformed or malicious requests are rejected immediately, before any business logic runs.

**Groq (LLaMA 3.3 70B)**
I chose Groq over OpenAI for three reasons - a generous free tier, significantly faster inference through their custom LPU hardware, and an OpenAI-compatible API. I used the OpenAI SDK with a single `baseURL` override, so switching to OpenAI in future would be a one-line change.

**Resend**
Email was a natural fit for a platform where admins register students manually. Instead of telling students their credentials out of band, the system emails them automatically. Resend has a clean API, a free tier, and excellent TypeScript support.

**PostgreSQL on Neon**
SQLite works locally but not on serverless platforms like Vercel. Neon provides a free serverless PostgreSQL database with a connection pooler — exactly what a Next.js app on Vercel needs.

---

## 3. Main technical decisions and reasoning

**Anonymity enforced at the API level**

The most important design decision was where to enforce anonymity. A naive approach would be to simply not show the submitter's name in the UI. But that means the data is in the API response - a developer could inspect network requests and see who said what.

My approach: `submittedByUserId` is stored in the database (needed to prevent double submission) but is never included in any API response that students can access. The comment `// ANONYMITY: submittedByUserId is write-only for students` marks this intentional decision in the code.

**Exact target matching**

The feedback submission route checks that submissions cover every teammate exactly once - not skipping anyone, not including outsiders, not reviewing yourself. Both the expected and submitted target ID arrays are sorted before comparison so order doesn't affect correctness. This prevents partial submissions and data inconsistency.

**Atomic transactions for feedback**

All feedback entries for a submission are saved in a single `prisma.$transaction`. If saving the third entry fails, the first two are rolled back automatically. The database never ends up in a half-submitted state.

**AI response validation and clamping**

Groq returns JSON, but AI output can't be fully trusted. I wrote a `parseSummary()` function that validates every field, clamps `sentimentScore` to `[-1, 1]`, and limits `actionableAdvice` to 3 items. If the AI returns unexpected output, the function throws — and the catch block saves a `FAILED` status to the database so the UI can show a retry button instead of crashing.

**Upsert for AI summaries**

Using `prisma.aISummary.upsert` instead of `create` means the admin can regenerate summaries without creating duplicate records. One student always has at most one summary per form.

**force-dynamic on server pages**

Next.js caches server component renders by default. I added `export const dynamic = "force-dynamic"` to the admin and dashboard pages so they always fetch fresh data from the database — critical for a platform where data changes frequently.

---

## 4. Flowcharts

### Feedback submission flow

```
Student logs in
        │
        ▼
Opens feedback form
        │
        ▼
Fills rating + strengths + improvements per teammate
        │
        ▼
Frontend: isComplete() check ──── Incomplete ──→ Show error toast
        │
      Complete
        │
        ▼
POST /api/feedback
        │
        ├─ Zod validation failed? ──→ 400 Bad Request
        ├─ Form not found? ──────────→ 404 Not Found
        ├─ Form closed? ─────────────→ 400 Bad Request
        ├─ Not a group member? ──────→ 403 Forbidden
        ├─ Wrong targets? ───────────→ 400 Bad Request
        ├─ Already submitted? ───────→ 409 Conflict
        │
      All checks pass
        │
        ▼
prisma.$transaction — save all entries atomically
        │
        ▼
201 Created → Redirect to dashboard
```

### AI summary generation flow

```
Admin clicks "Generate summary"
        │
        ▼
POST /api/ai/summarize
        │
        ├─ Form not found? ──────────→ 404
        ├─ Student not in group? ────→ 400
        ├─ No feedback yet? ─────────→ 400
        │
      Proceed
        │
        ▼
Fetch all feedback submissions for student
        │
        ▼
Build structured prompt with feedback data
        │
        ▼
Send to Groq (LLaMA 3.3 70B) — JSON mode forced
        │
        ├─ Groq fails? ──────────────→ Save FAILED status → Retry button shown
        │
      Success
        │
        ▼
parseSummary() — validate + clamp + limit fields
        │
        ▼
prisma.aISummary.upsert — create or update
        │
        ▼
Student sees summary on dashboard
```

---

## 5. Technical architecture overview

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│         React (Next.js client components)           │
│   FeedbackForm / SummaryCard / AdminGroupManager    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│              Next.js Server (Vercel)                │
│                                                     │
│  Server Components    │    API Routes               │
│  /admin               │    /api/auth/login          │
│  /dashboard           │    /api/feedback            │
│  /feedback/[formId]   │    /api/ai/summarize        │
│                       │    /api/forms               │
│                       │    /api/groups              │
│                       │    /api/register            │
└──────┬────────────────┴──────────┬──────────────────┘
       │ Prisma ORM                │
┌──────▼──────────┐    ┌──────────▼──────────────────┐
│  PostgreSQL DB  │    │     External Services        │
│  (Neon)         │    │                             │
│                 │    │  Groq API (LLaMA 3.3 70B)   │
│  Users          │    │  → AI summary generation    │
│  Groups         │    │                             │
│  GroupMembers   │    │  Resend Email API           │
│  FeedbackForms  │    │  → Welcome emails           │
│  Submissions    │    └─────────────────────────────┘
│  AISummaries    │
└─────────────────┘
```

---

## 6. Challenges and how I handled them

**Challenge: Keeping feedback truly anonymous**
The naive solution — just don't show the name in the UI — isn't good enough. I stored `submittedByUserId` in the database for duplicate prevention but excluded it from all student-facing API responses. Anonymity is an architectural property, not a UI trick.

**Challenge: Trusting AI output**
AI responses can be malformed, incomplete, or have values outside expected ranges. I wrote a validation and clamping layer that checks every field before saving — and gracefully saves a `FAILED` status if anything goes wrong, so the UI always has something to show.

**Challenge: Stale data on server-rendered pages**
Next.js caches server component renders by default. The admin panel was showing 0 reviews even after students submitted because the page was cached. I added `export const dynamic = "force-dynamic"` to force a fresh database query on every visit.

**Challenge: Database compatibility on Vercel**
SQLite doesn't work on serverless platforms because there's no persistent file system. I migrated to PostgreSQL on Neon and updated the Prisma schema — a one-line provider change, one migration, and it worked.

---

## 7. What I'd improve with more time

- **Password reset via email** — students should be able to reset their own password without admin intervention
- **Proper session management** — replace sessionStorage with NextAuth server-side sessions and JWT tokens
- **Bulk student import** — admins shouldn't have to add 30 students one by one; a CSV upload would solve this
- **Custom feedback questions** — different groups might need different questions; a form builder would make this flexible
- **Analytics dashboard** — charts showing sentiment trends across multiple feedback rounds would give admins better insight
- **Rate limiting** — protect API routes from abuse in production

---

## 8. How to run the app

See the README for full setup instructions. Quick start:

```bash
git clone https://github.com/sahenasalim/peer-feedback-platform.git
cd peer-feedback-platform
npm install
cp .env.example .env.local   # fill in your keys
npx prisma migrate dev
npm run seed
npm run dev
```

Or visit the live app directly: **https://peer-feedback-platform-fawn.vercel.app**

Demo credentials — Student: `alice@demo.com` / `alice123` | Admin: `admin@demo.com` / `admin123`
