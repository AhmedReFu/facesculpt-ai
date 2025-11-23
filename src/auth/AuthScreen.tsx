import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useBackHandler } from '../lib/useBackHandler';

type RootStackParamList = {
    Home: undefined;
    ResetPassword: undefined;
    OtpAuth: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AuthScreen = () => {
    const navigation = useNavigation<AuthScreenNavigationProp>();
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
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
    const isSignInValid = email.length > 0 && password.length > 0;
    const isSignUpValid = name.length > 0 && email.length > 0 && password.length > 0 && agreeTerms;

    const handleSignIn = () => {
        console.log('Sign In:', { email, password, rememberMe });
        if (email && password) {
            setEmail("");
            setPassword("")
            navigation.navigate('Home');
        }
    };

    const handleSignUp = () => {
        setEmail("");
        setPassword("")
        setName("")
        console.log('Sign Up:', { name, email, password, agreeTerms });
        navigation.navigate('OtpAuth');
    };

    const handleForgotPassword = () => {
        navigation.replace('ResetPassword');
    };

    // Clear form when switching tabs
    const switchTab = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        // Clear form fields when switching
        if (tab === 'signin') {
            setName('');
            setAgreeTerms(false);
        } else {
            setRememberMe(true);
        }
    };

    return (
        <ScrollView className="flex-1 bg-[#000000]">
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
                        <Text className="text-6xl font-bold text-white">Logo</Text>
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
                                value={email}
                                onChangeText={setEmail}
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
        </ScrollView>
    );
};

export default AuthScreen;