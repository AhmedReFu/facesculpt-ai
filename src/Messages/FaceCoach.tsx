import { IPA_BASE } from '@env';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    isLoading?: boolean;
}

interface SuggestedQuestion {
    id: string;
    text: string;
}


type FaceCoachScreenRouteProp = RouteProp<
    {
        FaceCoach: {
            token: string;
        }
    },
    'FaceCoach'
>;

// ============================================
// FIXED WEBSOCKET HOOK
// ============================================
const useWebSocket = (token: string | null) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

    const addLog = (message: string) => {
        console.log(`🔍 ${message}`);
        setConnectionLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const connectWebSocket = () => {
        if (!token) {
            addLog('❌ No token provided for WebSocket connection');
            setConnectionError('No authentication token');
            return;
        }

        let cleanBase = IPA_BASE.replace(/^(https?:\/\/)/, '');
        cleanBase = cleanBase.replace(/\/+$/, '');

        const wsProtocol = cleanBase.includes('localhost') ||
            cleanBase.includes('127.0.0.1') ||
            cleanBase.includes('192.168')
            ? 'ws'
            : 'wss';

        const urlVariants = [
            `${wsProtocol}://${cleanBase}/ws/chat/?token=${token}`,
            `${wsProtocol}://${cleanBase}/ws/cnau/?token=${token}`,
            `${wsProtocol}://${cleanBase}/ws/chat/${token}/`,
            `${wsProtocol}://${cleanBase}/ws/cnau/${token}/`,
            `${wsProtocol}://${cleanBase}/ws/?token=${token}`,
        ];

        let currentUrlIndex = 0;

        const tryConnect = () => {
            if (currentUrlIndex >= urlVariants.length) {
                addLog('🔴 All connection attempts failed');
                setConnectionError('Unable to connect to server');
                reconnectAttemptsRef.current++;

                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    addLog(`🔄 Retrying in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        currentUrlIndex = 0;
                        tryConnect();
                    }, delay);
                }
                return;
            }

            const WS_URL = urlVariants[currentUrlIndex];
            addLog(`🔌 Connection attempt ${currentUrlIndex + 1}/${urlVariants.length}`);
            addLog(`URL: ${WS_URL.replace(token, '***TOKEN***')}`);

            try {
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }

                const websocket = new WebSocket(WS_URL);
                wsRef.current = websocket;

                const connectionTimeout = setTimeout(() => {
                    if (websocket.readyState !== WebSocket.OPEN) {
                        addLog('⏰ Connection timeout');
                        websocket.close();
                        currentUrlIndex++;
                        tryConnect();
                    }
                }, 5000);

                websocket.onopen = () => {
                    clearTimeout(connectionTimeout);
                    addLog('✅ WEBSOCKET CONNECTED');
                    addLog(`Connected to: ${urlVariants[currentUrlIndex].replace(token, '***TOKEN***')}`);
                    setIsConnected(true);
                    setConnectionError(null);
                    reconnectAttemptsRef.current = 0;

                    setTimeout(() => {
                        if (websocket.readyState === WebSocket.OPEN) {
                            const pingMessage = {
                                type: 'ping',
                                service: 'AT',
                                created_at: new Date().toISOString()
                            };
                            websocket.send(JSON.stringify(pingMessage));
                            addLog('📤 Sent ping');
                        }
                    }, 500);
                };

                websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        const messageType = data.type || 'unknown';
                        addLog(`📨 Received: ${messageType}`);
                        console.log('📨 Full message:', data);
                    } catch (error) {
                        addLog(`📨 Text: ${event.data.substring(0, 50)}...`);
                    }
                };

                websocket.onerror = (event) => {
                    clearTimeout(connectionTimeout);
                    addLog(`🔴 Error on URL ${currentUrlIndex + 1}`);
                    setIsConnected(false);

                    currentUrlIndex++;
                    if (currentUrlIndex < urlVariants.length) {
                        addLog(`🔄 Trying next URL...`);
                        setTimeout(tryConnect, 1000);
                    } else {
                        setConnectionError('All connection methods failed');
                    }
                };

                websocket.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    addLog(`❌ Closed: ${event.code} - ${event.reason || 'No reason'}`);
                    setIsConnected(false);

                    if (event.code === 1000) {
                        addLog('✅ Normal closure');
                        return;
                    }

                    const errorMessages: { [key: number]: string } = {
                        1006: 'Connection rejected or network error',
                        1008: 'Authentication failed - check token',
                        1011: 'Server error',
                        4001: 'Unauthorized - invalid token',
                        4003: 'Forbidden - token expired',
                    };

                    const errorMsg = errorMessages[event.code] || `Connection closed (${event.code})`;
                    addLog(`🔴 ${errorMsg}`);
                    setConnectionError(errorMsg);

                    if (currentUrlIndex < urlVariants.length - 1) {
                        currentUrlIndex++;
                        setTimeout(tryConnect, 1000);
                    } else {
                        reconnectAttemptsRef.current++;
                        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                            addLog(`🔄 Reconnecting in ${delay / 1000}s...`);

                            reconnectTimeoutRef.current = setTimeout(() => {
                                currentUrlIndex = 0;
                                tryConnect();
                            }, delay);
                        } else {
                            addLog('🔴 Max reconnection attempts reached');
                        }
                    }
                };

            } catch (error) {
                addLog(`🔴 Init error: ${error}`);
                setConnectionError('Failed to initialize connection');
                currentUrlIndex++;

                if (currentUrlIndex < urlVariants.length) {
                    setTimeout(tryConnect, 1000);
                }
            }
        };

        tryConnect();
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                addLog('🧹 Closing connection');
                wsRef.current.close(1000, 'Component unmounting');
                wsRef.current = null;
            }
        };
    }, [token]);

    const sendMessage = (message: any): boolean => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            addLog('🔴 Cannot send - not connected');
            setConnectionError('Not connected');
            return false;
        }

        try {
            const messageData = {
                ...message,
                created_at: message.created_at || new Date().toISOString(),
                service: message.service || 'AT'
            };

            wsRef.current.send(JSON.stringify(messageData));
            addLog(`📤 Sent: ${messageData.type || 'message'}`);
            return true;
        } catch (error) {
            addLog(`🔴 Send failed: ${error}`);
            setConnectionError('Failed to send message');
            return false;
        }
    };

    const reconnect = () => {
        addLog('🔄 Manual reconnect');
        reconnectAttemptsRef.current = 0;
        setConnectionError(null);
        connectWebSocket();
    };

    const addMessageListener = (handler: (event: MessageEvent) => void) => {
        if (wsRef.current) {
            messageHandlerRef.current = handler;
            wsRef.current.addEventListener('message', handler);
        }
    };

    const removeMessageListener = () => {
        if (wsRef.current && messageHandlerRef.current) {
            wsRef.current.removeEventListener('message', messageHandlerRef.current);
            messageHandlerRef.current = null;
        }
    };

    return {
        websocket: wsRef.current,
        isConnected,
        connectionError,
        connectionLogs,
        sendMessage,
        reconnect,
        addMessageListener,
        removeMessageListener
    };
};


const getMockSuggestions = (): SuggestedQuestion[] => {
    return [
        { id: '1', text: 'Why is my jawline puffy today?' },
        { id: '2', text: 'How often should I do lymph drainage?' },
        { id: '3', text: 'When should I rescan my face?' },
        { id: '4', text: 'Best exercises for jawline definition?' },
    ];
};

// ============================================
// COMPONENTS
// ============================================
interface MessageBubbleProps {
    message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    if (message.isLoading) {
        return (
            <View className="mb-3 items-start">
                <View className="max-w-[80%] bg-[#1F2937] rounded-2xl rounded-bl-sm px-4 py-3">
                    <View className="flex-row gap-2">
                        <ActivityIndicator size="small" color="#60A5FA" />
                        <Text className="text-gray-400 text-sm">FaceCoach is thinking...</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className={`mb-3 ${message.isUser ? 'items-end' : 'items-start'}`}>
            <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.isUser
                    ? 'bg-[#60A5FA] rounded-br-sm'
                    : 'bg-[#1F2937] rounded-bl-sm'
                    }`}
            >
                <Text className="text-white text-[15px] leading-relaxed">
                    {message.text}
                </Text>
            </View>
        </View>
    );
};

interface SuggestedQuestionButtonProps {
    question: SuggestedQuestion;
    onPress: (text: string) => void;
}

const SuggestedQuestionButton: React.FC<SuggestedQuestionButtonProps> = ({
    question,
    onPress,
}) => (
    <TouchableOpacity
        onPress={() => onPress(question.text)}
        className="flex-row items-center bg-transparent border border-gray-600 rounded-lg px-4 py-3 mb-2 mx-2 active:bg-gray-800"
        style={{ minWidth: 280 }}
    >
        <MaterialCommunityIcons name="message-outline" size={20} color="#60A5FB" />
        <Text className="text-gray-300 text-base ml-2 flex-shrink">{question.text}</Text>
    </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================
const FaceCoach: React.FC = () => {
    const navigator = useNavigation();
    const route = useRoute<FaceCoachScreenRouteProp>();
    const token = route.params?.token;

    const {
        websocket,
        isConnected,
        connectionError,
        sendMessage,
        addMessageListener,
        removeMessageListener
    } = useWebSocket(token);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [useMockData, setUseMockData] = useState<boolean>(true);
    const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Show welcome message only when connected
    useEffect(() => {
        if (isConnected && !hasShownWelcome) {
            setMessages([{
                id: '1',
                text: "Hi! I'm FaceCoach. Ask me anything about your routine or scans.",
                isUser: false,
                timestamp: new Date(),
            }]);
            setSuggestedQuestions(getMockSuggestions());
            setHasShownWelcome(true);
        }
    }, [isConnected, hasShownWelcome]);

    // Setup WebSocket message listener
    useEffect(() => {
        if (!websocket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket received:', data);

                if (data.type === 'auth_success' || data.status === 'authenticated') {
                    console.log('🔐 Authentication successful');
                    setUseMockData(false);
                    return;
                }

                if (data.type === 'pong') {
                    console.log('🏓 Pong received');
                    return;
                }

                if (data.type === 'message' || data.message || data.response || data.answer) {
                    const responseText = data.message || data.response || data.answer || "I received your message.";

                    if (responseTimeoutRef.current) {
                        clearTimeout(responseTimeoutRef.current);
                        responseTimeoutRef.current = null;
                    }

                    setMessages((prev) =>
                        prev.filter((msg) => !msg.isLoading).concat({
                            id: Date.now().toString(),
                            text: responseText,
                            isUser: false,
                            timestamp: new Date(),
                        })
                    );

                    setIsLoading(false);

                    if (data.suggestions && Array.isArray(data.suggestions)) {
                        setSuggestedQuestions(
                            data.suggestions.map((suggestion: string, index: number) => ({
                                id: `suggestion-${Date.now()}-${index}`,
                                text: suggestion,
                            }))
                        );
                    }
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        addMessageListener(handleMessage);

        return () => {
            removeMessageListener();
        };
    }, [websocket]);

    useEffect(() => {
        if (connectionError && !useMockData && !isConnected) {
            console.log('🔄 Switching to mock data');
            setUseMockData(true);
        }
    }, [connectionError, useMockData, isConnected]);

    useEffect(() => {
        if (isConnected && useMockData) {
            console.log('✅ Switching to real connection');
            setUseMockData(false);
        }
    }, [isConnected]);

    // Auto-scroll when messages change or keyboard opens
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleSendMessage = async (text: string): Promise<void> => {
        if (!text.trim() || isLoading || !isConnected) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        const loadingMessage: Message = {
            id: `loading-${Date.now()}`,
            text: '',
            isUser: false,
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, loadingMessage]);

        if (!useMockData && websocket && isConnected) {
            try {
                const messageData = {
                    type: 'message',
                    service: 'AT',
                    message: text.trim(),
                    created_at: new Date().toISOString()
                };

                console.log('📤 Sending via WebSocket:', messageData);
                const sent = sendMessage(messageData);

                if (!sent) {
                    throw new Error('Failed to send');
                }

                responseTimeoutRef.current = setTimeout(() => {
                    console.log('⏰ Response timeout, using mock');
                    if (responseTimeoutRef.current) {
                        clearTimeout(responseTimeoutRef.current);
                    }
                    setUseMockData(true);
                }, 10000);

            } catch (error) {
                console.error('WebSocket error:', error);
                setUseMockData(true);
            }
        }
    };

    const handleSuggestionPress = (text: string): void => {
        handleSendMessage(text);
    };

    const handleSubmit = (): void => {
        handleSendMessage(inputText);
    };

    return (
        <ScrollView className="flex-1 bg-[#0D0F14]">
            <SafeAreaView className="flex-1" edges={['top']}>
                <StatusBar style="light" />

                {/* Header */}
                <View className="flex-row items-center justify-center px-4 py-3 bg-[#0D0F14]">
                    <TouchableOpacity
                        onPress={() => navigator.goBack()}
                        className="p-2 absolute left-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View className="flex-row gap-2 items-center">
                        <Ionicons name="chatbubble-ellipses" size={24} color="#60A5FA" />
                        <Text className="text-white text-xl font-bold">Face Coach</Text>
                    </View>
                </View>

                {/* Connection Status */}
                {!isConnected && (
                    <View className="px-4 py-3 bg-[#1F2937] border-b border-gray-700">
                        <View className="flex-row items-center justify-center gap-2">
                            <ActivityIndicator size="small" color="#60A5FA" />
                            <Text className="text-gray-300 text-sm">
                                {connectionError ? 'Connection failed. Retrying...' : 'Connecting to FaceCoach...'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Suggested Questions */}
                {isConnected && suggestedQuestions.length > 0 && (
                    <View className="py-4 border-b border-gray-800">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 12 }}
                        >
                            {suggestedQuestions.map((question) => (
                                <SuggestedQuestionButton
                                    key={question.id}
                                    question={question}
                                    onPress={handleSuggestionPress}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1"
                        contentContainerStyle={{
                            paddingHorizontal: 16,
                            paddingTop: 16,
                            paddingBottom: 16,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                    >
                        {messages.length === 0 && !isConnected && (
                            <View className="flex-1 items-center justify-center py-20">
                                <Ionicons name="chatbubble-ellipses-outline" size={64} color="#374151" />
                                <Text className="text-gray-500 text-center mt-4 text-base">
                                    Waiting for connection...
                                </Text>
                            </View>
                        )}
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                    </ScrollView>

                    {/* Input Area - Fixed at bottom */}
                    <View className="bg-[#0D0F14] mb-4 border-t border-gray-800">
                        <View className="px-4 py-3">
                            <View className={`flex-row items-center rounded-xl px-4 py-3 border ${isConnected ? 'bg-[#1F2937] border-gray-600' : 'bg-[#151921] border-gray-700'
                                }`}>
                                <TextInput
                                    className="flex-1 text-white text-base"
                                    style={{ maxHeight: 100 }}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    placeholder={
                                        isConnected
                                            ? "Ask about your routine, scans, or progress..."
                                            : "Waiting for connection..."
                                    }
                                    placeholderTextColor="#6B7280"
                                    multiline
                                    maxLength={500}
                                    editable={isConnected && !isLoading}
                                    returnKeyType="send"
                                    blurOnSubmit={false}
                                />
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={!inputText.trim() || isLoading || !isConnected}
                                    className={`ml-3 rounded-lg w-10 h-10 items-center justify-center ${!inputText.trim() || isLoading || !isConnected
                                        ? 'bg-gray-600'
                                        : 'bg-[#60A5FA]'
                                        }`}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="send" size={18} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ScrollView>
    );
};

export default FaceCoach;