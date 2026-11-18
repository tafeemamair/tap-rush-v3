# Tap Rush V4 — Android build and device QA

**Status:** Web gameplay and Settings were manually checked in Chrome, and 27 Node tests passed in the latest reported local verification. No APK or AAB has yet been generated or tested on Android.

## Baseline
- Repository: https://github.com/tafeemamair/tap-rush-v3
- Source files: `index.html`, `style.css`, `app.js`, `score-challenge.js`, `settings.js`.
- `npm run build` creates ignored `www/` assets for Capacitor and Vercel.
- `npm test` runs source and simulated-DOM behavior tests, not physical Android tests.
- `capacitor.config.json`: app ID `com.tafeemamair.taprush` is **provisional**. Confirm it before Play Console creation. Keep it stable thereafter.
- The game uses external Google Fonts; verify the offline font fallbacks.
- `android/` and generated build output are intentionally ignored in this initial experiment. Preserve the generated native project locally until a decision is made to version it.

## Requirements
- Node 22+ (user's latest verified laptop Node: 24.13.0).
- Capacitor 8 requires Android Studio 2025.2.1+; install SDK Platform API 36 and build tools on the **desktop PC** if possible to save laptop storage.
- Google Play new-app submissions currently require Android 16 / API 36+ target. Confirm native `targetSdkVersion` after generating the project, and recheck policy before publishing.
- An Android phone with USB debugging, a USB cable and Windows USB driver if needed.
- No emulator or Android Studio is needed for the laptop-only steps.

Official documentation:
- https://capacitorjs.com/docs/getting-started/environment-setup
- https://capacitorjs.com/docs/android
- https://support.google.com/googleplay/android-developer/answer/11926878

## Laptop: lightweight preflight (PowerShell)

```powershell
cd E:\Tafeem\tap-rush-v4-gameplay-regression
git status --short
git fetch origin
git switch -c test/v4-android-preflight origin/main
node --version
npm --version
npm test
npm run build
node --check settings.js
```

If `test/v4-android-preflight` already exists, choose a new branch name. Do not reset/delete existing local changes. Check that `www/settings.js` exists and that the game operates offline with the network disabled; do not install Android Studio on this laptop.

## Desktop: first Android project and debug build (PowerShell)

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

If the repository is already cloned, use its clean checkout at the latest `origin/main` instead of cloning a second copy. `npx cap add android` is only needed **once**, when `android/` does not already exist. In Android Studio, allow Gradle to sync, verify the generated compile/target SDK (API 36+), select a USB-connected Android device, and build/run a **debug** APK. In Android Studio, the usual debug APK output is `android/app/build/outputs/apk/debug/app-debug.apk`; verify the actual file, do not assume it exists.

For later web changes: `npm run android:sync` before rebuilding. Do not commit signing keys or passwords. A debug APK is for internal device QA, **not** Google Play submission. Use a signed AAB and controlled key management for release.

## Android device QA acceptance
- [ ] Startup, Endless Rush, Timed Rush and Focus Rush work by actual finger taps.
- [ ] No scoring after 60 seconds, including background, screen lock and resume.
- [ ] Focus cyan/red, shields, accuracy and separate records behave correctly.
- [ ] Sound OFF silences all effects (including scheduled notes); music starts/stops and remains off when disabled.
- [ ] Music/sound/vibration preferences survive force-close/relaunch; vibration can be turned off.
- [ ] Native sharing works; cancellation and fallback are safe.
- [ ] Game runs without mobile data or Wi-Fi; fonts remain readable.
- [ ] Back button, system status/navigation bars, rotation, calls and notifications don't corrupt game state.
- [ ] 393×852 and at least one smaller Android phone are legible and tap targets are comfortable.
- [ ] Android WebView console/logcat shows no relevant crashes or unhandled errors.

## Google Play preparation (after device QA)
- Confirm final package ID, game title, icon, feature graphic, screenshots, privacy policy, Data safety declarations, content rating and target audience.
- Set up developer account and required identity/device verification.
- Generate a signed **AAB** with securely backed-up upload key, not the debug certificate.
- For newly created personal Play developer accounts, check the closed-test eligibility and production-access requirements in Play Console.
- Never claim release readiness until real-device and closed-test evidence is complete.

## Player feedback record
Capture test date, game build/commit, phone model and Android version, tested mode, whether a replay was voluntary, score, any lag/crash, sound/music behavior and reproducible issues. Avoid collecting unnecessary personal information.
