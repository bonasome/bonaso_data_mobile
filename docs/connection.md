# BONASO Data Portal Mobile: Authentication Overview:

---

The BONASO Data Portal Server handles most of the legwork for authentication, but the mobile has its own logic, mainly owing to the fact that the app needs to avaialable offline, and thus must have its own framework for when that happens. 

---

## Offline/Online Considerations
The BONASO Data Portal Mobile application was primarily designed to give users who may be working in remote areas the ability to collect data while on the go. As such, offline functionality is a paramount concern of the app. 

While online, the app will function similarly to the website, and will always try to pull the most recent information from the server.

However, in the background, the app will download tasks to the device for use later offline (important for recording interactions).

When offline, the app will only have local data available, which most of the time will just be the user's previously downloaded tasks and any respondents/interactions they have recorded while offline. 

For safety reasons, whenever a respondent/interaction is created on the app, it will first save it locally. Then it will try to upload if there is server connection. If there is no connection, it can be uploaded next time there is connection. 

The app attempts to manage the issue of conflicting local and server IDs by creating a **RespondentLink** model that contains both a unique uuid that the device can use when referencing this respondent and a corresponding server_id (if the respondent exists in the server). However, detail and edit components for respondents and interactions will still take either a serverId param or a localId param so that the component knows the source of the id and can access the data from the correct source. 


## Connection Context
The Connection Context Wrapper at [context/ConnectionContext.tsx] handles the apps connectivity states. It checks connection every time an API request is made or every 60 seconds by default. If no connection is found, it will set an isConnected state to false. If connection is found, but the server is down, it will set an isServerReachable state to false. 

isServerReachable is frequently used throughout the app to check if there is connection before trying to make any server requests. 

Chcking conneciton can be triggered manually by clicking the sync button in the header (see [components/header.tsx])
