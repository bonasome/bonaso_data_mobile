import checkServerConnection from "@/services/checkServerConnection";
import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from './AuthContext';
const ConnectionContext = createContext({ isConnected: true, isServerReachable: true })

export const ConnectionTest = ({ children }) => {
    const[isConnected, setIsConnected] = useState(false);
    const[isServerReachable, setIsServerReachable] = useState(false);
    
    const { offlineMode } = useAuth();
    
    const checkConnection = async () => {
        console.log('Checking connection...');
        const state = await NetInfo.fetch();
        const connected = !!state.isConnected;
        setIsConnected(connected);
        if (connected) {
            const serverResponse = await checkServerConnection();
            if(offlineMode && serverResponse){
                alert('You have regained connection, but you must log out and log in again to regain complete access. ')
            }
            if(isServerReachable && !serverResponse){
                alert('You are offline. Some features may not be available.')
            }
            setIsServerReachable(serverResponse);
        } 
        else {
            setIsServerReachable(false);
        }
    };

    useEffect(() => {
        checkConnection();
        const interval = setInterval(async () => {
            checkConnection();
        }, 60000);
        
        return () => clearInterval(interval);
    }, [])

    return (
        <ConnectionContext.Provider value={{ isConnected, isServerReachable }}>
            {children}
        </ConnectionContext.Provider>
    )
}

export const useConnection = () => useContext(ConnectionContext);