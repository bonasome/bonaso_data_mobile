import * as SecureStore from 'expo-secure-store';

let refreshingPromise = null; // global promise to coordinate refresh calls

/*
Functions that takes an api call and wraps it such that if the access token is expired, the refresh token
will be used to get a new access token before retrying the request again. 
*/

async function refreshAccessToken() {
    /*
    Fetch a new access token if expired.
    */
    const dn = process.env.EXPO_PUBLIC_API_URL; //domain name
    const refreshToken = await SecureStore.getItemAsync('refreshToken'); //get refresh token
    if (!refreshToken) throw new Error('No refresh token available'); //error if none found

    //fetch new token
    const response = await fetch(`${dn}/api/users/mobile-token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Invalid refresh token');
    }
    //refresh tokens are blacklisted so update it as well
    await SecureStore.setItemAsync('accessToken', data.access);
    await SecureStore.setItemAsync('refreshToken', data.refresh);
    return data.access;
}

export default async function fetchWithAuth(url, options = {}, retry = true) {
    /*
    try to fetch a url and if it fails due to a 401, fetch a new access token and try again. 
    - url (string/URL): url endpoint to call
    - options (object, optional): and options (JSON data, etc.) to include in request
    - retry (boolean, optional): set to false if already been retried to prevent infinite loops
    */
    const dn = process.env.EXPO_PUBLIC_API_URL; //domain name
    let token = await SecureStore.getItemAsync('accessToken'); //get access token

    //always include headers for auth
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    //try to make the request
    let response = await fetch(dn + url, {
        ...options,
        headers,
    });
    //if no access token and request has not been retried, get a new refresh token
    if (response.status === 401 && retry) {
        // If refresh already in progress, wait for it
        if (!refreshingPromise) {
            refreshingPromise = refreshAccessToken()
                .finally(() => {
                    refreshingPromise = null; // reset after done
                });
        }
        try {
            token = await refreshingPromise;
            // Retry original request with new token
            const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${token}`,
            };
            response = await fetch(dn + url, {
                ...options,
                headers: retryHeaders,
            });
        } 
        //handle second failure
        catch (err) {
            console.error('Refresh failed...');
            //AuthService.signOut();
            throw err;
        }
    }
    return response;
}