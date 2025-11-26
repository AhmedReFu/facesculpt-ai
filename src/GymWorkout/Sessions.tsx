// screens/Sessions.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../types/navigation';
import { useWorkout } from '../utils/WorkoutProvider';

type SessionsScreenRouteProp = RouteProp<RootStackParamList, 'Sessions'>;

interface InstructionItemProps {
    text: string;
}

const InstructionItem = ({ text }: InstructionItemProps) => (
    <View className="flex-row items-start mb-2">
        <Ionicons name="checkmark" size={18} color="#60A5FB" className="mr-2 mt-0.5" />
        <Text className="text-[#9CA3AF] text-[16px] flex-1 leading-5">
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
    const [isProcessing, setIsProcessing] = useState(false);
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

    // Handle auto-complete when timer reaches 0
    useEffect(() => {
        if (timeLeft === 0 && !isCompleted && !exercise?.reps && isRunning) {
            setIsRunning(false);
            handleAutoComplete();
        }
    }, [timeLeft, isCompleted, exercise?.reps, isRunning]);

    const handleAutoComplete = () => {
        if (exercise && !exercise.completed) {
            completeExercise(exercise.id);
            setIsCompleted(true);
        }
    };

    const handleStartPause = () => {
        if (isProcessing) return;

        if (exercise?.reps) {
            handleNextExercise();
        } else {
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
        if (isProcessing || !exercise || exercise.completed) return;

        setIsProcessing(true);
        completeExercise(exercise.id);
        setIsCompleted(true);

        ToastAndroid.showWithGravity(
            `Successfully Complete ${exercise.name}.`,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
        );
        setIsRunning(false);

        const workoutCompleted = isWorkoutCompleted;

        setTimeout(() => {
            if (workoutCompleted) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            { name: 'DailyTrack' },
                            { name: 'DailyRoutine' },
                        ],
                    })
                );
            } else {
                moveToNextExercise();
                const nextExercise = getCurrentExercise();

                if (nextExercise) {
                    navigation.navigate('Sessions', {
                        exerciseId: nextExercise.id,
                    });
                } else {
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 1,
                            routes: [
                                { name: 'DailyTrack' },
                                { name: 'DailyRoutine' },
                            ],
                        })
                    );
                }
            }
            setIsProcessing(false);
        }, 1000);
    };

    const handlePrevious = () => {
        navigation.goBack();
    };

    const handleNextExercise = () => {
        if (isProcessing) return;

        moveToNextExercise();
        const nextExercise = getCurrentExercise();

        if (nextExercise && !nextExercise.completed) {
            navigation.navigate('Sessions', {
                exerciseId: nextExercise.id,
            });
        } else {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        { name: 'DailyTrack' },
                        { name: 'DailyRoutine' },
                    ],
                })
            );
        }
    };

    const handleBackToRoutine = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 1,
                routes: [
                    { name: 'DailyTrack' },
                    { name: 'DailyRoutine' },
                ],
            })
        );
    };

    if (!exercise) {
        return (
            <View className="flex-1 bg-[#000000] justify-center items-center">
                <Text className="text-white text-lg">Exercise not found</Text>
            </View>
        );
    }

    const isDurationBased = !exercise.reps;
    const showCompletedState = isCompleted || exercise.completed;

    return (
        <View className="flex-1 bg-[#000000]">
            <StatusBar style='light' />

            {/* Header */}
            <View className="pt-12 pb-4 bg-[#000000]">
                <View className="flex-row items-center py-4">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute left-2 z-10"
                    >
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>

                    <Text className="text-white text-xl font-semibold flex-1 text-center">
                        Session
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-4 bg-[#000000]"
                showsVerticalScrollIndicator={false}
            >
                {/* Exercise Title */}
                <Text className="text-white text-2xl font-bold mb-3">
                    {exercise.name}
                </Text>

                {/* Description */}
                <Text className="text-[#9CA3AF] text-base mb-6 leading-6">
                    {exercise.description}
                </Text>

                {/* How to do it */}
                <Text className="text-white text-base font-semibold mb-3">
                    How to do it
                </Text>

                <View className="mb-6">
                    {exercise.instructions.map((instruction: string, index: number) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                {/* DIFFERENT DISPLAYS BASED ON EXERCISE TYPE */}

                {/* Duration-based Exercise Display (with Timer) */}
                {isDurationBased && (
                    <View className="bg-[#252b33] rounded-3xl p-8 items-center mb-6">
                        <View className="rounded-full mb-4">
                            <MaterialCommunityIcons
                                name={showCompletedState ? "check-circle" : isRunning ? "pause" : "timer-outline"}
                                size={40}
                                color={showCompletedState ? "#4ade80" : timeLeft === 0 ? "#4ade80" : "#60A5FB"}
                            />
                        </View>

                        <Text className={`
                            text-white text-2xl font-bold mb-2
                            ${timeLeft <= 3 && timeLeft > 0 ? 'text-red-400' : ''}
                            ${(timeLeft === 0 || showCompletedState) ? 'text-green-400' : ''}
                        `}>
                            {showCompletedState ? 'Done!' : `${timeLeft}s`}
                        </Text>

                        <Text className="text-[#9CA3AF] text-lg mb-4">
                            {showCompletedState ? 'Completed!' : timeLeft === 0 ? 'Completed!' : isRunning ? 'Running...' : 'Ready to start'}
                        </Text>

                        {/* Reset Button - Only show if not completed */}
                        {!showCompletedState && (isRunning || timeLeft !== exercise.durationInSeconds) && (
                            <TouchableOpacity
                                onPress={handleReset}
                                className="mt-2"
                            >
                                <Text className="text-[#60A5FB] text-sm">Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Reps-based Exercise Display (Simple) */}
                {!isDurationBased && (
                    <View className="bg-[#252b33] rounded-3xl p-8 items-center mb-6">
                        <View className="rounded-full mb-4">
                            <MaterialCommunityIcons
                                name={showCompletedState ? "check-circle" : "repeat"}
                                size={40}
                                color={showCompletedState ? "#4ade80" : "#60A5FB"}
                            />
                        </View>

                        <Text className={`
                            text-white text-lg font-bold mb-2
                            ${showCompletedState ? 'text-green-400' : ''}
                        `}>
                            {exercise.duration}
                        </Text>

                        <Text className="text-[#9CA3AF] text-lg mb-4">
                            {showCompletedState ? 'Completed!' : 'Complete all reps'}
                        </Text>
                    </View>
                )}

                <View className="h-32" />
            </ScrollView>

            {/* BOTTOM NAVIGATION - DIFFERENT FOR EACH TYPE */}
            <View className="px-6 pb-8 pt-4 bg-[#000000]">

                {/* Duration-based Exercise Buttons */}
                {isDurationBased && (
                    <>
                        {/* Prev and Running Buttons */}
                        <View className="flex-row gap-3 mb-3">
                            <TouchableOpacity
                                onPress={handlePrevious}
                                className="flex-1 bg-[#252b33] py-4 rounded-2xl flex-row items-center justify-center"
                                activeOpacity={0.7}
                                disabled={isProcessing}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" className="mr-1" />
                                <Text className="text-white font-semibold text-base">Prev</Text>
                            </TouchableOpacity>

                            {!showCompletedState ? (
                                <TouchableOpacity
                                    onPress={handleStartPause}
                                    className={`
                                        flex-1 py-4 rounded-2xl flex-row items-center justify-center
                                        ${isRunning ? 'bg-[#f59e0b]' : 'bg-[#60A5FB]'}
                                    `}
                                    activeOpacity={0.7}
                                    disabled={isProcessing}
                                >
                                    <Text className="text-white font-semibold text-base">
                                        {timeLeft === 0 ? 'Restart' : isRunning ? 'Running...' : 'Start'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                        className="flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center"
                                    activeOpacity={0.7}
                                        disabled={isProcessing}
                                >
                                        <Text className="text-white font-semibold text-base">Next</Text>
                                        <Ionicons name="chevron-forward" size={20} color="white" className="ml-1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Mark Complete Button */}
                        <TouchableOpacity
                            onPress={showCompletedState ? handleBackToRoutine : handleMarkComplete}
                            className={`
                                py-6 rounded-2xl flex-row items-center justify-center
                                ${showCompletedState ? 'bg-[#4ade80]' : 'bg-[#d4dce5]'}
                                ${isProcessing ? 'opacity-50' : ''}
                            `}
                            activeOpacity={0.7}
                            disabled={isProcessing}
                        >
                            {showCompletedState ? (
                                <>
                                    <MaterialIcons name="check-circle" size={24} color="white" className="mr-2" />
                                    <Text className="text-white font-semibold text-base">
                                        {isProcessing ? 'Processing...' : 'Completed! Tap to return'}
                                    </Text>
                                </>
                            ) : (
                                <>
                                        <MaterialIcons name="check-circle-outline" size={24} color="#1a1f24" className="mr-2" />
                                        <Text className="text-[#1a1f24] font-semibold text-base">
                                            {isProcessing ? 'Processing...' : 'Mark Complete'}
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
                        <View className="flex-row gap-3 mb-3">
                            <TouchableOpacity
                                onPress={handlePrevious}
                                className="flex-1 bg-[#252b33] py-4 rounded-2xl flex-row items-center justify-center"
                                activeOpacity={0.7}
                                disabled={isProcessing}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" className="mr-1" />
                                <Text className="text-white font-semibold text-base">Prev</Text>
                            </TouchableOpacity>

                            {!showCompletedState ? (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                    className="flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center"
                                    activeOpacity={0.7}
                                    disabled={isProcessing}
                                >
                                    <Text className="text-white font-semibold text-base">Next</Text>
                                    <Ionicons name="chevron-forward" size={20} color="white" className="ml-1" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleNextExercise}
                                        className="flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center"
                                    activeOpacity={0.7}
                                        disabled={isProcessing}
                                >
                                        <Text className="text-white font-semibold text-base">Next Exercise</Text>
                                        <Ionicons name="chevron-forward" size={20} color="white" className="ml-1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Mark Complete Button */}
                        <TouchableOpacity
                            onPress={showCompletedState ? handleBackToRoutine : handleMarkComplete}
                            className={`
                                py-6 rounded-2xl flex-row items-center justify-center
                                ${showCompletedState ? 'bg-[#4ade80]' : 'bg-[#d4dce5]'}
                                ${isProcessing ? 'opacity-50' : ''}
                            `}
                            activeOpacity={0.7}
                            disabled={isProcessing}
                        >
                            {showCompletedState ? (
                                <>
                                    <MaterialIcons name="check-circle" size={24} color="white" className="mr-2" />
                                    <Text className="text-white font-semibold text-base">
                                        {isProcessing ? 'Processing...' : 'Completed! Tap to return'}
                                    </Text>
                                </>
                            ) : (
                                <>
                                        <MaterialIcons name="check-circle-outline" size={24} color="#1a1f24" className="mr-2" />
                                        <Text className="text-[#1a1f24] font-semibold text-base">
                                            {isProcessing ? 'Processing...' : 'Mark Complete'}
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