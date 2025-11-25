import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    Home: undefined;
    ResetPassword: undefined;
    SignIn: undefined;
    OtpAuth: undefined;
};

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SignUp = () => {
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(true);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Add this to your SignIn and SignUp components
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Simulate any initial loading
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    if (!isReady) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000' }} />
        );
    }


    const handleSignUp = () => {
        console.log('Sign Up:', { name, email, password, agreeTerms });
        // Add your signup logic here
        navigation.navigate('OtpAuth');
    };

    const isFormValid = name.length > 0 && email.length > 0 && password.length > 0 && agreeTerms;

    return (
        <SafeAreaView style={styles.container} className='px-4'>
            <StatusBar barStyle="light-content" />

            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Logo</Text>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={styles.tab}
                        onPress={() => navigation.push("SignIn")}
                    >
                        <Text style={styles.tabText}>
                            Sign In
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, styles.activeTab]}
                    >
                        <Text style={[styles.tabText, styles.activeTabText]}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Create Your Account</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Join the AI Face Scan community and explore your facial insights instantly.
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor="#6B7280"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email address"
                            placeholderTextColor="#6B7280"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#6B7280"
                                value={password}
                                onChangeText={setPassword}
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

                    {/* Terms & Conditions */}
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

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        style={[
                            styles.signUpButton,
                            !isFormValid && styles.signUpButtonDisabled
                        ]}
                        onPress={handleSignUp}
                        disabled={!isFormValid}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.signUpButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

export default SignUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 48,
    },
    logo: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#fff',
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
    welcomeSection: {
        marginBottom: 32,
    },
    welcomeTitle: {
        fontSize: 28,
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
        borderColor: '#4B5563',
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
        borderColor: '#4B5563',
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4B5563',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: '#60A5FA',
        borderColor: '#60A5FA',
    },
    termsText: {
        flex: 1,
        fontSize: 15,
        color: '#9CA3AF',
        lineHeight: 18,
    },
    signUpButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    signUpButtonDisabled: {
        backgroundColor: '#374151',
        opacity: 0.6,
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});