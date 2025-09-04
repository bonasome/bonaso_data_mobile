import checkServerConnection from "@/services/checkServerConnection";
import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from './AuthContext';
const ConnectionContext = createContext({ isConnected: true, isServerReachable: true })

export const ConnectionTest = ({ children }) => {
    /*
    Context that helps manage whether or not a user is connected to the internet and whether or not 
    the server is reachable.
    */
    const[isConnected, setIsConnected] = useState(false); //user has connection
    const[isServerReachable, setIsServerReachable] = useState(false); //user can talk to server
    
    const { offlineMode } = useAuth(); //auth to determine if user has access/refresh tokens necessary for fetching APIs
    
    //function to check connection
    const checkConnection = async () => {
        console.log('Checking connection...');
        const state = await NetInfo.fetch(); //check if they have internet access
        const connected = !!state.isConnected;
        setIsConnected(connected);
        //if connected, see if they have server access
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

    //recheck connection every 60 seconds
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