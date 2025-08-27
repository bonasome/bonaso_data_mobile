# BONASO Data Portal Mobile: Setup

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
    ```
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