import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from "twrnc";

const Otp = () => {
    const navigation = useNavigation();
    const [code, setCode] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const inputsRef = useRef([]);

    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(countdown);
    }, []);

    const handleChange = (text: any, index: any) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        if (text && index < 3) {
            inputsRef.current[index + 1].focus();
        }

        if (!text && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    const handleResend = () => {
        if (timer === 0) {
            setTimer(60);
            Alert.alert('Code Resent', 'A new verification code has been sent.');
        }
    };

    const handleContinue = () => {
        const enteredCode = code.join('');
        if (enteredCode.length < 4) {
            Alert.alert('Error', 'Please enter a 4-digit code.');
            return;
        }
        // Here you can add verification logic
        Alert.alert('Success', `Code entered: ${enteredCode}`);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`absolute top-16 left-2`}>
                <Text style={tw`text-white text-2xl`}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Text>
            </TouchableOpacity>
            <Text style={styles.logo}>Logo</Text>
            <Text style={styles.heading}>Verification Code</Text>
            <Text style={styles.subText}>
                Enter the verification code that we have sent to your email.
            </Text>

            <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        ref={ref => (inputsRef.current[index] = ref)}
                        style={styles.codeInput}
                        keyboardType="numeric"
                        maxLength={1}
                        value={digit}
                        onChangeText={text => handleChange(text, index)}
                    />
                ))}
            </View>

            <View style={tw`mb-10 items-center`}>
                <Text style={styles.resendText}>
                    Didn't receive the code?{' '}
                    <Text
                        style={[styles.resendLink, timer !== 0 && { color: 'red' }]}
                        onPress={handleResend}
                    >
                        Resend code
                    </Text>
                </Text>

                {timer !== 0 && (
                    <Text style={styles.timerText}>
                        <Text style={tw`text-white`}>Resend code at </Text>
                        00:{timer < 10 ? `0${timer}` : timer}</Text>
                )}
            </View>


            <TouchableOpacity style={styles.continueBtn} onPress={() => (navigation as any).navigate("CreateNewPassword")}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingHorizontal: 10, justifyContent: 'center' },
    logo: { fontSize: 60, fontFamily: "bold", color: '#fff', marginBottom: 50 },
    heading: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
    subText: { fontSize: 20, color: '#aaa', textAlign: 'center', marginBottom: 30 },
    codeContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '70%', marginBottom: 20 },
    codeInput: { width: 60, height: 60, backgroundColor: '#1a1a1a', color: '#fff', textAlign: 'center', borderRadius: 8, fontSize: 25, borderWidth: 1, borderColor: '#60A5FB' },
    resendText: { color: '#fff', fontSize: 16, marginBottom: 10 },
    resendLink: { color: 'red' },
    timerText: { color: '#60A5FB', fontSize: 16, marginBottom: 20 },
    continueBtn: { width: '80%', padding: 15, backgroundColor: '#60A5FB', borderRadius: 8, alignItems: 'center' },
    continueText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default Otp;
