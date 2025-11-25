// screens/Exercise.tsx
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import { RootStackParamList } from '../types/navigation';
import { useWorkout } from '../utils/WorkoutProvider';

// Define the route prop type for this screen
type ExerciseScreenRouteProp = RouteProp<RootStackParamList, 'Exercise'>;

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View style={tw`flex-row items-start mb-3`}>
        <View style={tw`w-1.5 h-1.5 rounded-full bg-white mt-2 mr-3`} />
        <Text style={tw`text-[#9CA3AF] text-lg flex-1 leading-6`}>
            {text}
        </Text>
    </View>
);

const Exercise = () => {
    const navigation = useNavigation();
    // Properly typed route
    const { exercises } = useWorkout();

    const route = useRoute<ExerciseScreenRouteProp>();
    const exerciseId = route.params.exerciseId;
    // Now TypeScript knows exerciseId exists

    const exercise = exercises.find(ex => ex.id === exerciseId) || exercises[0];

    const handleStartExercise = () => {
        // Properly typed navigation
        navigation.navigate('Sessions', {
            exerciseId: exercise.id,
        });
    };

    return (
        <View style={tw`flex-1 bg-[#000000]`}>
            <StatusBar style='light' />

            <View style={tw`px-4 mt-14`}>
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={tw`absolute left-0 z-10`}
                        >
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>
                            Exercise
                        </Text>
                    </View>
                </View>
                <Text style={tw`text-white text-2xl font-bold my-8`}>
                    {exercise.name}
                </Text>
            </View>

            <ScrollView
                style={tw`flex-1 px-4`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`bg-[#1D2229] rounded-2xl p-14 flex-row items-center mb-6`}>
                    <View style={tw`bg-[#202F41] p-4 rounded-xl mr-4`}>
                        <Ionicons name="image" size={32} color="#60A5FB" />
                    </View>
                    <Text style={tw`text-white text-base`}>
                        Diagram coming soon
                    </Text>
                </View>

                <Text style={tw`text-white text-lg font-semibold mb-4`}>
                    How to do it
                </Text>

                <View style={tw`mb-6`}>
                    {exercise.instructions.map((instruction: string, index: number) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                <View style={tw`h-24`} />
            </ScrollView>

            <View style={tw`px-6 pb-6 pt-4 bg-[#000000]`}>
                <TouchableOpacity
                    onPress={handleStartExercise}
                    style={tw`bg-[#60A5FB] py-5 rounded-2xl`}
                    activeOpacity={0.8}
                >
                    <Text style={tw`text-white text-center font-bold text-lg`}>
                        Start Exercise
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Exercise;