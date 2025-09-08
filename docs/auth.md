# BONASO Data Portal Mobile: Authentication Overview

---

## 1. Authentication Flow

The BONASO Data Portal Server handles most of the authentication logic. The mobile app has its own framework to support offline mode, allowing users to access the app even when there is no internet connection.

### 1.1 Online Login

When the device is online, the user enters their username and password. This sends a request to the server, which, if successful, returns an access token and a refresh token. The user is then signed into the app.

Upon successful online login, the username and a bcrypt-hashed password are stored in secure storage. This enables offline login later.

See the login flow [here](/app/login/index.tsx).

### 1.2 Offline Login

When offline, the app checks secure storage for previously saved credentials. If they match, the user can log in in offline mode.

No access or refresh tokens are available in this mode.

The user cannot make API calls until they log in online again.

See offline login logic [here](/services/offlineLogic.js).

---

## 2. Token Management

The mobile app uses access and refresh tokens stored and managed in [AuthContext](/context/AuthContext.tsx).

Tokens must be sent with all API requests, except for login. If the access token has expired, the app automatically uses the refresh token to obtain a new access token.

Tokens are not used during offline login since no API calls are possible.

---

## 3. Inactivity Handling

For security, users are automatically signed out if inactive (no screen interaction) for 5 minutes.

See details [here](/context/InactivityContext.tsx).

---

## 4. Fetch With Auth

All API requests (except login) should use the [fetchWithAuth](/services/fetchWithAuth.js) helper. This function:

1. Attempts the API request.

2. If the access token is expired:
    - Calls the refresh function ([src/contexts/UserAuth.jsx]) to obtain a new token.
    - Halts any simultaneous requests until the new token is available to prevent race conditions.
    - Retries the original request once a valid token is obtained.

This simplifies request handling by automatically including headers, managing tokens, and preventing failures due to expired access tokens.

---