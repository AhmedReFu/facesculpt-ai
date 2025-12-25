import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useWorkout } from '../utils/WorkoutProvider';

type ExerciseScreenRouteProp = RouteProp<RootStackParamList, 'Exercise'>;

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View className="flex-row items-start mb-3">
        <View className="w-1.5 h-1.5 rounded-full bg-white mt-2 mr-3" />
        <Text className="text-[#9CA3AF] text-lg flex-1 leading-6">{text}</Text>
    </View>
);

const Exercise = () => {
    const navigation = useNavigation();
    const { exercises } = useWorkout();
    const route = useRoute<ExerciseScreenRouteProp>();
    const exerciseId = route.params.exerciseId;

    const exercise =
        exercises.find(ex => ex.id === exerciseId) || exercises[0] || null;

    if (!exercise) {
        return (
            <View className="flex-1 bg-[#000000] justify-center items-center">
                <StatusBar style="light" />
                <Text className="text-white text-lg">No exercise found</Text>
            </View>
        );
    }

    const handleStartExercise = () => {
        navigation.navigate('Sessions', {
            exerciseId: exercise.id,
        });
    };

    return (
        <View className="flex-1 bg-[#000000]">
            <StatusBar style="light" />

            <View className="px-4 mt-14">
                <View className="mb-2">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="absolute left-0 z-10"
                        >
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        <Text className="text-white text-xl font-semibold flex-1 text-center">
                            Exercise
                        </Text>
                    </View>
                </View>
                <Text className="text-white text-2xl font-bold my-8">
                    {exercise.name}
                </Text>
            </View>

            <ScrollView
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-[#1D2229] rounded-2xl p-14 flex-row items-center mb-6">
                    <View className="bg-[#202F41] p-4 rounded-xl mr-4">
                        <Ionicons name="image" size={32} color="#60A5FB" />
                    </View>
                    <Text className="text-white text-base">Diagram coming soon</Text>
                </View>

                <Text className="text-white text-lg font-semibold mb-4">
                    How to do it
                </Text>

                <View className="mb-6">
                    {(exercise.instructions || []).map(
                        (instruction: string, index: number) => (
                            <InstructionItem key={index} text={instruction} />
                        )
                    )}
                </View>

                <View className="h-24" />
            </ScrollView>

            <View className="px-6 pb-6 pt-4 bg-[#000000]">
                <TouchableOpacity
                    onPress={handleStartExercise}
                    className="bg-[#60A5FB] py-5 rounded-2xl"
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        Start Exercise
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Exercise;
