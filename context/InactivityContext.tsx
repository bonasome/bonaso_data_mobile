import { useCallback, useEffect, useRef } from "react";
import { AppState, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from 'react-native-reanimated';

//change timer back when out of development!!!!!!!
export const InactivityProvider = ({ children, onTimeout, timeout=3000000}) => {
    const timer = useRef(null);
    const appState = useRef(AppState.currentState);

    const resetTimer = useCallback(() => {
        console.log('[resetTimer] current timer:', timer.current);

        if (timer.current) {
            clearTimeout(timer.current);
            console.log('[resetTimer] Cleared existing timer');
        }

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
    
    const tapGesture = Gesture.Tap().onEnd((event, success) => {
        if (success) {
          console.log('Tap detected!');
          runOnJS(resetTimer)();
        }
    });

     useEffect(() => {
        return () => {
            if (timer.current) {
                console.log('[InactivityProvider] Cleanup timer:', timer.current);
                clearTimeout(timer.current);
                timer.current = null;
            }
        };
    }, []);
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
