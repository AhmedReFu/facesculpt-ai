import { IPA_BASE, LOGIN, REGISTER } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { Toast, useToast } from '../hooks/useToost';
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
    OtpAuth: undefined | { phone_number: string } | { name: string } | { password: string };
    FaceScan: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AuthScreen = () => {
    const toast = useToast();
    const navigator = useNavigation<AuthScreenNavigationProp>();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [password, setPassword] = useState('');

    const [isReady, setIsReady] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Refs for ScrollView and TextInputs
    const scrollViewRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);
    const numberInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    useBackHandler();

    // Initial setup
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Load remembered number every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const loadRememberedNumber = async () => {
                try {
                    const savedNumber = await AsyncStorage.getItem("rememberedNumber");
                    console.log('📱 Loaded remembered number:', savedNumber);
                    if (savedNumber) {
                        setNumber(savedNumber);
                        setRememberMe(true);
                        console.log('✅ Number pre-filled:', savedNumber);
                    } else {
                        console.log('ℹ️ No remembered number found');
                    }
                } catch (error) {
                    console.error('❌ Error loading remembered number:', error);
                }
            };

            loadRememberedNumber();
        }, [])
    );

    // Keyboard listeners for auto-scroll
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    if (!isReady) {
        return <View className="flex-1 bg-black" />;
    }

    // Form validation
    const isSignInValid = number.length > 0 && password.length > 0;
    const isSignUpValid = name.length > 0 && number.length > 0 && password.length > 0 && agreeTerms;

    const allNumberRegex = /^\+[1-9]\d{1,14}$/;

    // Scroll to input when focused
    const scrollToInput = (inputRef: React.RefObject<TextInput | null>) => {
        setTimeout(() => {
            inputRef.current?.measure((fx, fy, width, height, px, py) => {
                scrollViewRef.current?.scrollTo({
                    y: py - 40,
                    animated: true,
                });
            });
        }, 100);
    };

    // ============ API Sign In Handler ============
    const handleSignIn = async () => {
        if (!number || !password) {
            toast.show({
                message: 'Please enter phone number and password.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (!allNumberRegex.test(number)) {
            toast.show({
                message: 'Please enter a valid phone number with country code (e.g., +19844864234).',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (password.length < 6) {
            toast.show({
                message: 'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        setIsLoading(true);

        try {
            const loginPayload = {
                phone_number: number,
                password: password,
            };

            console.log('Login payload:', loginPayload);

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
                console.log('💾 Remember Me status:', rememberMe);
                if (rememberMe) {
                    await AsyncStorage.setItem("rememberedNumber", number);
                    console.log('✅ Number saved:', number);
                } else {
                    await AsyncStorage.removeItem("rememberedNumber");
                    console.log('🗑️ Number removed from storage');
                }

                await AsyncStorage.setItem('token', data.data.token);
                console.log('Token saved:', data.data.token);
                await AsyncStorage.setItem('refresh_token', data.data.refresh_token);
                await AsyncStorage.setItem("subscribe", "true")
                await AsyncStorage.setItem('isLoggedIn', 'true');
                await AsyncStorage.setItem('user', JSON.stringify({
                    phone_number: number,
                    timestamp: data.timestamp,
                }));

                setPassword('');

                toast.show({
                    message: 'Sign in successfully ✓',
                    type: 'success',
                    style: 'top',
                    duration: 2000
                });

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
                const errorMessage = data.message || 'Invalid phone number or password.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                    buttons: [{ text: 'OK', action: 'dismiss' }]
                });
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            toast.show({
                message: 'Network error. Please check your connection and try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ============ API Sign Up Handler ============
    const handleSignUp = async () => {
        if (!name || !number || !password) {
            toast.show({
                message: 'Please fill in all fields.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (name.trim().length < 2) {
            toast.show({
                message: 'Please enter a valid name (at least 2 characters).',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (!allNumberRegex.test(number)) {
            toast.show({
                message: 'Please enter a valid phone number with country code (e.g., +19844864234).',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (password.length < 6) {
            toast.show({
                message: 'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        if (!agreeTerms) {
            toast.show({
                message: 'Please agree to Terms & Conditions.',
                type: 'warning',
                style: 'top'
            });
            return;
        }

        setIsLoading(true);

        try {
            const signupPayload = {
                phone_number: number.trim(),
                name: name.trim(),
                password: password
            };

            console.log('Signup payload:', signupPayload);

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
                await AsyncStorage.setItem('tempUser', JSON.stringify({
                    name: name.trim(),
                    phone_number: number,
                }));

                toast.show({
                    message: 'Account created successfully! Please verify OTP.',
                    type: 'success',
                    style: 'top',
                    duration: 2000
                });

                setTimeout(() => {
                    navigator.navigate('OtpAuth', {
                        phone_number: number,
                        name: name,
                        password: password
                    });
                }, 500);

                setName('');
                setNumber('');
                setPassword('');
                setAgreeTerms(false);

            } else {
                const errorMessage = data.message || 'Sign up failed. Please try again.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                    buttons: [{ text: 'OK', action: 'dismiss' }]
                });
            }
        } catch (error) {
            console.error('Sign-up error:', error);
            toast.show({
                message: 'Network error. Please check your connection and try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigator.navigate('ResetPassword');
    };

    const switchTab = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        if (tab === 'signup') {
            setNumber('');
        }
        setPassword('');
        setName('');
        if (tab === 'signin') {
            setAgreeTerms(false);
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView className="flex-1 bg-[#000000]" edges={['top']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: Platform.OS === 'android' ? keyboardHeight + 20 : 20,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
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
                                <Text className="text-lg font-bold text-white">
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signup' ? 'bg-blue-400' : 'bg-transparent'
                                    }`}
                                onPress={() => switchTab('signup')}
                                disabled={isLoading}
                            >
                                <Text className="text-lg font-bold text-white">
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
                        <View>
                            {/* Name Input - Only for Sign Up */}
                            {activeTab === 'signup' && (
                                <View className="mb-4">
                                    <Text className="text-lg font-semibold text-white mb-3">Name</Text>
                                    <TextInput
                                        ref={nameInputRef}
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                        placeholder="Enter your name"
                                        placeholderTextColor="#6B7280"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                        onFocus={() => scrollToInput(nameInputRef)}
                                    />
                                </View>
                            )}

                            {/* Phone Number Input */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">
                                    Phone Number
                                </Text>
                                <TextInput
                                    ref={numberInputRef}
                                    className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                    placeholder="e.g., +19844864234 with country code"
                                    placeholderTextColor="#6B7280"
                                    value={number}
                                    onChangeText={setNumber}
                                    keyboardType="phone-pad"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                    onFocus={() => scrollToInput(numberInputRef)}
                                />
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        ref={passwordInputRef}
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white pr-12"
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="password"
                                        editable={!isLoading}
                                        onFocus={() => scrollToInput(passwordInputRef)}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-5"
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={24}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In Specific Options */}
                            {activeTab === 'signin' && (
                                <View className="flex-row justify-between items-start mb-6">
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() => setRememberMe(!rememberMe)}
                                        disabled={isLoading}
                                    >
                                        <View
                                            className={`w-6 h-6 mr-2 border-2 rounded items-center justify-center ${rememberMe ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                                }`}
                                        >
                                            {rememberMe && (
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            )}
                                        </View>
                                        <Text className="text-base text-gray-400">Remember Me</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                                        <Text className="text-base text-red-500 font-semibold">
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Sign Up Specific Options */}
                            {activeTab === 'signup' && (
                                <TouchableOpacity
                                    className="flex-row items-start mb-6"
                                    onPress={() => setAgreeTerms(!agreeTerms)}
                                    disabled={isLoading}
                                >
                                    <View
                                        className={`w-6 h-6 border-2 rounded items-center justify-center mr-2 mt-0.5 ${agreeTerms ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                            }`}
                                    >
                                        {agreeTerms && (
                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                        )}
                                    </View>
                                    <Text className="text-sm text-gray-400 flex-1 leading-5">
                                        I agree to the Terms & Conditions and Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`py-5 rounded-xl items-center mb-8 ${isLoading || (activeTab === 'signin' ? !isSignInValid : !isSignUpValid)
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
                    </ScrollView>
                </KeyboardAvoidingView>

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
        </SafeAreaProvider>
    );
};

export default AuthScreen;