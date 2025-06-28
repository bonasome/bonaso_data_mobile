
import { ConnectionTest } from '@/context/ConnectionContext';
import { InactivityProvider } from '@/context/InactivityContext';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AppContent() {
    const { signOut } = useAuth();
  return (
        <InactivityProvider onTimeout={signOut}>
            <ConnectionTest>
                <Stack screenOptions={{headerShown: false}}/>
            </ConnectionTest>
        </InactivityProvider>
  );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GestureHandlerRootView>
  );
}