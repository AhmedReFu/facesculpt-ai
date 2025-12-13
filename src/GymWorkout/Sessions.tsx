import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Toast, useToast } from '../hooks/useToost';
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
    const toast = useToast();
    const navigation = useNavigation();
    const route = useRoute<SessionsScreenRouteProp>();
    const { exercises, completeExercise, moveToNextExercise, getCurrentExercise } = useWorkout();

    const exerciseId = route.params.exerciseId;
    const exercise = exercises.find(ex => ex.id === exerciseId) || getCurrentExercise();

    // Timer states for duration-based exercises
    const [timeLeft, setTimeLeft] = useState(exercise?.duration || 0);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSets, setCompletedSets] = useState(0);
    const [isExerciseCompleted, setIsExerciseCompleted] = useState(exercise?.completed || false);
    const [isProcessing, setIsProcessing] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when exercise changes
    useEffect(() => {
        if (exercise) {
            setIsExerciseCompleted(exercise.completed);
            // IMPORTANT: Reset sets counter when exercise changes
            if (!exercise.completed) {
                setCompletedSets(0);
                if (!exercise.isRepBased) {
                    setTimeLeft(exercise.duration);
                }
            } else {
                // If exercise already completed, show all sets as done
                setCompletedSets(exercise.sets);
            }
        }
    }, [exercise?.id]); // Only trigger when exercise ID changes

    // Timer effect for duration-based exercises
    useEffect(() => {
        if (!exercise?.isRepBased && isRunning && timeLeft > 0) {
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
    }, [isRunning, timeLeft, exercise?.isRepBased]);

    // Handle auto-complete when timer reaches 0 for duration-based
    useEffect(() => {
        if (timeLeft === 0 && !exercise?.isRepBased && !isRunning && completedSets < (exercise?.sets || 0)) {
        // Timer just finished, but don't auto-complete set
        // User must click "Next Set" or "Complete Set"
        }
    }, [timeLeft, exercise?.isRepBased, isRunning, completedSets, exercise?.sets]);

    const handleStartPause = () => {
        if (isProcessing || isExerciseCompleted) return;

        if (exercise?.isRepBased) {
            // For reps-based, start/pause doesn't apply
            return;
        } else {
            // For duration-based
            if (timeLeft === 0) {
                // Reset timer for new set
                setTimeLeft(exercise?.duration || 0);
            }
            setIsRunning(!isRunning);
        }
    };

    const handleCompleteSet = () => {
        if (isProcessing || !exercise || isExerciseCompleted) return;

        const newCompletedSets = completedSets + 1;
        setCompletedSets(newCompletedSets);

        toast.show({
            message: `Set ${newCompletedSets}/${exercise.sets} completed ✓`,
            type: 'success',
            style: 'top',
            duration: 1500
        });

        // Check if all sets are completed
        if (newCompletedSets >= exercise.sets) {
            // All sets completed, mark workout as complete
            setIsExerciseCompleted(true);
            completeExercise(exercise.id);

            toast.show({
                message: `${exercise.name} completed! All sets done 🎉`,
                type: 'success',
                style: 'top',
                duration: 2000
            });
        } else {
            // More sets remaining, reset timer/reps for next set
            if (!exercise.isRepBased) {
                setTimeLeft(exercise.duration);
                setIsRunning(false);
            }
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(exercise?.duration || 0);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handlePrevious = () => {
        navigation.goBack();
    };

    const handleNextExercise = () => {
        if (isProcessing) return;

        setIsProcessing(true);

        const workoutAllCompleted = isExerciseCompleted;

        setTimeout(() => {
            if (workoutAllCompleted) {
                moveToNextExercise();
                const nextExercise = getCurrentExercise();

                if (nextExercise && !nextExercise.completed) {
                    navigation.navigate('Sessions', {
                        exerciseId: nextExercise.id,
                    });
                } else {
                    // All exercises completed
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
        }, 500);
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

    const isDurationBased = !exercise.isRepBased;
    const allSetsCompleted = isExerciseCompleted;
    const canCompleteSet = isDurationBased ? timeLeft === 0 : true;

    return (
        <View className="flex-1 bg-[#000000] px-4">
            <StatusBar style='light' />

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
                className="flex-1 bg-[#000000]"
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-white text-2xl font-bold mb-3">
                    {exercise.name}
                </Text>

                <Text className="text-[#9CA3AF] text-base mb-6 leading-6">
                    {exercise.description}
                </Text>

                <Text className="text-white text-base font-semibold mb-3">
                    How to do it
                </Text>

                <View className="mb-6">
                    {exercise.instructions.map((instruction: string, index: number) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                {/* Duration-based Exercise Display (with Timer) */}
                {isDurationBased && (
                    <View className="bg-[#252b33] rounded-3xl p-8 items-center mb-6">
                        <TouchableOpacity onPress={handleStartPause} disabled={allSetsCompleted}>
                            <View className="rounded-full mb-4">
                                <MaterialCommunityIcons
                                    name={allSetsCompleted ? "check-circle" : isRunning ? "pause" : "timer-outline"}
                                    size={40}
                                    color={allSetsCompleted ? "#4ade80" : timeLeft === 0 ? "#4ade80" : "#60A5FB"}
                                />
                            </View>
                        </TouchableOpacity>

                        <Text className={`
                            text-white text-2xl font-bold mb-2
                            ${timeLeft <= 3 && timeLeft > 0 ? 'text-red-400' : ''}
                            ${timeLeft === 0 ? 'text-green-400' : ''}
                        `}>
                            {allSetsCompleted ? 'All Sets Done!' : `${timeLeft}s`}
                        </Text>

                        <Text className="text-[#9CA3AF] text-base mb-2">
                            {allSetsCompleted
                                ? 'Workout Completed!'
                                : timeLeft === 0
                                    ? 'Set completed! Click Complete Set'
                                    : isRunning
                                        ? 'Running...'
                                        : 'Ready to start'}
                        </Text>

                        {/* Sets Counter */}
                        <View className="flex-row items-center gap-2 mt-2 mb-3">
                            <Text className="text-[#60A5FB] text-xl font-bold">
                                {completedSets}/{exercise.sets}
                            </Text>
                            <Text className="text-[#9CA3AF] text-base">sets</Text>
                        </View>

                        {!allSetsCompleted && (isRunning || timeLeft !== exercise.duration) && (
                            <TouchableOpacity
                                onPress={handleReset}
                                className="mt-2"
                            >
                                <Text className="text-[#60A5FB] text-base">Reset Timer</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Reps-based Exercise Display */}
                {!isDurationBased && (
                    <View className="bg-[#252b33] rounded-3xl p-8 items-center mb-6">
                        <View className="rounded-full mb-4">
                            <MaterialCommunityIcons
                                name={allSetsCompleted ? "check-circle" : "repeat"}
                                size={40}
                                color={allSetsCompleted ? "#4ade80" : "#60A5FB"}
                            />
                        </View>

                        <Text className={`
                            text-white text-2xl font-bold mb-2
                            ${allSetsCompleted ? 'text-green-400' : ''}
                        `}>
                            {exercise.reps} reps
                        </Text>

                        <Text className="text-[#9CA3AF] text-base mb-2">
                            {allSetsCompleted ? 'Workout Completed!' : 'Complete all reps for this set'}
                        </Text>

                        {/* Sets Counter */}
                        <View className="flex-row items-center gap-2 mt-2">
                            <Text className="text-[#60A5FB] text-xl font-bold">
                                {completedSets}/{exercise.sets}
                            </Text>
                            <Text className="text-[#9CA3AF] text-base">sets</Text>
                        </View>
                    </View>
                )}

                <View className="h-32" />
            </ScrollView>

            <View className="pb-8 pt-4 bg-[#000000]">
                {!allSetsCompleted && (
                    <>
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

                            {isDurationBased && (
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
                                        {timeLeft === 0 ? 'Restart' : isRunning ? 'Pause' : 'Start'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {!isDurationBased && (
                                <TouchableOpacity
                                    onPress={handleCompleteSet}
                                    className="flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center"
                                    activeOpacity={0.7}
                                    disabled={isProcessing}
                                >
                                    <Text className="text-white font-semibold text-base">Complete Set</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleCompleteSet}
                            className={`
                                py-6 rounded-2xl flex-row items-center justify-center
                                ${canCompleteSet ? 'bg-[#4ade80]' : 'bg-[#d4dce5]'}
                                ${isProcessing || !canCompleteSet ? 'opacity-50' : ''}
                            `}
                            activeOpacity={0.7}
                            disabled={isProcessing || !canCompleteSet}
                        >
                            <MaterialIcons
                                name={canCompleteSet ? "check-circle" : "check-circle-outline"}
                                size={24}
                                color={canCompleteSet ? "white" : "#1a1f24"}
                                className="mr-2"
                            />
                            <Text className={`font-semibold text-base ${canCompleteSet ? 'text-white' : 'text-[#1a1f24]'}`}>
                                {isProcessing
                                    ? 'Processing...'
                                    : `Complete Set ${completedSets + 1}/${exercise.sets}`}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {allSetsCompleted && (
                    <>
                        <View className="flex-row gap-3 mb-3">
                            <TouchableOpacity
                                onPress={handlePrevious}
                                className="flex-1 bg-[#252b33] py-4 rounded-2xl flex-row items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={20} color="white" className="mr-1" />
                                <Text className="text-white font-semibold text-base">Prev</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleNextExercise}
                                className="flex-1 bg-[#60A5FB] py-4 rounded-2xl flex-row items-center justify-center"
                                activeOpacity={0.7}
                                disabled={isProcessing}
                            >
                                <Text className="text-white font-semibold text-base">Next</Text>
                                <Ionicons name="chevron-forward" size={20} color="white" className="ml-1" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleBackToRoutine}
                            className="bg-[#4ade80] py-6 rounded-2xl flex-row items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="check-circle" size={24} color="white" className="mr-2" />
                            <Text className="text-white font-semibold text-base">
                                Workout Complete! Return to Routine
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Toast Component */}
            <Toast
                style={toast.style}
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                fadeAnim={toast.fadeAnim}
                buttons={toast.buttons}
                onHide={toast.hide}
            />
        </View>
    );
};

export default Sessions;