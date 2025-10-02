# BONASO Data Portal Mobile Sitemap

The following is a basic overview of the mobile application, grouped into "tabs" of related screens (as displayed in the tabs bar at the bottom of the app).

Navigation is primarily handled via _layout.tsx files nested within each folder of the app. Outside of the login flow, all of the app screens are managed via the tabs [`_layout.tsx`](/app/authorized/(tabs)/_layout.tsx).

All of the apps content (except for login) should be placed within the authorization folder, since the user should be logged in to see any content.

**Note**: Relies on Components includes specialized components for that page. For globally reuseable components, see [`components.md`](docs/components.md)

---

## Contents
- [Login](#login)
- [Home](#home)
- [Respondents](#respondents)
    - [Index](#index)
    - [Detail](#detail)
    - [RespondentForm](#respondent-form)
    - [InteractionForm](#interaction-form)
- [Tasks](#tasks)
- [About](#about)
    - [About](#about-1)
    - [OfflineInformation](#offline-information)

---

## Login
**Description**: The login screen is the initial load screen and allows a user to login to access the app. 

**Main Component**: [Login](/app/login/index.tsx)

**Notes**: See more information about login and offline logic at [`auth.md`](/docs/auth.md).

---

## Home
**Description**: The home screen is the default landing page.

**Main Component**: [Home](/app/authorized/(tabs)/index.tsx)

---

## Respondents
**Description**: This tab group controls all screens related to respondents and their interactions, and is workable offline and online. 

### Index
**Description**: Contains a list view of all respondents (segmented by whether they are stored locally or or pulled from the server).

**Main Component**: [RespondentsIndex](/app/authorized/(tabs)/respondents/index.tsx)

### Detail
**Description**: Detail view for a specific respondent that also allows a user to view/create interactions for that respondent. 

**Main Component**: [RespondentDetail](/app/authorized/(tabs)/respondents/id.tsx)
- **Relies on Components**:
    - [AddInteractions](/components/respondents/addInteraction.tsx): For creating new interactions for a respondent.
    - [Interactions](/components/respondents/interactions.tsx): For viewing a list of previous respondent interactions and a link to edit the interaction.

**Notes**: When routing to the [detail](/app/authorized/(tabs)/respondents/[id].tsx) file, prefix any local ids with a '-'. Server ids do not need to be prefixed. This is how the component knows whether to contact the server or pull from the database.

**Tasks** must be properly synced for interactions/add interactions to work. The **respondent meta** must also be properly synced for labels to display properly. 

### Respondent Form
**Description**: For creating/editing a respondent. Takes a serverId or a localId param for editing respondents, depending on if the respondent is being pulled from the server or locally from the device. 

**Main Component**: [RespondentForm](/app/authorized/(tabs)/respondents/forms/respondentForm.tsx) 

**Notes**: The respondent meta must also be properly synced for input options to display properly. 

### Interaction Form
**Description**: For editing an interaction. Takes a serverId or a localId param, depending on if the interaction is being pulled from the server or locally from the device. 

**Main Component**: [InteractionForm](/app/authorized/(tabs)/respondents/forms/interactionForm.tsx)

--- 

## Tasks
**Description**: The tasks page is a place where a user can view all of the tasks present on their device.

**Main Component**: [Tasks](/app/authorized/(tabs)/tasks.tsx)

---

## About
**Description**: Contains informational screens with information the user should know about the app. 

### About
**Description**: The about screen contains basic information about the app and some term definitions.

**Main Component**: [AboutScreen](/app/authorized/(tabs)/about/index.tsx)

### Offline Information
**Description**: The offline information screen contains information about the app's capabilities while offline. 

**Main Component**: [OfflineInfo](/app/authorized/(tabs)/about/offlineInfo.tsx)

**Notes**: This screen is accessible via an alert on the home screen that displays when a user is offline. 
