# NextRep Mobile (Expo)

React Native (Expo, SDK 54) shell that wraps the NextRep web app
(`https://nextrep-fd6a57ecb582.herokuapp.com/`) in a `WebView` and adds native chrome on top of it.
This mirrors the FarmFed app that passed Apple App Review — the native UI is what satisfies
Guideline 4.2 ("more than a repackaged website").

What the shell adds:

- **Native bottom tab bar** — Home, Search, Sell, Inbox, Profile. Tapping a tab navigates the
  WebView (`/`, `/s`, `/l/new`, `/inbox/sales`, `/profile-settings` — the standard Sharetribe
  routes) and fires a haptic. The active tab stays in sync with in-app navigation via injected
  SPA URL tracking.
- **Push notifications** — registers an Expo push token, injects it into the web app, and deep-links
  to a listing when a notification is tapped.
- **Native share sheet, camera / photo picker, and haptics** via a small web↔native bridge.
- **Loading + offline/error screen** with a Retry button.

Branding (icon, splash, adaptive icon, notification icon, error logo) was generated from
`public/nextrep.avif` — brand cream `#FAF6F5`, lime `#BEFD6E`, near-black `#232222`.

> **Note on the bridge:** push/haptics/camera/share need matching code on the web/server side.
> NextRep's web app doesn't wire that up yet, so those features are no-ops until it does — the tab
> bar and site browsing work regardless. Use FarmFed's `src/util/pushNotifications.js`,
> `src/util/nativeBridge.js`, `server/api/device-tokens.js`, and `server/api-util/pushSender.js` as
> the reference implementation.

## Configuration

- **Site URL:** `app.json` → `expo.extra.siteUrl` (falls back to the Heroku URL in `App.tsx`).
- **Tabs:** the `TABS` array in `App.tsx`.

## Prerequisites

```bash
npm install -g eas-cli
```

You also need an **Apple Developer** account (Identifier `com.nextrep.app`, Push Notifications
capability), a **Google Play Console** account, and a free **Expo** account.

## Local development

```bash
cd mobile
npm install
npx expo start
```

Open Expo Go on a real device and scan the QR code. Push notifications WON'T work in Expo Go — they
require a development/production build.

## First-time EAS setup

This project ships without an EAS `projectId` (FarmFed's was intentionally not carried over). Create
a fresh one — it writes `expo.extra.eas.projectId` into `app.json`, which the push-token code reads:

```bash
eas login
eas project:init
```

## Building & submitting

```bash
eas build --platform ios --profile production
eas build --platform android --profile production

eas submit --platform ios --latest
eas submit --platform android --latest
```

## Native bridge protocol

Web → Native messages (via `window.ReactNativeWebView.postMessage`):

| `type` | `payload` | Returns |
|---|---|---|
| `urlChanged` | `{ url }` | (keeps the active tab in sync) |
| `requestPushToken` | — | `{ token, platform }` |
| `haptic` | `{ style: 'light' \| 'medium' \| 'success' }` | (fire-and-forget) |
| `camera` | `{ source: 'camera' \| 'library' }` | `{ dataUrl, format }` |
| `share` | `{ title, url }` | `{ success: true }` |
