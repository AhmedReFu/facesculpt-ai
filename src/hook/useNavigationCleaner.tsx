import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { useRef } from 'react';

const AppNavigationContainer = ({ children }: { children: React.ReactNode }) => {
    const navigationRef = useRef<NavigationContainerRef<any>>(null);

    return (
        <NavigationContainer ref={navigationRef}>
            {children}
        </NavigationContainer>
    );
};

export default AppNavigationContainer;