<<<<<<< HEAD
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';

type RootStackParamList = {
    Auth: undefined;
    // Add other screens as needed
};

type CreateNewPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface PasswordValidation {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
}

export default function CreateNewPassword() {
    const navigation = useNavigation<CreateNewPasswordScreenNavigationProp>();

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(60);
    const [spinnerRotation, setSpinnerRotation] = useState<number>(0);

    const validatePassword = (password: string): PasswordValidation => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const passwordChecks = validatePassword(newPassword);
    const allChecksPassed = Object.values(passwordChecks).every(check => check);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

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

    const handleContinue = (): void => {
        if (!allChecksPassed) {
            return;
        }

        if (!passwordsMatch) {
            return;
        }

        // Show success modal
        setShowSuccessModal(true);
    };
=======
import { CustomInputProps } from "../../type";
import { useState } from "react";
import { Text, TextInput, View } from 'react-native';
import tw from "twrnc";
>>>>>>> 4ccd3e4e7bc3af7326db5e56710c981616078253



const CustomInput = ({ placeholder, value, onChangeText, label, secureTextEntry = false, keyboardType = "default" }: CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);


    return (
<<<<<<< HEAD
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    {/* <Text style={styles.logoText}>Logo</Text> */}
                    <Image source={Images.Icon} resizeMode="contain" />
                </View>

                {/* Title and Description */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Create New Password</Text>
                    <Text style={styles.description}>
                        Your password must be different from previous used password.
                    </Text>
                </View>

                {/* New Password Field */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[
                                styles.input,
                                newPassword && !allChecksPassed && styles.inputError,
                                newPassword && allChecksPassed && styles.inputSuccess
                            ]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor="#6B7280"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                            <Ionicons
                                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Password Requirements */}
                {newPassword.length > 0 && (
                    <View style={styles.requirementsContainer}>
                        <PasswordCheck met={passwordChecks.length} text="At least 8 characters" />
                        <PasswordCheck met={passwordChecks.uppercase} text="One uppercase letter" />
                        <PasswordCheck met={passwordChecks.lowercase} text="One lowercase letter" />
                        <PasswordCheck met={passwordChecks.number} text="One number" />
                        <PasswordCheck met={passwordChecks.special} text="One special character" />
                    </View>
                )}

                {/* Confirm Password Field */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[
                                styles.input,
                                confirmPassword && !passwordsMatch && styles.inputError,
                                confirmPassword && passwordsMatch && styles.inputSuccess
                            ]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            placeholder="Re-enter password"
                            placeholderTextColor="#6B7280"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                    {confirmPassword && passwordsMatch && (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text style={styles.successText}>Passwords match</Text>
                        </View>
                    )}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !isContinueEnabled && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!isContinueEnabled}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal */}
            {showSuccessModal && (
                <BlurView
                    intensity={70}
                    tint="dark"
                    style={styles.blurContainer}
                >
                    <View style={styles.modalWrapper}>
                        <View style={styles.modalContent}>
                            {/* Success Icon with gradient border effect */}
                            <View style={styles.iconWrapper}>
                                <View style={styles.iconContainer}>
                                    {/* <Ionicons name="checkmark" size={50} color="#60A5FA" /> */}
                                    <MaterialCommunityIcons name="check-decagram-outline" size={80} color="#60A5FA" />
                                </View>
                            </View>

                            {/* Success Title */}
                            <Text style={styles.modalTitle}>
                                Successful!
                            </Text>

                            {/* Success Subtitle */}
                            <Text style={styles.modalSubtitle}>
                                Your registration was completed{'\n'}successfully
                            </Text>

                            {/* Circular Spinner Animation */}
                            <View style={styles.spinnerContainer}>
                                {spinnerDots.map((dot, index) => {
                                    const angle = (dot.angle + spinnerRotation) * (Math.PI / 180);
                                    const radius = 20;
                                    const x = Math.cos(angle) * radius;
                                    const y = Math.sin(angle) * radius;

                                    return (
                                        <View
                                            key={index}
                                            style={[
                                                styles.spinnerDot,
                                                {
                                                    width: dot.size,
                                                    height: dot.size,
                                                    borderRadius: dot.size / 2,
                                                    opacity: dot.opacity,
                                                    transform: [
                                                        { translateX: x },
                                                        { translateY: y }
                                                    ]
                                                }
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </BlurView>
            )}
        </SafeAreaView>
    );
}

interface PasswordCheckProps {
    met: boolean;
    text: string;
}

const PasswordCheck = ({ met, text }: PasswordCheckProps) => {
    return (
        <View style={styles.checkContainer}>
            <Ionicons
                name={met ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={met ? '#10B981' : '#6B7280'}
=======
        <View style={tw`w-full`}>
            <Text style={tw`label`}>{label}</Text>
            <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                placeholderTextColor="#888"
                style={tw`'input', isFocused ? 'border-primary' : 'border-gray-300'`}
>>>>>>> 4ccd3e4e7bc3af7326db5e56710c981616078253
            />
        </View>
    )
}
export default CustomInput