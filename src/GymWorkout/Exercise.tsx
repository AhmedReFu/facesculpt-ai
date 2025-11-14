import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import CustomButton from '../Components/CustomButton';

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View style={tw`flex-row items-start mb-3`}>
        <View style={tw`w-1.5 h-1.5 rounded-full bg-white mt-2 mr-3`} />
        <Text style={tw`text-[#9CA3AF] text-sm flex-1 leading-5`}>
            {text}
        </Text>
    </View>
);

const Exercise = () => {
    const navigator = useNavigation();

    const instructions = [
        'Sit upright with relaxed shoulders.',
        'Engage the target muscle gently first.',
        'Increase tension to a firm, pain-free hold.',
        'Breathe steadily through your nose.',
        'Release slowly and reset posture.',
    ];

    return (
        <View style={tw`flex-1 bg-[#000000]`}>
            <StatusBar style='light' />

            <View style={tw`px-6 mt-14`}>
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center py-4`}>
                        <TouchableOpacity
                            onPress={() => navigator.goBack()}
                            style={tw`absolute left-0 z-10`}
                        >
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>
                            Exercise Details
                        </Text>
                    </View>
                </View>
                <Text style={tw`text-[#9CA3AF] text-base leading-6`}>
                    Personalized from your latest scan.
                </Text>
            </View>

            <ScrollView
                style={tw`flex-1 px-6`}
                showsVerticalScrollIndicator={false}
            >
                <Text style={tw`text-white text-2xl font-semibold my-4`}>
                    Jaw Clench Hold
                </Text>

                <View style={tw`bg-[#1D2229] rounded-2xl p-10 flex-row items-center mb-6`}>
                    <View style={tw`bg-[#202F41] p-4 rounded-xl mr-4`}>
                        <Ionicons name="image" size={32} color="#60A5FB" />
                    </View>
                    <Text style={tw`text-white text-lg`}>
                        Diagram coming soon
                    </Text>
                </View>

                <Text style={tw`text-white text-lg font-semibold mb-4`}>
                    How to do it
                </Text>

                <View style={tw`mb-6`}>
                    {instructions.map((instruction, index) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                <View style={tw`h-24`} />
            </ScrollView>

            <View style={tw`px-6 pb-6 pt-4 bg-[#000000]`}>
                <CustomButton name="Start Exercise" route="Exercise" />
            </View>
        </View>
    );
};

export default Exercise;