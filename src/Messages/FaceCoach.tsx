import { IPA_BASE } from '@env';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================
// TYPES
// ============================================
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

interface ChatResponse {
    answer: string;
    suggestions?: string[];
}

interface WebSocketMessage {
    type: string;
    message?: string;
    service?: string;
    created_at?: string;
    [key: string]: any;
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

        // Clean the base URL
        let cleanBase = IPA_BASE.replace(/^(https?:\/\/)/, '');
        cleanBase = cleanBase.replace(/\/+$/, '');

        // Determine protocol based on environment
        const wsProtocol = cleanBase.includes('localhost') ||
            cleanBase.includes('127.0.0.1') ||
            cleanBase.includes('192.168')
            ? 'ws'
            : 'wss';

        // FIXED: Include token in WebSocket URL (not after connection)
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

                // Auto-retry with exponential backoff
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
                // Close existing connection
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }

                // Create WebSocket with token in URL
                const websocket = new WebSocket(WS_URL);
                wsRef.current = websocket;

                // Connection timeout
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

                    // Send ping to verify connection
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

                    // Try next URL
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

                    // Handle close codes
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

                    // Try next URL if available
                    if (currentUrlIndex < urlVariants.length - 1) {
                        currentUrlIndex++;
                        setTimeout(tryConnect, 1000);
                    } else {
                        // Attempt reconnection with backoff
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

        // Start connection
        tryConnect();
    };

    useEffect(() => {
        connectWebSocket();

    // Cleanup
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

    // Send message function
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

    // Manual reconnect
    const reconnect = () => {
        addLog('🔄 Manual reconnect');
        reconnectAttemptsRef.current = 0;
        setConnectionError(null);
        connectWebSocket();
    };

    // Add message listener
    const addMessageListener = (handler: (event: MessageEvent) => void) => {
        if (wsRef.current) {
            messageHandlerRef.current = handler;
            wsRef.current.addEventListener('message', handler);
        }
    };

    // Remove message listener
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

// ============================================
// MOCK DATA (FALLBACK)
// ============================================
const getMockResponse = (message: string): ChatResponse => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('puff') || lowerMessage.includes('swell')) {
        return {
            answer: 'Focus on posture, tongue posture, and short resistance drills. Keep reps controlled; avoid jaw clenching.',
            suggestions: [
                'How to reduce puffiness quickly?',
                'Best exercises for jawline definition?',
                'When will I see results?',
            ],
        };
    }

    if (lowerMessage.includes('lymph') || lowerMessage.includes('drainage')) {
        return {
            answer: 'Try gentle lymphatic drainage to reduce puffiness. Stay hydrated and avoid excess salt.',
            suggestions: [
                'Show me lymphatic massage technique',
                'What causes lymphatic buildup?',
                'Diet tips for reducing puffiness',
            ],
        };
    }

    if (lowerMessage.includes('rescan') || lowerMessage.includes('scan')) {
        return {
            answer: 'For accurate progress tracking, I recommend rescanning your face every 2 weeks. Make sure to scan at the same time of day under consistent lighting conditions.',
            suggestions: [
                'How to get the best scan results?',
                'What time of day is best for scanning?',
                'My scan results seem inconsistent',
            ],
        };
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return {
            answer: "Hello! I'm FaceCoach, your AI assistant for facial exercises and progress tracking. How can I help you today?",
            suggestions: [
                'Why is my jawline puffy today?',
                'How often should I do lymph drainage?',
                'When should I rescan my face?',
            ],
        };
    }

    return {
        answer: "I understand you're asking about: " + message + ". As your FaceCoach, I recommend focusing on consistent daily exercises and proper technique for best results. Would you like specific advice on any particular aspect of your routine?",
        suggestions: [
            'Why is my jawline puffy today?',
            'How often should I do lymph drainage?',
            'When should I rescan my face?',
        ],
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
        connectionLogs,
        sendMessage,
        reconnect,
        addMessageListener,
        removeMessageListener
    } = useWebSocket(token);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm FaceCoach. Ask me anything about your routine or scans.",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState<string>('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [useMockData, setUseMockData] = useState<boolean>(true);
    const [showDebug, setShowDebug] = useState<boolean>(true);

    const scrollViewRef = useRef<ScrollView>(null);
    const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Setup WebSocket message listener
    useEffect(() => {
        if (!websocket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket received:', data);

                // Handle different message types
                if (data.type === 'auth_success' || data.status === 'authenticated') {
                    console.log('🔐 Authentication successful');
                    setUseMockData(false);
                    return;
                }

                if (data.type === 'pong') {
                    console.log('🏓 Pong received');
                    return;
                }

                // Handle chat response
                if (data.type === 'message' || data.message || data.response || data.answer) {
                    const responseText = data.message || data.response || data.answer || "I received your message.";

                    // Clear timeout
                    if (responseTimeoutRef.current) {
                        clearTimeout(responseTimeoutRef.current);
                        responseTimeoutRef.current = null;
                    }

                    // Remove loading message and add response
                    setMessages((prev) =>
                        prev.filter((msg) => !msg.isLoading).concat({
                            id: Date.now().toString(),
                            text: responseText,
                            isUser: false,
                            timestamp: new Date(),
                        })
                    );

                    setIsLoading(false);

                    // Update suggestions
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

    // Auto-switch to mock if connection fails
    useEffect(() => {
        if (connectionError && !useMockData && !isConnected) {
            console.log('🔄 Switching to mock data');
            setUseMockData(true);
        }
    }, [connectionError, useMockData, isConnected]);

    // Switch to real connection when connected
    useEffect(() => {
        if (isConnected && useMockData) {
            console.log('✅ Switching to real connection');
            setUseMockData(false);
        }
    }, [isConnected]);

    // Load initial suggestions
    useEffect(() => {
        setSuggestedQuestions(getMockSuggestions());
    }, []);

    // Auto-scroll
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    // Test connection
    const testRealConnection = () => {
        console.log('=== CONNECTION DEBUG ===');
        console.log('Token:', token?.substring(0, 20) + '...');
        console.log('Base URL:', IPA_BASE);
        console.log('WebSocket State:', websocket?.readyState);
        console.log('Is Connected:', isConnected);
        console.log('Connection Error:', connectionError);
        console.log('Using Mock Data:', useMockData);
        console.log('======================');

        if (websocket && isConnected) {
            Alert.alert(
                'Test Connection',
                'Sending test message...',
                [{ text: 'OK' }]
            );

            const testMessage = {
                type: 'message',
                service: 'AT',
                message: 'Test from React Native',
                created_at: new Date().toISOString()
            };

            sendMessage(testMessage);
        } else {
            Alert.alert(
                'Not Connected',
                `Status: ${isConnected ? 'Connected' : 'Disconnected'}\nError: ${connectionError || 'None'}\nMode: ${useMockData ? 'Mock' : 'Real'}`,
                [{ text: 'OK' }]
            );
        }
    };

    const handleManualReconnect = () => {
        setUseMockData(false);
        reconnect();
    };

    // ============================================
    // MESSAGE HANDLING
    // ============================================
    const handleSendMessage = async (text: string): Promise<void> => {
        if (!text.trim() || isLoading) return;

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

        // Try real WebSocket first
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

                // Set response timeout
                responseTimeoutRef.current = setTimeout(() => {
                    console.log('⏰ Response timeout, using mock');
                    if (responseTimeoutRef.current) {
                        clearTimeout(responseTimeoutRef.current);
                    }
                    setUseMockData(true);
                    handleSendMessageWithMockData(text);
                }, 10000);

            } catch (error) {
                console.error('WebSocket error:', error);
                setUseMockData(true);
                handleSendMessageWithMockData(text);
            }
        } else {
            handleSendMessageWithMockData(text);
        }
    };

    const handleSendMessageWithMockData = async (text: string) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));
            const response = getMockResponse(text);

            setMessages((prev) =>
                prev.filter((msg) => !msg.isLoading).concat({
                    id: Date.now().toString(),
                    text: response.answer,
                    isUser: false,
                    timestamp: new Date(),
                })
            );

            if (response.suggestions && response.suggestions.length > 0) {
                setSuggestedQuestions(
                    response.suggestions.map((suggestion, index) => ({
                        id: `suggestion-${Date.now()}-${index}`,
                        text: suggestion,
                    }))
                );
            }
        } catch (error) {
            console.error('Mock error:', error);
            setMessages((prev) =>
                prev.filter((msg) => !msg.isLoading).concat({
                    id: Date.now().toString(),
                    text: "Sorry, I'm having trouble. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionPress = (text: string): void => {
        handleSendMessage(text);
    };

    const handleSubmit = (): void => {
        handleSendMessage(inputText);
    };

    const getConnectionStatus = () => {
        if (useMockData) {
            return { text: 'Demo', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
        }
        if (isConnected) {
            return { text: 'Live', color: 'text-green-400', bgColor: 'bg-green-500' };
        }
        return { text: 'Connecting', color: 'text-blue-400', bgColor: 'bg-blue-500' };
    };

    const status = getConnectionStatus();

    return (
        <SafeAreaView className="flex-1 bg-[#0D0F14]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
                <TouchableOpacity
                    onPress={() => navigator.goBack()}
                    className="p-2"
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View className="flex-row gap-2 items-center">
                    <Ionicons name="chatbubble-ellipses" size={24} color="#60A5FA" />
                    <Text className="text-white text-xl font-bold">Face Coach</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => setShowDebug(!showDebug)}>
                        <View className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                    </TouchableOpacity>
                    <Text className={`text-xs ${status.color}`}>{status.text}</Text>
                    <TouchableOpacity onPress={testRealConnection}>
                        <Ionicons name="bug-outline" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleManualReconnect}>
                        <Ionicons name="refresh" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Debug Panel */}
                {showDebug && (
                    <View className="bg-black/90 p-3 border-b border-gray-700">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-white font-bold text-xs">Debug Info</Text>
                            <TouchableOpacity onPress={handleManualReconnect}>
                                <Text className="text-blue-400 text-xs">Reconnect</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="space-y-1">
                            <Text className="text-green-400 text-xs">
                                Connected: {isConnected ? 'Yes' : 'No'}
                            </Text>
                            <Text className="text-red-400 text-xs">
                                Error: {connectionError || 'None'}
                            </Text>
                            <Text className="text-yellow-400 text-xs">
                                Mode: {useMockData ? 'Demo' : 'Live'}
                            </Text>
                            <Text className="text-blue-400 text-xs">
                                WS State: {websocket?.readyState ?? 'N/A'}
                            </Text>
                        </View>
                        {connectionLogs.length > 0 && (
                            <ScrollView className="max-h-20 mt-2">
                                {connectionLogs.slice(-5).map((log, index) => (
                                    <Text key={index} className="text-gray-400 text-xs">
                                        {log}
                                    </Text>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Connection Error Banner */}
                {connectionError && !useMockData && (
                    <View className="bg-red-900/50 px-4 py-2 border-b border-red-700">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-red-200 text-sm flex-1">
                                {connectionError}
                            </Text>
                            <TouchableOpacity onPress={handleManualReconnect}>
                                <Text className="text-red-100 text-sm font-bold">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                    <View className="px-4 py-4 border-b border-gray-800 bg-[#0F1724]/50">
                        <Text className="text-gray-400 text-sm mb-3 ml-2">Quick questions:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 4 }}
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

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View className="px-4 py-4 bg-[#0D0F14] border-t border-gray-800">
                    <View className="flex-row items-center bg-[#1F2937] rounded-xl px-4 py-3 border border-gray-600">
                        <TextInput
                            className="flex-1 text-white text-base max-h-20"
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask about your routine, scans, or progress..."
                            placeholderTextColor="#6B7280"
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!inputText.trim() || isLoading}
                            className={`ml-3 rounded-lg w-10 h-10 items-center justify-center ${!inputText.trim() || isLoading
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

                    {/* Connection status info */}
                    <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-gray-500 text-xs">
                            {useMockData
                                ? "Demo mode - responses are simulated"
                                : "Connected to server"
                            }
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {inputText.length}/500
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default FaceCoach;