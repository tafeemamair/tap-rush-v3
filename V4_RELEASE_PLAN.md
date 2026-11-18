# Tap Rush V4 — Android release plan

## Product principle
Preserve V3's Endless Rush gameplay, speed, and high-score competition. Build additional modes separately so returning players do not lose their favorite experience.

## Release milestones
1. **Competition foundation:** Share scores using the native share sheet with clipboard fallback. Keep the original offline personal high score. Test on mobile devices.
2. **60-Second Rush:** New, separately scored mode with fixed 60-second timer. Consistent scoring and pause/background behavior. Do not mix its scores with Endless mode.
3. **Focus Rush:** Fast selective-attention challenge with good/bad targets and measurable in-game accuracy. Do not claim medically proven concentration improvement.
4. **Quality:** Device/resolution QA, accessibility, touch latency, audio settings, privacy review, crash/error checks, tests for saved-score compatibility.
5. **Android packaging:** Use Capacitor or a comparable WebView wrapper once production assets and offline handling are ready. Generate a signed Android App Bundle, meet current Play target API and policy requirements, and test through Play Console before production rollout.

## Competition integrity
- Share text is a player claim, **not** a verified leaderboard result.
- Any future online leaderboard needs server-side validation and anti-cheat controls.
- Scores across different modes must be stored and ranked separately.

## Publishing blockers (not yet completed)
- Confirm Play Console developer account and enrollment requirements.
- Design application icon and Play Store screenshots.
- Prepare privacy policy and Data safety disclosures consistent with actual data collection and SDKs.
- Configure Android application ID, signing credentials, production bundle, and app testing tracks.
- Confirm whether the applicable Play Console account requires a closed test before production access.

## Acceptance criteria for first change
- On the Game Over screen, 'CHALLENGE A FRIEND' shares the displayed score and current V3 link.
- If Web Share is unsupported, the text is copied or displayed for manual copying.
- Cancelling native sharing does not display an error.
- Gameplay engine and saved score format remain unchanged.
