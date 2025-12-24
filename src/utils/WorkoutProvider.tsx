// contexts/WorkoutProvider.tsx - COMPLETE FIXED VERSION
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
    completedSets: number;
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
    completeExerciseSet: (exerciseId: number) => void;
    completeExercise: (exerciseId: number) => Promise<void>;
    resetWorkout: () => void;
    restartWorkout: () => void;
    getCurrentExercise: () => Exercise | null;
    moveToNextExercise: () => void;
    isWorkoutCompleted: boolean;
    workoutProgress: number;
    getNextIncompleteExercise: () => Exercise | null;
    getNextExerciseInCircuit: () => Exercise | null;
    loading: boolean;
    workoutPlanId: number | null;
    fetchWorkoutPlan: () => Promise<void>;
    getExerciseProgress: (exerciseId: number) => { completed: number; total: number };
    getCurrentSetInfo: () => { currentSet: number; maxSets: number };
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
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            initializeWorkout();
        }
    }, []);

    useEffect(() => {
        if (exercises.length > 0) {
            saveWorkoutState();
        }
    }, [exercises, currentExerciseIndex, currentSetNumber]);

    const initializeWorkout = async () => {
        console.log('🚀 Initializing workout...');
        try {
            const savedState = await AsyncStorage.getItem(WORKOUT_STATE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                setExercises(state.exercises || []);
                setCurrentExerciseIndex(state.currentExerciseIndex || 0);
                setCurrentSetNumber(state.currentSetNumber || 1);
                setMaxSets(state.maxSets || 3);
                setWorkoutPlanId(state.workoutPlanId || null);
                console.log('📂 Loaded cached workout state');
                setLoading(false);
            }
            await fetchWorkoutPlan();
        } catch (error) {
            console.error('Error initializing workout:', error);
            setLoading(false);
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
            console.log('📡 Fetching workout plan from API...');
            const accessToken = await AsyncStorage.getItem('token');

            if (!accessToken) {
                console.log('⚠️ No token found, skipping API call');
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
                const isNewPlan = workoutPlanId !== newWorkoutPlanId;

                setWorkoutPlanId(newWorkoutPlanId);

                // Transform API data
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
                        completedSets: 0,
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

                // Calculate max sets from regular exercises (excluding last cooldown)
                const regularExercises = transformedExercises.slice(0, -1);
                const calculatedMaxSets = Math.max(...regularExercises.map(ex => ex.sets), 1);

                setExercises(transformedExercises);
                setMaxSets(calculatedMaxSets);

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
                    totalExercises: transformedExercises.length,
                    maxSets: calculatedMaxSets
                });
            } else {
                throw new Error(result.message || 'Failed to load workout plan');
            }
        } catch (error) {
            console.error('❌ Failed to fetch workout plan:', error);
            if (exercises.length === 0) {
                toast.show({
                    message: "Error: Failed to load workout plan. Please try again.",
                    type: 'error',
                    style: 'center'
                });
            }
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
        console.log(`🎯 Completing set for exercise ${exerciseId}`);

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

            // Check if ALL exercises are completed
            const allExercisesComplete = updated.every(ex => ex.completed);

            if (allExercisesComplete && !workoutCompletionCalledRef.current) {
                console.log('🎯 ALL EXERCISES & ALL SETS COMPLETED! Calling API...');
                callWorkoutCompletionAPI();
            }

            return updated;
        });
    };

    const completeExercise = async (exerciseId: number) => {
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

    const getNextExerciseInCircuit = (): Exercise | null => {
        console.log('🔍 Finding next exercise in circuit...');
        console.log('Current Set:', currentSetNumber);
        console.log('Max Sets:', maxSets);
        console.log('Current Exercise Index:', currentExerciseIndex);

        // Separate regular exercises from cooldown
        const regularExercises = exercises.slice(0, -1);
        const cooldownExercise = exercises[exercises.length - 1];

        // If workout is already completed, return null
        if (exercises.every(ex => ex.completed)) {
            console.log('✅ Workout already completed');
            return null;
        }

        // If cooldown is completed, workout is done
        if (cooldownExercise?.completed) {
            console.log('✅ Cooldown already completed');
            return null;
        }

        const currentExercise = exercises[currentExerciseIndex];

        // Check if we're on the cooldown exercise
        if (currentExercise?.order === exercises.length) {
            // We're on cooldown
            if (!cooldownExercise.completed) {
                return cooldownExercise;
            }
            return null;
        }

        // ===== FIXED CIRCUIT LOGIC =====
        // Check all exercises in order
        for (let i = 0; i < regularExercises.length; i++) {
            const exercise = regularExercises[i];

            // Skip if exercise doesn't have this set
            if (exercise.sets < currentSetNumber) {
                console.log(`⏭️ ${exercise.name} has only ${exercise.sets} sets, skipping Set ${currentSetNumber}`);
                continue;
            }

            // Check if this exercise hasn't completed this set yet
            if (exercise.completedSets < currentSetNumber) {
                console.log(`➡️ Found exercise: ${exercise.name} (Set ${currentSetNumber}, Completed: ${exercise.completedSets})`);
                return exercise;
            }
        }

        // All regular exercises completed for current set
        console.log(`✅ All regular exercises completed for Set ${currentSetNumber}`);

        // Check if we should move to next set
        if (currentSetNumber < maxSets) {
            const nextSet = currentSetNumber + 1;
            console.log(`🔄 Moving to Set ${nextSet}/${maxSets}`);

            // Find first exercise for next set
            for (let i = 0; i < regularExercises.length; i++) {
                const exercise = regularExercises[i];

                if (exercise.sets < nextSet) continue;

                if (exercise.completedSets < nextSet) {
                    console.log(`🎯 Starting Set ${nextSet} with: ${exercise.name}`);
                    // Update state for next set
                    setCurrentSetNumber(nextSet);
                    return exercise;
                }
            }
        }

        // All sets completed, move to cooldown
        console.log('🏁 All sets completed! Moving to cooldown...');
        if (cooldownExercise && !cooldownExercise.completed) {
            console.log('🧘 Moving to cooldown:', cooldownExercise.name);
            return cooldownExercise;
        }

        console.log('🎉 Workout fully completed!');
        return null;
    };

    const moveToNextExercise = () => {
        const nextExercise = getNextExerciseInCircuit();
        if (nextExercise) {
            const nextIndex = exercises.findIndex(ex => ex.id === nextExercise.id);
            if (nextIndex !== -1) {
                setCurrentExerciseIndex(nextIndex);
                console.log(`📱 Moved to: ${nextExercise.name} (index ${nextIndex})`);
            }
        }
    };

    const resetWorkout = () => {
        setExercises(prev =>
            prev.map(exercise => ({ ...exercise, completed: false, completedSets: 0 }))
        );
        setCurrentExerciseIndex(0);
        setCurrentSetNumber(1);
        workoutCompletionCalledRef.current = false;
        clearWorkoutState();
        console.log('🔄 Workout has been reset');
    };

    const restartWorkout = () => {
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

    const getExerciseProgress = (exerciseId: number) => {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        return {
            completed: exercise?.completedSets || 0,
            total: exercise?.sets || 0
        };
    };

    const getCurrentSetInfo = () => {
        return {
            currentSet: currentSetNumber,
            maxSets: maxSets
        };
    };

    const isWorkoutCompleted = exercises.length > 0 && exercises.every(exercise => exercise.completed);
    const workoutProgress = exercises.length > 0
        ? exercises.filter(ex => ex.completed).length / exercises.length
        : 0;

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
        getExerciseProgress,
        getCurrentSetInfo,
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