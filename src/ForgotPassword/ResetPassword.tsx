import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

const ResetPassword = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        // Here you would call your API to send the verification code
        Alert.alert('Success', `Verification code sent to ${email}`);
        // Example navigation to next screen
        // navigation.navigate('VerifyCode', { email });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-black px-4 justify-center`}
        >
            {/* Back button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`absolute top-16 left-2`}>
                <Text style={tw`text-white text-2xl`}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={tw`items-center mb-20`}>
                <Text style={tw`text-white text-5xl font-bold`}>Logo</Text>
            </View>

            {/* Title and instructions */}
            <Text style={tw`text-white text-2xl font-bold text-center mb-2`}>Reset Password</Text>
            <Text style={tw`text-gray-400 text-lg text-center mb-6`}>
                Enter your email, we will send a verification code to your email.
            </Text>

            {/* Email input */}
            <Text style={tw`text-white text-lg mb-1`}>Email Address</Text>
            <TextInput
                style={tw`border border-gray-400 rounded-lg p-5 mb-6 text-lg text-white`}
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            {/* Continue button */}
            <TouchableOpacity
                onPress={() => (navigation as any).navigate("Otp")}
                style={tw`bg-blue-500 py-4 rounded-lg items-center`}
                activeOpacity={0.8}
            >
                <Text style={tw`text-white font-semibold text-lg`}>Continue</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

export default ResetPassword;
