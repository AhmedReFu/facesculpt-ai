import { NavigationContainerRef } from '@react-navigation/native';
import { useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';

const AppNavigationContainer = ({ children }: { children: React.ReactNode }) => {
    // Fixed: Added initial values to useRef hooks
    const routeNameRef = useRef<string | undefined>(undefined);
    const navigationRef = useRef<NavigationContainerRef<any>>(null);

    const handleStateChange = useCallback(async () => {
        // Update current route name in ref
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        routeNameRef.current = currentRouteName;
    }, []);

    const handleChange = useCallback(async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        // Handle navigation state based on route changes
        if (previousRouteName === 'Sessions' && currentRouteName === 'DailyRoutine') {
            // User completed workout and returned - clean exercise screens
            const state = navigationRef.current?.getState();

            if (state && state.routes) {
                const cleanedRoutes = state.routes.filter((route: any) =>
                    route.name && !['Exercise', 'Sessions'].includes(route.name)
                );

                // Note: You'll need to implement actual navigation reset logic here
                // For example: navigationRef.current?.reset({...})
            }
        }
    }, []);

    return (
        <NavigationContainer
            ref={navigationRef}
            onStateChange={handleStateChange}
        >
            {children}
        </NavigationContainer>
    );
};

export default AppNavigationContainer;