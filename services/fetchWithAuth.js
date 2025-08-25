import * as SecureStore from 'expo-secure-store';

let refreshingPromise = null; // global promise to coordinate refresh calls

async function refreshAccessToken() {
    const dn = process.env.EXPO_PUBLIC_API_URL;
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${dn}/api/users/mobile-token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error('Invalid refresh token');
    }

    await SecureStore.setItemAsync('accessToken', data.access);
    await SecureStore.setItemAsync('refreshToken', data.refresh);
    return data.access;
}

export default async function fetchWithAuth(url, options = {}, retry = true) {
    const dn = process.env.EXPO_PUBLIC_API_URL;
    let token = await SecureStore.getItemAsync('accessToken');

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let response = await fetch(dn + url, {
        ...options,
        headers,
    });

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
        } catch (err) {
            console.error('Refresh failed, signing out...');
            //AuthService.signOut();
            throw err;
        }
    }
    return response;
}