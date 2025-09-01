import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    /*
    App index. Handles redirection based on authentication, with unauthenticated traffic going to the login screen
    and authenticated traffic going to the base tabs layout. 
    */
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/authorized/(tabs)" />;
}