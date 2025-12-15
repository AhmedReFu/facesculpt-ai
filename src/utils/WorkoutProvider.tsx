// contexts/WorkoutProvider.tsx - WITH SETS TRACKING
import { GET_PLAN, IPA_BASE, WORKOUT_DONE } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    GET_PLAN: GET_PLAN,
    WORKOUT_DONE: WORKOUT_DONE,
};

export interface Exercise {
    id: number;
    name: string;
    reps: number;
    duration: number;
    sets: number;
    completedSets: number; // Track how many sets are completed
    icon: string;
    instructions: string[];
    completed: boolean;
    description?: string;
    order: number;
    isRepBased: boolean;
    displayText: string;
    target_metric?: string;
}

interface WorkoutContextType {
    exercises: Exercise[];
    currentExerciseIndex: number;
    currentSetNumber: number;
    maxSets: number;
    completeExerciseSet: (exerciseId: number) => void; // Complete one set
    completeExercise: (exerciseId: number) => Promise<void>;
    resetWorkout: () => void;
    restartWorkout: () => void; // Manual restart by user
    getCurrentExercise: () => Exercise | null;
    moveToNextExercise: () => void;
    isWorkoutCompleted: boolean;
    workoutProgress: number;
    getNextIncompleteExercise: () => Exercise | null;
    getNextExerciseInCircuit: () => Exercise | null;
    loading: boolean;
    workoutPlanId: number | null;
    fetchWorkoutPlan: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const getIconForMetric = (metric: string, index: number): string => {
    const icons = ['meditation', 'face-man', 'emoticon-happy', 'account-circle', 'head', 'skull'];
    switch (metric?.toUpperCase()) {
        case 'JAWLINE': return 'meditation';
        case 'SYMMETRY': return 'face-man';
        case 'PUFFINESS': return 'emoticon-happy';
        case 'GENERAL': return 'emoticon-happy';
        default: return icons[index % icons.length];
    }
};

const WORKOUT_STATE_KEY = 'workout_state';

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
    const toast = useToast();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
    const [maxSets, setMaxSets] = useState<number>(3);
    const [loading, setLoading] = useState<boolean>(true);
    const [workoutPlanId, setWorkoutPlanId] = useState<number | null>(null);

    const workoutCompletionCalledRef = useRef(false);
    const isCallingAPIRef = useRef(false);

    // Load workout state from storage
    useEffect(() => {
        loadWorkoutState();
    }, []);

    // Save workout state whenever it changes
    useEffect(() => {
        if (exercises.length > 0) {
            saveWorkoutState();
        }
    }, [exercises, currentExerciseIndex, currentSetNumber]);

    const loadWorkoutState = async () => {
        try {
            const savedState = await AsyncStorage.getItem(WORKOUT_STATE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                setExercises(state.exercises || []);
                setCurrentExerciseIndex(state.currentExerciseIndex || 0);
                setCurrentSetNumber(state.currentSetNumber || 1);
                setMaxSets(state.maxSets || 3);
                setWorkoutPlanId(state.workoutPlanId || null);
                console.log('📂 Loaded workout state from storage');
            }
        } catch (error) {
            console.error('Error loading workout state:', error);
        }
    };

