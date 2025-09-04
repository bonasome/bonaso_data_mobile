import { AuthService } from '@/services/authService';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from "react";
import { deleteSecureItem, saveSecureItem } from '../services/secureStorage';

type AuthContextType = {
    /*
    Types for AuthContent exports
    */
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
    /*
    Context that manages the app's authentication state. Wrap around the entire app. 
    Pretty much everything should require auth to use. 
    */
    const [accessToken, setAccessToken] = useState<string | null>(null); //store access token from server
    const [refreshToken, setRefreshToken] = useState<string | null>(null); //store refresh token from server
    const [isLoading, setIsLoading] = useState(true); //global loading state
    const [offlineMode, setOfflineMode] = useState(false); //if user logged in offline, they will not have server tokens, and cannot access any API endpoints

    //try to get tokens
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

    //generate signout function as found in [../services/authService.js]
    useEffect(() => {
        AuthService.setSignOut(signOut);
    }, []);

    //sign a user in if the server approves their credentials
    const signIn = async (data:any) => {
        await saveSecureItem('accessToken', data.access);
        await saveSecureItem('refreshToken', data.refresh);
        await saveSecureItem('user_id', String(data.user_id));
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        setOfflineMode(false);
        console.log('Signed In');
    }
    //sign a user in if they login offline
    const offlineSignIn = async (token:string) => {
        await saveSecureItem('userToken', token);
        setAccessToken(token); //random token, will not work with the server
        setOfflineMode(true);
        console.log('Signed In');
    }
    //clean up on signout
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
    //return necessary states
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

//export states for use in components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth requires AuthProvider')
    }
    return context
}
