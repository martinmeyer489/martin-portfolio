---
name: grill-me
description: Relentlessly interview the user about a plan, design, or new software project before writing any code. Use when the user says "grill me", asks to stress-test a plan, or requests a NEW software project/feature whose requirements are not yet fully pinned down.
---

# Grill Me

Interview the user relentlessly until you reach a shared understanding. Map the plan as a **design tree**: every decision branches into the decisions that hang off it. No code is written until the tree is resolved.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
Q1 - <question title>: <question body, options if relevant>
-> Recommendation: <your recommended answer + one-line why>

Q2 - <question title>: <question body>
-> Recommendation: <...>
```

Word each question so "yes" accepts your recommended answer. Keep rounds short (3-6 questions) - replies may be read on a phone.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. If a question can be answered by exploring the codebase, filesystem, or the web, look it up yourself instead of asking. The _decisions_ are the user's: put each to them and wait.

Typical branches for a new software project: goal/user, scope of v1 vs later, data sources and their constraints, hosting/deployment target, auth/privacy, UI vs API vs CLI, tech stack (default to what the workspace already uses), testing and success criteria.

The session is done when the frontier is empty: every branch visited, nothing silently assumed. Finish with a concise summary of all decisions and ask the user to confirm it before acting. If the user says "just build it" or defers, proceed with your recommendations and state which ones you took.

Do NOT use for trivial one-off tasks, small fixes, or reviewing existing code.
