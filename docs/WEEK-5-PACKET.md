# Week 5 · Build Discipline Packet — Public chatbot / guided assistant (`/chat`)

> Written **before** touching code. The commit of this file precedes the commit of the
> feature's first file; the git history shows it.

**This week's feature:** a public page, `/chat`, where anyone can ask ClosetAI "what should I
wear?" without an account. Three guided questions, an outfit suggestion with the reason it works,
a guardrail for what a stylist must not answer, a human checkpoint, a rating on every answer, and
three tests with real people outside the project.

**Decisions made by Tamara on October 28, 2026:**

1. **Purpose:** a guided "What should I wear?" assistant. It is ClosetAI's promise, tried in one
   minute and without signing up.
2. **External testers:** Tamara recruits three people (friends, classmates or family) who use the
   chat on their own phone and agree that their conversation is saved without their name.
3. **Human checkpoint:** when the assistant must not answer, the conversation is **flagged for
   Tamara to review** in `/admin`, and the person is told a human will look at it. No personal
   data is asked for.
4. **Language:** the assistant always answers in English, even if someone writes in Spanish. The
   course requires the whole product in English.

---

## 🧩 Problem

ClosetAI's value only shows after creating an account and photographing at least four garments.
Someone who arrives from a post has no way to feel, in one minute, what it is like to have a stylist
who answers "what should I wear?". And a public assistant that answers anything is a risk: the
fashion conversation slides easily into diets, bodies and weight, which a stylist app must not
encourage.

## 👤 User

1. **The visitor** — arrives from the homepage or a post, has no account and wants a concrete
   answer for today. The target persona from Week 4: a woman aged 24 to 30 in Mexico City.
2. **Tamara, the reviewer** — the human checkpoint. She reads the conversations the assistant
   flagged and marks them as reviewed.
3. **The three external testers** — real people who try it and leave a short written summary.

## 🎯 Success (what must work by the end of the week)

- `/chat` loads without an account and asks three guided questions: occasion, city and weather,
  and how the person likes to dress.
- With the three answers, the assistant suggests one outfit made of common garments, explains why
  it works and gives one tip. Follow-up questions are allowed, up to a limit.
- Anything about diets, weight, body judgments, health, or not about clothes gets a fixed
  guardrail answer instead of a model answer, and the conversation is flagged for human review.
- Every assistant answer can be rated thumbs up or down, once.
- Conversations, ratings and test summaries are stored; only the server can read them.
- Three external testers complete a session and leave a summary; the page shows the summaries.
- 3 external user tests + 3 software tests, run against production.

## 🖼️ UX concept

Wireframe in `docs/evidencia/mockups/11-chat-wireframe.png` (source next to it, in HTML). Image
generation still has no free tier and billing is not active, so, as in Weeks 3 and 4, the UX
concept is the wireframe.

- **The intake is guided, not a blank box:** each of the three questions comes with tappable
  answers and a free-text option. A blank chat box makes people ask "what can you do?".
- **The answer is a card, not a wall of text:** the garments as a short list, then why it works,
  then one tip, then 👍 / 👎.
- **The guardrail looks different on purpose:** a calm, bordered message that says what the
  assistant won't do and that a person will review the conversation. It never lectures.
- **Testing evidence lives on the same page:** below the chat, the three external testers'
  summaries and the rating totals, so whoever evaluates sees the evidence without asking.

## ✂️ Scope cut

| Out | Why |
|---|---|
| Using the person's own closet in `/chat` | It needs an account and photos; `/today` already does it for signed-in users. `/chat` is the one-minute version |
| Images of the suggested outfit | Image generation has no free tier |
| Conversation memory across visits | It would mean storing who someone is; each visit starts fresh |
| Replying in the person's language | The course requires English (decision 4) |
| Emailing the person after review | It would require asking for an email; the checkpoint is Tamara's review, not a support desk |
| Streaming the answer word by word | Nice, but the answer is short and structured; one complete card is simpler to validate and test |
| Unlimited follow-up questions | Free-tier quota; 4 follow-ups per conversation and 10 conversations per hour per connection |

