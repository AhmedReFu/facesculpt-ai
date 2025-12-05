// contexts/WorkoutProvider.tsx - COMPLETE FIXED VERSION
import { GET_PLAN, IPA_BASE, WORKOUT_DONE } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    GET_PLAN: GET_PLAN,
    WORKOUT_DONE: WORKOUT_DONE,
};

export interface Exercise {
    id: number;
    name: string;
    duration: string;
    reps: boolean;
    icon: string;
    instructions: string[];
    completed: boolean;
    durationInSeconds: number;
    description?: string;
    order: number;
}

interface WorkoutContextType {
    exercises: Exercise[];
    currentExerciseIndex: number;
    completeExercise: (exerciseId: number) => Promise<void>;
    resetWorkout: () => void;
    getCurrentExercise: () => Exercise | null;
    moveToNextExercise: () => void;
    isWorkoutCompleted: boolean;
    workoutProgress: number;
    getNextIncompleteExercise: () => Exercise | null;
    loading: boolean;
    workoutPlanId: number | null;
    fetchWorkoutPlan: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Helper functions
const parseDurationToSeconds = (duration: string): number => {
    const trimmed = duration.trim().toLowerCase();
    if (trimmed.includes('s') && !trimmed.includes('min')) {
        const seconds = parseInt(trimmed.replace('s', ''));
        return isNaN(seconds) ? 10 : seconds;
    }
    if (trimmed.includes('min')) {
        const minutes = parseInt(trimmed.replace(/[^0-9]/g, ''));
        return isNaN(minutes) ? 60 : minutes * 60;
    }
    if (trimmed.includes('rep')) {
        const reps = parseInt(trimmed.replace(/[^0-9]/g, ''));
        return isNaN(reps) ? 10 : reps;
    }
    return 10;
};

const isRepBased = (duration: string): boolean => {
    return duration.trim().toLowerCase().includes('rep');
};

const getIconForMetric = (metric: string, index: number): string => {
    const icons = ['meditation', 'face-man', 'emoticon-happy', 'account-circle', 'head', 'skull'];
    switch (metric?.toUpperCase()) {
        case 'JAWLINE': return 'meditation';
        case 'SYMMETRY': return 'face-man';
        case 'PUFFINESS': return 'emoticon-happy';
        case 'GENERAL':
        default: return icons[index % icons.length];
    }
};

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [workoutPlanId, setWorkoutPlanId] = useState<number | null>(null);

    // CRITICAL: Track if workout completion API has been called
    const workoutCompletionCalledRef = useRef(false);
    const isCallingAPIRef = useRef(false);

    useEffect(() => {
        fetchWorkoutPlan();
    }, []);

    const fetchWorkoutPlan = async () => {
        try {
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                console.log('No token found');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_PLAN}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            console.log('Workout Plan Response:', result);

            if (response.ok && result.success && result.data) {
                resetWorkout();
                const apiData = result.data;
                setWorkoutPlanId(apiData.id);

                const transformedExercises: Exercise[] = apiData.exercises.map((item: any, index: number) => ({
                    id: item.order || index + 1,
                    name: item.exercise.name,
                    duration: item.reps,
                    reps: isRepBased(item.reps),
                    durationInSeconds: parseDurationToSeconds(item.reps),
                    icon: getIconForMetric(item.exercise.target_metric, index),
                    completed: false,
                    description: item.exercise.description,
                    instructions: item.exercise.instructions || [],
                    order: item.order,
                }));

                transformedExercises.sort((a, b) => a.order - b.order);
                setExercises(transformedExercises);

                // Reset completion flag when new workout plan is fetched
                workoutCompletionCalledRef.current = false;

                console.log('Transformed exercises:', transformedExercises);
            } else {
                throw new Error(result.message || 'Failed to load workout plan');
            }
        } catch (error) {
            console.error('Failed to fetch workout plan:', error);
            Alert.alert('Error', 'Failed to load workout plan. Please try again.');

        } finally {
            setLoading(false);
        }
    };

    // Call workout completion API - ONLY when ALL exercises are done
    const callWorkoutCompletionAPI = async () => {
        // Prevent duplicate calls
        if (workoutCompletionCalledRef.current || isCallingAPIRef.current) {
            console.log('⚠️ API already called or in progress, skipping...');
            return;
        }

        try {
            isCallingAPIRef.current = true;
            workoutCompletionCalledRef.current = true;

            const token = await AsyncStorage.getItem('token');
            console.log('🎉 ALL EXERCISES COMPLETED! Calling workout completion API...');

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.WORKOUT_DONE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Workout completion API success:', data);

                // Optional: Reset workout after 10 seconds
                // setTimeout(() => {
                //     resetWorkout();
                //     console.log("🔄 Workout reset after completion");
                // }, 10000);

            } else {
                console.error('❌ Workout completion API failed:', response.status);
                // Reset flag on failure so it can be retried
                workoutCompletionCalledRef.current = false;
            }
        } catch (error) {
            console.error('❌ Error calling workout done API:', error);
            // Reset flag on error so it can be retried
            workoutCompletionCalledRef.current = false;
        } finally {
            isCallingAPIRef.current = false;
        }
    };

    // Complete exercise - API called ONLY after ALL exercises are done
    const completeExercise = async (exerciseId: number) => {
        setExercises(prev => {
            // Mark the current exercise as completed
            const updated = prev.map(exercise =>
                exercise.id === exerciseId
                    ? { ...exercise, completed: true }
                    : exercise
            );

            // Count completed exercises
            const completedCount = updated.filter(ex => ex.completed).length;
            const totalCount = updated.length;

            console.log(`📊 Progress: ${completedCount}/${totalCount} exercises completed`);

            // Check if ALL exercises are now complete
            const allComplete = completedCount === totalCount;

            if (allComplete && !workoutCompletionCalledRef.current) {
                console.log('🎯 ALL EXERCISES COMPLETED! Calling API...');
                // Call API only when the last exercise is marked complete
                callWorkoutCompletionAPI();
            } else if (!allComplete) {
                console.log(`⏳ Still ${totalCount - completedCount} exercise(s) remaining...`);
            }

            return updated;
        });
    };

    const moveToNextExercise = () => {
        setCurrentExerciseIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex < exercises.length ? nextIndex : prev;
        });
    };

    const resetWorkout = () => {
        setExercises(prev =>
            prev.map(exercise => ({ ...exercise, completed: false }))
        );
        setCurrentExerciseIndex(0);
        // Reset the API call flag so it can be called again
        workoutCompletionCalledRef.current = false;
        console.log('🔄 Workout has been reset');
    };

    const getCurrentExercise = (): Exercise | null => {
        return exercises[currentExerciseIndex] || null;
    };

    const getNextIncompleteExercise = (): Exercise | null => {
        return exercises.find(exercise => !exercise.completed) || null;
    };

    const isWorkoutCompleted = exercises.length > 0 && exercises.every(exercise => exercise.completed);
    const workoutProgress = exercises.length > 0 ? exercises.filter(ex => ex.completed).length / exercises.length : 0;

    const contextValue: WorkoutContextType = {
        exercises,
        currentExerciseIndex,
        completeExercise,
        resetWorkout,
        getCurrentExercise,
        moveToNextExercise,
        isWorkoutCompleted,
        workoutProgress,
        getNextIncompleteExercise,
        loading,
        workoutPlanId,
        fetchWorkoutPlan,
    };

    return (
        <WorkoutContext.Provider value={contextValue}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => {
    const context = useContext(WorkoutContext);
    if (context === undefined) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
};