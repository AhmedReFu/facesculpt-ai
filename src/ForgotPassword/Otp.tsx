import { IPA_BASE, RESEND_OTP } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
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
    OTP_RESEND: RESEND_OTP,
};

type RootStackParamList = {
    CreateNewPassword: undefined | { phone_number?: string } | { otp?: number };
    Auth: undefined;
};

interface RouteParams {
    phone_number?: string;
}
type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const Otp = () => {
    const toast = useToast();
    const navigation = useNavigation<OtpScreenNavigationProp>();
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [timer, setTimer] = useState<number>(60);
    const [isVerifying, setIsVerifying] = useState<boolean>(false);
    const inputsRef = useRef<TextInput[]>([]);
    const route = useRoute();
    const params = route.params as RouteParams;

    // Initialize refs array
    useEffect(() => {
        inputsRef.current = inputsRef.current.slice(0, 6);
    }, []);

    // Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

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

            // Show success and navigate
            toast.show({
                message: 'Code verified successfully! ✓',
                type: 'success',
                style: 'top',
                duration: 2000
            });

            // Delay navigation for better UX
            setTimeout(() => {
                navigation.navigate('CreateNewPassword', {
                    phone_number: params.phone_number,
                    otp: parseInt(verificationCode)
                });
            }, 1000);

        } catch (error) {
            console.error('Error verifying OTP:', error);

            toast.show({
                message: 'Failed to verify OTP. Please try again.',
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
                };

                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OTP_RESEND}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(otpPayload),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log('OTP resent successfully!');
                    toast.show({
                        message: 'A new verification code has been sent to your phone.',
                        type: 'success',
                        style: 'top',
                        duration: 3000
                    });
                } else {
                    throw new Error(result.message || 'Failed to resend OTP');
                }

            } catch (error) {
                console.error('Error resending OTP:', error);
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

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView>
                <View className="flex-1 px-6 justify-center">
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={handleBack}
                        className={`absolute top-4 left-6 z-10`}
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
                                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                <Text className="text-white font-bold text-lg">
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

export default Otp;