    const saveWorkoutState = async () => {
        try {
            const state = {
                exercises,
                currentExerciseIndex,
                currentSetNumber,
                maxSets,
                workoutPlanId,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving workout state:', error);
        }
    };

    const clearWorkoutState = async () => {
        try {
            await AsyncStorage.removeItem(WORKOUT_STATE_KEY);
            console.log('🗑️ Cleared workout state');
        } catch (error) {
            console.error('Error clearing workout state:', error);
        }
    };

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

            if (response.ok && result.success && result.data) {
                const apiData = result.data;
                const newWorkoutPlanId = apiData.id;

                // Check if this is a NEW workout plan (different from current)
                const isNewPlan = workoutPlanId !== newWorkoutPlanId;

                setWorkoutPlanId(newWorkoutPlanId);

                const transformedExercises: Exercise[] = apiData.exercises.map((item: any, index: number) => {
                    const isRepBased = item.reps > 0;
                    const displayValue = isRepBased ? item.reps : item.duration;
                    const displayUnit = isRepBased ? 'reps' : 's';

                    return {
                        id: item.order || index + 1,
                        name: item.exercise.name,
                        reps: item.reps,
                        duration: item.duration,
                        sets: item.sets,
                        completedSets: 0, // Initialize completed sets to 0
                        isRepBased: isRepBased,
                        displayText: `${displayValue} ${displayUnit}`,
                        icon: getIconForMetric(item.exercise.target_metric, index),
                        completed: false,
                        description: item.exercise.description,
                        instructions: item.exercise.instructions || [],
                        order: item.order,
                        target_metric: item.exercise.target_metric,
                    };
                });

                transformedExercises.sort((a, b) => a.order - b.order);

                // Calculate max sets (excluding last cooldown exercise)
                const regularExercises = transformedExercises.slice(0, -1);
                const calculatedMaxSets = Math.max(...regularExercises.map(ex => ex.sets));

                setExercises(transformedExercises);
                setMaxSets(calculatedMaxSets);

                // Only reset progress if it's a NEW plan (after face scan)
                if (isNewPlan) {
                    console.log('🆕 NEW workout plan detected - Resetting progress');
                    setCurrentExerciseIndex(0);
                    setCurrentSetNumber(1);
                    workoutCompletionCalledRef.current = false;
                    await clearWorkoutState();
                } else {
                    console.log('♻️ Same workout plan - Keeping progress');
                }

                console.log('✅ Workout plan loaded:', {
                    planId: newWorkoutPlanId,
                    exercises: transformedExercises.length,
                    maxSets: calculatedMaxSets,
                    isNewPlan
                });
            } else {
                throw new Error(result.message || 'Failed to load workout plan');
            }
        } catch (error) {
            console.error('Failed to fetch workout plan:', error);
            toast.show({
                message: "Error: Failed to load workout plan. Please try again.",
                type: 'error',
                style: 'center'
            });
        } finally {
            setLoading(false);
        }
    };

    const callWorkoutCompletionAPI = async () => {
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
                await clearWorkoutState();
            } else {
                console.error('❌ Workout completion API failed:', response.status);
                workoutCompletionCalledRef.current = false;
            }
        } catch (error) {
            console.error('❌ Error calling workout done API:', error);
            workoutCompletionCalledRef.current = false;
        } finally {
            isCallingAPIRef.current = false;
        }
    };

    const completeExerciseSet = (exerciseId: number) => {
        setExercises(prev => {
            const updated = prev.map(exercise => {
                if (exercise.id === exerciseId) {
                    const newCompletedSets = exercise.completedSets + 1;
                    const isExerciseComplete = newCompletedSets >= exercise.sets;

                    console.log(`✅ ${exercise.name}: Set ${newCompletedSets}/${exercise.sets} completed`);

                    return {
                        ...exercise,
                        completedSets: newCompletedSets,
                        completed: isExerciseComplete
                    };
                }
                return exercise;
            });

            // Check if ALL exercises are fully completed
            const allExercisesComplete = updated.every(ex => ex.completed);

            if (allExercisesComplete && !workoutCompletionCalledRef.current) {
                console.log('🎯 ALL EXERCISES & ALL SETS COMPLETED! Calling API...');
                callWorkoutCompletionAPI();
            } else {
                const totalCompleted = updated.filter(ex => ex.completed).length;
                const totalRemaining = updated.length - totalCompleted;
                console.log(`📊 Progress: ${totalCompleted}/${updated.length} exercises fully completed (${totalRemaining} remaining)`);
            }

            return updated;
        });
    };

    const completeExercise = async (exerciseId: number) => {
        // This marks the entire exercise as complete (all sets done)
        setExercises(prev => {
            const updated = prev.map(exercise =>
                exercise.id === exerciseId
                    ? { ...exercise, completed: true, completedSets: exercise.sets }
                    : exercise
            );

            const allComplete = updated.every(ex => ex.completed);

            if (allComplete && !workoutCompletionCalledRef.current) {
                console.log('🎯 ALL EXERCISES COMPLETED! Calling API...');
                callWorkoutCompletionAPI();
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

    const getNextExerciseInCircuit = (): Exercise | null => {
        // Get regular exercises (exclude last cooldown)
        const regularExercises = exercises.slice(0, -1);
        const currentExercise = exercises[currentExerciseIndex];

        if (!currentExercise) return null;

        // Check if current exercise is the last cooldown
        const isLastExercise = currentExercise.order === exercises.length;

        if (isLastExercise) {
            // Already on cooldown, check if all its sets are done
            if (currentExercise.completedSets >= currentExercise.sets) {
                return null; // Cooldown complete, workout done
            }
            return currentExercise; // Stay on cooldown
        }

        // Find next exercise in current set round that still needs sets
        const currentIndexInRegular = regularExercises.findIndex(ex => ex.id === currentExercise.id);

        // Look for next exercise in current set round that hasn't completed this set yet
        for (let i = currentIndexInRegular + 1; i < regularExercises.length; i++) {
            const ex = regularExercises[i];
            // Check if this exercise needs more sets and hasn't completed the current set round
            if (ex.completedSets < ex.sets && ex.completedSets < currentSetNumber) {
                return ex;
            }
        }

        // Check if current set round is complete for all exercises
        const allExercisesCompletedCurrentSet = regularExercises.every(ex =>
            ex.completedSets >= currentSetNumber || ex.sets < currentSetNumber
        );

        if (allExercisesCompletedCurrentSet) {
            // Move to next set round
            if (currentSetNumber < maxSets) {
                setCurrentSetNumber(currentSetNumber + 1);

                // Find first exercise in next set round that needs more sets
                const nextExercise = regularExercises.find(ex =>
                    ex.completedSets < ex.sets && ex.sets >= (currentSetNumber + 1)
                );

                return nextExercise || null;
            } else {
                // All regular exercise sets completed, move to cooldown
                const cooldown = exercises[exercises.length - 1];
                return cooldown.completed ? null : cooldown;
            }
        }

        return null;
    };

    const resetWorkout = () => {
        // This is called internally or when user gets NEW workout plan
        setExercises(prev =>
            prev.map(exercise => ({ ...exercise, completed: false, completedSets: 0 }))
        );
        setCurrentExerciseIndex(0);
        setCurrentSetNumber(1);
        workoutCompletionCalledRef.current = false;
        clearWorkoutState();
        console.log('🔄 Workout has been reset (internal)');
    };

    const restartWorkout = () => {
        // Manual restart by user - resets progress but keeps same plan
        setExercises(prev =>
            prev.map(exercise => ({ ...exercise, completed: false, completedSets: 0 }))
        );
        setCurrentExerciseIndex(0);
        setCurrentSetNumber(1);
        workoutCompletionCalledRef.current = false;
        clearWorkoutState();
        console.log('🔄 Workout manually restarted by user');
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
        currentSetNumber,
        maxSets,
        completeExerciseSet,
        completeExercise,
        resetWorkout,
        restartWorkout,
        getCurrentExercise,
        moveToNextExercise,
        isWorkoutCompleted,
        workoutProgress,
        getNextIncompleteExercise,
        getNextExerciseInCircuit,
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