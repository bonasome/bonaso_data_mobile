import * as SecureStore from 'expo-secure-store';

export async function saveSecureItem(key, value) {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch (e) {
        console.error('Failed to save item', e);
    }
}

export async function getSecureItem(key) {
    try {
        return await SecureStore.getItemAsync(key);
    } catch (e) {
        console.error('Failed to retrieve item', e);
        return null;
    }
}

export async function deleteSecureItem(key) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (e) {
        console.error('Failed to delete item', e);
    }
}