import { IPA_BASE, SET_GOALS } from '@env'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    SET_GOALS: SET_GOALS,
};

interface GoalItemProps {
    label: string
    isSelected: boolean
    onPress: () => void
}

type RootStackParamList = {
    Home: undefined;
    FaceMetrics: undefined;
    DailyTrack: undefined;
    UnlockFacialGym: undefined;
    Login: undefined;
};

type ChooseGoalScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const GoalItem = ({ label, isSelected, onPress }: GoalItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={tw`border-2 ${isSelected
            ? 'bg-[#60A5FA] border-[#60A5FA]'
            : 'bg-transparent border-white'
            } my-1 rounded-full px-4 py-2 flex-row items-center`}
        activeOpacity={0.7}
    >
        {isSelected && (
            <Ionicons name="checkmark" size={20} color="black" style={tw`mr-2`} />
        )}
        <Text style={tw` text-base font-medium ${isSelected ? 'text-black' : 'text-white'}`}>{label}</Text>
    </TouchableOpacity>
)

const ChooseGoal = () => {
    const navigator = useNavigation<ChooseGoalScreenNavigationProp>()

    const [selectedGoals, setSelectedGoals] = useState<string[]>([
        'Sharper Jawline',
        'Improve Symmetry'
    ])
    const [loading, setLoading] = useState(false)

    const goals = [
        { label: 'Sharper Jawline' },
        { label: 'Reduce Puffiness' },
        { label: 'Improve Symmetry' },
    ]

    const toggleGoal = (goalLabel: string) => {
        if (selectedGoals.includes(goalLabel)) {
            setSelectedGoals(selectedGoals.filter(goal => goal !== goalLabel))
        } else {
            setSelectedGoals([...selectedGoals, goalLabel])
        }
    }

    const isGoalSelected = (goalLabel: string) => {
        return selectedGoals.includes(goalLabel)
    }

    const handleSetGoals = async () => {
        if (selectedGoals.length === 0) {
            Alert.alert('No Goals Selected', 'Please select at least one goal');
            return;
        }

        try {
            setLoading(true);

            // Get access token
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                Alert.alert(
                    'Authentication Required',
                    'Please log in to continue',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigator.replace('Login')
                        }
                    ]
                );
                return;
            }

            // Prepare form data
            const formData = new FormData();
            selectedGoals.forEach((goal, index) => {
                formData.append('goals', goal);
            });

            // Send goals to API
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SET_GOALS}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const result = await response.json();
            console.log('Set Goals Response:', result);

            // Handle 401 - Token expired
            if (response.status === 401) {
                await AsyncStorage.removeItem('token');
                Alert.alert(
                    'Session Expired',
                    'Please log in again',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigator.replace('Login')
                        }
                    ]
                );
                return;
            }

            // Check if goals were set successfully
            if (response.ok && result.success) {
                console.log('Goals set successfully!');

        // Check subscription status
                const subscribe = await AsyncStorage.getItem("subscribe");

                if (subscribe === "true") {
                    // User has subscription - go to DailyTrack
                    navigator.replace("DailyTrack");
                } else {
                    // No subscription - go to unlock page
                    navigator.replace("UnlockFacialGym");
                }
            } else {
                // API returned error
                throw new Error(result.message || 'Failed to set goals');
            }

        } catch (error) {
            console.error('Error setting goals:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to set goals. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style='light' />
            <View style={tw`mt-2 flex-1`}>
                <View style={tw`mb-6`}>
                    <View style={tw`flex-row justify-between items-start`}>
                        <Text style={tw`text-white text-3xl font-bold flex-1 mr-4`}>
                            Choose Your Goal
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigator.replace("FaceMetrics")}
                            style={tw`mt-1`}
                            disabled={loading}
                        >
                            <Ionicons name="close" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={tw`text-[#9CA3AF] text-base mt-4 leading-6`}>
                        All goals selected. Deselect any you don't want — your plan adapts automatically.
                    </Text>
                </View>
                <View style={tw`flex-row flex-wrap gap-3`}>
                    {goals.map((goal, index) => (
                        <GoalItem
                            key={index}
                            label={goal.label}
                            isSelected={isGoalSelected(goal.label)}
                            onPress={() => !loading && toggleGoal(goal.label)}
                        />
                    ))}
                </View>

                {/* Selected Count */}
                <View style={tw`mt-6`}>
                    <Text style={tw`text-[#9CA3AF] text-sm`}>
                        {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} selected
                    </Text>
                </View>
            </View>
            <View style={tw`my-6`}>
                <TouchableOpacity
                    onPress={handleSetGoals}
                    activeOpacity={0.8}
                    disabled={loading || selectedGoals.length === 0}
                    style={tw`bg-[#60A5FB] p-5 rounded-xl flex-row gap-2 items-center justify-center ${loading || selectedGoals.length === 0 ? 'opacity-50' : ''
                        }`}
                >
                    {loading ? (
                        <>
                            <ActivityIndicator color="white" />
                            <Text style={tw`text-center text-white text-xl font-semibold ml-2`}>
                                Setting Goals...
                            </Text>
                        </>
                    ) : (
                        <Text style={tw`text-center text-white text-xl font-semibold`}>
                            Set My Goals
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default ChooseGoal