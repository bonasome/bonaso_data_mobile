import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <Redirect href="/authorized/(tabs)" />;
}