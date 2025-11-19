import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    CreateNewPassword: undefined;
    Auth: undefined;
};

type OtpScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const Otp = () => {
    const navigation = useNavigation<OtpScreenNavigationProp>();
    const [code, setCode] = useState<string[]>(['', '', '', '']);
    const [timer, setTimer] = useState<number>(60);
    const inputsRef = useRef<TextInput[]>([]);

    // Initialize refs array
    useEffect(() => {
        inputsRef.current = inputsRef.current.slice(0, 4);
    }, []);



    const handleChange = (text: string, index: number) => {
        const numericText = text.replace(/[^0-9]/g, '');
        const newCode = [...code];
        newCode[index] = numericText;
        setCode(newCode);

        if (numericText && index < 3) {
            setTimeout(() => {
                inputsRef.current[index + 1]?.focus();
            }, 10);
        }

        if (numericText && index === 3) {
            const enteredCode = newCode.join('');
            if (enteredCode.length === 4) {

            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            setTimeout(() => {
                inputsRef.current[index - 1]?.focus();
            }, 10);
        }
    };

    const handleSubmit = (enteredCode?: string) => {
        const verificationCode = enteredCode || code.join('');

        if (verificationCode.length < 4) {
            Alert.alert('Error', 'Please enter a 4-digit code.');
            return;
        }

        navigation.replace('CreateNewPassword');
    };

    const handleResend = () => {
        if (timer === 0) {
            setTimer(60);
            setCode(['', '', '', '']);
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
            Alert.alert('Code Resent', 'A new verification code has been sent.');
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const isContinueDisabled = code.join('').length < 4;



    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Back Button */}
                <TouchableOpacity
                    onPress={handleBack}
                    style={[styles.backButton]}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Logo */}
                <Text style={styles.logo}>Logo</Text>

                {/* Heading */}
                <Text style={styles.heading}>Verification Code</Text>

                {/* Subtext */}
                <Text style={styles.subText}>
                    Enter the verification code that we have sent to your email.
                </Text>

                {/* OTP Inputs */}
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            ref={(ref) => {
                                if (ref) {
                                    inputsRef.current[index] = ref;
                                }
                            }}
                            style={[
                                styles.codeInput,
                                digit && styles.codeInputFilled
                            ]}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={text => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            selectTextOnFocus
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                {/* Resend Code Section */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                        Didn't receive the code?{' '}
                        <Text
                            style={[
                                styles.resendLink,
                                timer !== 0 && styles.resendLinkDisabled
                            ]}
                            onPress={handleResend}
                        >
                            Resend code
                        </Text>
                    </Text>

                    {timer !== 0 && (
                        <Text style={styles.timerText}>
                            Resend code in 00:{timer < 10 ? `0${timer}` : timer}
                        </Text>
                    )}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueBtn,
                        isContinueDisabled && styles.continueBtnDisabled
                    ]}
                    onPress={() => handleSubmit()}
                    disabled={isContinueDisabled}
                >
                    <Text style={styles.continueText}>
                        Continue
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Success Modal with Blur */}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 64,
        left: 24,
        zIndex: 10,
    },
    hidden: {
        opacity: 0,
    },
    logo: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 48,
    },
    heading: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    codeInput: {
        width: 64,
        height: 64,
        backgroundColor: '#1F2937',
        color: '#fff',
        textAlign: 'center',
        borderRadius: 12,
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#374151',
        fontWeight: 'bold',
    },
    codeInputFilled: {
        borderColor: '#60A5FA',
        backgroundColor: '#1e3a5f',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    resendText: {
        color: '#9CA3AF',
        fontSize: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    resendLink: {
        color: '#60A5FA',
        fontWeight: '600',
    },
    resendLinkDisabled: {
        color: '#6B7280',
        textDecorationLine: 'line-through',
    },
    timerText: {
        color: '#60A5FA',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    continueBtn: {
        width: '100%',
        paddingVertical: 16,
        backgroundColor: '#60A5FA',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    continueBtnDisabled: {
        backgroundColor: '#374151',
        opacity: 0.6,
    },
    continueText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    // Modal Styles

});

export default Otp