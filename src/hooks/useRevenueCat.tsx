import { useEffect } from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

function useRevenueCat() {
    useEffect(() => {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        // Platform-specific API keys
        const iosApiKey = 'appl_SGOUsugAvdJhvzWJZhOwbmNOKrG';
        const androidApiKey = 'goog_pZuivWeWkPuaNMFYnVvexWkfELI';

        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: iosApiKey });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: androidApiKey });
        }
    }, []);
}

export default useRevenueCat;