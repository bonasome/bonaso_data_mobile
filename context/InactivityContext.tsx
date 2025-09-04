import { useCallback, useEffect, useRef } from "react";
import { AppState, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from 'react-native-reanimated';

//change timer back when out of development!!!!!!!
export const InactivityProvider = ({ children, onTimeout, timeout=300000}) => {
    /*
    If a user does not interact with the app for 5 minutes, they should be signed out by default for 
    security purposes. 
    - onTimeout (function): action to perform when timer expires (pass signOut from AuthContext)
    - timeout (integer, optional): time in ms to set timer for (default to 5 minutes)
    */
    const timer = useRef(null); //ref to stores timer info
    const appState = useRef(AppState.currentState); //check what app state is

    //function that resets the timer
    const resetTimer = useCallback(() => {
        console.log('[resetTimer] current timer:', timer.current);

        if (timer.current) {
            clearTimeout(timer.current);
            console.log('[resetTimer] Cleared existing timer');
        }

        //if expires, reset timer and call inTimeout
        const newTimer = setTimeout(() => {
            console.log('⏰ Timeout triggered');
            onTimeout?.();
        }, timeout);

        timer.current = newTimer;
        console.log('[resetTimer] Set new timer:', newTimer);
    }, [onTimeout, timeout]);

    const handleAppStateChange = (nextAppState) => {
        if(appState.current.match(/inactive|background/) && nextAppState === 'active'){
            resetTimer();
        }
        appState.current = nextAppState;
    };
    
    //tap should reset the timer
    const tapGesture = Gesture.Tap().onEnd((event, success) => {
        if (success) {
          console.log('Tap detected!');
          runOnJS(resetTimer)();
        }
    });

    //cleanup timer
     useEffect(() => {
        return () => {
            if (timer.current) {
                console.log('[InactivityProvider] Cleanup timer:', timer.current);
                clearTimeout(timer.current);
                timer.current = null;
            }
        };
    }, []);

    //mount on load
    useEffect(() => {
        console.log('[InactivityProvider] Mounted');
        return () => {
            console.log('[InactivityProvider] Unmounted');
            clearTimeout(timer.current);
            timer.current = null;
        };
        }, []);

     return (
        <GestureDetector gesture={tapGesture}>
            <View style={{flex: 1}}>
                {children}
            </View>
        </GestureDetector>
    );
};
