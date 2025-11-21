// screens/Sessions.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";
import { useWorkout } from '../lib/WorkoutProvider';
import { RootStackParamList } from '../types/navigation';

type SessionsScreenRouteProp = RouteProp<RootStackParamList, 'Sessions'>;

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View style={tw`flex-row items-start mb-2`}>
        <Ionicons name="checkmark" size={18} color="#60A5FB" style={tw`mr-2 mt-0.5`} />
        <Text style={tw`text-[#9CA3AF] text-[16px] flex-1 leading-5`}>
            {text}
        </Text>
    </View>
);

const Sessions = () => {
    const navigation = useNavigation();
    const route = useRoute<SessionsScreenRouteProp>();
    const { exercises, completeExercise, moveToNextExercise, getCurrentExercise, isWorkoutCompleted } = useWorkout();

    const exerciseId = route.params.exerciseId;
    const exercise = exercises.find(ex => ex.id === exerciseId) || getCurrentExercise();

    // Timer states for duration-based exercises
    const [timeLeft, setTimeLeft] = useState(exercise?.durationInSeconds || 10);
    const [isRunning, setIsRunning] = useState(false);
    const [isCompleted, setIsCompleted] = useState(exercise?.completed || false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when exercise changes
    useEffect(() => {
        if (exercise) {
            setIsCompleted(exercise.completed);
            if (!exercise.reps && !exercise.completed) {
                setTimeLeft(exercise.durationInSeconds);
            }
        }
    }, [exercise]);

    // Timer effect for duration-based exercises
    useEffect(() => {
        if (!exercise?.reps && isRunning && timeLeft > 0 && !isCompleted) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        handleAutoComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft, exercise?.reps, isCompleted]);

    const handleAutoComplete = () => {
        if (exercise && !exercise.completed) {
            completeExercise(exercise.id);
            setIsCompleted(true);
        }
    };

    const handleStartPause = () => {
        if (exercise?.reps) {
            // For reps-based exercises, just navigate to next
            handleNextExercise();
        } else {
        // For duration-based exercises, start/pause timer
            if (timeLeft === 0) {
                setTimeLeft(exercise?.durationInSeconds || 10);
                setIsCompleted(false);
            }
            setIsRunning(!isRunning);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(exercise?.durationInSeconds || 10);
        setIsCompleted(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handleMarkComplete = () => {
        if (exercise && !exercise.completed) {
            completeExercise(exercise.id);
            setIsCompleted(true);
            setIsRunning(false);

            // Show completed state for 1 second before navigating
            setTimeout(() => {
                moveToNextExercise();
                const nextExercise = getCurrentExercise();

                if (isWorkoutCompleted) {
                    // All exercises completed - go to DailyRoutine
                    navigation.navigate('DailyRoutine');
                } else if (nextExercise && !nextExercise.completed) {
                    // Go to next exercise
                    navigation.navigate('Sessions', {
                        exerciseId: nextExercise.id,
                    });
                } else {
                    // No next exercise or all completed - go to DailyRoutine
                    navigation.navigate('DailyRoutine');
                }
            }, 1000);
        }
    };

    const handlePrevious = () => {
        navigation.goBack();
    };

    const handleNextExercise = () => {
        const nextExercise = getCurrentExercise();
        if (nextExercise && nextExercise.id !== exercise?.id) {
            moveToNextExercise();
            navigation.navigate('Sessions', {
                exerciseId: nextExercise.id,
            });
        } else {
            // If no next exercise, go to DailyRoutine
            navigation.navigate('DailyRoutine');
        }
    };

    const handleBackToRoutine = () => {
        navigation.navigate('DailyRoutine');
    };

    if (!exercise) {
        return (
            <View style={tw`flex-1 bg-[#000000] justify-center items-center`}>
                <Text style={tw`text-white text-lg`}>Exercise not found</Text>
            </View>
        );
    }

    const isDurationBased = !exercise.reps;
    const showCompletedState = isCompleted || exercise.completed;

    return (
        <View style={tw`flex-1 bg-[#000000]`}>
            <StatusBar style='light' />

            {/* Header */}
            <View style={tw`pt-12 pb-4 bg-[#000000]`}>
                <View style={tw`flex-row items-center py-4`}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={tw`absolute left-2 z-10`}
                    >
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    <Text style={tw`text-white text-xl font-semibold flex-1 text-center`}>
                        Session
                    </Text>
                </View>
            </View>

            <ScrollView
                style={tw`flex-1 px-4 bg-[#000000]`}
                showsVerticalScrollIndicator={false}
            >
                {/* Exercise Title */}
                <Text style={tw`text-white text-2xl font-bold mb-3`}>
                    {exercise.name}
                </Text>

                {/* Description */}
                <Text style={tw`text-[#9CA3AF] text-base mb-6 leading-6`}>
                    {exercise.description}
                </Text>

                {/* How to do it */}
                <Text style={tw`text-white text-base font-semibold mb-3`}>
                    How to do it
                </Text>

                <View style={tw`mb-6`}>
                    {exercise.instructions.map((instruction: string, index: number) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                {/* DIFFERENT DISPLAYS BASED ON EXERCISE TYPE */}

                {/* Duration-based Exercise Display (with Timer) */}
                {isDurationBased && (
                    <View style={tw`bg-[#252b33] rounded-3xl p-8 items-center mb-6`}>
                        <View style={tw`rounded-full mb-4`}>
                            <MaterialCommunityIcons
                                name={showCompletedState ? "check-circle" : isRunning ? "pause" : "timer-outline"}
                                size={40}
                                color={showCompletedState ? "#4ade80" : timeLeft === 0 ? "#4ade80" : "#60A5FB"}
                            />
                        </View>

                        <Text style={[
                            tw`text-white text-6xl font-bold mb-2`,
                            timeLeft <= 3 && timeLeft > 0 && tw`text-red-400`,
                            (timeLeft === 0 || showCompletedState) && tw`text-green-400`
                        ]}>
                            {showCompletedState ? 'Done!' : `${timeLeft}s`}
                        </Text>

                        <Text style={tw`text-[#9CA3AF] text-sm mb-4`}>
                            {showCompletedState ? 'Completed!' : timeLeft === 0 ? 'Completed!' : isRunning ? 'Running...' : 'Ready to start'}
                        </Text>

                        {/* Reset Button - Only show if not completed */}
                        {!showCompletedState && (isRunning || timeLeft !== exercise.durationInSeconds) && (
                            <TouchableOpacity
                                onPress={handleReset}
                                style={tw`mt-2`}
                            >
                                <Text style={tw`text-[#60A5FB] text-sm`}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Reps-based Exercise Display (Simple) */}
                {!isDurationBased && (
                    <View style={tw`bg-[#252b33] rounded-3xl p-8 items-center mb-6`}>
                        <View style={tw`rounded-full mb-4`}>
                            <MaterialCommunityIcons
                                name={showCompletedState ? "check-circle" : "repeat"}
                                size={40}
                                color={showCompletedState ? "#4ade80" : "#60A5FB"}
                            />
                        </View>

                        <Text style={[
                            tw`text-white text-4xl font-bold mb-2`,
                            showCompletedState && tw`text-green-400`
                        ]}>
                            {exercise.duration}
                        </Text>

                        <Text style={tw`text-[#9CA3AF] text-sm mb-4`}>
                            {showCompletedState ? 'Completed!' : 'Complete all reps'}
                        </Text>
                    </View>
                )}

                {/* Diagram Placeholder */}
                {/* <View style={tw`bg-[#1D2229] rounded-2xl p-14 flex-row items-center mb-6`}>
                    <View style={tw`bg-[#202F41] p-4 rounded-xl mr-4`}>
                        <Ionicons name="image" size={32} color="#60A5FB" />
                    </View>
                    <Text style={tw`text-white text-base`}>
                        Diagram coming soon
                    </Text>
                </View> */}

                <View style={tw`h-32`} />
            </ScrollView>

            {/* BOTTOM NAVIGATION - DIFFERENT FOR EACH TYPE */}
            <View style={tw`px-6 pb-8 pt-4 bg-[#000000]`}>

                {/* Duration-based Exercise Buttons */}
                {isDurationBased && (
                    <>
                        {/* Prev and Running Buttons */}
                        <View style={tw`flex-row gap-3 mb-3`}>
                            <TouchableOpacity
                                onPress={handlePrevious}
                                style={tw`flex-1 bg-[#252b33] py-4 rounded-2xl flex-row items-center justify-center`}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" style={tw`mr-1`} />
                                <Text style={tw`text-white font-semibold text-base`}>Prev</Text>
                            </TouchableOpacity>

                            {!showCompletedState ? (
                                <TouchableOpacity
                                    onPress={handleStartPause}
                                    style={[
                                        tw`flex-1 py-4 rounded-2xl flex-row items-center justify-center`,
                                        isRunning ? tw`bg-[#f59e0b]` : tw`bg-[#60A5FB]`
                                    ]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={tw`text-white font-semibold text-base`}>
                                        {timeLeft === 0 ? 'Restart' : isRunning ? 'Running...' : 'Start'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                    style={tw`flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center`}
                                    activeOpacity={0.7}
                                >
                                    <Text style={tw`text-white font-semibold text-base`}>Next</Text>
                                    <Ionicons name="chevron-forward" size={20} color="white" style={tw`ml-1`} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Mark Complete Button */}
                        <TouchableOpacity
                            onPress={showCompletedState ? handleBackToRoutine : handleMarkComplete}
                            style={[
                                tw`py-6 rounded-2xl flex-row items-center justify-center`,
                                showCompletedState ? tw`bg-[#4ade80]` : tw`bg-[#d4dce5]`
                            ]}
                            activeOpacity={0.7}
                        >
                            {showCompletedState ? (
                                <>
                                    <MaterialIcons name="check-circle" size={24} color="white" style={tw`mr-2`} />
                                    <Text style={tw`text-white font-semibold text-base`}>
                                        Completed! Tap to return
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <MaterialIcons name="check-circle-outline" size={24} color="#1a1f24" style={tw`mr-2`} />
                                    <Text style={tw`text-[#1a1f24] font-semibold text-base`}>
                                        Mark Complete
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                {/* Reps-based Exercise Buttons */}
                {!isDurationBased && (
                    <>
                        {/* Prev and Next Buttons */}
                        <View style={tw`flex-row gap-3 mb-3`}>
                            <TouchableOpacity
                                onPress={handlePrevious}
                                style={tw`flex-1 bg-[#252b33] py-4 rounded-2xl flex-row items-center justify-center`}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" style={tw`mr-1`} />
                                <Text style={tw`text-white font-semibold text-base`}>Prev</Text>
                            </TouchableOpacity>

                            {!showCompletedState ? (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                    style={tw`flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center`}
                                    activeOpacity={0.7}
                                >
                                    <Text style={tw`text-white font-semibold text-base`}>Next</Text>
                                    <Ionicons name="chevron-forward" size={20} color="white" style={tw`ml-1`} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                    style={tw`flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center`}
                                    activeOpacity={0.7}
                                >
                                    <Text style={tw`text-white font-semibold text-base`}>Next Exercise</Text>
                                    <Ionicons name="chevron-forward" size={20} color="white" style={tw`ml-1`} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Mark Complete Button */}
                        <TouchableOpacity
                            onPress={showCompletedState ? handleBackToRoutine : handleMarkComplete}
                            style={[
                                tw`py-6 rounded-2xl flex-row items-center justify-center`,
                                showCompletedState ? tw`bg-[#4ade80]` : tw`bg-[#d4dce5]`
                            ]}
                            activeOpacity={0.7}
                        >
                            {showCompletedState ? (
                                <>
                                    <MaterialIcons name="check-circle" size={24} color="white" style={tw`mr-2`} />
                                    <Text style={tw`text-white font-semibold text-base`}>
                                        Completed! Tap to return
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <MaterialIcons name="check-circle-outline" size={24} color="#1a1f24" style={tw`mr-2`} />
                                    <Text style={tw`text-[#1a1f24] font-semibold text-base`}>
                                        Mark Complete
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

export default Sessions;