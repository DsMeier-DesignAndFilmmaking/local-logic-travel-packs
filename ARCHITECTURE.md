# Offline-First Architecture Principles

## Core Product Truth

We are NOT shipping “offline content”.

We ARE shipping an **offline-capable interface**.

The UI is the product.
The JSON is decision fuel.
Offline is the default, not the edge case.

---

## Non-Negotiable Rules

1. UI must work without network access.
2. Navigation must not depend on the internet.
3. Search must function fully offline.
4. Voice must degrade gracefully to offline logic.
5. Online functionality may enhance — never replace — offline behavior.

---

## Design Implications

- Same UI online and offline
- No “offline mode” screens
- No PDF-style content dumps
- Card-first, situational UX
- Read-heavy, fast, deterministic interactions

---

## Data Philosophy

- JSON is NOT the UI
- JSON feeds decisions, not layouts
- UI components own presentation logic
- Derived indexes are allowed
- Source JSON remains human-readable

---

## Engineering Guardrails

Before adding a feature, ask:

1. Does this work offline first?
2. If the network disappears mid-action, does the UI break?
3. Is this feature discoverable without search?
4. Is this interaction fast on low-end devices?

If any answer is “no”, redesign before shipping.
