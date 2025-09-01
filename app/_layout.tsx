
import { ConnectionTest } from '@/context/ConnectionContext';
import { InactivityProvider } from '@/context/InactivityContext';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AppContent() {
    const { signOut } = useAuth();
    //sign the user out on timeout. Wrap in connection context
    return (
            <InactivityProvider onTimeout={signOut}>
                <ConnectionTest>
                    <Stack screenOptions={{headerShown: false}}/>
                </ConnectionTest>
            </InactivityProvider>
    );
}

export default function RootLayout() {
    /*
    Root layout for the entire app, wrapped in the gensture handler wrapper, which checks for user activity
    and the auth provider which manages a user's auth status.
    */
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GestureHandlerRootView>
  );
}