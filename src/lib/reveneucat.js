import { Alert, Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { PREMIUM_ENTITLEMENT_ID, REVENUECAT_IOS_API_KEY } from '../constants/Paths';



export const initializeRevenueCat = async (user, getInfo = () => { }) => {
    try {
        if (Platform.OS === "ios") {
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
                console.log('TESTING MODE: StoreKit Configuration Active');
            } else {
                Purchases.setLogLevel(LOG_LEVEL.ERROR);
            }

            Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });



            await identifyUserInRevenueCat(user);

            await detectTestingEnvironment();
        }


        await checkSubscriptionStatus(getInfo);



    } catch (error) {
        console.error('Error initializing RevenueCat:', error);

        Alert.alert('Error', 'Failed to initialize payment system. Please restart the app.');
    }
};

const identifyUserInRevenueCat = async (user) => {
    try {


        if (user && user.email) {
            console.log('Logging in user to RevenueCat:', user.email);

            const { customerInfo } = await Purchases.logIn(user.email);

            console.log('User logged in to RevenueCat');
            console.log('RevenueCat User ID:', customerInfo.originalAppUserId);


            await setUserAttributes(user);

            return customerInfo;
        } else {
            console.log('No user to identify - using anonymous');
        }
    } catch (error) {
        console.error(' Error identifying user:', error);
    }
};


const setUserAttributes = async (user) => {
    try {
        console.log('Setting user attributes...');

        if (user.email) {
            await Purchases.setEmail(user.email);
            console.log('Email set:', user.email);
        }

        if (user.name) {
            await Purchases.setDisplayName(user.name);
            console.log('Name set:', user.name);
        }

        const attributes = {
            'user_id': user._id || user.uid || '',
            'signup_date': user.createdAt || new Date().toISOString(),
            'user_type': user.role || 'standard',
        };

        await Purchases.setAttributes(attributes);
        console.log('Custom attributes set');
        console.log('All user attributes set successfully');
    } catch (error) {
        console.error('Error setting attributes:', error);
    }
};

const detectTestingEnvironment = async () => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isTest = customerInfo.originalAppUserId.includes('RCAnonymous') || __DEV__;

        if (isTest) {
            console.log('StoreKit Testing Environment Detected');
            console.log('Test User ID:', customerInfo.originalAppUserId);
        }
    } catch (error) {
        console.log('Could not detect environment:', error);
    }
};




const checkSubscriptionStatus = async (getInfo) => {
    try {
        console.log('Checking subscription status...');
        const customerInfo = await Purchases.getCustomerInfo();

        console.log('Customer ID:', customerInfo.originalAppUserId);
        console.log('Active Entitlements:', Object.keys(customerInfo.entitlements.active));
        console.log('Active Subscriptions:', customerInfo.activeSubscriptions);

        const hasActiveSubscription =
            customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive === true;

        getInfo(hasActiveSubscription, customerInfo)


        if (hasActiveSubscription) {
            console.log('USER IS SUBSCRIBED');
            const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
            console.log('Subscription Details:');
            console.log('   - Product:', entitlement.productIdentifier);
            console.log('   - Will Renew:', entitlement.willRenew);
            console.log('   - Expires:', new Date(entitlement.expirationDate).toLocaleString());


        } else {
            console.log('USER IS NOT SUBSCRIBED');

        }

        return hasActiveSubscription;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
};