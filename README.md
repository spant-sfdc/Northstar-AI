# SkillSynq

AI-native career intelligence for tech professionals. By TechPulse Solutions.

## What it does

SkillSynq benchmarks your expertise against real market requirements for your target role, identifies exactly which skills to build, and generates a personalized week-by-week learning path — so every hour of learning moves your career forward.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui (radix-nova)
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL + Storage)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o
- **Payments**: Razorpay
- **Deployment**: Vercel

## Getting started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local .env.local   # fill in the values
# or create .env.local manually — see the file for required keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay dashboard → API Keys |
| `RAZORPAY_KEY_ID` | Razorpay dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay dashboard → Webhooks |
| `RAZORPAY_PLAN_PREMIUM` | Razorpay dashboard → Subscriptions → Plans |
| `RAZORPAY_PLAN_ADVANCED` | Razorpay dashboard → Subscriptions → Plans |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (local) / `https://skillsynq.co.in` (prod) |

**Rule**: Variables without `NEXT_PUBLIC_` prefix are server-only. Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `RAZORPAY_KEY_SECRET` to the client.

## Project structure

```
app/
├── (marketing)/        # Public landing page — no auth required
├── (auth)/             # Login, signup, callback — Phase 3
├── (dashboard)/        # Protected app routes — Phase 3
└── api/                # API route handlers — Phase 4+

components/
├── marketing/          # Landing page section components
└── ui/                 # shadcn primitives (auto-generated, don't edit)

lib/
└── utils.ts            # cn() utility

hooks/                  # Custom React hooks — Phase 3+
stores/                 # Zustand state stores — Phase 3+
types/                  # TypeScript type definitions — Phase 3+
```

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build (run before deploying)
npm run start   # Start production server locally
npm run lint    # ESLint
```

## Development phases

- **Phase 1** ✅ Project scaffold, dependencies, folder structure
- **Phase 2** ✅ Landing page — 9 sections, dashboard mock, brand system
- **Phase 3** 🔜 Authentication + onboarding wizard (Supabase Auth)
- **Phase 4** — AI readiness analysis + roadmap generation (OpenAI)
- **Phase 5** — Dashboard, milestones, progress tracking
- **Phase 6** — Razorpay billing (free + premium + advanced tiers)
