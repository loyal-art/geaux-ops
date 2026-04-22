# The 5 Fs of Geaux Ops

The organizing philosophy of Geaux Ops. Every feature in the app should map back to at least one of the 5 Fs. If it doesn't, we're probably adding bloat.

The 5 Fs are not five separate concepts — they're five lenses on the same activity: doing the work that matters to you.

Status: **DRAFT** — refined over multiple sessions with Loyal.

---

## F1 — Finish

**What it answers:** What does done look like?

**Why it matters:** You can't be satisfied with work you haven't defined. Most people start work without a clear picture of what "done" looks like, then either overwork or underwork because the target is fuzzy.

**How it shows up in the app today:**
- Captured as plain text on job creation ("What does finished look like?")
- Displayed on the job detail page below the title

**How it should show up:**
- Pinned as a prominent banner at the top of every job detail page — the North Star of the job
- Should be reviewable and editable at any time
- Optionally: post-completion reflection asking "Did this meet the F1 goal?" Yes/No/Partially — builds a quality signal over time, not just a quantity signal

**Open questions:**
- Should F1 be required on every job or optional?
- Should templated jobs come with pre-written F1 definitions?

---

## F2 — Focus

**What it answers:** Where should my attention be while I do this?

**The two layers of Focus:**

**Layer 1 — The "how" pointers (step-level micro-training):**
Every step in a job can carry a few focus pointers. These are the operational knowledge that makes the difference between doing a task and doing it well.

Example — "Change the pillowcase":
- Flip it inside out first
- Get the corners fully into the corners
- Zipper hidden at the bottom

These are codified once and scale to anyone using the app — kids, VAs, team members. It's embedded training without a training session.

**Layer 2 — The bigger "why" (the meaning behind the task):**
Focus is also about NOT just focusing on the task itself — it's about what the task contributes to.

"Am I just stuffing a pillow into a pillowcase, or am I creating a comfortable living situation for my family?"

This reframe turns chores into meaningful contribution. Especially powerful for kids, family members, or team members who lose sight of the bigger picture.

**How it shows up in the app today:**
- Captured as plain text on job creation ("What's your focus?")
- Displayed on the job detail page

**How it should show up:**
- Layer 1 pointers attach to individual steps, not the whole job. Clicking a step reveals its focus pointers inline. Maybe a small "focus" icon on the step that hints pointers exist.
- Layer 2 is set at the job level — the "bigger why" shown at the top of the job detail page, near F1
- Both should be optional but encouraged — if no focus is set, the UI gently prompts for it

**Open questions:**
- Do templated jobs come with pre-written focus pointers?
- Can focus pointers be shared across similar steps? (e.g., "Fold neatly" might apply to folding towels, folding laundry, folding napkins)

---

## F3 — Feeling

**What it answers:** What's my relationship with this work?

**The insight:** Don't ask users to rate their feelings directly — that's homework. Instead, INFER feeling from the choices they make while working.

**How:** F3 is derived from F2 Focus engagement. If the user engages with the quality-focused pointers, they're doing the work with care. If they skip those and just mash through the checklist, they're executing for speed — which is fine sometimes but a signal over time.

**How it should show up:**
- Not as a direct question. The app should never ask "how do you feel?"
- Instead: after a job completes, if the user engaged deeply with focus pointers, a subtle acknowledgment: "You brought care to this one."
- Over time, patterns emerge — "You tend to speed through Thursday chores." "You bring more focus to OPS work in the mornings."
- Eventually this feeds into recommendations: "It's Thursday morning — a good time for that detailed work you've been putting off."

**How it shows up in the app today:**
- Barely represented. The ramp progress bar hints at it with color shifts but doesn't capture actual feeling data.

**Open questions:**
- Is feeling visualized anywhere for the user, or does it stay behind the scenes informing recommendations?
- How do we balance "tracking" without making it feel surveillance-y?

---

## F4 — Follow-Up

**What it answers:** What comes after the work I just did?

**The insight:** Follow-up isn't one thing — it's a growing library of methods. Over time you learn which follow-up method works best for which situation.

**How it should show up:**
- A "Follow Up" button on jobs and steps
- Clicking opens a list of follow-up options. Starts small (Email, Call, Text, Note to self) and grows as users add custom methods.
- Each time a follow-up method is used, user rates the result (success/partial/no response) or types free-form notes
- Over time, the app learns: "For OPS, calling Dre directly gets a response 80% of the time. Emailing gets 30%."
- When setting a job to Waiting, user can optionally set an expected follow-up date — feeds into My Day

**How it shows up in the app today:**
- Comments system handles the mechanics
- "Waiting" status with reason captures some intent
- My Day's "Still Waiting" section nudges stale jobs after 3 days

**Open questions:**
- How does the follow-up library get seeded for new users?
- Should follow-up methods be shared across a workspace (team learns together) or individual?

---

## F5 — Follow-Through

**What it answers:** What have I decided but not yet done?

**The insight:** Follow-through is the gap between decision and action. "I said I'd call them back." "I agreed to send the files." These are the commitments floating in your head that don't live cleanly in a task list.

**How it should show up:**
- A dedicated view or My Day section: "Time to follow through"
- Shows everything where a decision has been made but the action hasn't happened
- Distinct from "to-do" — these are specifically things you've committed to someone else or to a path

**How it shows up in the app today:**
- Confetti celebration on job completion
- Team notifications when a job is finished
- Proposed: last-bubble confirmation for ceremonial completion

**Open questions:**
- Is F5 a special job status, or a tag, or a view that filters existing jobs?
- Should follow-through items auto-expire if not acted on? Get escalated?

---

## Design principle

**Lightweight and rewarding, not bureaucratic.** If any F feels like homework, it's wrong. The 5 Fs should feel like the app quietly helping you be more thoughtful — not a checklist of "now rate your feelings."

The test: if removing an F feature would make the user feel relieved, we've built it wrong. If removing it would make them feel less capable, we built it right.

---

## Bigger ambitions (future thinking)

- **True flowchart logic:** Flow View bubbles that ask questions (Yes/No, If/Then) and route based on answers. Turns Flow View from a checklist into an actual decision tree / SOP. Especially powerful for complex work like IT troubleshooting where "it depends" is 80% of the job.
- **Personal patterns dashboard:** Show users their own patterns over time — when they focus best, which jobs drain them, which clients they tend to procrastinate on. Not judgmental. Just observational.
