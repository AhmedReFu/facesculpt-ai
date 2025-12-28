import { IP_FIND, IPA_BASE, LOGIN, REGISTER } from '@env';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../constants';
import { useBackHandler } from '../hooks/useBackHandler';
import { Toast, useToast } from '../hooks/useToost';

// Import your country data
import countryData from '../../assets/country.json';

const API_BASE_URL = IPA_BASE;
const API_ENDPOINTS = {
    LOGIN,
    REGISTER,
};
const IP_API = IP_FIND;

const { height, width } = Dimensions.get('window');

type RootStackParamList = {
    DailyTrack: undefined;
    ResetPassword: undefined;
    OtpAuth:
    | undefined
    | { phone_number: string; name?: string; password?: string };
    FaceScan: undefined;
    FaceScanWithDetection: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<
    RootStackParamList
>;

interface Country {
    name: string;
    code: string;
    iso: string;
    flag: string;
}

const phoneRegex = /^[0-9]{6,15}$/; // Only digits, 6-15 length

// Custom Country Picker Component
interface CountryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (country: Country) => void;
    selectedCountry?: Country;
}

const CountryPickerComponent: React.FC<CountryPickerProps> = ({
    visible,
    onClose,
    onSelect,
    selectedCountry,
}) => {
    const [search, setSearch] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<Country[]>(countryData);
    const animationDriver = React.useRef(new Animated.Value(0)).current;
    const panY = React.useRef(new Animated.Value(height)).current;
    const lastOffsetY = React.useRef(height);
    const [modalHeight, setModalHeight] = useState(height * 0.7); // Default to 70% of screen

    // Calculate modal height based on screen size
    useEffect(() => {
        const calculateModalHeight = () => {
            const screenHeight = Dimensions.get('window').height;
            // Use 80% of screen for larger screens, 90% for smaller screens
            const calculatedHeight = screenHeight < 700 ? screenHeight * 0.85 : screenHeight * 0.75;
            setModalHeight(Math.min(calculatedHeight, 650)); // Cap at 650
        };

        calculateModalHeight();

        // Update on screen rotation
        const subscription = Dimensions.addEventListener('change', calculateModalHeight);
        return () => subscription?.remove();
    }, []);

    useEffect(() => {
        if (visible) {
            panY.setValue(height);
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 12,
            }).start();
        } else {
            Animated.timing(panY, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // PanResponder for swipe gestures
    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) { // Only allow dragging down
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const dragThreshold = height * 0.25;
                const gestureDistance = gestureState.dy;

                if (gestureDistance > dragThreshold || gestureState.vy > 0.5) {
                    // Swipe down to close
                    Animated.timing(panY, {
                        toValue: height,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
                        panY.setValue(height);
                    });
                } else {
                    // Return to original position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 12,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredCountries(countryData);
        } else {
            const filtered = countryData.filter(country =>
                country.name.toLowerCase().includes(search.toLowerCase()) ||
                country.code.includes(search) ||
                country.iso.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredCountries(filtered);
        }
    }, [search]);

    const modalPosition = Animated.add(panY, animationDriver.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height],
        extrapolate: 'clamp',
    }));

    const modalBackdropFade = panY.interpolate({
        inputRange: [0, height],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    const handleSelect = (country: Country) => {
        onSelect(country);
        onClose();
    };

    const renderItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                selectedCountry?.code === item.code && styles.selectedCountryItem
            ]}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.flagText}>{item.flag}</Text>
            <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
            </View>
            {selectedCountry?.code === item.code && (
                <Text style={styles.checkmark}>✓</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[
                        styles.backdrop,
                        { opacity: modalBackdropFade }
                    ]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.modal as any,
                        {
                            transform: [{ translateY: modalPosition }],
                            maxHeight: modalHeight,
                            minHeight: Math.min(height * 0.75, 750), // Minimum 50% of screen or 400
                        }
                    ]}
                >
                    {/* Drag Handle */}
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>Select Country</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search country..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus={Platform.OS === 'ios'}
                    />

                    <FlatList
                        data={filteredCountries}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.iso}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No countries found</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                        bounces={true}
                        nestedScrollEnabled
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

