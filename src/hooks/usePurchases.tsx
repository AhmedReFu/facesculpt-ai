// hooks/useSubscriptionCheck.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

interface SubscriptionCheck {
    isSubscribed: boolean;
    isLoading: boolean;
    checkSubscription: () => Promise<boolean>;
}

const useSubscriptionCheck = (): SubscriptionCheck => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is subscribed
    const checkSubscription = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true);

            // 1. Check local storage first (faster)
            const localSubscribe = await AsyncStorage.getItem('subscribe');
            if (localSubscribe === 'true') {
                setIsSubscribed(true);
                setIsLoading(false);
                return true;
            }

            // 2. Check with RevenueCat
            const customerInfo = await Purchases.getCustomerInfo();

            // Check if user has active premium entitlement
            const hasPremium = customerInfo.entitlements.active?.premium !== undefined;

            // Update local storage
            if (hasPremium) {
                await AsyncStorage.setItem('subscribe', 'true');
            } else {
                await AsyncStorage.removeItem('subscribe');
            }

            setIsSubscribed(hasPremium);
            setIsLoading(false);

            return hasPremium;

        } catch (error) {
            console.error('Error checking subscription:', error);

            // Fallback to local storage on error
            const localSubscribe = await AsyncStorage.getItem('subscribe');
            const fallbackSubscribed = localSubscribe === 'true';

            setIsSubscribed(fallbackSubscribed);
            setIsLoading(false);

            return fallbackSubscribed;
        }
    }, []);

    // Initialize RevenueCat on mount
    useEffect(() => {
        const initialize = async () => {
            try {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
                // RevenueCat is already configured in App.tsx
                await checkSubscription();
            } catch (error) {
                console.error('Subscription check error:', error);
                setIsLoading(false);
            }
        };

        initialize();
    }, [checkSubscription]);

    // Listen for subscription updates
    useEffect(() => {
        const removeListener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            const hasPremium = customerInfo.entitlements.active?.premium !== undefined;

            if (hasPremium) {
                AsyncStorage.setItem('subscribe', 'true');
                setIsSubscribed(true);
            } else {
                AsyncStorage.removeItem('subscribe');
                setIsSubscribed(false);
            }
        });

        return () => {
            removeListener(); // Call the function with parentheses
        };
    }, []);

    return {
        isSubscribed,
        isLoading,
        checkSubscription
    };
};

export default useSubscriptionCheck;