## 🧱 Specification and acceptance criteria

| # | Requirement | Acceptance criterion (testable) |
|---|---|---|
| 1 | Public page | `GET /chat` answers 200 without a session |
| 2 | Chat UI | Messages from the person and from the assistant are visually distinct; the newest is in view |
| 3 | 3 intake questions | Occasion, city/weather and style are asked **in order**, one at a time, each with suggested answers and free text; the answer is not requested until all three are answered |
| 4 | Response logic | With the three answers, the assistant returns one outfit (2–5 garments), why it works and one tip, in English; validated by a zod contract before it is shown |
| 5 | Guardrail | A message about diets, weight, body judgments, health, self-harm or something not about clothes gets the guardrail answer, **without** calling the model for the deterministic cases; self-harm also shows a crisis line |
| 6 | Human checkpoint | A guardrail flags the conversation (`needs_review`, with the reason); `/admin` lists flagged conversations and Tamara can mark them reviewed |
| 7 | Storage | Every conversation and message is saved; the public key cannot read them (401) |
| 8 | Rating | Each assistant answer has 👍 / 👎; one rating per answer, saved, and the totals shown on the page |
| 9 | Test summary | A tester link (`/chat?test=1`) asks for consent first and, at the end, for a short summary (what worked, what was confusing, 1–5); it is saved and shown on the page |
| 10 | Abuse limits | 4 follow-ups per conversation; 10 conversations per hour per connection; test traffic (`x-cai-prueba`) is stored marked as a test |

## 🏗️ Architecture

```
Browser (/chat — no session)
   │
   ├── /chat (Server Component)
   │      reads the rating totals and the testers' summaries
   │      └── <Chat> (client): intake → messages → ratings → tester summary
   │
   ├── Server Action enviarMensaje(sessionId, text)
   │      1. limits (per conversation, per connection hash)
   │      2. guardrail, deterministic: patterns for diet, weight, body,
   │         health, self-harm, personal data      ← pure function, tested
   │         └─ hit → fixed answer + flag needs_review → save → done
   │      3. Gemini (Flash-Lite, Flash as fallback) with the intake + history
   │         └─ the model also classifies: on_topic | off_topic | sensitive
   │         └─ zod contract; off_topic/sensitive → guardrail answer + flag
   │      4. save message → return the card
   │
   ├── Server Action calificar(messageId, +1 | −1)     one per message (unique)
   ├── Server Action guardarResumen(sessionId, …)      tester summary
   └── /admin (signed in, allow-listed)                flagged conversations → reviewed
   ▼
Supabase Postgres (RLS on, no public policies: server only)
   ├── chat_sessions   (intake, is_test, tester, needs_review, review_reason, reviewed_at)
   ├── chat_messages   (session, role, content, guardrail, model)
   ├── chat_ratings    (message, rating; unique per message)
   └── chat_test_summaries (session, tester 1–3, worked, confusing, score 1–5)
```

