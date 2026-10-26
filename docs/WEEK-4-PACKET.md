# Week 4 · Build Discipline Packet — Marketing engine and homepage (`/marketing` and `/`)

> Written **before** touching code. The commit of this file precedes the commit of the
> feature's first file; the git history shows it.
>
> **Translated into English on October 26, 2026**, when the course required all Module 4 work
> in English. The plan is unchanged; where it said something that later changed because of that
> requirement, a note in *italics* says so. The original Spanish version is in the git history
> (`docs/SEMANA-4-PACKET.md`).

**This week's feature:** two things. A homepage that works as a product landing page —one that
says what ClosetAI is, who it is for, what it costs and why to believe it— and a public
`/marketing` page with the brand system, the target persona, the launch content and an A/B
tester that measures headlines with real visits.

**Brand decisions made by Tamara on October 21, 2026:**

1. **A/B headline:** the current one, "Your stylist, in your pocket.", against "You already have
   something to wear.", which comes from what the person interviewed in Week 2 said. The question
   is whether a real customer's words beat brand language.
   *(The interview was held in Spanish; both headlines were in Spanish until October 26. Translating
   them changed the stimulus, so the experiment was restarted under a new id, `headline`.)*
2. **Target persona:** a woman aged 24 to 30 in Mexico City. It is a **hypothesis**: it falls
   inside the 18–35 core and the verified AMVO data, but nobody with that profile has been
   interviewed yet, and the page says so.
3. **Channels:** Instagram and TikTok.
4. **Content:** the agent drafts the 10 posts, the 3 scripts and the calendar using only facts
   already verified; **Tamara approves them before they are published**. The page says they were
   drafted with AI and approved by a person. There is also a generator for new posts, labelled as
   AI and "not reviewed" until someone approves it.

---

## 🧩 Problem

ClosetAI's homepage says one nice sentence and little more. Someone who lands there doesn't know
within ten seconds **what problem it solves**, what it costs, or why to trust an app they don't
know. And everything built over three weeks —the research with sources, the pricing simulator,
the privacy work— doesn't appear on it.

On top of that, ClosetAI has nothing to go out and find anyone with: there is no written brand
voice, no defined audience, not a single post. And the current headline was chosen by taste; it
was never measured against anything else.

## 👤 User

1. **The homepage visitor** — arrives from a post or a link and decides in seconds whether to
   stay. She is the target persona: a woman aged 24 to 30, Mexico City.
2. **Tamara, the founder** — needs content ready to publish and an honest way to know which
   headline works better.
3. **Whoever evaluates ClosetAI** — needs to see that the marketing only says what the product
   does.

## 🎯 Success (what must work by the end of the week)

- The homepage explains on one screen what it is, who it is for and what it costs, with proof
  that it works (the research with sources) and a clear path to start.
- The homepage headline is a **real experiment**: each visitor sees one of two versions, always
  the same one, and views and clicks are measured.
- `/marketing` loads without an account and shows: brand system, persona, landing copy,
  10 posts, 3 video scripts, a 14-day calendar, the A/B results and the saved assets.
- Every piece can be copied, and the posts, scripts and calendar can be exported.
- The generator creates a new post with AI, validates it and saves it labelled "not reviewed".
- 2 A/B tests + 3 software tests, run against production.

## 🖼️ UX concept

Wireframe in `docs/evidencia/mockups/10-marketing-wireframe.png`. Gemini image generation still
can't be used —it has no free tier and billing is not active— so, as in Week 3, the UX concept is
the wireframe.

- **The homepage reads top to bottom as an argument:** what it is → the problem in a customer's
  words → how it works in three steps → proof (data with sources) → price → privacy → start.
- **`/marketing` is a workbench, not a brochure:** each piece in a card with its channel, its
  status (approved or not reviewed) and its copy and export buttons.
- **The A/B results say "no winner yet"** until there is enough data, instead of showing a
  percentage that looks like a decision and is noise.

## ✂️ Scope cut

