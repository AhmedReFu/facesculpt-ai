import { IPA_BASE, LOGIN, REGISTER } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
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
const API_ENDPOINTS = {
    LOGIN,
    REGISTER,
};

type RootStackParamList = {
    DailyTrack: undefined;
    ResetPassword: undefined;
    OtpAuth:
    | undefined
    | { phone_number: string; name?: string; password?: string };
    FaceScan: undefined;
    FaceScanWithDetection: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<
    RootStackParamList
>;

const phoneRegex = /^\+?[0-9]{6,15}$/; // optional +, 6–15 digits

const AuthScreen = () => {
    const toast = useToast();
    const navigator = useNavigation<AuthScreenNavigationProp>();

    const [activeTab, setActiveTab] =
        useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [password, setPassword] = useState('');

    const [isReady, setIsReady] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const scrollViewRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);
    const numberInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    useBackHandler();

    // small delay to avoid layout flicker
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // load remembered phone number
    useFocusEffect(
        useCallback(() => {
            const loadRememberedNumber = async () => {
                try {
                    const savedNumber = await AsyncStorage.getItem(
                        'rememberedNumber'
                    );
                    if (savedNumber) {
                        setNumber(savedNumber);
                        setRememberMe(true);
                    } else {
                        setRememberMe(false);
                    }
                } catch (error) {
                    console.error(
                        'Error loading remembered number:',
                        error
                    );
                }
            };

            loadRememberedNumber();
        }, [])
    );

    // keyboard listeners (for extra bottom padding)
    useEffect(() => {
        const showEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillShow'
                : 'keyboardDidShow';
        const hideEvent =
            Platform.OS === 'ios'
                ? 'keyboardWillHide'
                : 'keyboardDidHide';

        const keyboardShowSub = Keyboard.addListener(
            showEvent,
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardHideSub = Keyboard.addListener(
            hideEvent,
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardShowSub.remove();
            keyboardHideSub.remove();
        };
    }, []);

    if (!isReady) {
        return <View className="flex-1 bg-black" />;
    }

    // ---------- helpers ----------

    const sanitizePhone = (value: string) =>
        value.replace(/\s/g, '');

    const validatePhoneOrToast = (value: string) => {
        const phone = sanitizePhone(value);
        if (!phoneRegex.test(phone)) {
            toast.show({
                message:
                    'Please enter a valid phone number (6–15 digits, optional +country code).',
                type: 'warning',
                style: 'top',
            });
            return { ok: false, phone: '' };
        }
        return { ok: true, phone };
    };

    const isSignInValid =
        number.trim().length > 0 && password.trim().length > 0;

    const isSignUpValid =
        name.trim().length > 0 &&
        number.trim().length > 0 &&
        password.trim().length > 0 &&
        agreeTerms;

    const scrollToInput = (
        inputRef: React.RefObject<TextInput | null>
    ) => {
        setTimeout(() => {
            inputRef.current?.measure(
                (_fx, _fy, _w, h, _px, py) => {
                    scrollViewRef.current?.scrollTo({
                        y: py - 40,
                        animated: true,
                    });
                }
            );
        }, 100);
    };

    // ---------- sign in ----------

    const handleSignIn = async () => {
        if (!number || !password) {
            toast.show({
                message:
                    'Please enter phone number and password.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        const { ok, phone } = validatePhoneOrToast(number);
        if (!ok) return;

        if (password.length < 6) {
            toast.show({
                message:
                    'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        setIsLoading(true);

        try {
            const loginPayload = {
                phone_number: phone,
                password,
            };

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginPayload),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                // remember number
                if (rememberMe) {
                    await AsyncStorage.setItem(
                        'rememberedNumber',
                        phone
                    );
                } else {
                    await AsyncStorage.removeItem(
                        'rememberedNumber'
                    );
                }

                await AsyncStorage.setItem(
                    'token',
                    data.data.token
                );
                await AsyncStorage.setItem(
                    'refresh_token',
                    data.data.refresh_token
                );
                await AsyncStorage.setItem(
                    'subscribe',
                    'true'
                ); // if you have real subscribe flag, replace this
                await AsyncStorage.setItem(
                    'isLoggedIn',
                    'true'
                );
                await AsyncStorage.setItem(
                    'user',
                    JSON.stringify({
                        phone_number: phone,
                        timestamp: data.timestamp,
                    })
                );

                setPassword('');

                toast.show({
                    message: 'Sign in successfully ✓',
                    type: 'success',
                    style: 'top',
                    duration: 2000,
                });

                const subscribe = await AsyncStorage.getItem(
                    'subscribe'
                );

                setTimeout(() => {
                    if (subscribe === 'true') {
                        navigator.navigate('DailyTrack');
                    } else {
                        navigator.navigate('FaceScanWithDetection');
                    }
                }, 1000);
            } else {
                const errorMessage =
                    data.message ||
                    'Invalid phone number or password.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                    buttons: [{ text: 'OK', action: 'dismiss' }],
                });
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            toast.show({
                message:
                    'Network error. Please check your connection and try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }],
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ---------- sign up ----------

    const handleSignUp = async () => {
        if (!name || !number || !password) {
            toast.show({
                message: 'Please fill in all fields.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        if (name.trim().length < 2) {
            toast.show({
                message:
                    'Please enter a valid name (at least 2 characters).',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        const { ok, phone } = validatePhoneOrToast(number);
        if (!ok) return;

        if (password.length < 6) {
            toast.show({
                message:
                    'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        if (!agreeTerms) {
            toast.show({
                message:
                    'Please agree to Terms & Conditions.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        setIsLoading(true);

        try {
            const signupPayload = {
                phone_number: phone,
                name: name.trim(),
                password,
            };

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(signupPayload),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                await AsyncStorage.setItem(
                    'tempUser',
                    JSON.stringify({
                        name: name.trim(),
                        phone_number: phone,
                    })
                );

                toast.show({
                    message:
                        'Account created successfully! Please verify OTP.',
                    type: 'success',
                    style: 'top',
                    duration: 2000,
                });

                setTimeout(() => {
                    navigator.navigate('OtpAuth', {
                        phone_number: phone,
                        name: name.trim(),
                        password,
                    });
                }, 500);

                setName('');
                setNumber('');
                setPassword('');
                setAgreeTerms(false);
            } else {
                const errorMessage =
                    data.message ||
                    'Sign up failed. Please try again.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                    buttons: [{ text: 'OK', action: 'dismiss' }],
                });
            }
        } catch (error) {
            console.error('Sign-up error:', error);
            toast.show({
                message:
                    'Network error. Please check your connection and try again.',
                type: 'error',
                style: 'center',
                buttons: [{ text: 'OK', action: 'dismiss' }],
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
        setPassword('');
        setName('');
        if (tab === 'signup') {
            setNumber('');
        }
        if (tab === 'signin') {
            setAgreeTerms(false);
        }
    };

    // ---------- UI ----------

    return (
        <SafeAreaProvider>
            <SafeAreaView
                className="flex-1 bg-[#000000]"
                edges={['top']}
            >
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={
                        Platform.OS === 'ios' ? 'padding' : undefined
                    }
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom:
                                Platform.OS === 'android'
                                    ? keyboardHeight + 20
                                    : 20,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo */}
                        <View className="items-center my-20">
                            <Image
                                source={Images.Icon}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Tab Switcher */}
                        <View className="flex-row border-2 border-white rounded-full p-1 mb-8">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signin'
                                    ? 'bg-blue-400'
                                    : 'bg-transparent'
                                    }`}
                                onPress={() => switchTab('signin')}
                                disabled={isLoading}
                            >
                                <Text className="text-lg font-bold text-white">
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signup'
                                    ? 'bg-blue-400'
                                    : 'bg-transparent'
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
                                {activeTab === 'signin'
                                    ? 'Welcome!'
                                    : 'Create Your Account'}
                            </Text>
                            <Text className="text-lg text-white leading-5">
                                {activeTab === 'signin'
                                    ? 'Log in to your account to access your face scan data and reports.'
                                    : 'Join the AI Face Scan community and explore your facial insights instantly.'}
                            </Text>
                        </View>

                        {/* Form */}
                        <View>
                            {/* Name (Sign Up only) */}
                            {activeTab === 'signup' && (
                                <View className="mb-4">
                                    <Text className="text-lg font-semibold text-white mb-3">
                                        Name
                                    </Text>
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

                            {/* Phone Number */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">
                                    Phone Number
                                </Text>
                                <TextInput
                                    ref={numberInputRef}
                                    className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                    placeholder="Phone number with country code"
                                    placeholderTextColor="#6B7280"
                                    value={number}
                                    onChangeText={setNumber}
                                    keyboardType={
                                        Platform.OS === 'ios'
                                            ? 'numbers-and-punctuation'
                                            : 'phone-pad'
                                    }
                                    textContentType="telephoneNumber"
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                    onFocus={() => scrollToInput(numberInputRef)}
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">
                                    Password
                                </Text>
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
                                        onFocus={() =>
                                            scrollToInput(passwordInputRef)
                                        }
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-5"
                                        onPress={() =>
                                            setShowPassword(prev => !prev)
                                        }
                                        disabled={isLoading}
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? 'eye-off-outline'
                                                    : 'eye-outline'
                                            }
                                            size={24}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In options */}
                            {activeTab === 'signin' && (
                                <View className="flex-row justify-between items-start mb-6">
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() =>
                                            setRememberMe(prev => !prev)
                                        }
                                        disabled={isLoading}
                                    >
                                        <View
                                            className={`w-6 h-6 mr-2 border-2 rounded items-center justify-center ${rememberMe
                                                ? 'bg-blue-400 border-blue-400'
                                                : 'border-gray-600'
                                                }`}
                                        >
                                            {rememberMe && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={18}
                                                    color="#fff"
                                                />
                                            )}
                                        </View>
                                        <Text className="text-base text-gray-400">
                                            Remember Me
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleForgotPassword}
                                        disabled={isLoading}
                                    >
                                        <Text className="text-base text-red-500 font-semibold">
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Sign Up options */}
                            {activeTab === 'signup' && (
                                <TouchableOpacity
                                    className="flex-row items-start mb-6"
                                    onPress={() =>
                                        setAgreeTerms(prev => !prev)
                                    }
                                    disabled={isLoading}
                                >
                                    <View
                                        className={`w-6 h-6 border-2 rounded items-center justify-center mr-2 mt-0.5 ${agreeTerms
                                            ? 'bg-blue-400 border-blue-400'
                                            : 'border-gray-600'
                                            }`}
                                    >
                                        {agreeTerms && (
                                            <Ionicons
                                                name="checkmark"
                                                size={18}
                                                color="#fff"
                                            />
                                        )}
                                    </View>
                                    <Text className="text-sm text-gray-400 flex-1 leading-5">
                                        I agree to the Terms & Conditions and
                                        Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`py-5 rounded-xl items-center mb-8 ${isLoading ||
                                    (activeTab === 'signin'
                                        ? !isSignInValid
                                        : !isSignUpValid)
                                    ? 'bg-gray-700 opacity-60'
                                    : 'bg-blue-400'
                                    }`}
                                onPress={
                                    activeTab === 'signin'
                                        ? handleSignIn
                                        : handleSignUp
                                }
                                disabled={
                                    isLoading ||
                                    (activeTab === 'signin'
                                        ? !isSignInValid
                                        : !isSignUpValid)
                                }
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Text className="text-white text-xl font-semibold">
                                            {activeTab === 'signin'
                                                ? 'Log In'
                                                : 'Sign Up'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

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
