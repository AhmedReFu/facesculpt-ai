import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateNewPassword() {
    const navigation = useNavigation();


    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));

    const validatePassword = (password:any) => {
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

    useEffect(() => {
        if (showSuccessModal) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto redirect after 3 seconds
            const timer = setTimeout(() => {
                handleSuccessContinue();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [showSuccessModal]);

    const handleContinue = () => {
        const newErrors = {};

        if (!newPassword) {
            newErrors.newPassword = 'Password is required';
        } else if (!allChecksPassed) {
            newErrors.newPassword = 'Password does not meet requirements';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        setTouched({ newPassword: true, confirmPassword: true });

        if (Object.keys(newErrors).length === 0) {
            setShowSuccessModal(true);
        }
    };

    const handleSuccessContinue = () => {
        setShowSuccessModal(false);
        // Navigate to login or home screen
        (navigation as any).navigate('SignUp');
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Logo</Text>
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
                            style={styles.input}
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                if (touched.newPassword) {
                                    setErrors({ ...errors, newPassword: null });
                                }
                            }}
                            onBlur={() => setTouched({ ...touched, newPassword: true })}
                            secureTextEntry={!showNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
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
                    {touched.newPassword && errors.newPassword && (
                        <Text style={styles.errorText}>{errors.newPassword}</Text>
                    )}
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
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (touched.confirmPassword) {
                                    setErrors({ ...errors, confirmPassword: null });
                                }
                            }}
                            onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                            secureTextEntry={!showConfirmPassword}
                            placeholder="Re-enter password"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
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
                    {touched.confirmPassword && errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
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
                        (!allChecksPassed || !passwordsMatch) && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Bottom Indicator */}
            <View style={styles.bottomIndicator}>
                <View style={styles.indicator} />
            </View>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="none"
                statusBarTranslucent
            >
                <Animated.View
                    style={[
                        styles.modalOverlay,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim,
                            }
                        ]}
                    >
                        <View style={styles.logoContainerModal}>
                            <Text style={styles.logoSmall}>Logo</Text>
                        </View>

                        <View style={styles.successCard}>
                            <View style={styles.successIconContainer}>
                                <View style={styles.successIcon}>
                                    <Ionicons name="checkmark" size={50} color="#60A5FA" />
                                </View>
                            </View>

                            <Text style={styles.successTitle}>Successful!</Text>
                            <Text style={styles.successSubtitle}>
                                Your password has been changed successfully.
                            </Text>

                            <LoadingSpinner />
                        </View>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleSuccessContinue}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </SafeAreaView>
    );
}

function PasswordCheck({ met, text }:any) {
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

function LoadingSpinner() {
    const [rotation] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.spinnerDot,
                        {
                            transform: [
                                { rotate: `${i * 45}deg` },
                                { translateY: -20 },
                            ],
                            opacity: 1 - (i * 0.12),
                        },
                    ]}
                />
            ))}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        marginTop: 10,
        marginBottom: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#999999',
        lineHeight: 20,
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
        borderColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#FFFFFF',
        paddingRight: 50,
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -11 }],
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    },
    requirementsContainer: {
        marginBottom: 24,
        gap: 8,
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
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    successText: {
        fontSize: 12,
        color: '#10B981',
    },
    continueButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomIndicator: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    indicator: {
        width: 120,
        height: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
    },
    logoContainerModal: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoSmall: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        opacity: 0.3,
    },
    successCard: {
        backgroundColor: '#1F2937',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        marginBottom: 24,
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
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    spinner: {
        width: 50,
        height: 50,
        position: 'relative',
    },
    spinnerDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#60A5FA',
        top: '50%',
        left: '50%',
        marginLeft: -4,
        marginTop: -4,
    },
    modalButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});