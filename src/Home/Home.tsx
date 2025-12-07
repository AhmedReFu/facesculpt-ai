import { REVENUE_API_ANDROID, REVENUE_API_APPLE } from '@env';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, Text, View } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import CustomButton from '../Components/CustomButton';
import { Images } from '../constants';
import { useNavigationReset } from '../lib/useNavigationReset';
import { RootStackParamList } from '../types/navigation';



type ChooseGoalScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const Home = () => {
    const navigator = useNavigation<ChooseGoalScreenNavigationProp>()
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);


    useEffect(() => {
        const configureRevenueCat = async () => {
            try {
                Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
                // Add validation for API key
                if (!REVENUE_API_ANDROID || REVENUE_API_ANDROID === '' || !REVENUE_API_APPLE || REVENUE_API_APPLE === '') {
                    console.warn('RevenueCat API key is not configured');
                    return;
                }

                // Configure based on platform


                if (Platform.OS === 'android') {
                    const configuration = {
                        apiKey: REVENUE_API_APPLE,
                        // Add appUserID for better tracking (optional)
                        appUserID: null // Let RevenueCat generate one
                    };
                    await Purchases.configure(configuration);
                } else if (Platform.OS === 'ios') {
                    const configuration = {
                        apiKey: REVENUE_API_APPLE,
                        // Add appUserID for better tracking (optional)
                        appUserID: null // Let RevenueCat generate one
                    };
                    await Purchases.configure(configuration);
                }

                console.log('RevenueCat configured successfully');

            } catch (error) {
                console.error('RevenueCat configuration failed:', error);
            }
        };

        configureRevenueCat();
    }, []);

    useNavigationReset();

    useEffect(() => {
        const checkAuthAndNavigate = async () => {
            setIsLoading(true);

            try {
                const netState = await NetInfo.fetch();
                setIsOnline(netState.isConnected as any);

                if (!netState.isConnected) {
                    // Offline mode - try to use cached data
                    await handleOfflineMode();
                    return;
                }

                // Online mode - check authentication and subscription
                await handleOnlineMode();

            } catch (error) {
                console.error("Error checking auth:", error);
                // Fallback to auth screen on error
                setTimeout(() => {
                    navigator.navigate("Auth");
                }, 1000);
            } finally {
                setIsLoading(false);
            }
        };

        const handleOfflineMode = async () => {
            try {

                const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
                const user = await AsyncStorage.getItem("user");
                const subscribe = await AsyncStorage.getItem("subscribe");

                setTimeout(() => {
                    if (isLoggedIn === "true" && user) {
                        // User was logged in - navigate to appropriate screen
                        if (subscribe === "true") {
                            navigator.replace("DailyTrack");
                        } else {
                            navigator.replace("FaceScan");
                        }
                    } else {
                        // No cached login data - stay on home screen
                        navigator.replace("Auth");
                        setIsLoading(false);
                        Alert.alert(
                            "Offline Mode",
                            "You're currently offline. Some features may be limited.",
                            [{ text: "OK" }]
                        );
                    }
                }, 2000);
            } catch (error) {
                console.error("Offline mode error:", error);
                setIsLoading(false);
            }
        };

        const handleOnlineMode = async () => {
            try {
                const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
                const user = await AsyncStorage.getItem("user");
                const subscribe = await AsyncStorage.getItem("subscribe");

                setTimeout(() => {
                    if (isLoggedIn === "true" && user) {
                        if (subscribe === "true") {
                            navigator.navigate("DailyTrack");
                        } else {
                            navigator.navigate("FaceScan");
                        }
                    } else {
                        navigator.navigate("Auth");
                    }
                }, 4000);
            } catch (error) {
                console.error("Online mode error:", error);
                setTimeout(() => {
                    navigator.navigate("Auth");
                }, 1000);
            }
        };

        checkAuthAndNavigate();
    }, []);

    // Handle manual start button press
    const handleStartPress = () => {
        navigator.navigate("Auth");
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#000000] justify-center items-center px-4">
                <StatusBar style='light' />
                <View className="h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4">
                    <MaterialIcons name="face" size={30} color="#548ED7" />
                </View>
                <Text className="text-5xl my-4 text-white text-center">Welcome to FaceSculpt AI</Text>
                <Text className="text-xl text-white text-center mb-8">
                    {isOnline ? "Checking your account..." : "Offline Mode - Using cached data"}
                </Text>
                <Image source={Images.Icon} className='w-48 h-96' resizeMode='contain' />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#000000] px-4">
            <StatusBar style='light' />

            {/* Offline Indicator */}
            {!isOnline && (
                <View className="bg-yellow-500 p-3 rounded-lg mt-4">
                    <Text className="text-black text-center font-bold">
                        You are currently offline. Some features may be limited.
                    </Text>
                </View>
            )}

            <View className="mt-14 flex-1">
                <View className="h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4">
                    <MaterialIcons name="face" size={30} color="#548ED7" />
                </View>
                <Text className="text-5xl my-4 text-white">Welcome to FaceSculpt AI</Text>
                <Text className="text-xl text-white">Scan your face to get started</Text>
                <Image source={Images.Icon} className='mt-20 w-48 h-96 self-center' resizeMode='contain' />
            </View>

            <CustomButton name="Start Face Scan" onPress={handleStartPress} />

            <View className="flex-row my-4 items-center">
                <EvilIcons name="lock" size={28} color="white" />
                <Text className="text-white text-sm font-bold">Our App Protected by High Quality Security</Text>
            </View>
        </View>
    );
}

export default Home;