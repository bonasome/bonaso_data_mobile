import { AuthService } from '@/services/authService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from "react";
import { deleteSecureItem, saveSecureItem } from '../services/secureStorage';

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    offlineMode: boolean;
    setOfflineMode;
    signIn: (data: JSON) => Promise<void>;
    signOut: () => Promise<void>;
    offlineSignIn: (token:string) => Promise<void>;
    setAccessToken,
    setRefreshToken,
};

const AuthContext= createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) =>{
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [offlineMode, setOfflineMode] = useState(false);

    useEffect(() => {
        const loadToken = async () => {
            const access = await SecureStore.getItemAsync('accessToken');
            const refresh = await SecureStore.getItemAsync('refreshToken');
            setAccessToken(access);
            setRefreshToken(refresh)
            setIsLoading(false);
        };
        loadToken();
    }, []);

    useEffect(() => {
        AuthService.setSignOut(signOut);
    }, []);


    const signIn = async (data:any) => {
        await saveSecureItem('accessToken', data.access);
        await saveSecureItem('refreshToken', data.refresh);
        await saveSecureItem('user_id', String(data.user_id));
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        setOfflineMode(false);
        console.log('Signed In');
    }
    const offlineSignIn = async (token:string) => {
        await saveSecureItem('userToken', token);
        setAccessToken(token);
        setOfflineMode(true);
        console.log('Signed In');
    }
    const signOut = async() => {
        await deleteSecureItem('accessToken');
        await deleteSecureItem('refreshToken');
        await deleteSecureItem('user_id');
        setAccessToken(null);
        setRefreshToken(null);
        setOfflineMode(false);
        console.log('Signed Out');
        router.replace('/login');
    }
    return(
        <AuthContext.Provider value={{
            isAuthenticated: !!accessToken,
            isLoading,
            accessToken,
            refreshToken,
            offlineMode,
            setOfflineMode,
            signIn,
            offlineSignIn,
            signOut,
            setRefreshToken,
            setAccessToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth requires AuthProvider')
    }
    return context
}
