import Header from '@/components/header';
import openDB from '@/database/dbManager';
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppState } from 'react-native';

export default function RootLayout() {
    /*
    Root layout for the authorized layer, which contains all the app's content save for the login screen. 
    */

    //try to reopen the db if the app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                // Reopen DB or warm it up
                openDB();
            }
        });
        return () => subscription.remove(); // clean up
    }, []);

    return (
        <Stack screenOptions={{header: () => (<Header />)}}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="respondentForms" />
        </Stack>
    );
}
