# BONASO Data Portal Mobile: Setup

This quickstart guide will get a dev verson of the mobile app set up. Please make sure to also setup the [server](https://github.com/bonasome/bonaso_data_server) and the [website](https://github.com/bonasome/bonaso_data_web) as well. *The web UI will not work if the server is not set up! It will also have no content if tasks are not created via the webiste!*

 ---

## 1. Requirements
- Node.js (v18+ recommended)
- npm (comes with Node.js) or Yarn

On first setup, run:

```bash
npm install
```
to install all requirements.

---

## 2. Setup .env
setup .env like this:
```bash
EXPO_PUBLIC_API_URL=https://your-domain.com
```

This will point all API calls to the correct server. Make sure .env is at the project root

---

## 3. Initiate the App
For development, it is reccomended that you install the *Expo Go* app from the App Store or the Google Play Store, since this allows testing on a real device. However, please note that some native modules will not work.

Once you have the app installed, run

```bash
npx expo start
```
which will produce a QR code you can scan to preview the app.

Alternatively, you can develop with an android emulator by running
```bash
npm run android
```
or if on MacOS
```bash
npm run ios
```