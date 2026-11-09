# Week 6 · Build Discipline Packet — Integrated Agentic Venture + Impact & Viability (`/demo`)

> Written **before** touching code. The commit of this file precedes the commit of the
> week's first code file; the git history shows it.

**This week's goal:** turn six weeks of separate modules into one venture site that a stranger can
walk through from start to finish, and prove three things with evidence: it **works** (a
full-site regression test against production), it **creates value** (five real external users and
real usage numbers), and it **avoids obvious harm** (an impact check that names each risk and the
guardrail that answers it).

**Decisions made by Tamara on November 9, 2026:**

1. **External users:** five in total. The three Week 5 testers count, and Tamara recruits **two
   new people** who test the **whole site** (not only `/chat`) on their own phones and leave a
   written summary. Nobody is invented; a missing tester is reported as missing.
2. **`/dashboard` is public and shows totals only.** Graders can't sign in to Tamara's account.
   It reads real records from Supabase across every module; no names, emails, photos or messages;
   test traffic excluded.
3. **`/demo` becomes the guided walkthrough.** The Week 0 video (Spanish narration) moves to
   `/demo/week-0`; the weekly demos stay at `/demo/week-1` … `/demo/week-5`.
4. **Language:** everything in English, as since Week 4.

---

## 🧩 Problem

ClosetAI was built one module a week: the app (Week 0), `/product` (1), `/research` (2), `/core`
and `/pricing` (3), `/marketing` (4), `/chat` (5). Each works, but they are **islands**: every
public page only links back to the homepage, nothing shows what the product has done in total,
the prompts and logs live in a GitHub folder few people open, and there is no single place that
answers "does this create value, and could it hurt someone?". A grader, an investor or a new user
can't see the venture as one thing.

## 👤 User

1. **The evaluator / visitor** — opens `closetai.lat/demo` with no account and needs to
   understand and try the whole product in about ten minutes.
2. **The two new external testers** — real people who follow the walkthrough on their own phone
   and say what worked and what didn't.
3. **Tamara, the founder** — needs one dashboard to see whether the product is used and what it
   costs, and a V2 roadmap based on evidence, not wishes.

## 🎯 Success (what must work by the end of the week)

- Every public page shares one navigation (desktop and phone) that reaches every module.
- `/dashboard` shows live totals from Supabase for every module, without test traffic.
- `/docs` shows the prompt library (every production prompt, its version and its guardrail) and
  the build log of the six weeks.
- `/demo` is a guided walkthrough: steps with live links, the agent map, the testing summary, the
  practical impact check and the Version 2 roadmap, plus the 5-minute video.
- Two new testers complete the full-site test (`/demo?test=4`, `?test=5`); with Week 5's three,
  **five external users in total**, shown on `/demo`.
- A full-site regression test passes against production, and at least one bug found by testing
  is fixed and redeployed.

## 🖼️ UX concept

Wireframe in `docs/evidencia/mockups/12-demo-wireframe.png` (HTML source next to it). Image
generation still has no free tier, so, as in Weeks 3–5, the UX concept is a wireframe built from
the course's UX prompt: input, agent output, saved results and testing evidence on one page.

