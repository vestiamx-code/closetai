# Video script — Week 1 · `/core`

**Video:** `ClosetAI-Semana1-Core.mp4` · **2:59** · **no audio track**, so you can
record your own voice.

Each block shows the exact minute it starts in the video. The times are measured
on the real file, not guessed, so if you read at a normal pace you will stay in
sync. If you get ahead, pause and keep going — nobody notices.

---

### 0:00 — 0:16 · The landing page

> "This is ClosetAI, live at closetai dot lat. Last week someone pointed out the
> strongest objection to my value proposition: that I ask people to photograph
> ten pieces of clothing **before** I give them anything."

*On screen: the landing page and its four features.*

---

### 0:16 — 0:37 · Why `/core` exists

> "The work comes before the payoff, and that is what killed the apps that came
> before mine. So this week I took a method I had already written down — how
> ClosetAI figures out someone's style — and turned it into a module that works
> **with no account and without uploading a single photo**."

*On screen: click "Extraer mi núcleo", `/core` loads.*

---

### 0:37 — 1:03 · The input

> "There is no quiz and no multiple choice. You write in your own words, the way
> you would tell a friend. I am going to write how I actually dress."

*On screen: the text is typed out, letter by letter.*

---

### 1:03 — 1:52 · It generates the card

> "And in a few seconds it pulls out my core.
>
> Here it is: my essence in one line, my principles, my colours, my shapes, and
> what does **not** work on me.
>
> Look at that last one. Knowing what to avoid matters as much as knowing what I
> like, and it is what stops the stylist from pushing things I hate later. And at
> the bottom, a rule of mine, written the way I would say it."

*On screen: the button changes to "Leyéndote…", the card appears, then a slow
pass over the four blocks and the personal rule.*

**This is the longest block — 49 seconds. Take your time.**

---

### 1:52 — 2:15 · The part I care most about

> "And this is the part I worked hardest on. The module tells you **how sure it
> is**, and what it still needed to ask me.
>
> I tested it with a vague text on purpose and it dropped to 25 percent, with the
> colour list empty. It made nothing up. Something that guesses a colour palette
> for a person who never mentioned a colour feels smart for ten seconds and fake
> forever."

*On screen: close-up on the confidence line.*

---

### 2:15 — 2:40 · Saving it

> "I save it, and it shows up below with the others. Only the core — never the
> text the person wrote about herself, because that can be very personal. Each
> one is stored in a Supabase table."

*On screen: click Save, then the panel of saved cores.*

---

### 2:40 — 2:59 · The repository

> "And the repo is public. The whole week is in there, with the Build Discipline
> Packet committed **before** the code — all the way at the bottom."

*On screen: the commit list on GitHub.*

---

## If someone asks you something uncomfortable

**"Isn't this just a pretty horoscope?"**
No — with a vague text it **refuses** to make things up. It drops the confidence
to 25 % and leaves the lists empty. That is in the video, at 1:52. You show it,
you don't argue it.

**"Why doesn't it ask for an account?"**
Because asking people to sign up before showing them anything useful is exactly
the problem this feature attacks.

**If something breaks while you present**
Gemini's free tier has a daily cap and sometimes returns an error. Say it out
loud: *"this runs on the free tier and I hit the daily cap today — that is why I
added an automatic retry."* Explaining it helps more than hiding it, and it is
written up in the iteration log.
