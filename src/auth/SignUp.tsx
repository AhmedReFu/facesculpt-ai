import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthFlow() {
    const navigator = useNavigation()
    const [screen, setScreen] = useState('login'); // login, signup, verification, success
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [agreeTerms, setAgreeTerms] = useState(true);

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup fields
    const [name, setName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    // Verification fields
    const [code, setCode] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(59);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (screen === 'verification' && timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [screen, timer]);

    const handleLogin = () => {
        console.log('Login:', { loginEmail, loginPassword, rememberMe });
        (navigator as any).navigate('Home');
    };

    const handleSignup = () => {
        console.log('Signup:', { name, signupEmail, signupPassword, agreeTerms });
        setScreen('verification');
    };

    const handleCodeChange = (text:any, index:any) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleContinue = () => {
        console.log('Verification code:', code.join(''));
        setScreen('success');
    };

    const handleResendCode = () => {
        setTimer(59);
        console.log('Resend code');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Success Screen
    if (screen === 'success') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.successContainer}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoSmall}>Logo</Text>
                    </View>

                    <View style={styles.successCard}>
                        <View style={styles.successIconContainer}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark" size={40} color="#60A5FA" />
                            </View>
                        </View>

                        <Text style={styles.successTitle}>Successful!</Text>
                        <Text style={styles.successSubtitle}>
                            Your registration was completed successfully
                        </Text>

                        <View style={styles.loadingDots}>
                            <View style={[styles.dot, styles.dotActive]} />
                            <View style={[styles.dot, styles.dotActive]} />
                            <View style={[styles.dot, styles.dotActive]} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setScreen('login')}
                    >
                        <Text style={styles.actionButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Verification Screen
    if (screen === 'verification') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.verificationContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setScreen(activeTab)}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>Logo</Text>
                    </View>

                    <View style={styles.verificationContent}>
                        <Text style={styles.verificationTitle}>Verification Code</Text>
                        <Text style={styles.verificationSubtitle}>
                            Enter the verification code that we have sent to your email.
                        </Text>

                        <View style={styles.codeContainer}>
                            {code.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={inputRefs[index]}
                                    style={styles.codeInput}
                                    value={digit}
                                    onChangeText={(text) => handleCodeChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>
                                Didn't receive the code?{' '}
                                <Text
                                    style={styles.resendLink}
                                    onPress={timer === 0 ? handleResendCode : null}
                                >
                                    Resend code
                                </Text>
                            </Text>
                            <Text style={styles.timerText}>
                                Resend code at{' '}
                                <Text style={styles.timerHighlight}>{formatTime(timer)}</Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleContinue}
                        >
                            <Text style={styles.actionButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Login/Signup Screens
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Logo</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'login' && styles.activeTab,
                        ]}
                        onPress={() => {
                            setActiveTab('login');
                            setScreen('login');
                        }}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'login' && styles.activeTabText,
                        ]}>
                            Log In
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'signup' && styles.activeTab,
                        ]}
                        onPress={() => {
                            setActiveTab('signup');
                            setScreen('signup');
                        }}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'signup' && styles.activeTabText,
                        ]}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>

                {screen === 'login' && (
                    <View style={styles.formWrapper}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Welcome!</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Log in to your account to access your face scan data and reports.
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email address"
                                    placeholderTextColor="#6B7280"
                                    value={loginEmail}
                                    onChangeText={setLoginEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={loginPassword}
                                        onChangeText={setLoginPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
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

                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={styles.rememberContainer}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        rememberMe && styles.checkboxActive,
                                    ]}>
                                        {rememberMe && (
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        )}
                                    </View>
                                    <Text style={styles.rememberText}>Remember Me</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={()=> navigator.navigate("ResetPassword")}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.actionButtonText}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {screen === 'signup' && (
                    <View style={styles.formWrapper}>
                        <View style={styles.welcomeSection}>
                            <Text style={styles.welcomeTitle}>Create Your Account</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Join the AI Face Scan community and explore your facial insights instantly.
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#6B7280"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email address"
                                    placeholderTextColor="#6B7280"
                                    value={signupEmail}
                                    onChangeText={setSignupEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={signupPassword}
                                        onChangeText={setSignupPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
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

                            <TouchableOpacity
                                style={styles.termsContainer}
                                onPress={() => setAgreeTerms(!agreeTerms)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    agreeTerms && styles.checkboxActive,
                                ]}>
                                    {agreeTerms && (
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    )}
                                </View>
                                <Text style={styles.termsText}>
                                    I agree to the Terms & Conditions and Privacy Policy
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleSignup}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.actionButtonText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logo: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoSmall: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        opacity: 0.3,
    },
    tabContainer: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 50,
        padding: 4,
        marginBottom: 32,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 50,
    },
    activeTab: {
        backgroundColor: '#60A5FA',
    },
    tabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    formWrapper: {
        flex: 1,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        lineHeight: 20,
    },
    formContainer: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingRight: 48,
        fontSize: 16,
        color: '#fff',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#60A5FA',
        borderColor: '#60A5FA',
    },
    rememberText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    forgotText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: '#9CA3AF',
        lineHeight: 18,
    },
    actionButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 16,
        paddingHorizontal: 150,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Verification Screen
    verificationContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 20,
        marginBottom: 20,
    },
    verificationContent: {
        flex: 1,
        alignItems: 'center',
    },
    verificationTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    verificationSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 48,
    },
    codeContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    codeInput: {
        width: 64,
        height: 64,
        backgroundColor: '#1F2937',
        borderWidth: 2,
        borderColor: '#374151',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    resendText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    resendLink: {
        color: '#EF4444',
        fontWeight: '600',
    },
    timerText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    timerHighlight: {
        color: '#60A5FA',
    },
    // Success Screen
    successContainer: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    successCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        borderRadius: 24,
        padding: 40,
        marginVertical: 40,
    },
    successIconContainer: {
        marginBottom: 32,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
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
});