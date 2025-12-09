import React, { useState } from 'react';
import {
    Animated,
    Platform,
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    BackHandler,
    Modal,
    Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastAction = 'dismiss' | 'back' | 'close-app' | 'custom';
export type ToastStyle = 'top' | 'center'; // top = normal, center = modal style

interface ToastButton {
    text: string;
    action: ToastAction;
    onPress?: () => void;
}

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number | null;
    buttons?: ToastButton[];
    style?: ToastStyle; // 'top' or 'center'
}

interface ToastHookReturn {
    show: (config: ToastConfig | string, type?: ToastType, duration?: number | null, buttons?: ToastButton[], style?: ToastStyle) => void;
    visible: boolean;
    message: string;
    type: ToastType;
    fadeAnim: Animated.Value;
    buttons: ToastButton[];
    style: ToastStyle;
    hide: () => void;
}

interface ToastProps {
    visible: boolean;
    message: string;
    type: ToastType;
    fadeAnim: Animated.Value;
    buttons: ToastButton[];
    style: ToastStyle;
    onHide: () => void;
}

const { width } = Dimensions.get('window');

// Toast Hook
export const useToast = (): ToastHookReturn => {
    const [visible, setVisible] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [type, setType] = useState<ToastType>('info');
    const [buttons, setButtons] = useState<ToastButton[]>([]);
    const [style, setStyle] = useState<ToastStyle>('top');
    const fadeAnim = useState(new Animated.Value(0))[0];

    const hide = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const show = (
        config: ToastConfig | string,
        toastType: ToastType = 'info',
        duration: number | null = 3000,
        toastButtons?: ToastButton[],
        toastStyle: ToastStyle = 'top'
    ): void => {
        let finalButtons: ToastButton[] = [];
        let finalDuration = duration;
        let finalStyle = toastStyle;

        // Handle both object and string parameters
        if (typeof config === 'string') {
            setMessage(config);
            setType(toastType);
            finalButtons = toastButtons || [];
            finalStyle = toastStyle;
        } else {
            setMessage(config.message);
            setType(config.type || 'info');
            finalButtons = config.buttons || [];
            finalStyle = config.style || 'top';
            finalDuration = config.duration !== undefined ? config.duration : 3000;
        }

        setButtons(finalButtons);
        setStyle(finalStyle);
        setVisible(true);

        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto dismiss if:
        // 1. Duration is set AND
        // 2. No buttons provided (auto-dismiss) OR style is 'top'
        if (finalDuration && (finalButtons.length === 0 || finalStyle === 'top')) {
            setTimeout(hide, finalDuration);
        }
    };

    return { show, visible, message, type, fadeAnim, buttons, style, hide };
};

// Toast Component
export const Toast: React.FC<ToastProps> = ({ visible, message, type, fadeAnim, buttons, style, onHide }) => {
    const navigation = useNavigation();

    if (!visible) return null;

    const bgColor: Record<ToastType, string> = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
    };

    const handleButtonPress = (button: ToastButton) => {
        switch (button.action) {
            case 'dismiss':
                onHide();
                break;
            case 'back':
                onHide();
                if (navigation.canGoBack()) {
                    navigation.goBack();
                }
                break;
            case 'close-app':
                onHide();
                BackHandler.exitApp();
                break;
            case 'custom':
                onHide();
                if (button.onPress) {
                    button.onPress();
                }
                break;
        }
    };

    // Top style (normal toast)
    if (style === 'top') {
        return (
            <Animated.View
                style={[
                    styles.topContainer,
                    {
                        backgroundColor: bgColor[type],
                        opacity: fadeAnim,
                        top: Platform.OS === 'ios' ? 60 : 40,
                    }
                ]}
            >
                <Text style={styles.text}>{message}</Text>

                {buttons.length > 0 && (
                    <View style={styles.buttonContainer}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.button}
                                onPress={() => handleButtonPress(button)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.buttonText}>{button.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.View>
        );
    }

    // Center style (modal with blur)
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onHide}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={80} style={styles.blurView}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => { }} // Prevent closing on backdrop press
                    />

                    <Animated.View
                        style={[
                            styles.centerContainer,
                            {
                                backgroundColor: bgColor[type],
                                opacity: fadeAnim,
                            }
                        ]}
                    >
                        <Text style={styles.centerText}>{message}</Text>

                        <View style={styles.centerButtonContainer}>
                            {buttons.map((button, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.centerButton,
                                        buttons.length === 1 && styles.centerButtonFull
                                    ]}
                                    onPress={() => handleButtonPress(button)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.centerButtonText}>{button.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // Top style (normal toast)
    topContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 12,
    },
    button: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        marginLeft: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // Center style (modal)
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    centerContainer: {
        width: width - 80,
        maxWidth: 400,
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    centerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    centerButtonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    centerButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
    },
    centerButtonFull: {
        flex: 1,
    },
    centerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});


// // 1. TOP STYLE (Normal toast at top)
// toast.show('Quick message', 'success', 3000, undefined, 'top');

// // 2. CENTER STYLE (Modal with blur - blocks screen)
// toast.show({
//     message: 'This is important!',
//     type: 'warning',
//     style: 'center', // 👈 This makes it center modal
//     buttons: [
//         { text: 'OK', action: 'dismiss' }
//     ]
// });

// // 3. Center modal with custom action
// toast.show({
//     message: 'Delete all data?',
//     type: 'error',
//     style: 'center',
//     buttons: [
//         { text: 'Cancel', action: 'dismiss' },
//         {
//             text: 'Delete',
//             action: 'custom',
//             onPress: () => deleteAllData()
//         }
//     ]
// });

// // 4. Center modal to close app
// toast.show({
//     message: 'App needs to restart',
//     type: 'info',
//     style: 'center',
//     buttons: [
//         { text: 'Close App', action: 'close-app' }
//     ]
// });



/* // ✅ Quick notification (no buttons, auto-dismiss)
toast.show({
    message: 'Password must be at least 6 characters.',
    type: 'warning',
    style: 'top'
});

// ✅ Success message (no buttons, auto-dismiss)
toast.show({
    message: 'Sign in successfully ✓',
    type: 'success',
    style: 'top',
    duration: 2000
});

// ✅ Error with button (shows OK button, manual dismiss)
toast.show({
    message: 'Invalid phone number or password.',
    type: 'error',
    style: 'center',
    buttons: [{ text: 'OK', action: 'dismiss' }]
});

// ✅ Network error with button
toast.show({
    message: 'Network error. Please check your connection.',
    type: 'error',
    style: 'center',
    buttons: [{ text: 'OK', action: 'dismiss' }]
}); */