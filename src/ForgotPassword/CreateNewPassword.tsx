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


    const handleBack = (): void => {
        navigation.navigate('Auth');
    };

    const isContinueEnabled = allChecksPassed && passwordsMatch;

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
    logoText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successCard: {
        backgroundColor: '#1F2937',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#60A5FA',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#374151',
    },
    dotActive: {
        backgroundColor: '#60A5FA',
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
        // width: 96,
        // height: 96,
        // borderRadius: 48,
        // borderWidth: 4,
        // borderColor: '#60A5FA',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(96, 165, 250, 0.1)',
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