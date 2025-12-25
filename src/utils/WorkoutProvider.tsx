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
    isCooldown: boolean;
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
        case 'JAWLINE':
            return 'meditation';
        case 'SYMMETRY':
            return 'face-man';
        case 'PUFFINESS':
            return 'emoticon-happy';
        case 'GENERAL':
            return 'emoticon-happy';
        default:
            return icons[index % icons.length];
    }
};

const isCooldownExercise = (exerciseData: any): boolean => {
    if (exerciseData?.is_cooldown !== undefined) {
        return exerciseData.is_cooldown === true;
    }

    const hasSingleSet = exerciseData?.sets === 1;
    const hasDuration = (exerciseData?.duration || 0) > 0;
    const noReps = (exerciseData?.reps || 0) === 0;

    const name = exerciseData?.exercise?.name || '';
    const lower = name.toLowerCase();
    const isNamedCooldown =
        lower.includes('lymphatic') ||
        lower.includes('cool down') ||
        lower.includes('cooldown') ||
        lower.includes('cool-down');

    return (hasSingleSet && hasDuration && noReps) || isNamedCooldown;
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

    const getRegularExercises = () => exercises.filter(ex => !ex.isCooldown);
    const getCooldownExercises = () => exercises.filter(ex => ex.isCooldown);

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
                timestamp: Date.now(),
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
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                const apiData = result.data;
                const newWorkoutPlanId = apiData.id;
                const isNewPlan = workoutPlanId !== newWorkoutPlanId;

                setWorkoutPlanId(newWorkoutPlanId);

                // ✅ SAFE mapping here
                const transformedExercises: Exercise[] = apiData.exercises.map((item: any, index: number) => {
                    const exerciseData = item?.exercise || {};

                    const reps = Number(item?.reps) || 0;
                    const duration = Number(item?.duration) || 0;
                    const sets = Number(item?.sets) || 1;

                    const isRepBased = reps > 0;
                    const displayValue = isRepBased ? reps : duration;
                    const displayUnit = isRepBased ? 'reps' : 's';
                    const cooldown = isCooldownExercise(item);

                    return {
                        id: item?.order || index + 1,
                        name: exerciseData?.name || `Exercise ${index + 1}`,
                        reps,
                        duration,
                        sets,
                        completedSets: 0,
                        isRepBased,
                        displayText: `${displayValue} ${displayUnit}`,
                        icon: getIconForMetric(exerciseData?.target_metric || '', index),
                        completed: false,
                        description: exerciseData?.description || '',
                        instructions: exerciseData?.instructions || [],
                        order: item?.order ?? index + 1,
                        target_metric: exerciseData?.target_metric || '',
                        isCooldown: cooldown,
                    };
                });

                transformedExercises.sort((a, b) => a.order - b.order);

                const cooldownExercises = transformedExercises.filter(ex => ex.isCooldown);
                const regularExercises = transformedExercises.filter(ex => !ex.isCooldown);

                const finalExercises = [...regularExercises, ...cooldownExercises];

                finalExercises.forEach((ex, idx) => {
                    ex.order = idx + 1;
                    ex.id = idx + 1;
                });

                const calculatedMaxSets =
                    regularExercises.length > 0 ? Math.max(...regularExercises.map(ex => ex.sets), 1) : 1;

                setExercises(finalExercises);
                setMaxSets(calculatedMaxSets);

                console.log('✅ Workout plan loaded:', {
                    planId: newWorkoutPlanId,
                    totalExercises: finalExercises.length,
                    regularExercises: regularExercises.length,
                    cooldownExercises: cooldownExercises.length,
                    maxSets: calculatedMaxSets,
                    cooldownNames: cooldownExercises.map(ex => ex.name),
                });

                if (isNewPlan) {
                    console.log('🆕 NEW workout plan detected - Resetting progress');
                    setCurrentExerciseIndex(0);
                    setCurrentSetNumber(1);
                    workoutCompletionCalledRef.current = false;
                    await clearWorkoutState();
                } else {
                    console.log('♻️ Same workout plan - Keeping progress');
                }
            } else {
                throw new Error(result.message || 'Failed to load workout plan');
            }
        } catch (error) {
            console.error('❌ Failed to fetch workout plan:', error);
            if (exercises.length === 0) {
                toast.show({
                    message: 'Error: Failed to load workout plan. Please try again.',
                    type: 'error',
                    style: 'center',
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
                    Authorization: `Bearer ${token}`,
                },
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

                    console.log(
                        `✅ ${exercise.name}: Set ${newCompletedSets}/${exercise.sets} completed`
                    );
                    console.log(`Is cooldown? ${exercise.isCooldown}`);

                    return {
                        ...exercise,
                        completedSets: newCompletedSets,
                        completed: isExerciseComplete,
                    };
                }
                return exercise;
            });

            const allExercisesComplete = updated.every(ex => ex.completed);

            if (allExercisesComplete && !workoutCompletionCalledRef.current) {
                console.log('🎯 ALL EXERCISES & ALL SETS COMPLETED! Calling API...');
                callWorkoutCompletionAPI();
            }

            return updated;
        });

        setTimeout(() => {
            const nextExercise = getNextExerciseInCircuit();
            if (nextExercise) {
                const nextIndex = exercises.findIndex(ex => ex.id === nextExercise.id);
                if (nextIndex !== -1) {
                    setCurrentExerciseIndex(nextIndex);
                    console.log(`📱 Auto-moving to: ${nextExercise.name}`);
                }
            }
        }, 50);
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
        console.log('Current Set:', currentSetNumber, '/', maxSets);

        const regularExercises = getRegularExercises();
        const cooldownExercises = getCooldownExercises();

        if (exercises.every(ex => ex.completed)) {
            console.log('✅ Workout already completed');
            return null;
        }

        if (cooldownExercises.every(ex => ex.completed) && regularExercises.every(ex => ex.completed)) {
            console.log('✅ All regular + cooldown exercises completed');
            return null;
        }

        const currentExercise = exercises[currentExerciseIndex];
        const currentIsCooldown = currentExercise?.isCooldown || false;

        if (currentIsCooldown) {
            const nextCooldown = cooldownExercises.find(
                ex => !ex.completed && ex.order > (currentExercise?.order || 0)
            );
            if (nextCooldown) {
                console.log(`🧘 Next cooldown: ${nextCooldown.name}`);
                return nextCooldown;
            }
            return null;
        }

        const currentRegularIndex = regularExercises.findIndex(
            ex => ex.id === currentExercise?.id
        );

        console.log(`Current regular exercise index: ${currentRegularIndex}`);

        for (let i = currentRegularIndex + 1; i < regularExercises.length; i++) {
            const nextEx = regularExercises[i];
            if (nextEx.sets >= currentSetNumber && nextEx.completedSets < currentSetNumber) {
                console.log(`➡️ Next in same set: ${nextEx.name} (Set ${currentSetNumber})`);
                return nextEx;
            }
        }

        for (let i = 0; i <= currentRegularIndex; i++) {
            const nextEx = regularExercises[i];
            if (nextEx.sets >= currentSetNumber && nextEx.completedSets < currentSetNumber) {
                console.log(`🔁 Wrapping to beginning: ${nextEx.name}`);
                return nextEx;
            }
        }

        console.log(
            `✅ All ${regularExercises.length} regular exercises completed for Set ${currentSetNumber}`
        );

        if (currentSetNumber < maxSets) {
            const nextSet = currentSetNumber + 1;
            console.log(`🔄 Moving to Set ${nextSet}`);

            const firstExerciseNextSet = regularExercises.find(
                ex => ex.sets >= nextSet && ex.completedSets < nextSet
            );

            if (firstExerciseNextSet) {
                setCurrentSetNumber(nextSet);
                console.log(`🎯 Starting Set ${nextSet} with: ${firstExerciseNextSet.name}`);
                return firstExerciseNextSet;
            }
        }

        console.log('🏁 All regular sets completed! Moving to cooldown...');
        const firstIncompleteCooldown = cooldownExercises.find(ex => !ex.completed);
        if (firstIncompleteCooldown) {
            console.log('🧘 Going to cooldown:', firstIncompleteCooldown.name);
            return firstIncompleteCooldown;
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
            total: exercise?.sets || 0,
        };
    };

    const getCurrentSetInfo = () => {
        return {
            currentSet: currentSetNumber,
            maxSets: maxSets,
        };
    };

    const isWorkoutCompleted =
        exercises.length > 0 && exercises.every(exercise => exercise.completed);

    const workoutProgress =
        exercises.length > 0
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

    return <WorkoutContext.Provider value={contextValue}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
    const context = useContext(WorkoutContext);
    if (context === undefined) {
        throw new Error('useWorkout must be used within a WorkoutProvider');
    }
    return context;
};
