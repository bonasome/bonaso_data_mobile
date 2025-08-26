# BONASO Data Portal Mobile

**Tech stack:** React Native + Expo  
**Environments:** Development, Production  

---

## 1. Project Overview
The **BONASO Data Portal** enables community health workers and coordinators to capture and analyze client and project data from across the country in real time. It is a network of tools that work together to collect and retrieve data on the web and mobile applications.

This document specifically describes the **mobile application**. For additional context, please also read the documentation for:  
- **Backend:** BONASO Data Portal Server (Django + PostgreSQL)  
- **Frontend:** BONASO Data Portal Mobile (React Native + Expo)  

The mobile application is built for community health workers on the ground, who need to be mobile and may need to record data without having an internet connection.

---

## 2. Architecture
PostgreSQL (database)
        ↓
Django (backend / API server)
        ↓
React (frontend / website)
    ↳ Expo + React Native (mobile application)

The frontend:
- Is built with **React + Vite**.  
- Retrieves most data from the backend via **REST APIs**.  
- Submits all new or updated data back to the server through these APIs.  

See `sitemap.md` for a full outline of routes and features.  

---

## 3. Important Folders
- **/app** – main code for the app:
- **/assets** – images and static resources  
- **/components** – reusable UI components  
- **/contexts** – React contexts for global/shared state  
- **/services** – helper and API functions (e.g., authenticated fetch utilities)  
- **/theme** – style tokens and theme definitions (aligns with `/src/styles/tokens`) 

> **Note:** Environment variables for API URLs, keys, etc. should be placed in a `.env` file (see `setup.md`).

---

## 4. Next Steps
- Setup: [docs/setup.md]
- Sitemap: [docs/sitemap.md]
- Overview of Global Helper Functions: [docs/services.md]
- Overview of Global Components: [docs/components.md]

---

## Quick Start (Development)
```bash
# Install dependencies
npm install

# Start dev server
npx expo start #for general development
npm run android # for android emulator