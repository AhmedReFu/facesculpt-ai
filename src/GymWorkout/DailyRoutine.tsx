// screens/DailyRoutine.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import { RootStackParamList } from '../types/navigation';
import { useWorkout } from '../utils/WorkoutProvider';

type DailyRoutineNavigationProp = StackNavigationProp<RootStackParamList, 'DailyRoutine'>;

const DailyRoutine = () => {
    const navigation = useNavigation<DailyRoutineNavigationProp>();
    const { exercises, currentExerciseIndex, getCurrentExercise, isWorkoutCompleted } = useWorkout();

    const handleExercisePress = (exercise: any) => {
        navigation.navigate('Exercise', {
            exerciseId: exercise.id, // Keep as number since your context uses number
        });
    };

    const handleStartWorkout = () => {
        if (isWorkoutCompleted) {
            // All workouts completed - go to TrackGym
            navigation.navigate('DailyTrack');
        } else {
            // Start workout with current exercise
            const currentExercise = getCurrentExercise();
            if (currentExercise) {
                navigation.navigate('Exercise', {
                    exerciseId: currentExercise.id,
                });
            }
        }
    };

    const handleBackPress = async () => {
        await AsyncStorage.removeItem("subscribe")
        navigation.goBack();
    };

    const getNextIncompleteExercise = () => {
        return exercises.find(exercise => !exercise.completed) || exercises[0];
    };

    const nextExercise = getNextIncompleteExercise();
    const allCompleted = isWorkoutCompleted;

    // Calculate progress percentage safely
    const completedExercises = exercises.filter(ex => ex.completed).length;
    const progressPercentage = exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

    return (
        <View style={tw`flex-1 bg-[#000000] px-4`}>
            <StatusBar style='light' />
            <View style={tw`flex-1 mt-14`}>
                <View style={tw`mb-2`}>
                    <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                            onPress={handleBackPress}
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

                {/* Progress Bar */}
                <View style={tw`bg-[#1D2229] rounded-full h-2 mt-4 mb-6`}>
                    <View
                        style={[
                            tw`bg-[#60A5FB] h-2 rounded-full`,
                            { width: `${progressPercentage}%` }
                        ]}
                    />
                </View>

                {/* Completion Badge */}
                {allCompleted && (
                    <View style={tw`bg-[#1a3a2d] border border-[#4ade80] rounded-xl p-4 mb-4 flex-row items-center`}>
                        <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                        <Text style={tw`text-[#4ade80] ml-2 font-semibold`}>
                            All exercises completed! 🎉
                        </Text>
                    </View>
                )}

                <ScrollView
                    style={tw`flex-1`}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Info Card */}
                    <View style={tw`flex-row bg-[#1D2229] rounded-xl p-4 my-3`}>
                        <MaterialIcons name="auto-awesome" size={28} color="#60A5FB" style={tw`mt-1`} />
                        <View style={tw`flex-1 ml-3`}>
                            <Text style={tw`text-white text-lg leading-8`}>
                                Based on your facial scan, these workouts were created to strengthen and balance your features.
                            </Text>
                        </View>
                    </View>

                    {/* Exercise List */}
                    {exercises.map((exercise, index) => (
                        <TouchableOpacity
                            key={exercise.id}
                            onPress={() => handleExercisePress(exercise)}
                            activeOpacity={0.8}
                            disabled={exercise.completed}
                        >
                            <View style={[
                                tw`flex-row justify-between items-center rounded-xl p-4 my-2`,
                                exercise.completed
                                    ? tw`bg-[#1a3a2d] border border-[#4ade80]`
                                    : index === currentExerciseIndex
                                        ? tw`bg-[#2A3A4F] border border-[#60A5FB]`
                                        : tw`bg-[#1D2229]`,
                                exercise.completed && tw`opacity-70`
                            ]}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[
                                        tw`p-3 rounded-xl mr-4`,
                                        exercise.completed ? tw`bg-[#2a5c46]` : tw`bg-[#202F41]`
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={exercise.icon as any}
                                            size={28}
                                            color={exercise.completed ? "#4ade80" : "#60A5FB"}
                                        />
                                    </View>
                                    <View>
                                        <Text style={[
                                            tw`text-lg font-medium`,
                                            exercise.completed ? tw`text-[#4ade80]` : tw`text-white`
                                        ]}>
                                            {exercise.name}
                                        </Text>
                                        <Text style={tw`text-[#9CA3AF] text-sm mt-1`}>
                                            {exercise.duration} {exercise.completed ? '✓' : ''}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons
                                    name="keyboard-arrow-right"
                                    size={30}
                                    color={exercise.completed ? "#4ade80" : "white"}
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={tw`pb-6 pt-4 bg-[#000000]`}>
                    <TouchableOpacity
                        onPress={handleStartWorkout}
                        activeOpacity={0.8}
                        style={[
                            tw`p-5 rounded-xl flex-row gap-2 items-center justify-center`,
                            allCompleted ? tw`bg-[#4ade80]` : tw`bg-[#60A5FB]`
                        ]}
                    >
                        <Text style={tw`text-white text-center text-xl font-semibold`}>
                            {allCompleted ? 'View Progress in TrackGym' : `Start ${nextExercise?.name || 'Workout'}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default DailyRoutine;