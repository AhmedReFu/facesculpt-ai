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
// API FUNCTIONS
// ============================================
const BASE_URL = 'https://your-backend.com/api/facecoach';
const TIMEOUT = 30000;

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

const sendMessageToAPI = async (
    userId: string,
    message: string,
    conversationHistory: Message[]
): Promise<ChatResponse> => {
    try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return getMockResponse(message);
    } catch (error) {
        console.error('API Error:', error);
        return getMockResponse(message);
    }
};

const fetchSuggestedQuestions = async (userId: string): Promise<SuggestedQuestion[]> => {
    try {
        return getMockSuggestions();
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        return getMockSuggestions();
    }
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
        style={{ minWidth: 300 }} // or whatever width you prefer
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

    const scrollViewRef = useRef<ScrollView>(null);
    const USER_ID = 'user123';

    useEffect(() => {
        const loadQuestions = async (): Promise<void> => {
            const questions = await fetchSuggestedQuestions(USER_ID);
            setSuggestedQuestions(questions);
        };
        loadQuestions();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

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

        try {
            const response = await sendMessageToAPI(USER_ID, text, messages);

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
            console.error('Failed to send message:', error);
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
            <View className="flex-row items-center justify-between px-4 py-3 ">
                <TouchableOpacity className="" onPress={() => navigator.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View className='flex-row gap-2 '>
                    <Text className="text-white text-2xl font-bold">
                        Ask Face Coach
                    </Text>
                    <Ionicons name="chatbubble-ellipses" size={24} color="white" />

                </View>
                <View>

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
                <View className="px-4 py-4 ">
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