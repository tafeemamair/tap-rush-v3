# Tap Rush V4 — Preliminary Release-Readiness Audit
Date: 2026-11-18
Scope: repository `tafeemamair/tap-rush-v3`, merged `main`, read-only static source inspection.
Decision: **NOT YET RELEASE-READY**. This document is a triage record, not certification.

## Confirmed in repository
- `app.js` contains Endless Rush, 60-Second Rush and Focus Rush logic.
- Separate `highScore`, `timedHighScore` and `focusHighScore` values are present in local storage.
- Focus Rush uses cyan standard targets and red danger traps; correctly ignored traps do not receive passive points.
- Score-sharing code reads the results screen and adds the mode label.
- `FOCUS_RUSH_QA.md` exists but contains uncompleted manual test cases.

## Preliminary risks to test/fix
1. **P1 — Timed deadline enforcement:** Timed gameplay relies on a 100 ms interval calling `updateTimedClock()`. Target hits and scheduled spawns do not independently check `Date.now() >= timedDeadline`. When browser timers are delayed/throttled, the game may temporarily accept taps after 60 seconds until the interval/visibility handler executes. Add deadline guards at scoring and spawn boundaries; test background/foreground transitions.
2. **P1 — Timer lifecycle:** Verify interval, spawn timer, per-target timers and event timer are cancelled safely across early game-over and replay. There is a short delayed game-over display; check rapid replay and stale async callbacks.
3. **P1 — Device QA still unverified:** No Android touch-latency, lifecycle, narrow-screen or real-device test evidence has been collected in this audit. Don't equate merge with validated release.
4. **P1 — Android artifact absent:** Existing repository uses HTML/CSS/JS and web hosting; no verified Capacitor Android project, signed AAB, Play Console test, signing key or package ID is documented by this audit.
5. **P2 — Personal score vs competition:** Scores are currently local/browser-based. Shared scores are unverified claims, not a trusted global leaderboard. Avoid presenting them as online records.
6. **P2 — Product messaging:** Focus Rush challenges selective attention in-game. Avoid therapeutic or scientifically unsupported claims about improved real-world concentration.

## Verification checklist for next implementation
- [ ] Add strict timed deadline gate to score-acceptance and spawn paths without changing Endless behavior.
- [ ] Add automated boundary and mode-isolation tests with faked timers.
- [ ] Run mobile gameplay regression: Endless, Timed, Focus, low/high score, shield loss, replay, background/resume.
- [ ] Verify privacy/policy disclosures, offline behavior, assets, Android packaging and Play account requirements.
- [ ] Create a test-signed APK and production-signed AAB only with controlled signing credentials.
- [ ] Obtain and document Android closed-test feedback before requesting production access.

## Audit limitations
Static source review only. No browser automation, physical device, runtime test suite, signed artifact or Play Console inspection was performed. P1/P2 labels are prioritization judgments, not proof of exploitation or failed behavior.