| Out | Why |
|---|---|
| Publishing to Instagram and TikTok from the page | Requires business accounts and APIs with review; the copy button solves the same thing this week |
| Generated images for the posts | Image generation has no free tier |
| Editing the content from the page | Tamara approves the texts; a public editor would be a door to changing them |
| Declaring an A/B winner this week | Current traffic can't reach a sufficient sample; the method is published, not a fake winner |
| Third-party analytics tool | A table of our own is enough to count views and clicks, and sends nobody's data to another company |
| Touching `proxy.ts` to assign the variant | The session lives there, and it already broke once in production. The variant is chosen on the server and the browser remembers it |

## 🧱 Specification and acceptance criteria

| # | Requirement | Acceptance criterion (testable) |
|---|---|---|
| 1 | Improved homepage | `/` shows, in order: headline, problem, how it works (3 steps), proof with a source, price, privacy and a call to start |
| 2 | A/B headline | Each visitor sees **one** of the two variants, and the same one on reload |
| 3 | Honest measurement | **One view and one click per visitor** are counted, not per reload. Automated test traffic is not counted |
| 4 | Public page | `GET /marketing` answers 200 without a session |
| 5 | Brand system | Name, colors with their code, typefaces, voice (do and don't) and the known brand risk |
| 6 | Persona | A profile with every trait marked as **data** (with a source) or **hypothesis** |
| 7 | Landing copy | The homepage text, with a copy button |
| 8 | 10 posts | 10 cards with channel and format; each one can be copied; all can be exported |
| 9 | 3 scripts | 3 short video scripts with duration and shots; they can be copied and exported |
| 10 | 14-day calendar | 14 days, each with a channel and the piece published; exported as CSV |
| 11 | A/B results | Views, clicks and conversion per variant; **no winner** if the sample is too small or the difference isn't significant |
| 12 | Generator | Creates a post with AI from a topic; **rejects** a post that invents figures; saved as "generated with AI, not reviewed" |
| 13 | Saved assets | The list shows what was saved with its origin and status |

## 🏗️ Architecture

```
Browser (/ and /marketing — no session)
   │
   ├── /  (Server Component, dynamic)
   │      reads the `cai_visitante` cookie; if missing, creates a random id
   │      variant = hash(id + experiment) mod 2   ← pure function, tested
   │      └── <Experimento> (client): stores the cookie, records the view,
   │                                  records the click on "Start"
   │
   ├── /marketing (Server Component)
   │      reads brand, persona, content and A/B results from Postgres
   │      └── cards with copy / export (client, no server)
   │      └── generator → Server Action → Gemini → zod contract
   │                         + rejection of invented figures → save
   ▼
Supabase Postgres
   ├── marketing_assets   (posts, scripts, calendar days; public read)
   ├── ab_experiments     (the experiments and their variants; public read)
   └── ab_events          (one view and one click per visitor; SERVER ONLY)
```

**Why the variant is not chosen in `proxy.ts`:** it would be the natural place to set the cookie,
but that file is the one that refreshes the session, and in Week 0 a change there made the session
drop on its own in production with every test green. The cost of the alternative is lower: the
first visit chooses the variant on the server and the browser stores the cookie.

**Why one view per visitor:** if reloads were counted, a single person reloading ten times would
move the result. The unit of the experiment is the person.

**Privacy:** `ab_events` stores a hash of the random id, never the IP, and it can't be read with
the public key. It is the rule left over from Week 3: a table is opened only if all its columns are
public.

## 🧰 Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Already in use |
| A/B assignment | FNV-1a hash in `src/lib/ab.ts` | Deterministic, no dependencies, tested in milliseconds |
| Significance | Two-proportion z-test, in the same file | The standard test for comparing two conversion rates; 30 lines, no library |
| Export | `Blob` in the browser | A CSV doesn't need a server |
| Generator | Gemini 3.5 Flash, with Flash-Lite fallback | Already integrated, with Week 2's overload handling |
| Database | Supabase Postgres + RLS | Already in use |
| Tests | Vitest + Playwright | Already in use |

## ⚙️ DevOps

- **GitHub:** `vestiamx-code/closetai`, branch `main`, CI green on every commit.
- **Vercel:** automatic deploy on every push; at least 2 this week.
- **Supabase:** migration `20261021000010_marketing.sql` (tables and experiments) and
  `20261021000011_marketing_contenido.sql` (the content, **after** Tamara approves it).
  Both are applied only with her explicit permission and verified through REST.
- **Environment variables:** none new.
- **Rollback:** the new homepage is a single commit; reverting it brings back the previous one.

## 🧪 Test plan

**2 A/B tests** (Vitest, on `src/lib/ab.ts`):

1. **Assignment is stable and even:** the same visitor always gets the same variant, and across
   10,000 random visitors each variant lands between 48% and 52%.
2. **No fake winner is declared:** with fewer than 100 visitors per variant, or with a difference
   that isn't significant at 95%, the result is "no winner". With a large difference and enough
   sample, there is one, and it is the right variant.

**3 software tests** (Playwright, against production):

3. `/marketing` loads without a session with 10 posts, 3 scripts and 14 calendar days.
4. Exporting the calendar downloads a CSV with 14 rows and its header; copying a post puts its
   text on the clipboard.
5. The homepage shows **exactly one** of the two headlines, the same one on reload, and a test
   visit is **not** counted in the results.

Plus: the generator rejects a post with a figure that isn't in the verified facts (unit test),
and the homepage has the seven sections in order (e2e).

**Every new test is seen failing on purpose before it is trusted.**

## 🤖 Prompt to the coding agent

*Translated. The original was written in Spanish and asked for a Mexican Spanish interface; on
October 26 the course required English and that rule was replaced.*

```
Build Week 4 of ClosetAI (Next.js 16, App Router, Tailwind v4, Supabase).

EXACT SCOPE, nothing more:
1. src/lib/ab.ts — pure functions: varianteDe(visitor, experiment) with an FNV-1a hash
   mod 2, and resultado(a, b) with a two-proportion z-test: no winner if either variant
   has fewer than 100 visitors or p ≥ 0.05.
2. Homepage (/): A/B headline, problem, how it works in 3 steps, proof with a source,
   price, privacy and a call to start. The variant is chosen on the server from the
   cai_visitante cookie; DO NOT touch src/proxy.ts.
3. Server Action registrarEvento: one view and one click per visitor (unique), hash of
   the id, ignores traffic marked as a test.
4. /marketing: brand, persona (data vs hypothesis), landing copy, 10 posts, 3 scripts,
   14-day calendar, A/B results, generator and saved assets. Copy and export buttons
   (md and csv) in the browser.
5. Generator: Gemini with fallback; zod contract; rejects figures that aren't in the list
   of verified facts; saves with origin 'generado_ia' and aprobado = false.
6. Migrations 010 (tables, experiments) and 011 (approved content).

RULES:
- Interface in Mexican Spanish.          ← replaced on Oct 26: interface in English
- No fact that isn't in docs/evidencia/INVESTIGACION-SEMANA-2.md, the Master Document
  §2.3 or the pricing_assumptions table.
- Don't use the interview quote in social content: the permission was for the research
  page and the document, not for advertising.
- Tests: 2 A/B and 3 software; see them fail before trusting them.
```

That last-but-one rule wasn't among the decisions: the agent added it while drafting the plan. The
Week 2 consent was given to use the interview without a name "on the website and in the PDF". A
social media campaign is a different use, and nobody asked.

## ✅ Rubric criteria covered

| Week requirement | Where it lives |
|---|---|
| Improved homepage | closetai.lat |
| Brand system | `/marketing` |
| Target persona | `/marketing`, with data vs hypothesis |
| Landing copy | The homepage, and in `/marketing` with a copy button |
| 10 social posts | `/marketing`, `marketing_assets` table |
| 3 video scripts | `/marketing` |
| 14-day calendar | `/marketing`, exportable as CSV |
| A/B headline test | The homepage measures; `/marketing` shows |
| Saved assets | `marketing_assets` and the public list |
| 2 A/B tests + 3 software tests | Test plan, above |
| Commits, deploys, prompts | At least 5, 2 and 5 |
| Iteration and decision note | `ITERATION_LOG.md` and `DECISION_NOTES.md` |
| 2–3 minute video | Recorded against production, narrated by Tamara |
