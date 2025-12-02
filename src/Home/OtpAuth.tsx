import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';

type RootStackParamList = {
    CreateNewPassword: undefined;
    Auth: undefined;
};
interface RouteParams {
    phone_number?: string;
}


type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const OtpAuth = () => {
    const navigation = useNavigation<OtpScreenNavigationProp>();
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [code, setCode] = useState<string[]>(['', '', '', '']);
    const [timer, setTimer] = useState<number>(60);
    const [spinnerRotation, setSpinnerRotation] = useState<number>(0);
    const inputsRef = useRef<TextInput[]>([]);
    const route = useRoute();
    const params = route.params as RouteParams;
    // Initialize refs array
    useEffect(() => {
        inputsRef.current = inputsRef.current.slice(0, 4);
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

        if (numericText && index < 3) {
            setTimeout(() => {
                inputsRef.current[index + 1]?.focus();
            }, 10);
        }

        if (numericText && index === 3) {
            const enteredCode = newCode.join('');
            if (enteredCode.length === 4) {
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

    const handleSubmit = (enteredCode?: string) => {
        const verificationCode = enteredCode || code.join('');

        if (verificationCode.length < 4) {
            Alert.alert('Error', 'Please enter a 4-digit code.');
            return;
        }

        setShowSuccessModal(true);
    };

    const handleResend = () => {
        if (timer === 0) {
            setTimer(60);
            setCode(['', '', '', '']);
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
            Alert.alert('Code Resent', 'A new verification code has been sent.');
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const isContinueDisabled = code.join('').length < 4;

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
                        className={`absolute top-16 left-6 z-10 ${showSuccessModal ? 'opacity-0' : 'opacity-100'}`}
                    >
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Logo */}
                    {/* <Text className="text-6xl font-bold text-white text-center mb-20">
                    Logo
                </Text> */}
                    <Image source={Images.Icon} resizeMode="contain" className='self-center mb-20' />
                    {/* Heading */}
                    <Text className="text-3xl font-bold text-white text-center mb-3">
                        Verification Code
                    </Text>

                    {/* Subtext */}
                    <Text className="text-xl text-gray-400 text-center mb-12 leading-6 px-2">
                        A code has been sent to your mobile number. Please enter it to continue.
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
                                className={`w-16 h-16 bg-gray-800 text-white text-center rounded-xl text-2xl font-bold border-2 ${digit ? 'border-blue-400 bg-blue-900/30' : 'border-gray-700'
                                    }`}
                                keyboardType="default"
                                maxLength={1}
                                value={digit}
                                onChangeText={text => handleChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {/* Resend Code Section */}
                    <View className="items-center mb-10">
                        <Text className="text-gray-400 text-base mb-2 text-center">
                            Didn't receive the code?{' '}
                            <Text
                                className={`font-semibold ${timer !== 0 ? 'text-gray-600 line-through' : 'text-blue-400'
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
                        className={`w-full py-4 rounded-xl items-center mb-5 ${isContinueDisabled ? 'bg-gray-700 opacity-60' : 'bg-blue-400'
                            }`}
                        onPress={() => handleSubmit()}
                        disabled={isContinueDisabled}
                    >
                        <Text className="text-white font-bold text-lg">
                            Continue
                        </Text>
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
                                {/* Success Icon with gradient border effect bg-blue-400/10   w-24 h-24  border-4 border-blue-400 */}
                                <View className="mb-6">
                                    <View className=" rounded-full  justify-center items-center ">
                                        {/* <Ionicons name="checkmark" size={50} color="#60A5FA" /> */}
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


        </SafeAreaView>
    );
};

export default OtpAuth;