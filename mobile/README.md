# NextRep Mobile (Expo)

React Native (Expo) shell that wraps the NextRep web app at
`https://nextrep-fd6a57ecb582.herokuapp.com/` in a `WebView`. The web app is unchanged; this shell
provides the native capabilities a WebView can't:

- Push notifications (Expo Notifications → server uses `expo-server-sdk`)
- Native haptics
- Native image picker (camera + library) for the listing photos editor
- External link handling (off-site links open in the system browser)

> **Note:** the native bridge (push tokens, haptics, camera) needs matching code on the web/server
> side — see [Native bridge protocol](#native-bridge-protocol). NextRep's web app does **not** wire
> this up yet, so those features are no-ops until it does; the app still loads and runs the site
> normally. Use FarmFed's `src/util/pushNotifications.js`, `src/util/nativeBridge.js`,
> `server/api/device-tokens.js`, and `server/api-util/pushSender.js` as the reference implementation.

The icon, splash, adaptive icon, and notification icon were generated from `public/nextrep.avif`
(brand cream `#FAF6F5`, lime `#BEFD6E`, near-black `#232222`).

## Prerequisites

```bash
npm install -g eas-cli
```

You also need:

- An **Apple Developer** account with the `com.nextrep.app` Identifier and Push Notifications
  capability enabled.
- A **Google Play Console** account (for Android submission).
- An **Expo** account (free).

## Local development

```bash
cd mobile
npm install
npx expo start
```

Open Expo Go on a real device and scan the QR code. Push notifications WON'T work in Expo Go — they
require a development build (see below).

The site URL lives in `app.json` under `expo.extra.siteUrl` (and as a fallback default in `App.tsx`).
Change it there to point the shell at a different environment.

## First-time EAS setup

This project has no EAS `projectId` yet (the FarmFed one was intentionally not carried over). Create
a fresh one:

```bash
eas login
eas project:init      # writes the new projectId into app.json
# optional, for OTA updates:
eas update:configure
```

## Building & submitting

```bash
# Build (uses EAS Build cloud service; ~15 min per platform)
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores (after editing eas.json with your Apple ID / team ID)
eas submit --platform ios --latest
eas submit --platform android --latest
```

EAS prompts for Apple credentials on first iOS build and stores them in your Expo account.

## Notification flow

1. App launches → `App.tsx` calls `Notifications.getExpoPushTokenAsync()`
2. Token is injected into the WebView as `window.__EXPO_PUSH_TOKEN__`
3. Web app reads it and POSTs to `/api/device-tokens` *(not yet implemented on NextRep — see note above)*
4. Server stores token (e.g. `server/data/device-tokens.json`)
5. When a relevant transaction transition happens, server calls `sendPushNotifications`
6. Expo Push Service relays to APNs / FCM → device shows banner

## Native bridge protocol

Web → Native messages (via `window.ReactNativeWebView.postMessage`):

| `type` | `payload` | Returns |
|---|---|---|
| `requestPushToken` | — | `{ token, platform }` |
| `haptic` | `{ style: 'light' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error' }` | (fire-and-forget) |
| `camera` | `{ source: 'camera' \| 'library' }` | `{ uri, base64, mimeType }` or `null` if cancelled |
| `share` | `{ title, text, url }` | `{ ok: true }` |
