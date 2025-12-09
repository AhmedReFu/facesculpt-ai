import { IMAGE_UPLOAD, IPA_BASE } from '@env';
import { Ionicons } from '@expo/vector-icons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const MAX_RETRY_ATTEMPTS = 10; // Maximum retry attempts for processing status
const RETRY_DELAY = 3000;

type RootStackParamList = {
    DailyTrack: undefined;
    ChooseGoal: undefined;
    Auth: undefined;
    FaceScan: undefined;
};

type FaceMetricsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ScanData {
    id: number;
    image: string;
    status: string;
    error_message: string;
    jawline_angle: number;
    symmetry_score: number;
    puffiness_index: number;
    created_at: string;
}

interface RouteParams {
    imageUri?: string;
    scanData?: ScanData;
    fullResponse?: any;
}

const FaceMetrics = () => {
    const toast = useToast();
    const navigation = useNavigation<FaceMetricsScreenNavigationProp>();
    const [scanData, setScanData] = useState<ScanData>();
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Extract scan data from route params
    useEffect(() => {

        getImageData();
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [])



    const getImageData = async () => {
        try {

            setIsLoading(true);
            // Get access token from AsyncStorage
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                toast.show("Authentication Required" + "Please log in to continue", "warning", null, [
                    { text: 'OK', action: 'custom', onPress: () => (navigation as any).replace('Login') }
                ])

                // Alert.alert(
                //     'Authentication Required',
                //     'Please log in to continue',
                //     [
                //         {
                //             text: 'OK',
                //             onPress: () => (navigation as any).replace('Login')
                //         }
                //     ]
                // );
                return;
            }



            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                },

            });



            const result = await response.json();
            // console.log(response)
            console.log('FaceMetrics Data Got:', result);
            console.log(result.data.status);
            if (result.data.status === "PROCESSING") {

                if (retryCount < MAX_RETRY_ATTEMPTS) {
                    // Retry after 3 seconds
                    retryTimeoutRef.current = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        getImageData();
                    }, RETRY_DELAY);
                } else {
                    toast.show({
                        message: result.data.error_message + "Please capture again.",
                        type: 'error',
                        style: 'center',
                        buttons: [
                            {
                                text: 'Try Again',
                                action: 'custom',
                                onPress: () => {
                                    setRetryCount(0);
                                    getImageData();
                                }
                            }
                        ]
                    });
                }
                return;
            }

            if (result.data.status === "FAILED") {
                setIsLoading(false);

                toast.show({
                    message: result.data.error_message + " Please capture again.",
                    type: 'error',
                    style: 'center',
                    buttons: [
                        {
                            text: 'OK',
                            action: 'custom',
                            onPress: () => (navigation as any).navigate('FaceScan')
                        }
                    ]
                });
                return;
            }


            // Handle 401 - Token expired
            if (response.status === 401) {
                setIsLoading(false);
                setRetryCount(0);
                await AsyncStorage.removeItem('token');
                // Alert.alert(
                //     'Session Expired',
                //     'Please log in again',
                //     [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
                // );
                toast.show('Session Expired' + 'Please log in again', "error", null, [
                    { text: 'OK', action: 'custom', onPress: () => (navigation as any).navigate('Auth') }
                ])
                return;
            }

            if (response.ok && result.success) {
                setIsLoading(false);
                setRetryCount(0);
                const apiData: ScanData = result.data;
                setScanData(apiData);
            } else {
                throw new Error(result.message || 'Failed to load FaceMetrics Data');
            }

        } catch (error) {

        }
    }


    // Use scan data or default values
    const jawlineAngle = scanData?.jawline_angle || 0;
    const symmetryScore = scanData?.symmetry_score || 0;
    const puffinessIndex = scanData?.puffiness_index || 0;

    // Calculate AI suggestion based on metrics
    const getAISuggestion = () => {
        const suggestions: string[] = [];

        if (jawlineAngle > 125) {
            suggestions.push('jawline');
        }
        if (symmetryScore < 90) {
            suggestions.push('symmetry');
        }
        if (puffinessIndex > 0.5) {
            suggestions.push('puffiness');
        }

        if (suggestions.length === 0) {
            return "Great job! Your metrics are on target.";
        }

        return `AI suggests working on ${suggestions.join(' and ')}.`;
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center`}>
                <ActivityIndicator size="large" color="#60A5FB" />
                <Text style={tw`text-white text-base mt-4`}>Loading your progress...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style='light' />
            <View style={tw`mt-2 flex-1`}>
                <View style={tw``}>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white text-3xl font-bold`}>Face Metrics</Text>
                        <TouchableOpacity
                            onPress={() => navigation.replace("DailyTrack")}
                        >
                            <Ionicons name="close" size={34} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={tw`text-[#9CA3AF] text-xl my-4`}>
                        From your latest scan
                    </Text>
                </View>


                <View style={tw`bg-[#1F2937] p-4 rounded-2xl`}>
                    <View style={tw`flex-row items-center`}>
                        <View style={tw`bg-[#60A5FB] rounded-md p-1 mr-4`}>
                            <EvilIcons name="chart" size={20} color="black" />
                        </View>
                        <Text style={tw`text-white text-2xl`}>Face Metrics</Text>
                    </View>

                    {/* Jawline Angle */}
                    <View style={tw`flex-row items-center my-2 mt-4 justify-between`}>
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>Jawline Angle</Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>Goal 118°</Text>
                        </View>
                        <View>
                            <Text style={[
                                tw`text-xl font-semibold`,
                                jawlineAngle <= 125 ? tw`text-green-400` : tw`text-white`
                            ]}>
                                {jawlineAngle > 0 ? `${jawlineAngle.toFixed(1)}°` : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* Symmetry Score */}
                    <View style={tw`flex-row items-center my-2 justify-between`}>
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>Symmetry Score</Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>Goal 97%</Text>
                        </View>
                        <View>
                            <Text style={[
                                tw`text-xl font-semibold`,
                                symmetryScore >= 90 ? tw`text-green-400` : tw`text-white`
                            ]}>
                                {symmetryScore > 0 ? `${symmetryScore.toFixed(1)}%` : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* Puffiness Index */}
                    <View style={tw`flex-row items-center my-2 justify-between`}>
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>Puffiness Index</Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>Goal 0.30</Text>
                        </View>
                        <View>
                            <Text style={[
                                tw`text-xl font-semibold`,
                                puffinessIndex <= 0.5 ? tw`text-green-400` : tw`text-white`
                            ]}>
                                {puffinessIndex > 0 ? puffinessIndex.toFixed(2) : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* AI Suggestion */}
                    <Text style={tw`text-white text-base mt-2`}>
                        {getAISuggestion()}
                    </Text>
                </View>

                <Text style={tw`text-white text-xl mt-6`}>Next, choose your focus goal</Text>
                <Text style={tw`text-[#9CA3AF] text-base my-2`}>
                    We'll tailor a 7-day routine around it. You can change anytime.
                </Text>
            </View>

            <View style={tw`my-6`}>
                <CustomButton name="Set Goals" route="ChooseGoal" />
            </View>
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

export default FaceMetrics;