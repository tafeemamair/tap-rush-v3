# Timed deadline boundary regression plan

## Change
The 60-Second Rush and Focus Rush modes now check the wall-clock deadline not only in the countdown interval but at **every gameplay input and spawn boundary**. When the deadline has passed, the round is ended before scoring, penalty processing or target spawning. Endless Rush bypasses this deadline gate.

## Required functional tests (not yet executed)
1. **Boundary 59.99 s:** Valid tap just before deadline scores. After deadline, valid tap does not score, even when the interval callback has not run.
2. **Exactly 60.00 s:** Tap on an active target is rejected, HUD shows 0s and results appear once.
3. **Delayed spawn:** If scheduled spawn callback executes after deadline, it must not create a new target.
4. **Delayed miss callback:** Miss callback after deadline must not deduct a life or change score.
5. **Empty-field tap:** Tap after deadline must not increment the attempt count or invoke a penalty.
6. **Background/resume:** Background for >60 seconds and return; results must appear without another scoring opportunity.
7. **Early game-over:** Losing the third shield terminates a timed run without duplicate results.
8. **Replay:** Retry starts a fresh 60-second timer and keeps prior timed record intact.
9. **Mode isolation:** Endless Rush still supports unlimited play until shields are lost.
10. **Focus/Timed independence:** Focus and standard timed records remain separate; neither overwrites Endless records.
11. **60-second scoring fairness:** Verify no scoring when page is throttled, paused or rapidly clicked at deadline.
12. **Device QA:** Run all above on desktop Chromium and at least one mid-range Android phone.

## Limitations
- This regression checklist is not a test result.
- No automated browser tests, real-device tests, signing or Play Console actions are performed by this PR.
- Review remaining async callbacks and UI race conditions before release.
