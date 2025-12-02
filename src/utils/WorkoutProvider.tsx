// contexts/WorkoutContext.tsx
import { GET_PLAN, IPA_BASE } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    GET_PLAN: GET_PLAN,
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
    completeExercise: (exerciseId: number) => void;
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

// Helper function to parse duration string to seconds
const parseDurationToSeconds = (duration: string): number => {
    const trimmed = duration.trim().toLowerCase();

    // Check for seconds (e.g., "10s", "30s")
    if (trimmed.includes('s') && !trimmed.includes('min')) {
        const seconds = parseInt(trimmed.replace('s', ''));
        return isNaN(seconds) ? 10 : seconds;
    }

    // Check for minutes (e.g., "5 min", "2min")
    if (trimmed.includes('min')) {
        const minutes = parseInt(trimmed.replace(/[^0-9]/g, ''));
        return isNaN(minutes) ? 60 : minutes * 60;
    }

    // Check for reps (e.g., "20 reps", "15reps")
    if (trimmed.includes('rep')) {
        const reps = parseInt(trimmed.replace(/[^0-9]/g, ''));
        return isNaN(reps) ? 10 : reps;
    }

    // Default
    return 10;
};

// Helper function to determine if exercise is rep-based
const isRepBased = (duration: string): boolean => {
    const trimmed = duration.trim().toLowerCase();
    return trimmed.includes('rep');
};

// Map target metric to icon
const getIconForMetric = (metric: string, index: number): string => {
    const icons = ['meditation', 'face-man', 'emoticon-happy', 'account-circle', 'head', 'skull'];

    switch (metric?.toUpperCase()) {
        case 'JAWLINE':
            return 'meditation';
        case 'SYMMETRY':
            return 'face-man';
        case 'PUFFINESS':
            return 'emoticon-happy';
        case 'GENERAL':
        default:
            return icons[index % icons.length];
    }
};

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [workoutPlanId, setWorkoutPlanId] = useState<number | null>(null);

    useEffect(() => {
        fetchWorkoutPlan();
    }, []);

    const fetchWorkoutPlan = async () => {
        try {
            setLoading(true);

            // Get access token
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                console.log('No token found');
                setLoading(false);
                return;
            }

            // Fetch workout plan from API
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
                const apiData = result.data
                setWorkoutPlanId(apiData.id);

                // Transform API exercises to app format
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

                // Sort by order
                transformedExercises.sort((a, b) => a.order - b.order);

                setExercises(transformedExercises);
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

    const completeExercise = (exerciseId: number) => {
        setExercises(prev =>
            prev.map(exercise =>
                exercise.id === exerciseId
                    ? { ...exercise, completed: true }
                    : exercise
            )
        );
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