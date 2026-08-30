# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js (React) + Supabase (Postgres + built-in auth) — the product needs individual accounts/login and structured relational data (roster, division/event pairings, per-partner-pair practice-score trends over time, competition scores), which fits a real database better than a spreadsheet. Supabase bundles auth with the DB, avoiding a separate auth service for a small-team hub. The test bank stays external links into Google Drive rather than files stored in-app.

## Users

The head captain (the user's son) and other team captains/coaches for BASIS Cedar Park's Science Olympiad program, across both Division B (middle school) and Division C (high school). They need day-to-day and competition-day visibility into roster, teams, and event assignments, plus the ability to log and review score data.

## Product Purpose

A team hub that makes it easier for captains and coaches to run the program: see roster, teams, and event pairings at a glance across both divisions; record practice-test scores and track each partner pair's trend over time; track scores from actual competitions; and provide a central test bank (most likely as links into a Google Drive).

## Positioning

An internal operations hub scoped to one team, not a generic SciOly resource site. It ties roster/pairing visibility directly to score tracking, so captains see not just "who's on what event" but how each pairing is trending over time — informing pairing and prep decisions.

## Operating Context

Used by captains and coaches during practice and at competitions, spanning two divisions (B: middle school, C: high school) with their own events, teams, and pairings. Practice-test scores are entered per event/pairing and tracked over time as a trend, not a single snapshot. Competition scores are also tracked. A test bank exists or is planned, most likely as links out to Google Drive rather than files hosted in the app.

## Capabilities and Constraints

- Visualize roster, teams, and event pairings across Division B and Division C.
- Input and track practice-test scores per event, with per-partner-pair trend over time.
- Track competition scores.
- Provide a test bank, most likely as links into Google Drive rather than in-app file storage.
- Requires individual accounts/login (not a single shared link), since team members enter their own scores.
- Data storage/backend was undecided by the user and delegated — see Stack above.

## Brand Commitments

Team name: BASIS Cedar Park (Science Olympiad team). No logo or color assets on hand yet.

## Evidence on Hand

None yet — no existing roster data, test bank content, or score history was provided. Future work must not fabricate sample rosters, scores, or test-bank content as if real.

## Product Principles

1. Pairing and score data over time is the core value — trend tracking beats single-snapshot views.
2. Division B and Division C are structurally separate (different events/teams) and should stay clearly distinguished throughout, not merged.
3. Keep score/roster entry low-friction for captains and coaches who are likely doing this quickly between other tasks, including at competitions.
4. Treat the Google Drive test bank as an external resource to link to, not content to replicate in-app.

## Accessibility & Inclusion

No product-specific requirement established yet.
