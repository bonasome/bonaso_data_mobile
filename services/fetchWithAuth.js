//import { AuthService } from '@/services/authService';
import * as SecureStore from 'expo-secure-store';

async function refreshAccessToken() {

    const dn = process.env.EXPO_PUBLIC_API_URL
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');
    console.log(`${dn}/api/users/mobile-token/refresh/`)
    const response = await fetch(`${dn}/api/users/mobile-token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
        //AuthService.signOut();
        throw new Error('No refresh token available');
    }

    const data = await response.json();
    await SecureStore.setItemAsync('accessToken', data.access);
    return data.access;
}

export default async function fetchWithAuth(url, options = {}, retry = true) {
    let token = await SecureStore.getItemAsync('accessToken');
    const dn = process.env.EXPO_PUBLIC_API_URL
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    console.log(dn+url)
    let response = await fetch(dn + url, {
        ...options,
        headers,
    });

    if (response.status === 401 && retry) {
        try {
        // Try to refresh token
        token = await refreshAccessToken();

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
        catch (err) {
            //AuthService.signOut();
            throw new Error('No refresh token available', err);
        }
    }

    return response;
}