# Tap Rush V4 — Android test-build workflow

Status: **PREPARATION ONLY**. No APK/AAB has been generated or tested by this documentation change.

## Project
- Existing HTML, CSS and JavaScript stay at repository root for the current Vercel deployment.
- `npm run build` copies the four required assets into ignored `www/` for local Capacitor packaging.
- `npm test` performs dependency-free static smoke checks. These **do not replace gameplay/runtime testing**.
- Android package identifier is currently reserved as a *provisional proposal*: `com.tafeemamair.taprush`. Confirm before the first Play listing; once an app is published its application ID cannot simply be changed for updates.
- No online services or accounts are required for the current offline game modes. External Google Fonts may need network; fallback fonts should be checked offline.

## Development requirements
Capacitor 8 requires Node.js 22+, Android Studio 2025.2.1+ and Android SDK API 36 to build for Google's November 2026 new-app target policy. Install Android Studio on the desktop PC, not the storage-constrained laptop, if possible.

## On the Windows desktop (PowerShell)
```powershell
git clone https://github.com/tafeemamair/tap-rush-v3.git
cd tap-rush-v3
npm install
npm test
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, let Gradle finish syncing and select a connected phone (USB debugging) to run the **debug** variant. For future code updates use `npm run android:sync` before rebuilding.

Do not commit Android Studio-generated native files or sign/release with debug credentials. The `android/` directory is ignored during the initial exploration phase. Once a reproducible native baseline is confirmed, explicitly decide whether to version the native project.

## Android testing acceptance
- [ ] All three modes open and run; target taps register promptly.
- [ ] Timer at 60 seconds is enforced after background/resume and at input boundaries.
- [ ] Focus red/cyan rules, 3 shields and independent high scores work.
- [ ] Score sharing works on a real Android device and handles cancellation.
- [ ] App opens and works with mobile data and Wi-Fi turned **off** (including readable fonts).
- [ ] Phone Back button, notifications, screen lock, rotation, safe-area inset and keyboard do not corrupt gameplay.
- [ ] Game performs acceptably on an 8 GB RAM / entry-midrange Android phone.
- [ ] No external SDKs, sensitive permissions or undisclosed collection are introduced without updating Data safety disclosures.

## Play release handoff (future)
1. Set up a Google Play Console personal developer account, paying the one-time registration fee and completing verification.
2. Decide the final app ID, icon, screenshots, store description, privacy disclosure and content rating.
3. Use Android Studio to produce a **signed AAB** with a safely backed-up release/upload key; never send signing passwords or keystores into GitHub.
4. Verify target SDK is API 36 or later and review policy compliance at the actual submission date.
5. Use internal/closed testing. Newly created personal Play Console accounts generally need a qualifying closed test with at least 12 opted-in testers for 14 consecutive days before production-access application.
6. Only apply for production access and publish after device QA and Play review are satisfied.

## Developer/user testing feedback to collect
Device model, Android version, app version, mode, high score, screenshots/video if possible, what felt enjoyable, where it lagged, whether they voluntarily replayed, and any crash/freeze steps. Avoid asking players for unnecessary personal information.
