# BONASO Data Portal Mobile Sitemap
The following is a basic overview of the frontend site, grouped into "apps" of related pages (as displayed in the Navbar/Menu).

Navigation is primarily handled via _layout.tsx files nested within each folder of the app. Most broad groups are set within [app/authorized/(tabs)/_layout.tsx].

**Note**: Relies on Components includes specialized components for that page. For globally reuseable components, see [docs/components.md]

---

## Contents
- Login
- Home
- Respondents
- Tasks
- About
    - Offline Information

---

## Login
**Main Component**: Login ([app/login/index.tsx])

**Description**: The login screen is the initial load screen and allows a user to login to access the app. 

**Notes**: See more information about login and offline logic at [docs/auth.md]

---

## Home
**Main Component**: Home ([app/authorized/(tabs)/index.tsx])

**Description**: The home screen is the default landing page.

---

## Respondents
**Index Component**: RespondentsIndex ([app/authorized/(tabs)/respondents/index.tsx])
**Detail Component**: RespondentDetail ([app/authorized/(tabs)/respondents/id.tsx])
    - **Relies on Components**:
        - AddInteractions ([components/respondents/addInteraction.tsx]): For creating interactions for a respondent.
        - Interactions ([components/respondents/interactions.tsx]): For viewing a list of respondent interactions
**Create/Edit Components**: 
    - RespondentForm ([app/authorized/(tabs)/respondents/forms/respondentForm.jsx]): For creating/editing a respondent. Takes a serverId or a localId param for editing respondents, depending on if the respondent is being pulled from the server or locally from the device. 
    - InteractionForm ([app/authorized/(tabs)/respondents/forms/interactionForm.jsx]): For editing an interaction. Takes a serverId or a localId param, depending on if the interaction is being pulled from the server or locally from the device. 

**Description**: The respondents tab contains all information related to viewing and recording data about respondents.

**Notes**: When routing to the [id].tsx file, prefix andy local ids with a '-'. Server ids do not need to be prefixed.

--- 

## Tasks
**Main Component**: Tasks ([app/authorized/(tabs)/tasks.tsx])

**Description**: The tasks page is a place where a user can view all of the tasks present on their device.

---

## About

**Main Component**: AboutScreen ([app/authorized/(tabs)/about/index.tsx])
**Description**: The about screen contains basic information about the app and some term definitions.

### Offline Information
**Main Component**: OfflineInfo ([app/authorized/(tabs)/about/offlineInfo.tsx])
**Description**: The offline information screen contains information about the app's capabilities while offline. 

**Notes**: This screen is accessible via an alert on the home screen that displays when a user is offline. 
