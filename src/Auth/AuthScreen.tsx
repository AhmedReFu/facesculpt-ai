import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import Toast from 'react-native-toast-message';
import { Images } from '../constants';
import { useBackHandler } from '../hook/useBackHandler';

type RootStackParamList = {
    DailyTrack: undefined;
    ResetPassword: undefined;
    OtpAuth: undefined;
    FaceScan: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AuthScreen = () => {
    const navigator = useNavigation<AuthScreenNavigationProp>();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Form states
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

    const handleSignIn = async () => {
        if (!number || !password) {
            Toast.show({ type: 'error', text1: 'Invalid user please enter correct details.' });
            return;
        }

        try {
            // Validate mobile number format
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/; // Indian mobile number format
            if (!allNumberRegex.test(number)) {
                Toast.show({ type: 'error', text1: 'Please enter a valid 11-digit mobile number.' });
                return;
            }

            // Validate password length
            if (password.length < 6) {
                Toast.show({ type: 'error', text1: "Password must be at least 6 characters long." });
                return;
            }

            const data = await AsyncStorage.getItem("user");

            if (!data) {
                Toast.show({ type: 'error', });
                return;
            }

            const user = JSON.parse(data);

            // Validate stored user data
            if (!user || !user.number || !user.password) {
                Toast.show({ type: 'error', text1: 'Invalid user data. Please sign up again.' });
                await AsyncStorage.removeItem("user");
                return;
            }

            // Check credentials
            if (user.number !== number || user.password !== password) {
                Toast.show({ type: 'error', text1: 'Invalid mobile number or password.' });
                return;
            }

            // Clear inputs
            setNumber("");
            setPassword("");

            // Save login session
            await AsyncStorage.setItem("isLoggedIn", "true");
            await AsyncStorage.setItem("currentUser", JSON.stringify(user));
            const subscribe = await AsyncStorage.getItem("subscribe");
            // console.log("Sign in successful:", parseInt(user.number));
            Toast.show({ type: 'success', text1: "Sign in successfully" });
            // Navigate to home screen
            // navigation.navigate('Home');

            const timer = setTimeout(() => {
                if (subscribe === "true") {
                    navigator.navigate("DailyTrack");
                } else {
                    navigator.navigate("FaceScan")
                }
            }, 1000);
            return () => clearTimeout(timer);

        } catch (error) {
            console.error("Sign-in error:", error);
            Toast.show({ type: 'error', text1: 'An error occurred during sign-in.' });
        }
    };

    const handleSignUp = async () => {
        if (!name || !number || !password) {

            Toast.show({ type: 'error', text1: 'Please fill in all fields.' });
            return;
        }

        try {
            // Name validation
            if (name.trim().length < 2) {

                Toast.show({ type: 'error', text1: 'Please enter a valid name (at least 2 characters).' });
                return;
            }

            // Mobile number validation
            const universalPhoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!allNumberRegex.test(number)) {

                Toast.show({ type: 'error', text1: 'Please enter a valid 11-digit mobile number.' });
                return;
            }

            // Password validation
            if (password.length < 6) {
                Toast.show({ type: 'error', text1: '"Password must be at least 6 characters long."' });
                return;
            }

            // Check if user already exists
            const existingData = await AsyncStorage.getItem("user");
            if (existingData) {
                const existingUser = JSON.parse(existingData);
                if (existingUser.number === number) {
                    Toast.show({
                        type: 'error',
                        text1: '"An account with this mobile number already exists."'
                    });
                    return;
                }
            }

            // Create user object
            const userData = {
                name: name.trim(),
                number: number,
                password: password,
                createdAt: new Date().toISOString()
            };

            // Save to storage
            await AsyncStorage.setItem("user", JSON.stringify(userData));

            // Clear inputs
            setName("");
            setNumber("");
            setPassword("");

            // console.log('Sign Up successful:', userData);

            // Navigate to OTP screen
            navigator.navigate('OtpAuth');

        } catch (error) {
            console.error("Sign-up error:", error);
            Toast.show({
                type: 'error',
                text1: "An error occurred during sign-up."
            });
        }
    };

    const handleForgotPassword = () => {
        navigator.navigate('ResetPassword');
    };

    // Clear form when switching tabs
    const switchTab = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        setNumber("");
        setPassword("")
        setName("")
        // Clear form fields when switching
        if (tab === 'signin') {
            setName('');
            setAgreeTerms(false);
        } else {
            setRememberMe(true);
        }
    };

    return (
        <View className="flex-1 bg-[#000000]">
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >

                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start" }}
                >
                    {/* Logo */}
                    <View className="items-center my-20">
                        {/* <Text className="text-6xl font-bold text-white">Logo</Text> */}
                        <Image source={Images.Icon} resizeMode="contain" />
                        <Toast />
                    </View>
                    {/* Tab Switcher */}
                    <View className="flex-row border-2 border-white rounded-full p-1 mb-8">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signin' ? 'bg-blue-400' : 'bg-transparent'
                                }`}
                            onPress={() => switchTab('signin')}
                        >
                            <Text className={`text-lg font-bold ${activeTab === 'signin' ? 'text-white' : 'text-white'
                                }`}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signup' ? 'bg-blue-400' : 'bg-transparent'
                                }`}
                            onPress={() => switchTab('signup')}
                        >
                            <Text className={`text-lg font-bold ${activeTab === 'signup' ? 'text-white' : 'text-white'
                                }`}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Welcome Section */}
                    <View className="mb-8">
                        <Text className="text-2xl font-bold text-white mb-3 ">
                            {activeTab === 'signin' ? 'Welcome!' : 'Create Your Account'}
                        </Text>
                        <Text className="text-lg text-white leading-5">
                            {activeTab === 'signin'
                                ? 'Log in to your account to access your face scan data and reports.'
                                : 'Join the AI Face Scan community and explore your facial insights instantly.'
                            }
                        </Text>
                    </View>

                    {/* Divider */}


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
                                />
                            </View>
                        )}

                        {/* Email Input */}
                        <View className="my-4">
                            <Text className="text-lg font-semibold text-white">
                                Phone Number
                            </Text>
                            <TextInput
                                className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                placeholder="Enter your phone number"
                                placeholderTextColor="#6B7280"
                                value={number}
                                onChangeText={setNumber}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoComplete="email"
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
                                    autoComplete="password"
                                />
                                <TouchableOpacity
                                    className="absolute right-4 top-4"
                                    onPress={() => setShowPassword(!showPassword)}
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
                                >
                                    <View className={`w-7 h-7 mr-2 border-2 rounded items-center justify-center ${rememberMe ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                        }`}>
                                        {rememberMe && (
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        )}
                                    </View>
                                    <Text className="text-lg text-gray-400">Remember Me</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleForgotPassword}>
                                    <Text className="text-lg text-red-500 font-semibold">Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Sign Up Specific Options */}
                        {activeTab === 'signup' && (
                            <TouchableOpacity
                                className="flex-row items-center  my-4"
                                onPress={() => setAgreeTerms(!agreeTerms)}
                            >
                                <View className={`w-7 h-7 border-2 rounded items-center justify-center mr-2 ${agreeTerms ? 'bg-blue-400 border-blue-400' : 'border-gray-600'
                                    }`}>
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
                            className={`py-5 rounded-xl items-center mt-2 ${(activeTab === 'signin' ? !isSignInValid : !isSignUpValid)
                                ? 'bg-gray-700 opacity-60'
                                : 'bg-blue-400'
                                }`}
                            onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
                            disabled={activeTab === 'signin' ? !isSignInValid : !isSignUpValid}
                            activeOpacity={0.8}
                        >
                            <Text className="text-white text-xl font-semibold">
                                {activeTab === 'signin' ? 'Log In' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                    </View>


                    {/* Bottom Spacer */}
                    <View className="h-8" />

                </ScrollView>
            </KeyboardAvoidingView>

        </View>
    );
};

export default AuthScreen;