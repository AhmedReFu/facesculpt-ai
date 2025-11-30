import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';

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
                // Handle auto-submit if needed
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

        navigation.navigate('CreateNewPassword');
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
            <ScrollView

                className="flex-1"
            >


            {/* Back Button - Top Left */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Logo - Centered */}
                <Image
                    source={Images.Icon}
                    className='self-center mb-20'
                    resizeMode="contain"
                />

                {/* Heading */}
                <Text style={styles.heading}>Verification Code</Text>

                {/* Subtext */}
                <Text style={styles.subText}>
                    A code has been sent to your mobile number. Please enter it to continue.
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
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        // justifyContent: 'center',
    },
    logo: {
        width: 80, // Adjust based on your logo size
        height: 80, // Adjust based on your logo size
        alignSelf: 'center',
        marginBottom: 60, // Increased margin to push content down
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
});

export default Otp;