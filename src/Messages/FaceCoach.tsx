import { IPA_BASE } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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

// WebSocket Hook
const useWebSocket = (token: string | null) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const connectWebSocket = () => {
        if (!token) return;

        let cleanBase = IPA_BASE.replace(/^(https?:\/\/)/, '').replace(/\/+$/, '');
        const wsProtocol = cleanBase.includes('localhost') || cleanBase.includes('127.0.0.1') ||
            cleanBase.includes('206.162.244.133') || cleanBase.includes('192.168')
            ? 'ws' : 'wss';

        const WS_URL = `${wsProtocol}://${cleanBase}/ws/chat/?token=${token}`;

        try {
            if (wsRef.current) {
                wsRef.current.close();
            }

            const websocket = new WebSocket(WS_URL);
            wsRef.current = websocket;

            websocket.onopen = () => {
                setIsConnected(true);
                setConnectionError(null);
            };

            websocket.onerror = () => {
                setIsConnected(false);
                setConnectionError('Connection failed');
            };

            websocket.onclose = () => {
                setIsConnected(false);
            };
        } catch (error) {
            setConnectionError('Failed to connect');
        }
    };

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [token]);

    const sendMessage = (message: any): boolean => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false;
        }
        try {
            wsRef.current.send(JSON.stringify({
                ...message,
                created_at: new Date().toISOString(),
                service: 'AT'
            }));
            return true;
        } catch {
            return false;
        }
    };

    const addMessageListener = (handler: (event: MessageEvent) => void) => {
        if (wsRef.current) {
            wsRef.current.addEventListener('message', handler);
        }
    };

    const removeMessageListener = (handler: (event: MessageEvent) => void) => {
        if (wsRef.current) {
            wsRef.current.removeEventListener('message', handler);
        }
    };

    return {
        websocket: wsRef.current,
        isConnected,
        connectionError,
        sendMessage,
        addMessageListener,
        removeMessageListener
    };
};

const getMockSuggestions = (): SuggestedQuestion[] => [
    { id: '1', text: 'Why is my jawline puffy today?' },
    { id: '2', text: 'How often should I do lymph drainage?' },
    { id: '3', text: 'When should I rescan my face?' },
    { id: '4', text: 'Best exercises for jawline definition?' }
];

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    if (message.isLoading) {
        return (
            <View className="mb-3 items-start">
                <View className="max-w-[80%] bg-[#374151] rounded-2xl rounded-bl-sm px-4 py-3">
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
                    : 'bg-[#374151] rounded-bl-sm'
                    }`}
            >
                <Text className="text-white text-[15px] leading-relaxed">
                    {message.text}
                </Text>
            </View>
        </View>
    );
};

// Suggested Question Button
const SuggestedQuestionButton: React.FC<{
    question: SuggestedQuestion;
    onPress: (text: string) => void;
}> = ({ question, onPress }) => (
    <TouchableOpacity
        onPress={() => onPress(question.text)}
        className="bg-transparent border border-gray-600 rounded-full px-4 py-2.5 mr-2"
    >
        <Text className="text-gray-300 text-base">{question.text}</Text>
    </TouchableOpacity>
);

// Main Component
const FaceCoach: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<FaceCoachScreenRouteProp>();
    const token = route.params?.token;

    const { websocket, isConnected, sendMessage, addMessageListener, removeMessageListener } =
        useWebSocket(token);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Show welcome message
    useEffect(() => {
        if (isConnected) {
            setMessages([{
                id: '1',
                text: "Hi! I'm FaceCoach. Ask me anything about your routine or scans.",
                isUser: false,
                timestamp: new Date(),
            }]);
            setSuggestedQuestions(getMockSuggestions());
        }
    }, [isConnected]);

    // WebSocket message listener
    useEffect(() => {
        if (!websocket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'message' || data.message || data.response) {
                    const responseText = data.message || data.response || "I received your message.";

                    setMessages((prev) =>
                        prev.filter((msg) => !msg.isLoading).concat({
                            id: Date.now().toString(),
                            text: responseText,
                            isUser: false,
                            timestamp: new Date(),
                        })
                    );
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        addMessageListener(handleMessage);
        return () => removeMessageListener(handleMessage);
    }, [websocket]);

    // Auto-scroll
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleSendMessage = async (text: string) => {
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

        sendMessage({
            type: 'message',
            message: text.trim()
        });
    };

    return (
        <View className="flex-1 bg-[#0D0F14]">
            <SafeAreaView className="flex-1" edges={['top']}>
                <StatusBar style="light" />

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-[#0D0F14]">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View className="flex-row gap-2 items-center">
                        <Text className="text-white text-xl font-semibold">Ask Face Coach</Text>
                        <View className="bg-[#60A5FA] rounded-full p-1.5">
                            <Ionicons name="chatbubble-ellipses-sharp" size={20} color="#FFFFFF" />

                        </View>
                    </View>
                    <View className="w-10" />
                </View>

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                    <View className="py-3 border-b border-gray-800">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                        >
                            {suggestedQuestions.map((question) => (
                                <SuggestedQuestionButton
                                    key={question.id}
                                    question={question}
                                    onPress={handleSendMessage}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                </ScrollView>

                {/* Input Area - Sticks to keyboard */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                >
                    <View className="bg-[#0D0F14] px-4 py-3 border-t border-gray-800 mb-4">
                        <View className="flex-row items-center bg-[#1F2937] rounded-full px-4 py-2 border border-gray-700">
                            <TextInput
                                className="flex-1 text-white text-base py-2"
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type your question..."
                                placeholderTextColor="#6B7280"
                                multiline
                                maxLength={500}
                                editable={isConnected && !isLoading}
                            />
                            <TouchableOpacity
                                onPress={() => handleSendMessage(inputText)}
                                disabled={!inputText.trim() || isLoading || !isConnected}
                                className={`ml-2 rounded-full p-2.5 ${!inputText.trim() || isLoading || !isConnected
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
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default FaceCoach;