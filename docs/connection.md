# BONASO Data Portal Mobile: Authentication & Connectivity

The BONASO Data Portal Server handles most of the authentication, but the mobile app must also manage its own logic for offline use. Offline functionality is a **core feature**, designed for users collecting data in remote areas.

---

## Quick Guide

> **Important:** The app must be initialized while online. Otherwise, login information will not be saved and required data will not download.

### Online-only Features
- Login with valid access/refresh tokens  
- View/Edit respondents and interactions from the server  
- Stronger validation (prerequisites, repeat checks)  
- Always up-to-date tasks, metadata, and server sync  

### Offline Features
- Local login (no server tokens)  
- View tasks and associated indicator/project/org info  
- Create respondents (requires previously synced metadata)  
- Create interactions for local respondents (requires synced tasks)  
- View/Edit respondents and interactions stored locally  
- Access "About" screens  

---

## Offline/Online Considerations
- **Online mode** mirrors the website and always pulls the latest data.  
- **Offline mode** uses only local data (synced tasks, locally saved respondents, interactions).  
- **Safety:** All new respondents/interactions are first saved locally, then uploaded automatically if online. Otherwise, they sync once the server is reachable again.  

---

## ID Management

To avoid conflicts between local and server records, the app uses a **RespondentLink** model (see [RespondentLink](/database/ORM/tables/respondents.js)):  
- Each respondent gets a unique local UUID.  
- If also synced with the server, a `server_id` is linked.  
- Components accept either `localId` or `serverId` params to fetch data from the right source.  

---

## Connection Context

The [`ConnectionContext`](/context/ConnectionContext.tsx) wrapper:  
- Checks connectivity on every API request, or every 60 seconds by default.  
- Sets `isConnected` = false if no connection is found.  
- Sets `isServerReachable` = false if connected but the server is down.  
- Developers can trigger a manual check via the **sync button** in the [`header.tsx`](/components/header.tsx).