**Two layers of guardrail, on purpose.** The deterministic check runs first and costs nothing: the
model never sees "how do I lose 5 kilos for a party", so it can't be talked into answering it. The
model's own classification catches what a pattern can't ("is this outfit flattering for my
hips?"). Each layer is tested separately.

**Privacy.** Conversations can be personal. Every chat table is closed to the public key; the page
only shows totals and the summaries testers wrote to be shown. The connection is stored as a salted
hash, never the IP — the rule from Week 3.

## 🧰 Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), Server Actions | Already in use; the key never reaches the browser |
| Model | Gemini 3.5 Flash-Lite, Flash as fallback | The free tier gives Flash only 20 requests a day; three testers would use it up. Flash-Lite answers the stylist in 8–14 s (measured Oct 28) |
| Contract | zod | The model's answer is validated before it is shown or saved |
| Guardrail | A pure function with patterns, in `src/lib/chat.ts` | Deterministic, free, tested in milliseconds |
| Database | Supabase Postgres + RLS | Already in use |
| Tests | Vitest + Playwright against https://closetai.lat | Already in use |

## ⚙️ DevOps

- **GitHub:** `vestiamx-code/closetai`, branch `main`, CI on every commit.
- **Vercel:** automatic deploy on every push; at least 2 this week.
- **Supabase:** migration `20261028000015_chat.sql` (four tables, RLS, the review index). Applied
  only with Tamara's permission, loaded from the repository, checked byte for byte, verified via
  REST.
- **Environment variables:** none new.
- **Rollback:** `/chat` is new and isolated; removing the route takes it offline without touching
  the rest.

## 🧪 Test plan

**3 software tests** (Playwright, against production):

1. `/chat` loads without a session; the three intake questions appear in order and the answer is
   not requested before the third; with the three answers the outfit card appears (skipped only if
   the provider has no quota, and said so).
2. A diet question gets the guardrail answer, the conversation is flagged `needs_review` with its
   reason, and **no model call** was made (no cost row).
3. Rating an answer saves exactly one row; rating it again doesn't add another; the totals on the
   page move.

Plus unit tests for the guardrail: it catches the sensitive cases in English and Spanish, and it
does **not** catch ordinary fashion ("a dress for a wedding", "jeans that fit well").

**3 external user tests:** three real people, recruited by Tamara, each on their own device with a
tester link. Each one:
- accepts that the conversation is saved without their name;
- completes the three questions and asks at least one follow-up;
- rates the answers and writes the summary (what worked, what was confusing, 1–5).

What they say is recorded as they said it; nothing is written for them. If something they report
is a defect, it is fixed and redeployed, and the iteration log says which tester found it.

**Every new test is seen failing on purpose before it is trusted.**

## 🤖 Prompt to the coding agent

```
Build Week 5 of ClosetAI (Next.js 16, App Router, Tailwind v4, Supabase).

EXACT SCOPE, nothing more:
1. src/lib/chat.ts — pure functions: the three intake questions with their
   suggested answers; revisarMensaje(text) → null | { motivo } for diets,
   weight, body judgments, health, self-harm and personal data, in English and
   Spanish; the fixed guardrail answers (self-harm includes a crisis line).
2. Migration 20261028000015_chat.sql: chat_sessions, chat_messages,
   chat_ratings (unique per message), chat_test_summaries. RLS on, no public
   policies.
3. Server Actions: iniciarConversacion, enviarMensaje (limits → guardrail →
   Gemini Flash-Lite with Flash fallback → zod → save), calificar,
   guardarResumen. A guardrail hit flags needs_review with the reason.
4. /chat: guided intake, message list, outfit card, 👍/👎, tester mode with
   consent and summary, and a "testing evidence" section with the summaries
   and rating totals.
5. /admin: flagged conversations, mark as reviewed.

RULES:
- Interface and assistant answers in English, always.
- The assistant suggests common garments; it never comments on bodies, weight
  or diets, and never invents ClosetAI features or prices.
- No personal data requested. The connection is stored only as a salted hash.
- Tests: 3 software (against production) and the guardrail unit tests; see
  them fail before trusting them.
```

## ✅ Rubric criteria covered

| Week requirement | Where it lives |
|---|---|
| Chat UI | `/chat` |
| 3 intake questions | `/chat`, `src/lib/chat.ts` |
| Response logic | Server Action + Gemini + zod contract |
| Guardrail response | Two layers: deterministic and the model's classification |
| Human checkpoint | `needs_review` flag and the review list in `/admin` |
| Chat/test storage | Four tables, server only |
| Thumbs up/down | Every assistant answer |
| 3 external user tests | Tester links, consent, summaries on the page |
| 3 software tests | Test plan, above |
| Commits, deploys, prompts | At least 5, 2 and 5 |
| Iteration and decision note | `ITERATION_LOG.md` and `DECISION_NOTES.md` |
| 2–3 minute video | Recorded against production, narrated by Tamara |