// Main AuthScreen Component
const AuthScreen = () => {
    const toast = useToast();
    const navigator = useNavigation<AuthScreenNavigationProp>();

    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Default to India
    const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
        const india = countryData.find(c => c.iso === 'IN') || countryData[0];
        return india;
    });

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const scrollViewRef = useRef<ScrollView>(null);
    const nameInputRef = useRef<TextInput>(null);
    const phoneInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    useBackHandler();

    // Auto-detect country from IP
    useEffect(() => {
        const detectCountryFromIP = async () => {
            try {
                const response = await fetch(`https://api.ipfind.com/me?auth=${IP_API}`);
                if (!response.ok) return;

                const data = await response.json();
                if (data.country_code) {
                    const country = countryData.find(c => c.iso === data.country_code);
                    if (country) {
                        setSelectedCountry(country);
                    }
                }
            } catch (error) {
                console.log('Country detection failed, using default');
            }
        };

        detectCountryFromIP();
    }, []);

    // Load remembered data on mount
    useEffect(() => {
        const loadRememberedData = async () => {
            try {
                // Load remember me preference
                const savedRememberMe = await AsyncStorage.getItem('rememberMe');
                if (savedRememberMe !== null) {
                    const rememberMeValue = JSON.parse(savedRememberMe);
                    setRememberMe(rememberMeValue);

                    // Load saved data if remember me is enabled
                    if (rememberMeValue) {
                        const savedPhone = await AsyncStorage.getItem('rememberedPhone');
                        if (savedPhone) {
                            setPhoneNumber(savedPhone);
                        }

                        const savedCountry = await AsyncStorage.getItem('rememberedCountry');
                        if (savedCountry) {
                            setSelectedCountry(JSON.parse(savedCountry));
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading remembered data:', error);
            }
        };

        loadRememberedData();
    }, []);

    // Save remember me data when it changes
    const handleRememberMeChange = async (value: boolean) => {
        setRememberMe(value);

        try {
            await AsyncStorage.setItem('rememberMe', JSON.stringify(value));

            if (value && phoneNumber.trim()) {
                // Save current data
                await AsyncStorage.setItem('rememberedPhone', phoneNumber);
                await AsyncStorage.setItem('rememberedCountry', JSON.stringify(selectedCountry));
            } else if (!value) {
                // Clear saved data
                await AsyncStorage.removeItem('rememberedPhone');
                await AsyncStorage.removeItem('rememberedCountry');
            }
        } catch (error) {
            console.error('Error saving remember me data:', error);
        }
    };

    // Load remembered phone number on focus
    useFocusEffect(
        useCallback(() => {
            const loadRememberedNumber = async () => {
                try {
                    if (rememberMe) {
                        const savedNumber = await AsyncStorage.getItem('rememberedPhone');
                        if (savedNumber) {
                            setPhoneNumber(savedNumber);
                        }
                    }
                } catch (error) {
                    console.error('Error loading remembered number:', error);
                }
            };

            loadRememberedNumber();
        }, [rememberMe])
    );

    // Keyboard handling
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardShowSub = Keyboard.addListener(
            showEvent,
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardHideSub = Keyboard.addListener(
            hideEvent,
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardShowSub.remove();
            keyboardHideSub.remove();
        };
    }, []);

    // Initial delay
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!isReady) {
        return <View className="flex-1 bg-black" />;
    }

    // Helper functions
    const getFullPhoneNumber = () => {
        const cleanPhoneNumber = phoneNumber.replace(/\s/g, '').replace(/^0+/, '');
        return selectedCountry.code + cleanPhoneNumber;
    };

    const validatePhoneOrToast = () => {
        const fullPhoneNumber = getFullPhoneNumber();
        // Remove + sign and any non-digits for validation
        const phoneForValidation = fullPhoneNumber.replace(/\D/g, '');

        if (!phoneRegex.test(phoneForValidation)) {
            toast.show({
                message: 'Please enter a valid phone number (6-15 digits without country code).',
                type: 'warning',
                style: 'top',
            });
            return { ok: false, phone: '' };
        }
        return { ok: true, phone: fullPhoneNumber };
    };

    const isSignInValid = phoneNumber.trim().length > 0 && password.trim().length >= 6;
    const isSignUpValid = name.trim().length >= 2 && phoneNumber.trim().length > 0 && password.trim().length >= 6 && agreeTerms;

    const scrollToInput = (inputRef: React.RefObject<TextInput | null>) => {
        setTimeout(() => {
            inputRef.current?.measure(
                (_fx, _fy, _w, h, _px, py) => {
                    scrollViewRef.current?.scrollTo({
                        y: py - 40,
                        animated: true,
                    });
                }
            );
        }, 100);
    };

    // Handle country selection
    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);

        // Save selected country if remember me is enabled
        if (rememberMe) {
            AsyncStorage.setItem('rememberedCountry', JSON.stringify(country));
        }
    };

    // Sign In function
    const handleSignIn = async () => {
        if (!phoneNumber || !password) {
            toast.show({
                message: 'Please enter phone number and password.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        const { ok, phone } = validatePhoneOrToast();
        if (!ok) return;

        if (password.length < 6) {
            toast.show({
                message: 'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        setIsLoading(true);

        try {
            const loginPayload = {
                phone_number: phone,
                password,
            };

            console.log('Login payload:', loginPayload);

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(loginPayload),
                }
            );

            console.log('Response status:', response.status);

            let data;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Invalid server response');
            }

            if (response.ok && data.success) {
                // Save remember me data
                if (rememberMe) {
                    await AsyncStorage.setItem('rememberedPhone', phoneNumber);
                    await AsyncStorage.setItem('rememberedCountry', JSON.stringify(selectedCountry));
                }

                // Save auth tokens
                await AsyncStorage.setItem('token', data.data.token);
                await AsyncStorage.setItem('refresh_token', data.data.refresh_token);
                await AsyncStorage.setItem('isLoggedIn', 'true');
                await AsyncStorage.setItem('user', JSON.stringify({
                    phone_number: phone,
                    name: data.data.name || '',
                    timestamp: Date.now(),
                }));

                // Handle subscription
                if (data.data.subscribe !== undefined) {
                    await AsyncStorage.setItem('subscribe', data.data.subscribe ? 'true' : 'false');
                } else {
                    await AsyncStorage.setItem('subscribe', 'false');
                }

                setPassword('');

                toast.show({
                    message: 'Sign in successfully ✓',
                    type: 'success',
                    style: 'top',
                    duration: 2000,
                });

                const subscribe = await AsyncStorage.getItem('subscribe');

                setTimeout(() => {
                    if (subscribe === 'true') {
                        navigator.navigate('DailyTrack');
                    } else {
                        navigator.navigate('FaceScanWithDetection');
                    }
                }, 1000);
            } else {
                const errorMessage = data.message || data.error || 'Invalid phone number or password.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                });
            }
        } catch (error: any) {
            console.error('Sign-in error:', error);
            const errorMessage = error.message || 'Network error. Please check your connection and try again.';
            toast.show({
                message: errorMessage,
                type: 'error',
                style: 'center',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Sign Up function
    const handleSignUp = async () => {
        if (!name || !phoneNumber || !password) {
            toast.show({
                message: 'Please fill in all fields.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        if (name.trim().length < 2) {
            toast.show({
                message: 'Please enter a valid name (at least 2 characters).',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        const { ok, phone } = validatePhoneOrToast();
        if (!ok) return;

        if (password.length < 6) {
            toast.show({
                message: 'Password must be at least 6 characters long.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        if (!agreeTerms) {
            toast.show({
                message: 'Please agree to Terms & Conditions.',
                type: 'warning',
                style: 'top',
            });
            return;
        }

        setIsLoading(true);

        try {
            const signupPayload = {
                phone_number: phone,
                name: name.trim(),
                password,
            };

            console.log('Signup payload:', signupPayload);

            const response = await fetch(
                `${API_BASE_URL}${API_ENDPOINTS.REGISTER}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(signupPayload),
                }
            );

            console.log('Response status:', response.status);

            let data;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Invalid server response');
            }

            if (response.ok && data.success) {
                // Save temp user data for OTP verification
                await AsyncStorage.setItem('tempUser', JSON.stringify({
                    name: name.trim(),
                    phone_number: phone,
                }));

                toast.show({
                    message: 'Account created successfully! Please verify OTP.',
                    type: 'success',
                    style: 'top',
                    duration: 2000,
                });

                setTimeout(() => {
                    navigator.navigate('OtpAuth', {
                        phone_number: phone,
                        name: name.trim(),
                        password,
                    });
                }, 500);

                // Clear form
                setName('');
                setPhoneNumber('');
                setPassword('');
                setAgreeTerms(false);
            } else {
                const errorMessage = data.message || data.error || 'Sign up failed. Please try again.';
                toast.show({
                    message: errorMessage,
                    type: 'error',
                    style: 'center',
                });
            }
        } catch (error: any) {
            console.error('Sign-up error:', error);
            const errorMessage = error.message || 'Network error. Please check your connection and try again.';
            toast.show({
                message: errorMessage,
                type: 'error',
                style: 'center',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigator.navigate('ResetPassword');
    };

    const switchTab = (tab: 'signin' | 'signup') => {
        setActiveTab(tab);
        setPassword('');
        if (tab === 'signup') {
            setName('');
            setPhoneNumber('');
        }
        if (tab === 'signin') {
            setAgreeTerms(false);
        }
        Keyboard.dismiss();
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView className="flex-1 bg-[#000000]" edges={['top']}>
                <StatusBar barStyle="light-content" />
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingBottom: Platform.OS === 'android' ? keyboardHeight + 20 : 20,
                            flexGrow: 1,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo */}
                        <View className="items-center my-12">
                            <Image
                                source={Images.Icon}
                                resizeMode="contain"
                                style={{ width: 120, height: 120 }}
                            />
                        </View>

                        {/* Tab Switcher */}
                        <View className="flex-row border-2 border-white rounded-full p-1 mb-8">
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signin' ? 'bg-blue-400' : 'bg-transparent'}`}
                                onPress={() => switchTab('signin')}
                                disabled={isLoading}
                            >
                                <Text className="text-lg font-bold text-white">Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 py-3 rounded-full items-center ${activeTab === 'signup' ? 'bg-blue-400' : 'bg-transparent'}`}
                                onPress={() => switchTab('signup')}
                                disabled={isLoading}
                            >
                                <Text className="text-lg font-bold text-white">Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Welcome Section */}
                        <View className="mb-8">
                            <Text className="text-2xl font-bold text-white mb-3">
                                {activeTab === 'signin' ? 'Welcome!' : 'Create Your Account'}
                            </Text>
                            <Text className="text-lg text-white leading-5">
                                {activeTab === 'signin'
                                    ? 'Log in to your account to access your face scan data and reports.'
                                    : 'Join the AI Face Scan community and explore your facial insights instantly.'}
                            </Text>
                        </View>

                        {/* Form */}
                        <View className="pb-8">
                            {/* Name (Sign Up only) */}
                            {activeTab === 'signup' && (
                                <View className="mb-4">
                                    <Text className="text-lg font-semibold text-white mb-3">Full Name</Text>
                                    <TextInput
                                        ref={nameInputRef}
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white"
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#6B7280"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                        onFocus={() => scrollToInput(nameInputRef)}
                                        returnKeyType="next"
                                        onSubmitEditing={() => phoneInputRef.current?.focus()}
                                    />
                                </View>
                            )}

                            {/* Phone Number with Country Code */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">Phone Number</Text>
                                <View className="flex-row items-center border-2 border-gray-600 rounded-xl overflow-hidden">
                                    <TouchableOpacity
                                        className="flex-row items-center px-4 py-4 bg-gray-800 min-w-[100]"
                                        onPress={() => setShowCountryPicker(true)}
                                        disabled={isLoading}
                                    >
                                        <Text className="text-white text-lg mr-2">
                                            {selectedCountry.flag}
                                        </Text>
                                        <Text className="text-white text-lg">
                                            {selectedCountry.code}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                    <TextInput
                                        ref={phoneInputRef}
                                        className="flex-1 bg-transparent px-4 py-4 text-lg text-white"
                                        placeholder="Enter phone number"
                                        placeholderTextColor="#6B7280"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        textContentType="telephoneNumber"
                                        autoCapitalize="none"
                                        editable={!isLoading}
                                        onFocus={() => scrollToInput(phoneInputRef)}
                                        returnKeyType="next"
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    />
                                </View>
                                <Text className="text-gray-400 text-sm mt-1">
                                    Full number: {selectedCountry.code} {phoneNumber}
                                </Text>
                            </View>

                            {/* Password */}
                            <View className="mb-4">
                                <Text className="text-lg font-semibold text-white mb-3">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        ref={passwordInputRef}
                                        className="bg-transparent border-2 border-gray-600 rounded-xl px-4 py-4 text-lg text-white pr-12"
                                        placeholder="Enter your password (min 6 characters)"
                                        placeholderTextColor="#6B7280"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="password"
                                        editable={!isLoading}
                                        onFocus={() => scrollToInput(passwordInputRef)}
                                        returnKeyType="done"
                                        onSubmitEditing={activeTab === 'signin' ? handleSignIn : handleSignUp}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-5"
                                        onPress={() => setShowPassword(prev => !prev)}
                                        disabled={isLoading}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={24}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Sign In options */}
                            {activeTab === 'signin' && (
                                <View className="flex-row justify-between items-center mb-6">
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() => handleRememberMeChange(!rememberMe)}
                                        disabled={isLoading}
                                    >
                                        <View className={`w-6 h-6 mr-2 border-2 rounded items-center justify-center ${rememberMe
                                            ? 'bg-blue-400 border-blue-400'
                                            : 'border-gray-600'
                                            }`}>
                                            {rememberMe && (
                                                <Ionicons name="checkmark" size={18} color="#fff" />
                                            )}
                                        </View>
                                        <Text className="text-base text-gray-400">
                                            Remember Me
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleForgotPassword}
                                        disabled={isLoading}
                                    >
                                        <Text className="text-base text-red-500 font-semibold">
                                            Forgot Password?
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Sign Up options */}
                            {activeTab === 'signup' && (
                                <TouchableOpacity
                                    className="flex-row items-start mb-6"
                                    onPress={() => setAgreeTerms(!agreeTerms)}
                                    disabled={isLoading}
                                >
                                    <View className={`w-6 h-6 border-2 rounded items-center justify-center mr-2 mt-0.5 ${agreeTerms
                                        ? 'bg-blue-400 border-blue-400'
                                        : 'border-gray-600'
                                        }`}>
                                        {agreeTerms && (
                                            <Ionicons name="checkmark" size={18} color="#fff" />
                                        )}
                                    </View>
                                    <Text className="text-sm text-gray-400 flex-1 leading-5">
                                        I agree to the Terms & Conditions and Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`py-5 rounded-xl items-center mb-8 ${isLoading || (activeTab === 'signin' ? !isSignInValid : !isSignUpValid)
                                    ? 'bg-gray-700 opacity-60'
                                    : 'bg-blue-400'
                                    }`}
                                onPress={activeTab === 'signin' ? handleSignIn : handleSignUp}
                                disabled={isLoading || (activeTab === 'signin' ? !isSignInValid : !isSignUpValid)}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-xl font-semibold">
                                            {activeTab === 'signin' ? 'Log In' : 'Sign Up'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Custom Country Picker Modal */}
                <CountryPickerComponent
                    visible={showCountryPicker}
                    onClose={() => setShowCountryPicker(false)}
                    onSelect={handleCountrySelect}
                    selectedCountry={selectedCountry}
                />

                <Toast
                    style={toast.style}
                    visible={toast.visible}
                    message={toast.message}
                    type={toast.type}
                    fadeAnim={toast.fadeAnim}
                    buttons={toast.buttons}
                    onHide={toast.hide}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = {
    container: {
        flex: 1,
        justifyContent: 'flex-end' as const,
    },
    backdrop: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        width: '100%',
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
    },
    dragHandleContainer: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: 8,
        marginBottom: 8,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold' as const,
        color: '#000',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
        padding: 4,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#000',
    },
    list: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    selectedCountryItem: {
        backgroundColor: '#e3f2fd',
    },
    flagText: {
        fontSize: 24,
        marginRight: 12,
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: 16,
        color: '#000',
        marginBottom: 2,
    },
    countryCode: {
        fontSize: 14,
        color: '#666',
    },
    checkmark: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold' as const,
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center' as const,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center' as const,
    },
};

export default AuthScreen;