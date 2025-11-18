import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";

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

const Sessions = ({ route }: any) => {
    const navigation = useNavigation();

    // Get data from route params with fallbacks
    const title = route?.params?.title || 'Jaw Clench Hold';
    const info = route?.params?.info || [
        'Sit upright with relaxed shoulders.',
        'Engage the target muscle gently first.',
        'Increase tension to a firm, pain-free hold.',
        'Breathe steadily through your nose.',
        'Release slowly and reset posture.',
    ];
    const timers = route?.params?.duration;
    const initialDuration = parseInt(route?.params?.duration || '9', 10);
    const description = route?.params?.description || 'Clench your jaw muscles tightly and hold for the duration.';

    // Timer states
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown timer effect
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Timer completed
                        setIsRunning(false);
                        setIsCompleted(true);
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

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft]);

    const handleStartPause = () => {
        if (timeLeft === 0) {
            // Reset timer
            setTimeLeft(initialDuration);
            setIsCompleted(false);
        }
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(initialDuration);
        setIsCompleted(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handleMarkComplete = () => {
        setIsCompleted(true);
        setIsRunning(false);
        setTimeLeft(0)
        console.log('Exercise marked as complete');
        // Navigate back after marking complete
        (navigation as any).navigate('DailyTrack');
        setTimeout(() => {
           
        }, 500);
    };

    const handlePrevious = () => {
        console.log('Go to previous exercise');
        navigation.goBack();
    };

    return (
        <View style={tw`flex-1 bg-[#00000] `}>
            <StatusBar style='light' />

            {/* Header */}
            <View style={tw` pt-12 pb-4 bg-[#000000]`}>
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
                    {title}
                </Text>

                {/* Description */}
                <Text style={tw`text-[#9CA3AF] text-base mb-6 leading-6`}>
                    {description}
                </Text>

                {/* How to do it */}
                <Text style={tw`text-white text-base font-semibold mb-3`}>
                    How to do it
                </Text>

                <View style={tw`mb-6`}>
                    {info.map((instruction: string, index: number) => (
                        <InstructionItem key={index} text={instruction} />
                    ))}
                </View>

                {/* Timer Card */}
                <View style={tw`bg-[#252b33] rounded-3xl p-8 items-center mb-6`}>
                    <View style={tw` rounded-full mb-4`}>
                        <MaterialCommunityIcons
                            name={isRunning ? "pause" : "timer-outline"}
                            size={40}
                            color={timeLeft === 0 ? "#4ade80" : "#60A5FB"}
                        />
                    </View>
                    <Text style={tw`text-white text-6xl font-bold mb-2 ${timeLeft <= 3 && timeLeft > 0 ? 'text-red-400' : ''
                        } ${timeLeft === 0 ? 'text-green-400' : ''}`}>
                        {timeLeft}
                    </Text>
                    <Text style={tw`text-[#9CA3AF] text-sm mb-4`}>
                        {timeLeft === 0 ? 'Completed!' : isRunning ? 'In Progress...' : ''}
                    </Text>

                    {/* Reset Button */}
                    {(isRunning || timeLeft !== initialDuration) && (
                        <TouchableOpacity
                            onPress={handleReset}
                            style={tw`mt-2`}
                        >
                            <Text style={tw`text-[#60A5FB] text-sm`}>Reset</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={tw`h-32`} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={tw`px-6 pb-8 pt-4 bg-[#000000]`}>
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

                    <TouchableOpacity
                        onPress={handleStartPause}
                        style={tw`flex-1 bg-[#60A5FB]   py-4 rounded-2xl flex-row items-center justify-center `}
                        activeOpacity={0.7}
                        disabled={isRunning}
                        
                    >
                        <Text style={tw`text-white font-semibold text-base`}>
                            {timeLeft === 0 ? 'Restart' : isRunning ? 'Running...' : 'Start'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Mark Complete Button */}
                <TouchableOpacity
                    onPress={ handleMarkComplete}
                    style={tw`bg-[#d4dce5] py-6 rounded-2xl flex-row items-center justify-center `}
                    activeOpacity={0.7}
                >
                    {isCompleted ? (
                        <>
                            <MaterialIcons name="check-circle" size={24} color="#1a1f24" style={tw`mr-2`} />
                            <Text style={tw`text-[#1a1f24] font-semibold text-base`}>
                                Completed!
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
            </View>
        </View>
    );
};

export default Sessions;