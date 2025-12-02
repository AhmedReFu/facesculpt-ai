import { Ionicons } from '@expo/vector-icons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';

type RootStackParamList = {
    DailyTrack: undefined;
    ChooseGoal: undefined;
};

type FaceMetricsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ScanData {
    id: number;
    image: string;
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
    const navigator = useNavigation<FaceMetricsScreenNavigationProp>();
    const route = useRoute();
    const params = route.params as RouteParams;

    // Extract scan data from route params

    const scanData = params?.scanData;

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

    return (
        <SafeAreaView style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style='light' />
            <View style={tw`mt-2 flex-1`}>
                <View style={tw``}>
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white text-3xl font-bold`}>Face Metrics</Text>
                        <TouchableOpacity
                            onPress={() => navigator.replace("DailyTrack")}
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
        </SafeAreaView>
    );
}

export default FaceMetrics;