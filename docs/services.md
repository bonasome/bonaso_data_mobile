# Bonaso Data Website: Services

The [services] folder provides utility functions and helpers that standardize common patterns across the frontend. They’re not tied to specific components, but many components depend on them.

This document is intended as a quick reference. For complex logic or specific use cases, see the linked component files.

---

## Contents

- [FetchWithAuth](#fetchwithauth)
- [AuthServices](#authservices)
- [cleanLabels](#cleanlabels)
- [checkServerConnection](#checkserverconnection)
- [syncMeta](#syncmeta)
- [syncTasks](#synctasks)

---

## [fetchWithAuth](/services/fetchWithAuth.js)
This is a helper function that expands on the native fetch by helping to manage token authentication. For more detail, see [docs/auth.md]

**Example Usage**
```javascript
const response = await fetchWithAuth("/api/manage/projects/");
const data = await response.json();
```

## [authServices](/services/authServices.js)
This is a helper function that translates some of the features found in [src/contexts/AuthContext.tsx] into vanilla JS so that fetchWithAuth can also use them. 

## [cleanLabels](/services/cleanLabels.js)
Since our database often sends hard-to-read labels that include underscores or all lowercase words, this function tries to help make these more readable by splitting words, capitalizing, and spelling out some common abbreviations. It can be used instead of a full value/label map sometimes. 

**Example Usage**
```javascript
<div>
    <p>This is a {cleanLabel('example_of_clean_labels')}</p>
</div>
```
Returns : Example Of Clean Labels

## secureStorage(/services/secureStorage.js)
Contains helper functions that get/store/delete SecureSave items. 

**Example Usage**: 
```javascript
await saveSecureItem(value, 'name');
await getSecureItem('name'); //returns value
await deleteSecureItem('name');
```

## [checkServerConnection](/services/checkServerConnection.js)
Checks a lightweight API to see if the server is reachable. Returns a boolean. 

**Example Usage**:
```javascript
const serverResponse = await checkServerConnection()
if(serverResponse){
    setOnline(true);
}
```

## [syncMeta](/services/syncMeta.js)
Helper function that retrieves the respondent meta from the server and then parses/saves it to the local database. By default will only do this once every 12 hours (as stored in the [SyncRecords](/database/ORM/tables/meta.js)) table, unless forceUpdate is true. 

**Example Usage**:
```javascript
const response = await syncMeta();
const meta = response.json();
setMeta(meta)
```

## [syncTasks](/services/syncTasks.js)
Helper function that retrieves the a user's tasks from the server and downloads them to the database. By default will only do this once every 12 hours (as stored in the [SyncRecords](/database/ORM/tables/meta.js)) table, unless forceUpdate is true. 

**Example Usage**:
```javascript
const response = await syncTasks();
const tasks = response.json();
setTasks(tasks)
```
