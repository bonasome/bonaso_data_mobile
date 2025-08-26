# BONASO Data Portal Mobile: Authentication Overview:

---

The BONASO Data Portal Server handles most of the legwork for authentication, but the mobile has its own logic, mainly owing to the fact that the app needs to avaialable offline, and thus must have its own framework for when that happens. 

---

## Offline/Online Login
When there is connection to the internet, a user enters their login/password and this sends a request to the server, which if successful will send the user an access and refresh token and sign them into the app. 

Whenever the user has a successful online login, their username and a bcrypt hashed version of their password are stored in secure storage, which can then be used for offline login. See more about the login flow at [app/login/index.tsx].

When the user is offline, the device will check secure storage for offline credentials (created when a user logs in online). If they are found and match, the user will be allowed into the app in offline mode. They will not have a refresh/access token, and so they will not be able to make any API calls. To do this they will need to log in again when online. See more about offline login at [services/offlineLogic.js].

## Token Management Principles
Unlike the frontend, the mobile app relies on access and refersh tokens sent via JSON and stored/managed in [context/AuthContext.tsx].

These tokens are required to be sent with all API requests (save for logging in). If a user does not have a valid access token, then the app will try to use the refresh token to get a new one (see FETCH WITH AUTH below). If the user does not have a valid refresh token, they will be signed out. Without the refresh token, the backend will reject all of their requests. 

When using offline sign in, tokens are not used, since there is no API that can be accessed. 

---

## Inactivity Context
If a user is inactive (i.e., they have not touched the screen) for 5 minutes, they will be automatically signed out for security reasons. See [context/InactivityContext.tsx] for more details.

---

## Fetch With Auth
Virtually all api requests (except for logging in) should be wrapped in the **fetchWithAuth** helper function located at [services/fetchWithAuth.js]. This function will attempt to call the API, but if the access token is expired and a refresh token is present, it will automatically try to get a new refresh then retry the API call. This simplifies the process by assuring that requests do not fail due to an expired access token, holds simultanous requests until a refresh token is found, and also slightly simplifies the request code since if automatically includes headers (necessary for the cookie JWT system).

The fetchWithAuth process is:
    1. The user makes a request.
    2. If the access token is expired, fetchWithAuth calls the refresh function (located at [src/contexts/UserAuth.jsx])
        - If this happens during an API request (i.e., not preemptively, it will trigger a global loading state to prevent issues while pages are rendering)
        - If any further requests are made while the refresh token is being fetched, they will be halted until the refresh token is found to prevent race conditions.
    3. Once the new refresh token is found, the request will be tried again.

See more at [services/fetchWithAuth.js]
---

