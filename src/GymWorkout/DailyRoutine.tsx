import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";

const DailyRoutine = () => {
    const navigator = useNavigation();
    const [selectedExercise, setSelectedExercise] = useState<any>(null);

    // Exercise data with instructions
    const exercises = [
        {
            id: 1,
            name: 'Jaw Clench Hold',
            duration: '10s',
            icon: 'meditation',
            instructions: [
                'Sit upright with relaxed shoulders.',
                'Engage the target muscle gently first.',
                'Increase tension to a firm, pain-free hold.',
                'Breathe steadily through your nose.',
                'Release slowly and reset posture.',
            ]
        },
        {
            id: 2,
            name: 'Eye Circle Massage',
            duration: '8 reps',
            icon: 'face-man',
            instructions: [
                'Close your eyes gently.',
                'Use your fingertips to massage in circular motions.',
                'Apply light pressure around the eye area.',
                'Continue for the specified duration.',
                'Relax and breathe deeply.',
            ]
        },
        {
            id: 3,
            name: 'Chew Motion',
            duration: '20 reps',
            icon: 'food-apple',
            instructions: [
                'Sit in a comfortable position.',
                'Perform slow chewing motions.',
                'Keep your jaw relaxed.',
                'Maintain steady breathing.',
                'Focus on the jaw muscles.',
            ]
        },
        {
            id: 4,
            name: 'Cheek Lift',
            duration: '15 reps',
            icon: 'emoticon-happy',
            instructions: [
                'Smile widely to engage cheek muscles.',
                'Hold the position steadily.',
                'Keep breathing normally.',
                'Feel the muscle tension.',
                'Release gently.',
            ]
        },
    ];

    const handleExercisePress = (exercise: any) => {
        setSelectedExercise(exercise);
        // Pass exercise data when navigating
        (navigator as any).navigate('Exercise', {
            name: exercise.name,
            duration: exercise.duration,
            instructions: exercise.instructions,
        });
    };

    const handleStartWorkout = () => {
        if (selectedExercise) {
            // Navigate with the selected exercise
            (navigator as any).navigate('Exercise', {
                name: selectedExercise.name,
                duration: selectedExercise.duration,
                instructions: selectedExercise.instructions,
            });
        } else {
            // If no exercise selected, start with the first one
            handleExercisePress(exercises[0]);
        }
    };

    return (
        <View style={tw`flex-1 bg-[#000000] px-6`}>
            <StatusBar style='light' />
            <View style={tw`flex-1 mt-14`}>
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={() => navigator.goBack()}
                            style={tw`absolute left-0 z-10`}
                        >
                            <Ionicons name="arrow-back" size={28} color="white" />
                        </TouchableOpacity>

                        <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>
                            Today's Routine
                        </Text>
                    </View>
                </View>

                <Text style={tw`text-[#9CA3AF] text-lg mt-4 leading-6`}>
                    Personalized from your latest scan.
                </Text>

                <ScrollView
                    style={tw`flex-1`}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={tw`flex-row bg-[#1D2229] rounded-xl p-4 my-3`}>
                        <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" style={tw`mt-1`} />
                        <View style={tw`flex-1 ml-3`}>
                            <Text style={tw`text-white text-lg leading-8`}>
                                Based on your facial scan, these workouts were created to strengthen and balance your features.
                            </Text>
                        </View>
                    </View>

                    {exercises.map((exercise) => (
                        <TouchableOpacity
                            key={exercise.id}
                            onPress={() => handleExercisePress(exercise)}
                            activeOpacity={0.8}
                        >
                            <View style={[
                                tw`flex-row justify-between items-center rounded-xl p-4 my-2`,
                                selectedExercise?.id === exercise.id
                                    ? tw`bg-[#2A3A4F] border border-[#60A5FB]`
                                    : tw`bg-[#1D2229]`
                            ]}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`bg-[#202F41] p-3 rounded-xl mr-4`}>
                                        <MaterialCommunityIcons name={exercise.icon as any} size={28} color="#60A5FB" />
                                    </View>
                                    <View>
                                        <Text style={tw`text-white text-lg font-medium`}>{exercise.name}</Text>
                                        <Text style={tw`text-[#9CA3AF] text-sm mt-1`}>{exercise.duration}</Text>
                                    </View>
                                </View>
                                <MaterialIcons name="keyboard-arrow-right" size={30} color="white" />
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={tw`h-24`} />
                </ScrollView>

                <View style={tw`pb-6 pt-4 bg-[#000000]`}>
                    <TouchableOpacity
                        onPress={handleStartWorkout}
                        activeOpacity={0.8}
                        style={tw`bg-[#60A5FB] p-5 rounded-xl flex-row gap-2 items-center justify-center`}
                    >
                        <Text style={tw`text-white text-center text-xl font-semibold`}>
                            {selectedExercise ? `Start ${selectedExercise.name}` : 'Start Workout'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default DailyRoutine;