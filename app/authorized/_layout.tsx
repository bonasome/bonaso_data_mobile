import Header from '@/components/header';
import openDB from '@/database/dbManager';
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from 'react-native';

export default function RootLayout() {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                // Reopen DB or warm it up
                openDB(); // you can even validate it with a SELECT 1 if needed
            }
        });

        return () => subscription.remove(); // clean up
    }, []);

    return (
        <Stack screenOptions={{header: () => (<Header />)}}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="create/CreateRespondent" />
        </Stack>
    );
}
