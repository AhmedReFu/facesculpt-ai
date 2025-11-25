import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io, { Socket } from 'socket.io-client';

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

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================
const SOCKET_URL = 'https://your-backend.com'; // Replace with your backend URL
const USER_ID = 'user123'; // Replace with actual user ID from auth

// ============================================
// SOCKET.IO HOOK
// ============================================
const useSocketIO = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Initialize Socket.IO connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            query: {
                userId: USER_ID,
            },
        });

        const socket = socketRef.current;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('✅ Socket.IO Connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket.IO Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔴 Socket.IO Connection Error:', error);
            setIsConnected(false);
        });

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.disconnect();
                console.log('🧹 Socket.IO Cleaned up');
            }
        };
    }, []);

    return { socket: socketRef.current, isConnected };
};

// ============================================
// MOCK DATA (FALLBACK - Remove when API is ready)
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

    return {
        answer: "Hi! I'm FaceCoach. Ask me anything about your routine or scans.",
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
                        <Text className="text-gray-400 text-sm">Typing...</Text>
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
        className="flex-row items-center bg-transparent border border-gray-100 rounded-lg px-4 py-2.5 mb-2 mx-2"
        style={{ minWidth: 300 }}
    >
        <MaterialCommunityIcons name="message-outline" size={24} color="#60A5FB" />
        <Text className="text-gray-300 text-lg ml-2 flex-shrink">{question.text}</Text>
    </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================
const FaceCoach: React.FC = () => {
    const navigator = useNavigation();
    const { socket, isConnected } = useSocketIO();

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
    const [useMockData, setUseMockData] = useState<boolean>(true); // Toggle this when API is ready

    const scrollViewRef = useRef<ScrollView>(null);

    // ============================================
    // SOCKET.IO EVENT LISTENERS
    // ============================================
    useEffect(() => {
        if (!socket || useMockData) return;

        // Listen for chat responses
        socket.on('chat:response', (response: ChatResponse) => {
            console.log('📨 Received chat response:', response);

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

            setIsLoading(false);
        });

        // Listen for suggested questions
        socket.on('suggestions:update', (suggestions: string[]) => {
            console.log('💡 Received suggestions:', suggestions);
            setSuggestedQuestions(
                suggestions.map((suggestion, index) => ({
                    id: `suggestion-${Date.now()}-${index}`,
                    text: suggestion,
                }))
            );
        });

        // Listen for typing indicator (optional)
        socket.on('chat:typing', () => {
            console.log('⌨️ AI is typing...');
            // You can add typing indicator logic here if needed
        });

        // Listen for errors
        socket.on('chat:error', (error: { message: string }) => {
            console.error('🔴 Chat error:', error);
            setMessages((prev) =>
                prev.filter((msg) => !msg.isLoading).concat({
                    id: Date.now().toString(),
                    text: error.message || "Sorry, something went wrong. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                })
            );
            setIsLoading(false);
        });

        // Cleanup listeners
        return () => {
            socket.off('chat:response');
            socket.off('suggestions:update');
            socket.off('chat:typing');
            socket.off('chat:error');
        };
    }, [socket, useMockData]);

    // Load initial suggestions
    useEffect(() => {
        if (useMockData) {
            setSuggestedQuestions(getMockSuggestions());
        } else if (socket && isConnected) {
            // Request initial suggestions from server
            socket.emit('suggestions:fetch', { userId: USER_ID });
        }
    }, [socket, isConnected, useMockData]);

    // Auto-scroll on new messages
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

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

        // ============================================
        // SWITCH BETWEEN MOCK DATA AND SOCKET.IO
        // ============================================
        if (useMockData) {
        // MOCK DATA MODE (Remove this when API is ready)
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
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
                            id: `suggestion-${index}`,
                            text: suggestion,
                        }))
                    );
                }
            } catch (error) {
                console.error('Mock API error:', error);
                setMessages((prev) =>
                    prev.filter((msg) => !msg.isLoading).concat({
                        id: Date.now().toString(),
                        text: "Sorry, I'm having trouble connecting right now. Please try again.",
                        isUser: false,
                        timestamp: new Date(),
                    })
                );
            } finally {
                setIsLoading(false);
            }
        } else {
            // SOCKET.IO MODE (Use this when API is ready)
            if (!socket || !isConnected) {
                setMessages((prev) =>
                    prev.filter((msg) => !msg.isLoading).concat({
                        id: Date.now().toString(),
                        text: "Connection lost. Please check your internet and try again.",
                        isUser: false,
                        timestamp: new Date(),
                    })
                );
                setIsLoading(false);
                return;
            }

            try {
                // Emit message to server
                socket.emit('chat:message', {
                    userId: USER_ID,
                    message: text.trim(),
                    conversationHistory: messages
                        .filter((msg) => !msg.isLoading)
                        .map((msg) => ({
                            text: msg.text,
                            isUser: msg.isUser,
                            timestamp: msg.timestamp,
                        })),
                    timestamp: new Date().toISOString(),
                });

                console.log('📤 Message sent via Socket.IO:', text);

                // Response will be handled by socket.on('chat:response') listener
            } catch (error) {
                console.error('Socket.IO send error:', error);
                setMessages((prev) =>
                    prev.filter((msg) => !msg.isLoading).concat({
                        id: Date.now().toString(),
                        text: "Failed to send message. Please try again.",
                        isUser: false,
                        timestamp: new Date(),
                    })
                );
                setIsLoading(false);
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
        <SafeAreaView className="flex-1 bg-[#0D0F14]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <TouchableOpacity onPress={() => navigator.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View className="flex-row gap-2">
                    <Text className="text-white text-2xl font-bold">
                        Ask Face Coach
                    </Text>
                    <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                </View>
                <View>
                    {/* Connection Status Indicator */}
                    {!useMockData && (
                        <View
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
                                }`}
                        />
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                    <View className="px-4 py-3 border-b border-gray-800">
                        {suggestedQuestions.map((question) => (
                            <SuggestedQuestionButton
                                key={question.id}
                                question={question}
                                onPress={handleSuggestionPress}
                            />
                        ))}
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
                <View className="px-4 py-4">
                    <View className="flex-row items-center bg-[#1F2937] rounded-xl px-4 py-3 border border-gray-700">
                        <TextInput
                            className="flex-1 text-white text-base max-h-20"
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type your question..."
                            placeholderTextColor="#6B7280"
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!inputText.trim() || isLoading}
                            className={`ml-3 bg-[#60A5FA] rounded-lg w-10 h-10 items-center justify-center ${!inputText.trim() || isLoading ? 'opacity-50' : ''
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
    );
};

export default FaceCoach;