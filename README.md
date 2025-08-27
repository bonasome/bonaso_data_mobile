# BONASO Data Portal Mobile

**Tech stack:**  
- React Native + Expo  
- Expo SQLite (offline storage)  

**Environments:**  
- Development  
- Production  

---

## 1. Project Overview
The **BONASO Data Portal** enables community health workers and coordinators to capture and analyze client and project data from across the country in real time. It is a network of tools that work together to collect and retrieve data on the web and mobile applications.

This document describes the **mobile application**. For additional context, see:  
- [Backend – BONASO Data Portal Server (Django + PostgreSQL)](../bonaso_data_server/README.md)  
- [Frontend – BONASO Data Portal Web (React)](../bonaso_data_web/README.md)  

The mobile application is designed for community health workers in the field, with support for **offline data entry** via local SQLite storage.

---

## 2. Architecture
- PostgreSQL (database)  
  - Django (backend / API server)  
    - React (frontend web app)  
    - React Native + Expo (mobile app)  
      - Expo SQLite (local storage)  

The mobile app:  
- Is built with **React Native + Expo**.  
- Retrieves most data from the backend via **REST APIs**.  
- Submits new/updated data back to the server via these APIs.  

See [sitemap.md](docs/sitemap.md) for a full outline of routes and features.  

---

## 3. Important Folders
- **/app** – main application entry point and routing  
- **/assets** – images and static resources  
- **/components** – reusable UI components  
- **/contexts** – React contexts for global/shared state  
- **/services** – helper and API functions (e.g., authenticated fetch utilities)  
- **/theme** – style tokens and theme definitions (aligns with `/src/styles/tokens`)  

> **Note:** Environment variables for API URLs, keys, etc. should be placed in a `.env` file (see [setup.md](docs/setup.md)).

---

## 4. Next Steps
- [Setup](docs/setup.md)  
- [Sitemap](docs/sitemap.md)  
- [Global Helper Functions](docs/services.md)  
- [Global Components](docs/components.md)  
- [Custom ORM](docs/orm.md)  
- [Connection](docs/connection.md)  
- [User Authentication](docs/auth.md)  


---

## Quick Start (Development)
```bash
# Install dependencies
npm install

# Start dev server (Expo Go or emulator)
npx expo start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios