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
    Otp: { phoneNumber: string };
    Auth: undefined;
};

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ResetPassword = () => {
    const navigator = useNavigation<ResetPasswordScreenNavigationProp>();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        // Simple check - just make sure there's some input
        if (phoneNumber.trim().length < 5) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call to send verification code
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Here you would call your actual SMS service
            console.log('Sending verification code to:', phoneNumber);

            Alert.alert(
                'Verification Code Sent',
                `We've sent a verification code to ${phoneNumber}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigator.replace('Otp', { phoneNumber })
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = phoneNumber.trim().length > 0;

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
                        Enter your phone number, we will send a verification code to your phone number.
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Phone Number Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#6B7280"
                            keyboardType="number-pad"
                            autoCapitalize="none"
                            autoComplete="tel"
                            autoCorrect={false}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            editable={!isLoading}
                        />
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
                        Can't access your phone?{' '}
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