import { IPA_BASE, OTP_AUTH, RESEND_OTP } from '@env';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { Toast, useToast } from '../hooks/useToost';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    OTP_AUTH: OTP_AUTH,
    OTP_RESEND: RESEND_OTP,
};

type RootStackParamList = {
    CreateNewPassword: undefined;
    Auth: undefined;
};

interface RouteParams {
    phone_number?: string;
}

type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const OtpAuth = () => {
    const toast = useToast();
    const navigation = useNavigation<OtpScreenNavigationProp>();
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [timer, setTimer] = useState<number>(60);
    const [spinnerRotation, setSpinnerRotation] = useState<number>(0);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const inputsRef = useRef<TextInput[]>([]);
    const route = useRoute();
    const params = route.params as RouteParams;

    // Initialize refs array
    useEffect(() => {
        inputsRef.current = inputsRef.current.slice(0, 6);
    }, []);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer]);

    // Success modal auto redirect effect with spinner animation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        let spinnerInterval: NodeJS.Timeout;

        if (showSuccessModal) {
            // Spinner rotation animation
            spinnerInterval = setInterval(() => {
                setSpinnerRotation(prev => (prev + 45) % 360);
            }, 150);

            // Auto redirect after 3 seconds
            timer = setTimeout(() => {
                setShowSuccessModal(false);
                navigation.replace('Auth');
            }, 3000);
        } else {
            setSpinnerRotation(0);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (spinnerInterval) clearInterval(spinnerInterval);
        };
    }, [showSuccessModal, navigation]);

    const handleChange = (text: string, index: number) => {
        const numericText = text.replace(/[^0-9]/g, '');
        const newCode = [...code];
        newCode[index] = numericText;
        setCode(newCode);

        if (numericText && index < 5) {
            setTimeout(() => {
                inputsRef.current[index + 1]?.focus();
            }, 10);
        }

        if (numericText && index === 5) {
            const enteredCode = newCode.join('');
            if (enteredCode.length === 6) {
                handleSubmit(enteredCode);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            setTimeout(() => {
                inputsRef.current[index - 1]?.focus();
            }, 10);
        }
    };

    const handleSubmit = async (enteredCode?: string) => {
        const verificationCode = enteredCode || code.join('');

        if (verificationCode.length < 6) {
            toast.show({
                message: 'Please enter a complete 6-digit code.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        // Check if phone number is available
        if (!params?.phone_number) {
            toast.show({
                message: 'Phone number is missing. Please go back and try again.',
                type: 'error',
                style: 'center',
                buttons: [
                    {
                        text: 'Go Back',
                        action: 'back'
                    }
                ]
            });
            return;
        }

        try {
            setIsVerifying(true);

            // Prepare OTP verification payload
            const otpPayload = {
                phone_number: params.phone_number,
                otp: verificationCode
            };

            console.log('Sending OTP verification:', otpPayload);

            // Send OTP verification to API
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OTP_AUTH}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(otpPayload),
            });

            const result = await response.json();
            console.log('OTP Verification Response:', result);

            // Check if verification was successful
            if (response.ok && result.success) {
                console.log('OTP verified successfully!');
                setShowSuccessModal(true);
            } else {
                // API returned error
                throw new Error(result.message || 'Invalid or expired OTP');
            }

        } catch (error) {
            console.error('Error verifying OTP:', error);

            toast.show({
                message: error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }]
            });

            // Clear the code on error
            setCode(['', '', '', '', '', '']);
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (timer === 0) {
            try {
                setTimer(60);
                setCode(['', '', '', '', '', '']);
                setTimeout(() => {
                    inputsRef.current[0]?.focus();
                }, 100);
                const otpPayload = {
                    phone_number: params.phone_number,
                }
                // TODO: Implement actual resend OTP API call here
                // const response = await fetch(...);
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OTP_RESEND}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(otpPayload),
                });
                const result = await response.json();

                if (response.ok && result.success) {
                    console.log('OTP verified successfully!');
                    toast.show({
                        message: 'A new verification code has been sent to your phone.',
                        type: 'success',
                        style: 'top',
                        duration: 3000
                    });
                } else {
                    // API returned error
                    throw new Error(result.message || 'Invalid or expired OTP');
                }

            } catch (error) {
                toast.show({
                    message: 'Failed to resend code. Please try again.',
                    type: 'error',
                    style: 'top'
                });
            }
        } else {
            toast.show({
                message: `Please wait ${timer} seconds before requesting a new code.`,
                type: 'warning',
                style: 'top'
            });
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const isContinueDisabled = code.join('').length < 6 || isVerifying;

    // Spinner dot positions (8 dots in a circle)
    const spinnerDots = [
        { angle: 0, size: 12, opacity: 1 },
        { angle: 45, size: 11, opacity: 0.9 },
        { angle: 90, size: 10, opacity: 0.8 },
        { angle: 135, size: 9, opacity: 0.6 },
        { angle: 180, size: 8, opacity: 0.4 },
        { angle: 225, size: 7, opacity: 0.3 },
        { angle: 270, size: 6, opacity: 0.2 },
        { angle: 315, size: 6, opacity: 0.1 },
    ];

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView>
                <View className="flex-1 px-6 justify-center">
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={handleBack}
                        className={`absolute top-4 left-6 z-10 ${showSuccessModal ? 'opacity-0' : 'opacity-100'}`}
                        disabled={isVerifying}
                    >
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Logo */}
                    <Image source={Images.Icon} resizeMode="contain" className='self-center my-20' />

                    {/* Heading */}
                    <Text className="text-3xl font-bold text-white text-center mb-3">
                        Verification Code
                    </Text>

                    {/* Subtext */}
                    <Text className="text-xl text-gray-400 text-center mb-12 leading-6 px-2">
                        A code has been sent to {params?.phone_number}. Please enter it to continue.
                    </Text>

                    {/* OTP Inputs */}
                    <View className="flex-row justify-between mb-10 px-5">
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                placeholder="0"
                                placeholderTextColor="#6B7280"
                                ref={(ref) => {
                                    if (ref) {
                                        inputsRef.current[index] = ref;
                                    }
                                }}
                                className={`w-14 h-14 bg-gray-800 text-white text-center rounded-xl text-2xl font-bold border-2 ${digit ? 'border-blue-400 bg-blue-900/30' : 'border-gray-700'
                                    }`}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={digit}
                                onChangeText={text => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                selectTextOnFocus
                                autoFocus={index === 0}
                                editable={!isVerifying}
                            />
                        ))}
                    </View>

                    {/* Resend Code Section */}
                    <View className="items-center mb-10">
                        <Text className="text-gray-400 text-base mb-2 text-center">
                            Didn't receive the code?{' '}
                            <Text
                                className={`font-semibold ${timer !== 0 || isVerifying ? 'text-gray-600 line-through' : 'text-blue-400'
                                    }`}
                                onPress={handleResend}
                            >
                                Resend code
                            </Text>
                        </Text>

                        {timer !== 0 && (
                            <Text className="text-blue-400 text-base font-medium text-center">
                                Resend code in 00:{timer < 10 ? `0${timer}` : timer}
                            </Text>
                        )}
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center mb-5 flex-row justify-center ${isContinueDisabled ? 'bg-gray-700 opacity-60' : 'bg-blue-400'
                            }`}
                        onPress={() => handleSubmit()}
                        disabled={isContinueDisabled}
                    >
                        {isVerifying ? (
                            <>
                                <ActivityIndicator color="white" size="small" />
                                <Text className="text-white font-bold text-lg ml-2">
                                    Verifying...
                                </Text>
                            </>
                        ) : (
                                <Text className="text-white font-bold text-lg">
                                    Continue
                                </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Success Modal with Blur */}
                {showSuccessModal && (
                    <BlurView
                        intensity={70}
                        tint="dark"
                        className="absolute inset-0 justify-center items-center px-4"
                    >
                        <View className="w-full max-w-[400px]">
                            <View className="bg-[#1A2028] rounded-3xl p-10 items-center border border-gray-700/50">
                                {/* Success Icon */}
                                <View className="mb-6">
                                    <View className="rounded-full justify-center items-center">
                                        <MaterialCommunityIcons name="check-decagram-outline" size={80} color="#60A5FA" />
                                    </View>
                                </View>

                                {/* Success Title */}
                                <Text className="text-2xl font-bold text-white text-center mb-3">
                                    Successful!
                                </Text>

                                {/* Success Subtitle */}
                                <Text className="text-base text-gray-400 text-center mb-8 leading-6">
                                    Your registration was completed{'\n'}successfully
                                </Text>

                                {/* Circular Spinner Animation */}
                                <View className="w-16 h-16 items-center justify-center">
                                    {spinnerDots.map((dot, index) => {
                                        const angle = (dot.angle + spinnerRotation) * (Math.PI / 180);
                                        const radius = 20;
                                        const x = Math.cos(angle) * radius;
                                        const y = Math.sin(angle) * radius;

                                        return (
                                            <View
                                                key={index}
                                                style={{
                                                    position: 'absolute',
                                                    width: dot.size,
                                                    height: dot.size,
                                                    borderRadius: dot.size / 2,
                                                    backgroundColor: '#60A5FA',
                                                    opacity: dot.opacity,
                                                    transform: [
                                                        { translateX: x },
                                                        { translateY: y }
                                                    ]
                                                }}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </BlurView>
                )}
            </ScrollView>

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
        </SafeAreaView>
    );
};

export default OtpAuth;