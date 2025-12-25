import { IPA_BASE, RESET_PASSWORD } from '@env';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    RESET_PASSWORD: RESET_PASSWORD,
};

type RootStackParamList = {
    Auth: undefined;
    Otp: undefined | { phone_number?: string } | { otp?: number };
};

interface RouteParams {
    phone_number?: string;
    otp?: string;
}

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
    const route = useRoute();
    const params = route.params as RouteParams;

    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
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

    const handleContinue = async (): Promise<void> => {
        if (!allChecksPassed || !passwordsMatch) {
            return;
        }

        // Validate required params
        if (!params?.phone_number || !params?.otp) {
            setErrorMessage('Missing phone number or OTP. Please try again.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.RESET_PASSWORD}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: params.phone_number,
                    otp: params.otp,
                    new_password: newPassword,
                }),
            });

            const result = await response.json();
            console.log('Reset Password Response:', result);

            if (response.ok && result.success) {
                // Show success modal
                setShowSuccessModal(true);
            } else {
                // Handle error response
                setErrorMessage(result.message || 'Failed to reset password. Please try again.');
            }
        } catch (error: any) {
            console.error('Reset Password Error:', error);
            setErrorMessage('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = (): void => {
        navigation.goBack();
    };

    const isContinueEnabled = allChecksPassed && passwordsMatch && !isLoading;

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image source={Images.Icon} resizeMode="contain" />
                    </View>

                    {/* Title and Description */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Create New Password</Text>
                        <Text style={styles.description}>
                            Your password must be different from previous used password.
                        </Text>
                    </View>

                    {/* Error Message */}
                    {errorMessage ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

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
                                onChangeText={(text) => {
                                    setNewPassword(text);
                                    setErrorMessage('');
                                }}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                                disabled={isLoading}
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
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    setErrorMessage('');
                                }}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="Re-enter password"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isLoading}
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
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                                <Text style={styles.continueButtonText}>Continue</Text>
                        )}
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
                                {/* Success Icon */}
                                <View style={styles.iconWrapper}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons
                                            name="check-decagram-outline"
                                            size={80}
                                            color="#60A5FA"
                                        />
                                    </View>
                                </View>

                                {/* Success Title */}
                                <Text style={styles.modalTitle}>
                                    Successful!
                                </Text>

                                {/* Success Subtitle */}
                                <Text style={styles.modalSubtitle}>
                                    Your password has been reset{'\n'}successfully
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
            </KeyboardAvoidingView>
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
            />
            <Text style={[styles.checkText, met && styles.checkTextMet]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 10,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: '#EF4444',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4B5563',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#FFFFFF',
        paddingRight: 50,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputSuccess: {
        borderColor: '#10B981',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -11 }],
        padding: 4,
    },
    requirementsContainer: {
        marginBottom: 24,
        gap: 8,
        backgroundColor: '#111111',
        padding: 16,
        borderRadius: 12,
    },
    checkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkText: {
        fontSize: 14,
        color: '#6B7280',
    },
    checkTextMet: {
        color: '#10B981',
        fontWeight: '500',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    successText: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '500',
    },
    continueButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#374151',
        opacity: 0.6,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    blurContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    modalWrapper: {
        width: '100%',
        maxWidth: 400,
    },
    modalContent: {
        backgroundColor: '#1A2028',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(55, 65, 81, 0.5)',
    },
    iconWrapper: {
        marginBottom: 24,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    spinnerContainer: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinnerDot: {
        position: 'absolute',
        backgroundColor: '#60A5FA',
    },
});