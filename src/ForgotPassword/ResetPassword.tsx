import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
    Alert,
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

type RootStackParamList = {
    Otp: { email: string };
    Auth: undefined;
};

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ResetPassword = () => {
    const navigator = useNavigation<ResetPasswordScreenNavigationProp>();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleContinue = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call to send verification code
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Here you would call your actual API to send the verification code
            console.log('Sending verification code to:', email);

            Alert.alert(
                'Verification Code Sent',
                `We've sent a verification code to ${email}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigator.replace('Otp', { email })
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigator.goBack();
    };

    const isFormValid = validateEmail(email);

    return (
        <SafeAreaView style={styles.container} className='px-4'>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => navigator.navigate("Auth")}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Logo</Text>
                </View>

                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email, we will send a verification code to your email.
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[
                                styles.input,
                                email && !validateEmail(email) && styles.inputError,
                                email && validateEmail(email) && styles.inputSuccess
                            ]}
                            placeholder="Enter your email address"
                            placeholderTextColor="#6B7280"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                        />
                        {email && !validateEmail(email) && (
                            <Text style={styles.errorText}>Please enter a valid email address</Text>
                        )}
                        {email && validateEmail(email) && (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.successText}>Valid email address</Text>
                            </View>
                        )}
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!isFormValid || isLoading) && styles.continueButtonDisabled
                        ]}
                        onPress={handleContinue}
                        disabled={!isFormValid || isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>
                            {isLoading ? 'Sending...' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Help Text */}
                <View style={styles.helpContainer}>
                    <Text style={styles.helpText}>
                        Can't access your email?{' '}
                        <Text style={styles.helpLink}>Contact support</Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardAvoidingView: {
        flex: 1,

    },
    backButton: {
        marginTop: 10,
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 50,
    },
    logo: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerContainer: {
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    formContainer: {

        justifyContent: 'center',
    },
    inputGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4B5563',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#fff',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputSuccess: {
        borderColor: '#10B981',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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
        fontWeight: '500',
    },
    continueButton: {
        backgroundColor: '#60A5FA',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#374151',
        opacity: 0.6,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    helpContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    helpText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    helpLink: {
        color: '#60A5FA',
        fontWeight: '600',
    },
});

export default ResetPassword;