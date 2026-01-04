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
import tw from 'twrnc';
import CustomButton from '../Components/CustomButton';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    IMAGE_UPLOAD: IMAGE_UPLOAD,
};

const MAX_RETRY_ATTEMPTS = 10;
const RETRY_DELAY = 5000; // 5 seconds

// ---- Goal values (science/logic based) ----
// Smaller jawline angle = sharper jaw. Here <= 118° considered "on target"
const JAWLINE_GOAL = 118; // degrees

// Higher symmetry % = better balance. 97%+ considered very balanced
const SYMMETRY_GOAL = 97; // percent

// Lower puffiness index = less swelling. <= 0.20 considered good
const PUFFINESS_GOAL = 0.2; // index

type RootStackParamList = {
    DailyTrack: undefined;
    ChooseGoal: undefined;
    Auth: undefined;
    FaceScanWithDetection: undefined;
};

type FaceMetricsScreenNavigationProp = StackNavigationProp<
    RootStackParamList
>;

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

const FaceMetrics = () => {
    const toast = useToast();
    const navigation = useNavigation<FaceMetricsScreenNavigationProp>();
    const [scanData, setScanData] = useState<ScanData>();
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // initial delay so backend has time to process
        const t = setTimeout(() => {
            getImageData();
        }, 20000);

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            clearTimeout(t);
        };
    }, []);


    const getImageData = async () => {
        try {
            setIsLoading(true);

            // Get access token from AsyncStorage
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                setIsLoading(false);
                toast.show({
                    message: 'Authentication Required. Please log in to continue.',
                    type: 'warning',
                    style: 'center',
                    buttons: [
                        {
                            text: 'OK',
                            action: 'custom',
                            onPress: () => navigation.navigate('Auth'),
                        },
                    ],
                });
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const result = await response.json();
            console.log('FaceMetrics Data:', result);

            // Handle 401 - Token expired
            if (response.status === 401) {
                setIsLoading(false);
                setRetryCount(0);
                await AsyncStorage.removeItem('token');
                toast.show({
                    message: 'Session Expired. Please log in again.',
                    type: 'error',
                    style: 'center',
                    buttons: [
                        {
                            text: 'OK',
                            action: 'custom',
                            onPress: () => navigation.navigate('Auth'),
                        },
                    ],
                });
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Failed to load face metrics data',
                );
            }

            const status = result.data.status?.toUpperCase();

            // Handle PROCESSING status with retry
            if (status === 'PROCESSING') {
                console.log(
                    `⏳ Processing... (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
                );

                if (retryCount < MAX_RETRY_ATTEMPTS) {
                    // Retry after delay
                    retryTimeoutRef.current = setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        getImageData();
                    }, RETRY_DELAY);
                } else {
                    // Max retries reached
                    setIsLoading(false);
                    setRetryCount(0);
                    toast.show({
                        message:
                            'Processing is taking longer than expected. Please try scanning again.',
                        type: 'warning',
                        style: 'center',
                        buttons: [
                            {
                                text: 'Try Again',
                                action: 'custom',
                                onPress: () => {
                                    setRetryCount(0);
                                    navigation.navigate('FaceScanWithDetection');
                                },
                            },
                            { text: 'Cancel', action: 'dismiss' },
                        ],
                    });
                }
                return;
            }

            // Handle FAILED status
            if (status === 'FAILED') {
                setIsLoading(false);
                setRetryCount(0);
                toast.show({
                    message: `${result.data.error_message || 'Face scan failed'
                        }. Please try again.`,
                    type: 'error',
                    style: 'center',
                    buttons: [
                        {
                            text: 'Scan Again',
                            action: 'custom',
                            onPress: () => navigation.navigate('FaceScanWithDetection'),
                        },
                    ],
                });
                return;
            }

            // Handle SUCCESS status
            if (status === 'COMPLETED') {
                // Validate metrics data
                if (
                    typeof result.data.symmetry_score === 'number' &&
                    typeof result.data.puffiness_index === 'number' &&
                    typeof result.data.jawline_angle === 'number'
                ) {
                    setTimeout(() => {
                        setRetryCount(0);
                        const apiData: ScanData = result.data;
                        setScanData(apiData);
                        setIsLoading(false);
                        console.log('✅ Face metrics loaded successfully');
                    }, 1000);
                } else {
                    // Missing metrics data
                    setIsLoading(false);
                    setRetryCount(0);
                    setScanData(undefined);
                    toast.show({
                        message:
                            'Unable to analyze face properly. Please ensure good lighting and try again.',
                        type: 'error',
                        style: 'center',
                        buttons: [
                            {
                                text: 'Scan Again',
                                action: 'custom',
                                onPress: () => navigation.navigate('FaceScanWithDetection'),
                            },
                        ],
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error fetching face metrics:', error);
            setIsLoading(false);
            setRetryCount(0);
            toast.show({
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to load face metrics. Please try again.',
                type: 'error',
                style: 'center',
                buttons: [
                    {
                        text: 'Retry',
                        action: 'custom',
                        onPress: () => {
                            setRetryCount(0);
                            getImageData();
                        },
                    },
                    { text: 'Cancel', action: 'dismiss' },
                ],
            });
        }
    };

    // Use scan data or default values
    const jawlineAngle = scanData?.jawline_angle || 0;
    const symmetryScore = scanData?.symmetry_score || 0;
    const puffinessIndex = scanData?.puffiness_index || 0;

    // ---- Boolean flags for each metric ----
    const jawlineIsGood =
        jawlineAngle > 0 && jawlineAngle <= JAWLINE_GOAL; // smaller or equal is better
    const symmetryIsGood =
        symmetryScore > 0 && symmetryScore >= SYMMETRY_GOAL; // larger or equal is better
    const puffinessIsGood =
        puffinessIndex > 0 && puffinessIndex <= PUFFINESS_GOAL; // smaller or equal is better

    // Colors: green = meets goal, red = below/above goal, white = no data
    const jawlineColorStyle =
        jawlineAngle === 0
            ? tw`text-white`
            : jawlineIsGood
                ? tw`text-green-400`
                : tw`text-red-400`;

    const symmetryColorStyle =
        symmetryScore === 0
            ? tw`text-white`
            : symmetryIsGood
                ? tw`text-green-400`
                : tw`text-red-400`;

    const puffinessColorStyle =
        puffinessIndex === 0
            ? tw`text-white`
            : puffinessIsGood
                ? tw`text-green-400`
                : tw`text-red-400`;

    // Calculate AI suggestion based on metrics vs goals
    const getAISuggestion = () => {
        const suggestions: string[] = [];

        if (!jawlineIsGood) {
            suggestions.push('jawline angle');
        }
        if (!symmetryIsGood) {
            suggestions.push('symmetry');
        }
        if (!puffinessIsGood) {
            suggestions.push('puffiness');
        }

        if (suggestions.length === 0) {
            return 'Nice! Your metrics are within the target range. Keep maintaining healthy habits.';
        }

        return `AI suggests focusing a bit more on ${suggestions.join(
            ' and ',
        )}. Remember, these are just guidance metrics – not a judgment.`;
    };

    // Loading State
    if (isLoading) {
        return (
            <SafeAreaView
                style={tw`flex-1 bg-[#0D0F14] justify-center items-center px-4`}
            >
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#60A5FB" />
                <Text style={tw`text-white text-xl mt-4`}>
                    {retryCount > 0
                        ? 'Processing your face scan...'
                        : 'Analyzing your face data...'}
                </Text>
                {retryCount > 0 && (
                    <Text style={tw`text-[#9CA3AF] text-base mt-2`}>
                        Attempt {retryCount}/{MAX_RETRY_ATTEMPTS}
                    </Text>
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style="light" />
            <View style={tw`mt-2 flex-1`}>
                <View>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white text-3xl font-bold`}>Face Metrics</Text>
                        <TouchableOpacity
                            onPress={() => navigation.replace('DailyTrack')}
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
                    <View
                        style={tw`flex-row items-center my-2 mt-4 justify-between`}
                    >
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>Jawline Angle</Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>
                                Goal {JAWLINE_GOAL}°
                            </Text>
                        </View>
                        <View>
                            <Text style={[tw`text-xl font-semibold`, jawlineColorStyle]}>
                                {jawlineAngle > 0
                                    ? `${jawlineAngle.toFixed(1)}°`
                                    : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* Symmetry Score */}
                    <View style={tw`flex-row items-center my-2 justify-between`}>
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>
                                Symmetry Score
                            </Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>
                                Goal {SYMMETRY_GOAL}%
                            </Text>
                        </View>
                        <View>
                            <Text
                                style={[tw`text-xl font-semibold`, symmetryColorStyle]}
                            >
                                {symmetryScore > 0
                                    ? `${symmetryScore.toFixed(1)}%`
                                    : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* Puffiness Index */}
                    <View style={tw`flex-row items-center my-2 justify-between`}>
                        <View>
                            <Text style={tw`text-[#9CA3AF] text-lg`}>
                                Puffiness Index
                            </Text>
                            <Text style={tw`text-[#9CA3AF] text-sm`}>
                                Goal {PUFFINESS_GOAL.toFixed(2)}
                            </Text>
                        </View>
                        <View>
                            <Text
                                style={[tw`text-xl font-semibold`, puffinessColorStyle]}
                            >
                                {puffinessIndex > 0
                                    ? puffinessIndex.toFixed(2)
                                    : '--'}
                            </Text>
                        </View>
                    </View>

                    {/* AI Suggestion */}
                    <Text style={tw`text-white text-base mt-2`}>
                        {getAISuggestion()}
                    </Text>
                </View>

                <Text style={tw`text-white text-xl mt-6`}>
                    Next, choose your focus goal
                </Text>
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
};

export default FaceMetrics;
/*
import { IMAGE_UPLOAD, IPA_BASE } from '@env'; import { Ionicons } from '@expo/vector-icons'; import EvilIcons from '@expo/vector-icons/EvilIcons'; import AsyncStorage from '@react-native-async-storage/async-storage'; import { useNavigation } from '@react-navigation/native'; import { StackNavigationProp } from '@react-navigation/stack'; import { StatusBar } from 'expo-status-bar'; import React, { useEffect, useRef, useState } from 'react'; import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'; import { SafeAreaView } from 'react-native-safe-area-context'; import tw from "twrnc"; import CustomButton from '../Components/CustomButton'; import { useNavigationReset } from '../hooks/useNavigationReset'; import { Toast, useToast } from '../hooks/useToost'; const API_BASE_URL = IPA_BASE; const API_ENDPOINTS = { IMAGE_UPLOAD: IMAGE_UPLOAD, }; const MAX_RETRY_ATTEMPTS = 10; const RETRY_DELAY = 5000; // 5 seconds type RootStackParamList = { DailyTrack: undefined; ChooseGoal: undefined; Auth: undefined; FaceScanWithDetection: undefined; }; type FaceMetricsScreenNavigationProp = StackNavigationProp<RootStackParamList>; interface ScanData { id: number; image: string; status: string; error_message: string; jawline_angle: number; symmetry_score: number; puffiness_index: number; created_at: string; } const FaceMetrics = () => { const toast = useToast(); const navigation = useNavigation<FaceMetricsScreenNavigationProp>(); const [scanData, setScanData] = useState<ScanData>(); const [isLoading, setIsLoading] = useState(true); const [retryCount, setRetryCount] = useState(0); const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); useEffect(() => { setTimeout(() => { getImageData(); }, 20000) return () => { if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); } }; }, []); useNavigationReset(); const getImageData = async () => { try { setIsLoading(true); // Get access token from AsyncStorage const accessToken = await AsyncStorage.getItem('token'); if (!accessToken) { setIsLoading(false); toast.show({ message: 'Authentication Required. Please log in to continue.', type: 'warning', style: 'center', buttons: [ { text: 'OK', action: 'custom', onPress: () => navigation.navigate('Auth') } ] }); return; } const response = await fetch(${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}, { method: 'GET', headers: { 'Authorization': Bearer ${accessToken}, 'Content-Type': 'application/json', }, }); const result = await response.json(); console.log('FaceMetrics Data:', result); // Handle 401 - Token expired if (response.status === 401) { setIsLoading(false); setRetryCount(0); await AsyncStorage.removeItem('token'); toast.show({ message: 'Session Expired. Please log in again.', type: 'error', style: 'center', buttons: [ { text: 'OK', action: 'custom', onPress: () => navigation.navigate('Auth') } ] }); return; } if (!response.ok || !result.success) { throw new Error(result.message || 'Failed to load face metrics data'); } const status = result.data.status?.toUpperCase(); // Handle PROCESSING status with retry if (status === 'PROCESSING') { console.log(⏳ Processing... (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})); if (retryCount < MAX_RETRY_ATTEMPTS) { // Retry after delay retryTimeoutRef.current = setTimeout(() => { setRetryCount(prev => prev + 1); getImageData(); }, RETRY_DELAY); } else { // Max retries reached setIsLoading(false); setRetryCount(0); toast.show({ message: 'Processing is taking longer than expected. Please try scanning again.', type: 'warning', style: 'center', buttons: [ { text: 'Try Again', action: 'custom', onPress: () => { setRetryCount(0); navigation.navigate('FaceScanWithDetection'); } }, { text: 'Cancel', action: 'dismiss' } ] }); } return; } // Handle FAILED status if (status === 'FAILED') { setIsLoading(false); setRetryCount(0); toast.show({ message: ${result.data.error_message || 'Face scan failed'}. Please try again., type: 'error', style: 'center', buttons: [ { text: 'Scan Again', action: 'custom', onPress: () => navigation.navigate('FaceScanWithDetection') } ] }); return; } // Handle SUCCESS status if (status === 'COMPLETED') { // Validate metrics data if (result.data.symmetry_score && result.data.puffiness_index && result.data.jawline_angle) { setTimeout(() => { setRetryCount(0); const apiData: ScanData = result.data; setScanData(apiData); setIsLoading(false); console.log('✅ Face metrics loaded successfully'); }, 1000); } else { // Missing metrics data setIsLoading(false); setRetryCount(0); setScanData(undefined); toast.show({ message: 'Unable to analyze face properly. Please ensure good lighting and try again.', type: 'error', style: 'center', buttons: [ { text: 'Scan Again', action: 'custom', onPress: () => navigation.navigate('FaceScanWithDetection') } ] }); } } } catch (error) { console.error('❌ Error fetching face metrics:', error); setIsLoading(false); setRetryCount(0); toast.show({ message: error instanceof Error ? error.message : 'Failed to load face metrics. Please try again.', type: 'error', style: 'center', buttons: [ { text: 'Retry', action: 'custom', onPress: () => { setRetryCount(0); getImageData(); } }, { text: 'Cancel', action: 'dismiss' } ] }); } }; // Use scan data or default values const jawlineAngle = scanData?.jawline_angle || 0; const symmetryScore = scanData?.symmetry_score || 0; const puffinessIndex = scanData?.puffiness_index || 0; // Calculate AI suggestion based on metrics const getAISuggestion = () => { const suggestions: string[] = []; if (jawlineAngle > 125) { suggestions.push('jawline'); } if (symmetryScore < 90) { suggestions.push('symmetry'); } if (puffinessIndex > 0.5) { suggestions.push('puffiness'); } if (suggestions.length === 0) { return "Great job! Your metrics are on target."; } return AI suggests working on ${suggestions.join(' and ')}.; }; // Loading State if (isLoading) { return ( <SafeAreaView style={twflex-1 bg-[#0D0F14] justify-center items-center px-4}> <StatusBar style='light' /> <ActivityIndicator size="large" color="#60A5FB" /> <Text style={twtext-white text-xl mt-4}> {retryCount > 0 ? 'Processing your face scan...' : 'Analyzing your face data...'} </Text> {retryCount > 0 && ( <Text style={twtext-[#9CA3AF] text-base mt-2}> Attempt {retryCount}/{MAX_RETRY_ATTEMPTS} </Text> )} </SafeAreaView> ); } return ( <SafeAreaView style={twflex-1 bg-[#000000] px-4}> <StatusBar style='light' /> <View style={twmt-2 flex-1}> <View style={tw`}> <View style={twflex-row justify-between}> <Text style={twtext-white text-3xl font-bold}>Face Metrics</Text> <TouchableOpacity onPress={() => navigation.replace("DailyTrack")} > <Ionicons name="close" size={34} color="white" /> </TouchableOpacity> </View> <Text style={twtext-[#9CA3AF] text-xl my-4}> From your latest scan </Text> </View> <View style={twbg-[#1F2937] p-4 rounded-2xl}> <View style={twflex-row items-center}> <View style={twbg-[#60A5FB] rounded-md p-1 mr-4}> <EvilIcons name="chart" size={20} color="black" /> </View> <Text style={twtext-white text-2xl}>Face Metrics</Text> </View> {/* Jawline Angle } <View style={twflex - row items-center my-2 mt-4 justify-between}> <View> <Text style={twtext - [#9CA3AF] text-lg}>Jawline Angle</Text> <Text style={twtext - [#9CA3AF] text-sm}>Goal 118°</Text> </View > <View> <Text style={[twtext - xl font - semibold, jawlineAngle <= 125 ? twtext - green - 400 : twtext - white]}> {jawlineAngle > 0 ? ${jawlineAngle.toFixed(1)}° : '--'} </Text> </View> </View > {/* Symmetry Score  } < View style = { twflex- row items - center my - 2 justify - between}> <View> <Text style={twtext-[#9CA3AF] text-lg}>Symmetry Score</Text> <Text style={twtext-[#9CA3AF] text-sm}>Goal 97%</Text> </View > <View> <Text style={[twtext - xl font - semibold, symmetryScore >= 90 ? twtext - green - 400 : twtext - white]}> {symmetryScore > 0 ? ${symmetryScore.toFixed(1)}% : '--'} </Text> </View> </ > {/* Puffiness Index  } < View style = { twflex- row items - center my - 2 justify - between}> <View> <Text style={twtext-[#9CA3AF] text-lg}>Puffiness Index</Text> <Text style={twtext-[#9CA3AF] text-sm}>Goal 0.30</Text> </View > <View> <Text style={[twtext - xl font - semibold, puffinessIndex <= 0.5 ? twtext - green - 400 : twtext - white]}> {puffinessIndex > 0 ? puffinessIndex.toFixed(2) : '--'} </Text> </View> </ > {/* AI Suggestion  } < Text style = { twtext- white text - base mt - 2}> { getAISuggestion() } </ > </View > <Text style={twtext-white text-xl mt-6}>Next, choose your focus goal</Text> <Text style={twtext-[#9CA3AF] text-base my-2}> We'll tailor a 7-day routine around it. You can change anytime. </Text> </View > <View style={twmy-6}> <CustomButton name="Set Goals" route="ChooseGoal" /> </View> <Toast style={toast.style} visible={toast.visible} message={toast.message} type={toast.type} fadeAnim={toast.fadeAnim} buttons={toast.buttons} onHide={toast.hide} /> </SafeAreaView > ); }; export default FaceMetrics;
*/