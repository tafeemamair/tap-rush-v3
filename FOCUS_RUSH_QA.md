# Focus Rush — gameplay QA checklist

## Game rules
- Choose **FOCUS RUSH // 60s** on the title screen.
- **Tap cyan** targets quickly to score. **Ignore red** traps: touching a red trap costs one shield. Red traps disappearing do not score points.
- The round ends at 60 seconds or when three shields are lost, whichever is sooner.
- Reaction and accuracy are gameplay metrics, not clinical measures of concentration.

## Required manual tests
- [ ] Open main menu on a narrow Android phone; Focus button and instructions are readable, scroll/use as expected.
- [ ] Start Focus Rush; confirm cyan and red targets appear (approx. 60/40 split over many spawns).
- [ ] Tap cyan: score/combo increase; tap red: combo resets and shield drops.
- [ ] Ignore red: no points, no loss of shield; miss cyan: shield drops.
- [ ] Observe timer start at 60s and reach 0s; results appear exactly once and targets stop spawning.
- [ ] Lose all shields before 60s; results appear early and no late score changes occur.
- [ ] Open another tab/background the phone, return after deadline; game must conclude rather than extend the 60s wall-clock round.
- [ ] Finish a Focus round and revisit title screen; Focus best persists after refresh, and **Endless** / **60s** records remain unchanged.
- [ ] Retry from results: same Focus mode launches; return to menu and start Endless: original target mix and sectors work.
- [ ] Share score: message identifies **FOCUS RUSH**, not Endless or 60s.
- [ ] Verify visual/readability, sounds, tap response and reduced-motion behavior on actual low/mid-range Android devices.

## Notes
- Local best scores are stored in browser localStorage; they are not validated online.
- This PR introduces no backend, accounts, advertisements, analytics SDKs or online leaderboard.
- Do not merge/release to production until functional QA and regressions are completed.
