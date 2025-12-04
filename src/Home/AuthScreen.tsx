import { IPA_BASE, LOGIN, REGISTER } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { useBackHandler } from '../lib/useBackHandler';

const API_BASE_URL = IPA_BASE;
console.log(IPA_BASE);
const API_ENDPOINTS = {
    LOGIN: LOGIN,
    REGISTER: REGISTER,
};

type RootStackParamList = {
    DailyTrack: undefined;
    ResetPassword: undefined;
    OtpAuth: undefined | { phone_number: string };
    FaceScan: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AuthScreen = () => {
    const navigator = useNavigation<AuthScreenNavigationProp>();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [password, setPassword] = useState('');

    const [isReady, setIsReady] = useState(false);

    useBackHandler();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    if (!isReady) {
        return <View className="flex-1 bg-black" />;
    }

    // Form validation
    const isSignInValid = number.length > 0 && password.length > 0;
    const isSignUpValid = name.length > 0 && number.length > 0 && password.length > 0 && agreeTerms;

    const allNumberRegex = /^\+[1-9]\d{1,14}$/;

    // ============ API Sign In Handler ============
    const handleSignIn = async () => {
        if (!number || !password) {
            ToastAndroid.showWithGravity(
                'Please enter phone number and password.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        // Validate phone number format
        if (!allNumberRegex.test(number)) {
            ToastAndroid.showWithGravity(
                'Please enter a valid phone number with country code (e.g., +19844864234).',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        // Validate password length
        if (password.length < 6) {
            ToastAndroid.showWithGravity(
                'Password must be at least 6 characters long.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        setIsLoading(true);

        try {
            const loginPayload = {
                phone_number: number,
                password: password,
            };

            console.log('Login payload:', loginPayload);

            // Call Login API
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success) {
                // Store tokens and user data
                await AsyncStorage.setItem('token', data.data.token);
                console.log('Token saved:', data.data.token);
                await AsyncStorage.setItem('refresh_token', data.data.refresh_token);

                await AsyncStorage.setItem('isLoggedIn', 'true');
                await AsyncStorage.setItem('user', JSON.stringify({
                    phone_number: number,
                    timestamp: data.timestamp,
                }));

                // Clear inputs
                setNumber('');
                setPassword('');

                ToastAndroid.showWithGravity(
                    'Sign in successfully ✓',
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER,
                );

                // Navigate based on subscription status
                const subscribe = await AsyncStorage.getItem('subscribe');
                console.log('Subscribe status:', subscribe);

                setTimeout(() => {
                    if (subscribe === 'true') {
                        navigator.navigate('DailyTrack');
                    } else {
                        navigator.navigate('FaceScan');
                    }
                }, 1000);

            } else {
                // Handle API error response
                const errorMessage = data.message || 'Invalid phone number or password.';
                ToastAndroid.showWithGravity(
                    errorMessage,
                    ToastAndroid.LONG,
                    ToastAndroid.CENTER,
                );
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            ToastAndroid.showWithGravity(
                'Network error. Please check your connection and try again.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ============ API Sign Up Handler ============
    const handleSignUp = async () => {
        if (!name || !number || !password) {
            ToastAndroid.showWithGravity(
                'Please fill in all fields.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        // Name validation
        if (name.trim().length < 2) {
            ToastAndroid.showWithGravity(
                'Please enter a valid name (at least 2 characters).',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        // Mobile number validation
        if (!allNumberRegex.test(number)) {
            ToastAndroid.showWithGravity(
                'Please enter a valid phone number with country code (e.g., +19844864234).',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        // Password validation
        if (password.length < 6) {
            ToastAndroid.showWithGravity(
                'Password must be at least 6 characters long.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        if (!agreeTerms) {
            ToastAndroid.showWithGravity(
                'Please agree to Terms & Conditions.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
            return;
        }

        setIsLoading(true);

        try {
            // Prepare signup payload matching API format
            const signupPayload = {
                phone_number: number.trim(),
                name: name.trim(),
                password: password
            };

            console.log('Signup payload:', signupPayload);

            // Call Register API
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupPayload),
            });

            const data = await response.json();
            console.log('Signup response:', data);

            if (response.ok && data.success) {
                // Store user data temporarily for OTP verification
                await AsyncStorage.setItem('tempUser', JSON.stringify({
                    name: name.trim(),
                    phone_number: number,
                }));

                ToastAndroid.showWithGravity(
                    'Account created successfully! Please verify OTP.',
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER,
                );

                // Navigate to OTP screen with phone number
                setTimeout(() => {
                    navigator.navigate('OtpAuth', {
                        phone_number: number,
                    });
                }, 500);

                // Clear inputs after navigation
                setName('');
                setNumber('');
                setPassword('');
                setAgreeTerms(false);

            } else {
                // Handle API error response
                const errorMessage = data.message || 'Sign up failed. Please try again.';
                ToastAndroid.showWithGravity(
                    errorMessage,
                    ToastAndroid.LONG,
                    ToastAndroid.CENTER,
                );
            }
        } catch (error) {
            console.error('Sign-up error:', error);
            ToastAndroid.showWithGravity(
                'Network error. Please check your connection and try again.',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigator.navigate('ResetPassword');
    };

    // Clear form when switching tabs
    const switchTab = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        setNumber('');
        setPassword('');
        setName('');
        if (tab === 'signin') {
            setAgreeTerms(false);
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView className="flex-1 bg-[#000000]">
                <StatusBar barStyle="light-content" />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-4"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start' }}
                    >
                        {/* Logo */}
                        <View className="items-center my-20">
                            <Image source={Images.Icon} resizeMode="contain" />
                        </View>

                        {/* Tab Switcher */}
                        <View className="flex-row border-2 border-white rounded-full p-1 mb-8">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signin' ? 'bg-blue-400' : 'bg-transparent'
                                    }`}
                                onPress={() => switchTab('signin')}
                                disabled={isLoading}
                            >
                                <Text className={`text-lg font-bold text-white`}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signup' ? 'bg-blue-400' : 'bg-transparent'
                                    }`}
                                onPress={() => switchTab('signup')}
                                disabled={isLoading}
                            >
                                <Text className={`text-lg font-bold text-white`}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Welcome Section */}
                        <View className="mb-8">
                            <Text className="text-2xl font-bold text-white mb-3">
                                {activeTab === 'signin' ? 'Welcome!' : 'Create Your Account'}
                            </Text>
                            <Text className="text-lg text-white leading-5">
                                {activeTab === 'signin'
                                    ? 'Log in to your account to access your face scan data and reports.'
                                    : 'Join the AI Face Scan community and explore your facial insights instantly.'}
                            </Text>
                        </View>

                        {/* Form Container */}
                        <View className="space-y-6">
                            {/* Name Input - Only for Sign Up */}
                            {activeTab === 'signup' && (
                                <View className="space-y-3">
                                    <Text className="text-lg font-semibold text-white">Name</Text>
                                    <TextInput
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                        placeholder="Enter your name"
                                        placeholderTextColor="#6B7280"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />
                                </View>
                            )}

                            {/* Phone Number Input */}
                            <View className="my-4">
                                <Text className="text-lg font-semibold text-white">
                                    Phone Number
                                </Text>
                                <TextInput
                                    className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                    placeholder="e.g., +19844864234 with country code"
                                    placeholderTextColor="#6B7280"
                                    value={number}
                                    onChangeText={setNumber}
                                    keyboardType="phone-pad"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Password Input */}
                            <View className="space-y-6">
                                <Text className="text-base font-semibold text-white">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-base text-white pr-12"
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="password"
                                        editable={!isLoading}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-4"
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In Specific Options */}
                            {activeTab === 'signin' && (
                                <View className="flex-row justify-between items-start my-4">
                                    <TouchableOpacity
                                        className="flex-row items-center space-x-3"
                                        onPress={() => setRememberMe(!rememberMe)}
                                        disabled={isLoading}
                                    >
                                        <View
                                            className={`w-7 h-7 mr-2 border-2 rounded items-center justify-center ${rememberMe ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                                }`}
                                        >
                                            {rememberMe && (
                                                <Ionicons name="checkmark" size={20} color="#fff" />
                                            )}
                                        </View>
                                        <Text className="text-lg text-gray-400">Remember Me</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                                        <Text className="text-lg text-red-500 font-semibold">
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Sign Up Specific Options */}
                            {activeTab === 'signup' && (
                                <TouchableOpacity
                                    className="flex-row items-center my-4"
                                    onPress={() => setAgreeTerms(!agreeTerms)}
                                    disabled={isLoading}
                                >
                                    <View
                                        className={`w-7 h-7 border-2 rounded items-center justify-center mr-2 ${agreeTerms ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                            }`}
                                    >
                                        {agreeTerms && (
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        )}
                                    </View>
                                    <Text className="text-md text-gray-400 font-semibold">
                                        I agree to the Terms & Conditions and Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`py-5 rounded-xl items-center mt-2 ${isLoading || (activeTab === 'signin' ? !isSignInValid : !isSignUpValid)
                                    ? 'bg-gray-700 opacity-60'
                                    : 'bg-blue-400'
                                    }`}
                                onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
                                disabled={isLoading || (activeTab === 'signin' ? !isSignInValid : !isSignUpValid)}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-xl font-semibold">
                                        {activeTab === 'signin' ? 'Log In' : 'Sign Up'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Spacer */}
                        <View className="h-8" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default AuthScreen;