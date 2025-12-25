import { IPA_BASE, REFRESH_TOKEN } from '@env';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { Toast, useToast } from '../hooks/useToost';
import { useNavigationReset } from '../lib/useNavigationReset';
import { RootStackParamList } from '../types/navigation';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    REFRESH_TOKEN: REFRESH_TOKEN,
};

type ChooseGoalScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const Home = () => {
    const toast = useToast();
    const navigator = useNavigation<ChooseGoalScreenNavigationProp>();
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    useNavigationReset();

    useEffect(() => {
        const checkAuthAndNavigate = async () => {
            setIsLoading(true);

            try {
                const netState = await NetInfo.fetch();
                setIsOnline(netState.isConnected ?? true);

                if (!netState.isConnected) {
                    await handleOfflineMode();
                    return;
                }

                await handleOnlineMode();
            } catch (error) {
                console.error("Error checking auth:", error);
                toast.show({
                    message: 'Error checking authentication',
                    type: 'error',
                    style: 'top',
                    duration: 3000
                });

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
                        if (subscribe === "true") {
                            navigator.replace("DailyTrack");
                        } else {
                            navigator.replace("FaceScanWithDetection");
                        }
                    } else {
                        navigator.replace("Auth");
                        setIsLoading(false);
                        toast.show({
                            message: "You're currently offline. Some features may be limited.",
                            type: 'warning',
                            style: 'center',
                            buttons: [{ text: 'OK', action: 'dismiss' }]
                        });
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
                const token = await AsyncStorage.getItem("token");
                const refreshToken = AsyncStorage.getItem("refresh_token");
                const user = await AsyncStorage.getItem("user");
                const subscribe = await AsyncStorage.getItem("subscribe");
                // if (token) {
                   
                // } else {
                //     const bodyPayLoad = {
                //         refresh: refreshToken
                //     }
                //     const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
                //         method: 'POST',
                //         headers: {
                //             'Content-Type': 'application/json',
                //         },
                //         body: JSON.stringify(bodyPayLoad)
                //     });
                //     const result = await response.json()
                //     if (response.ok) {
                //         await AsyncStorage.setItem('token', result.data.access);
                //         if (isLoggedIn === "true" && user) {
                //             if (subscribe === "true") {
                //                 navigator.navigate("DailyTrack");
                //             } else {
                //                 navigator.navigate("FaceScan");
                //             }
                //         } else {
                //             navigator.navigate("Auth");
                //         }
                //     } else {
                //         navigator.navigate("Auth");
                //     }
                // }
                setTimeout(() => {
                    if (isLoggedIn === "true" && user) {
                        if (subscribe === "true") {
                            navigator.navigate("DailyTrack");    
                        } else {
                            navigator.navigate("FaceScanWithDetection");
                        }
                    } else {
                        navigator.navigate("Auth");
                    }
                }, 2000);
            } catch (error) {
                console.error("Online mode error:", error);
                setTimeout(() => {
                    navigator.navigate("Auth");
                }, 1000);
            }
        };

        checkAuthAndNavigate();
    }, []);



    // Loading Screen
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#000000] justify-center items-center px-4">
                <StatusBar style='light' />
                <View className="h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4">
                    <MaterialIcons name="face" size={30} color="#548ED7" />
                </View>
                <Text className="text-5xl my-4 text-white text-center">
                    Welcome to FaceSculpt AI
                </Text>
                <Text className="text-xl text-white text-center mb-8">
                    {isOnline ? "Checking your account..." : "Offline Mode - Using cached data"}
                </Text>
                <Image source={Images.Icon} className='w-48 h-96' resizeMode='contain' />

                <Toast
                    style={toast.style}
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    fadeAnim={toast.fadeAnim}
                    buttons={toast.buttons}
                    onHide={toast.hide}
                />
            </SafeAreaView>
        );
    }

    // Main Screen
    return (
        <SafeAreaView className="flex-1 bg-[#000000]">
            <StatusBar style='light' />

            <View className="flex-1 px-4">
                {/* Offline Indicator */}
                {!isOnline && (
                    <View className="bg-yellow-500 p-3 rounded-lg mt-4">
                        <Text className="text-black text-center font-bold">
                            You are currently offline. Some features may be limited.
                        </Text>
                    </View>
                )}

                {/* Main Content */}
                <View className="mt-14 flex-1">
                    <View className="h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4">
                        <MaterialIcons name="face" size={30} color="#548ED7" />
                    </View>
                    <Text className="text-5xl my-4 text-white">
                        Welcome to FaceSculpt AI
                    </Text>
                    <Text className="text-xl text-white">
                        Scan your face to get started
                    </Text>
                    <Image
                        source={Images.Icon}
                        className='mt-20 w-48 h-96 self-center'
                        resizeMode='contain'
                    />
                </View>

                {/* Button */}

                <TouchableOpacity
                    disabled
                    className='bg-[#60A5FB] p-5 rounded-xl flex-row gap-2 items-center justify-center'>
                    <Text className='text-center text-white text-xl font-semibold'>Start Face Scan</Text>
                </TouchableOpacity>

                {/* Security Info */}
                <View className="flex-row my-4 items-center">
                    <EvilIcons name="lock" size={28} color="white" />
                    <Text className="text-white text-sm font-bold ml-2">
                        Our App Protected by High Quality Security
                    </Text>
                </View>
            </View>

            {/* Toast Component */}
            <Toast
                style={toast.style}
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                onHide={toast.hide}
            />
        </SafeAreaView>
    );
};

export default Home;