- **`/demo` reads top to bottom like a tour:** a one-line pitch, then numbered steps ("1. Ask the
  stylist without an account → open /chat"), each with what to notice. A visitor never has to
  guess where to click next.
- **The agent map is a picture, not a paragraph:** one box per AI agent with its input, its
  model, its output, its guardrail and where a human steps in.
- **Evidence sits next to the claim:** the testing summary shows the five testers' scores and
  quotes; the impact check pairs each risk with its guardrail and the test that proves it.
- **Navigation:** a slim header with the logo and the modules; on a phone it collapses into a
  "Menu" button, because ten links don't fit on one line.

## ✂️ Scope cut

| Out | Why |
|---|---|
| Private per-user dashboard with individual records | Decision 2: graders can't sign in; `/admin` already covers Tamara's review list |
| Charts library for `/dashboard` | Totals and simple bars in CSS are enough; a new dependency adds weight and risk in the last week |
| Rendering every Markdown log inside `/docs` | It would need a Markdown parser; `/docs` shows the prompt library and the build timeline, and links each full log on GitHub |
| New AI features (e.g. outfit images, memory in `/chat`) | Week 6 is integration and proof, not new features; they go to the V2 roadmap |
| A sixth or seventh tester | Five is the requirement; quality of two full-site sessions beats quantity |
| Translating the Week 0 video | It is kept as history at `/demo/week-0`, labelled as Spanish; the new 5-minute video is in English |
| Real-time dashboard updates | The page reads fresh data on every visit; live sockets are unnecessary |

## 🧱 Specification and acceptance criteria

| # | Requirement | Acceptance criterion (testable) |
|---|---|---|
| 1 | Full navigation | Every public page (`/`, `/product`, `/research`, `/core`, `/pricing`, `/marketing`, `/chat`, `/dashboard`, `/docs`, `/demo`, `/privacy`) has the same header with links to all modules and "Sign in"; on a 375 px phone it collapses into a Menu and nothing overflows horizontally |
| 2 | `/dashboard` shows records | `GET /dashboard` answers 200 without a session and shows real totals per module (closet, stylist, try-on, research, core, marketing/A-B, chat, costs) read from Supabase on each visit; rows marked as test traffic are excluded; no personal data on the page |
| 3 | `/docs` prompt library + build logs | Lists every production prompt (≥ 8) with purpose, version, model and guardrail, its full text expandable; a build timeline Week 0–6 with each week's feature, route and packet link; links to the full logs on GitHub |
| 4 | `/demo` guided walkthrough | `GET /demo` answers 200 without a session; ≥ 6 numbered steps, each linking a live route that answers 200; the 5-minute video plays |
| 5 | Agent map | `/demo` shows every AI agent in production with input → model → output, its guardrail and its human checkpoint; the agents listed match the prompts in `/docs` |
| 6 | 5 external users | `/demo?test=4` and `?test=5` ask for consent, show the full-site checklist and save a summary (pages tried, what worked, what confused, score 1–5, would use it); `/demo` shows the five testers (3 from Week 5 + 2) and never shows a tester who didn't happen |
| 7 | Practical impact check | `/demo` lists the value (who benefits and the measured evidence) and each risk with its guardrail and the test that covers it |
| 8 | Version 2 roadmap | `/demo` lists V2 items, each tied to the evidence that motivated it (a tester comment, a metric or a limit found) |
| 9 | Full-site regression | `e2e/sitio.spec.ts` visits every public route on production (status, heading, navigation, no horizontal overflow on a phone, no console errors) and every private route redirects to sign-in; the full suite runs against `https://closetai.lat` |
| 10 | Old video kept | `/demo/week-0` plays the Week 0 video |

## 🏗️ Architecture

```
Browser (no session)
   │
   ├── <SitioNav> (shared header, every public page)
   │      desktop: inline links · phone: <details> "Menu" (no JavaScript needed)
   │
   ├── /dashboard (Server Component, force-dynamic)
   │      lib/tablero.ts → service-role client, head-only COUNT queries
   │        garments · outfits · feedback_events · tryon_renders · research_* ·
   │        core_outputs · marketing_assets · ab_events · chat_sessions (es_prueba = false) ·
   │        chat_ratings · api_costs (sum, by operation)
   │      → only numbers reach the browser
   │
   ├── /docs (Server Component, static)
   │      imports the prompt constants + versions from src/lib/ai/prompts/*
   │      (the page shows the exact text production uses, it can't drift)
   │      + lib/bitacora.ts: the build timeline Week 0–6
   │
   ├── /demo (Server Component, force-dynamic)
   │      steps · agent map (lib/agentes.ts) · testing summary · impact check · V2 roadmap
   │      reads tester summaries: chat_test_summaries (1–3) + site_test_summaries (4–5)
   │      └── <PruebaSitio> (client) when ?test=4|5: consent → checklist → summary
   │             └── Server Action guardarPruebaSitio → zod → insert
   │
   └── /demo/week-0  (the Week 0 video, moved)
   ▼
Supabase Postgres (RLS on, no public policies: server only)
   └── NEW site_test_summaries (tester 4–5 unique, consent, pages_tried[], worked,
                                confusing, score 1–5, would_use, es_prueba, created_at)
```

**One source of truth for agents.** `lib/agentes.ts` describes each agent once (name, prompt,
model, input, output, guardrail, human checkpoint); `/demo` draws the map from it and `/docs`
lists the prompts from the same imports, so the map can't name an agent that doesn't exist.

**Privacy.** The dashboard only ever selects counts; tester summaries hold no names (tester
number only) and need consent before anything is saved, as in Week 5.

## 🧰 Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router, Server Components, Server Actions | Already in use; the service key never reaches the browser |
| Styling | Tailwind v4 | Already in use; the bars in `/dashboard` are plain CSS widths, no chart library |
| Database | Supabase Postgres + RLS | All module data already lives there; one new table |
| Validation | zod | Same contract style as every other form |
| Tests | Vitest (pure logic) + Playwright against production | The course rule from Week 3: green locally doesn't prove the live site |
| Hosting | Vercel + `closetai.lat` | Already in use; every push to `main` deploys |
| AI | No new model calls | Week 6 integrates; it shows the existing agents (Gemini Flash-Lite / Flash, fal.ai try-on) |
| Video | Screen recording + Tamara's narration, synced with faster-whisper + ffmpeg | The Week 5 pipeline, now for 5 minutes |

All free tiers; no new paid API.

## ⚙️ DevOps

- **GitHub:** `vestiamx-code/closetai`, small commits in English (≥ 5 this week), this packet
  committed first.
- **Vercel:** every push to `main` deploys to `closetai.lat` (≥ 2 deployments this week);
  deployments listed in the submission from `vercel ls`.
- **Supabase:** migration `20261109000016_site_tests.sql`, applied **only with Tamara's
  permission**, verified afterwards through REST (the public key gets 401).
- **Env variables:** none new. `SUPABASE_SERVICE_ROLE_KEY` (already in Vercel) reads the totals.
- **Plan:** packet → navigation → `/docs` → `/dashboard` → `/demo` + agent map → migration →
  tester flow → regression test → testers → fixes → video → submission document.

## 🧪 Test plan

| Test | How | Proves |
|---|---|---|
| Unit: dashboard maths | Vitest on `lib/tablero.ts` (percentages, zero data, test rows excluded) | The numbers can't lie with empty tables |
| Unit: tester summary contract | Vitest on the zod schema (tester 4–5 only, score 1–5, consent required) | Bad input is rejected before the database |
| Unit: agent map ↔ prompts | Vitest: every agent in `lib/agentes.ts` points to a prompt that exists in `/docs`, and vice versa | The map matches production |
| E2E: full-site regression | `e2e/sitio.spec.ts` on production, desktop and phone | Every page loads, navigates, fits a phone, no console errors; private routes protected |
| E2E: the tester flow | `?test=4` with the test header: consent → summary saved marked as test, not shown publicly | The flow works without polluting the evidence |
| E2E: whole suite | `npm run test:e2e:prod` (all weeks) | Week 6 broke nothing from Weeks 0–5 |
| External users | 2 new testers, own phones, full-site checklist (+ Week 5's 3) | Real people find what tests don't |

## 🤖 Prompt to the coding agent (Claude Code)

```
ROLE: You are my disciplined AI-native product architect and coding partner.
CONTEXT: ClosetAI (Next.js 16 App Router, Tailwind v4, Supabase with RLS, Vercel), repo
~/closetai. Read docs/WEEK-6-PACKET.md first; implement ONLY its agreed scope.
TASK, in this order, one small commit each:
1. A shared public header <SitioNav> on every public page: links to Product, Research, Core,
   Pricing, Marketing, Chat, Dashboard, Docs, Demo and Sign in; on phones a <details> Menu.
   No horizontal overflow at 375 px.
2. /docs: prompt library built by importing the real prompt constants and versions from
   src/lib/ai/prompts/*, and a Week 0–6 build timeline with links to each packet on GitHub.
3. /dashboard: public, force-dynamic; lib/tablero.ts runs head-only count queries with the
   service-role client and returns numbers only; exclude es_prueba rows; unit-test the maths.
4. /demo: guided walkthrough (≥ 6 steps with live links), agent map from lib/agentes.ts,
   testing summary (Week 5 testers 1–3 + site testers 4–5), practical impact check, V2 roadmap,
   video. Move the Week 0 video to /demo/week-0.
5. Migration site_test_summaries (RLS on, no public policies). Do NOT apply it: ask me.
6. ?test=4|5 flow: consent → checklist → summary, zod-validated Server Action.
7. e2e/sitio.spec.ts: full-site regression against production.
CONSTRAINTS: free tools only; no new dependencies; English UI; no personal data on public
pages; never show a tester who didn't happen; tests must assert real outcomes.
DONE WHEN: every acceptance criterion in the packet passes against https://closetai.lat.
```

## ✅ Rubric criteria covered

| Rubric criterion | Where |
|---|---|
| Build discipline before coding | This packet, committed before any Week 6 code |
| UX planning + mockup | Wireframe `12-demo-wireframe.png`, UX concept above, scope cut |
| Product spec + acceptance criteria | Table of 10 testable criteria |
| Architecture + stack | Diagram and stack table above |
| Working deployed product | `https://closetai.lat/demo`, `/dashboard`, `/docs` |
| Coding/build evidence | ≥ 5 commits, ≥ 2 deployments, prompt log entries |
| Testing and iteration | 5 external users + full-site regression + the iteration log |
| Human judgment | Decision note (150–250 words) |
| Demo clarity | 5-minute narrated video at `/demo` |
