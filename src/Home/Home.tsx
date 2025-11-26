import EvilIcons from '@expo/vector-icons/EvilIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import CustomButton from '../Components/CustomButton';
import { Images } from '../constants';
import { useNavigationReset } from '../lib/useNavigationReset';

const Home = () => {
    const navigator = useNavigation();
    useNavigationReset();
    useEffect(() => {
        const checkAuthAndNavigate = async () => {
            try {
                const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
                const user = await AsyncStorage.getItem("user");
                const subscribe = await AsyncStorage.getItem("subscribe");
                setTimeout(() => {
                    if (isLoggedIn === "true" && user) {
                        if (subscribe === "true") {
                            navigator.navigate("DailyTrack");
                        } else {
                            navigator.navigate("FaceScan")
                        }

                    } else {
                        navigator.navigate("Auth");
                    }
                }, 4000);
            } catch (error) {
                console.error("Error checking auth:", error);
                setTimeout(() => {
                    navigator.navigate("Auth");
                }, 1000);
            }
        };

        checkAuthAndNavigate();
    }, []);

    return (
        <View className="flex-1 bg-[#000000] px-4">
            <StatusBar style='light' />
            <View className="mt-14 flex-1">
                <View className="h-16 w-16 bg-[#202F41] rounded-lg items-center justify-center my-4">
                    <MaterialIcons name="face" size={30} color="#548ED7" />
                </View>
                <Text className="text-5xl my-4 text-white">Welcome to FaceSculpt AI</Text>
                <Text className="text-xl text-white">Scan your face to get started</Text>
                <Image source={Images.Icon} className='mt-20 w-48 h-96 self-center' resizeMode='contain' />
            </View>

            <CustomButton name="Start Face Scan" route="Auth" />

            <View className="flex-row my-4 items-center">
                <EvilIcons name="lock" size={28} color="white" />
                <Text className="text-white text-sm font-bold">Our App Protected by High Quality Security</Text>
            </View>
        </View>
    );
}

export default Home;