// contexts/WorkoutContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {



    const [exercises, setExercises] = useState<Exercise[]>([
        {
            id: 1,
            name: 'Jaw Clench Hold',
            duration: '10s',
            reps: false,
            durationInSeconds: 10,
            icon: 'meditation',
            completed: false,
            description: 'Clench your jaw muscles tightly and hold for the duration.',
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
            reps: true,
            durationInSeconds: 10,
            icon: 'face-man',
            completed: false,
            description: 'Make gentle circles around your eyes with your ring fingers.',
            instructions: [
                'Apply clean hands and optional facial oil.',
                'Use gentle, upward strokes.',
                'Follow lymph pathways toward the ears.',
                'Keep pressure light and consistent.',
                'Finish with slow, calming breaths.',
            ]
        },
        {
            id: 3,
            name: 'Chew Motion',
            duration: '20 reps',
            reps: true,
            durationInSeconds: 10,
            icon: 'food-apple',
            completed: false,
            description: 'Perform exaggerated chewing motions to strengthen jaw muscles.',
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
            reps: true,
            durationInSeconds: 10,
            icon: 'emoticon-happy',
            completed: false,
            description: 'Lift your cheeks upward to tone facial muscles.',
            instructions: [
                'Smile widely to engage cheek muscles.',
                'Hold the position steadily.',
                'Keep breathing normally.',
                'Feel the muscle tension.',
                'Release gently.',
            ]
        },
    ]);



    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);

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

    const isWorkoutCompleted = exercises.every(exercise => exercise.completed);
    const workoutProgress = exercises.filter(ex => ex.completed).length / exercises.length;

    const contextValue: WorkoutContextType = {
        exercises,
        currentExerciseIndex,
        completeExercise,
        resetWorkout,
        getCurrentExercise,
        moveToNextExercise,
        isWorkoutCompleted,
        workoutProgress,
        getNextIncompleteExercise
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