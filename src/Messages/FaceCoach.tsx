import { Ionicons } from '@expo/vector-icons';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

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
// API SERVICE
// ============================================
class FaceCoachApiService {
    private BASE_URL = 'https://your-backend.com/api/facecoach';
    private TIMEOUT = 30000; // 30 seconds for AI responses

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        try {
            const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer your-token-here',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Send message to FaceCoach AI
    async sendMessage(userId: string, message: string, conversationHistory: Message[]): Promise<ChatResponse> {
        try {
            const response = await this.makeRequest('/chat', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    message,
                    history: conversationHistory.slice(-10).map(msg => ({
                        text: msg.text,
                        isUser: msg.isUser
                    }))
                }),
            });
            return response;
        } catch (error) {
            console.warn('Using mock AI response due to API error');
            return this.getMockResponse(message);
        }
    }

    // Get suggested questions
    async getSuggestedQuestions(userId: string): Promise<SuggestedQuestion[]> {
        try {
            const response = await this.makeRequest(`/suggestions?userId=${userId}`);
            return response.questions;
        } catch (error) {
            console.warn('Using mock suggestions due to API error');
            return this.getMockSuggestions();
        }
    }

    // Rate response quality
    async rateResponse(userId: string, messageId: string, rating: number): Promise<void> {
        try {
            await this.makeRequest('/rate', {
                method: 'POST',
                body: JSON.stringify({ userId, messageId, rating }),
            });
        } catch (error) {
            console.warn('Rating submission failed');
        }
    }

    // Mock responses for development
    private getMockResponse(message: string): ChatResponse {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('puff') || lowerMessage.includes('swell')) {
            return {
                answer: "Focus on posture, tongue posture, and short resistance drills. Keep reps controlled; avoid jaw clenching. Puffiness can be caused by fluid retention, so make sure you're staying hydrated and reducing sodium intake.",
                suggestions: [
                    "How to reduce puffiness quickly?",
                    "Best exercises for jawline definition?",
                    "When will I see results?"
                ]
            };
        } else if (lowerMessage.includes('lymph') || lowerMessage.includes('drainage')) {
            return {
                answer: "Try gentle lymphatic drainage to reduce puffiness. Stay hydrated and avoid excess salt. I recommend doing lymphatic massage 2-3 times per day, especially in the morning and before bed. Use gentle upward strokes from the neck to the jawline.",
                suggestions: [
                    "Show me lymphatic massage technique",
                    "What causes lymphatic buildup?",
                    "Diet tips for reducing puffiness"
                ]
            };
        } else if (lowerMessage.includes('rescan') || lowerMessage.includes('scan')) {
            return {
                answer: "For accurate progress tracking, I recommend rescanning your face every 2 weeks. Make sure to scan at the same time of day under consistent lighting conditions. Avoid scanning right after exercise or when you're puffy.",
                suggestions: [
                    "How to get the best scan results?",
                    "What time of day is best for scanning?",
                    "My scan results seem inconsistent"
                ]
            };
        } else if (lowerMessage.includes('jawline') || lowerMessage.includes('definition')) {
            return {
                answer: "Building jawline definition takes consistency with your exercises. Focus on proper form and gradual progression. Most users see noticeable improvements within 4-6 weeks with daily practice. Remember to combine exercises with good hydration and posture.",
                suggestions: [
                    "Best exercises for jawline?",
                    "How many reps should I do?",
                    "Why isn't my jawline improving?"
                ]
            };
        } else {
            return {
                answer: "Hi! I'm FaceCoach. I can help you with your facial exercise routine, progress tracking, scan results, and any questions about your journey to better facial structure and reduced puffiness. What would you like to know?",
                suggestions: [
                    "Why is my jawline puffy today?",
                    "How often should I do lymph drainage?",
                    "When should I rescan my face?",
                    "Best time to do facial exercises?"
                ]
            };
        }
    }

    private getMockSuggestions(): SuggestedQuestion[] {
        return [
            { id: '1', text: 'Why is my jawline puffy today?' },
            { id: '2', text: 'How often should I do lymph drainage?' },
            { id: '3', text: 'When should I rescan my face?' },
            { id: '4', text: 'Best exercises for jaw definition?' },
            { id: '5', text: 'How to reduce double chin?' },
            { id: '6', text: 'Why are my results slow?' },
        ];
    }
}

const apiService = new FaceCoachApiService();

// ============================================
// COMPONENTS
// ============================================
const MessageBubble = ({ message, onRate }: { message: Message; onRate?: (rating: number) => void }) => {
    const [showRating, setShowRating] = useState(false);

    return (
        <View style={tw`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}>
            <View
                style={[
                    tw`max-w-[80%] rounded-2xl px-4 py-3`,
                    message.isUser
                        ? tw`bg-[#60A5FA] rounded-br-none`
                        : tw`bg-[#1F2937] rounded-bl-none`,
                    message.isLoading && tw`opacity-70`,
                ]}
            >
                {message.isLoading ? (
                    <View style={tw`flex-row items-center`}>
                        <ActivityIndicator size="small" color="#60A5FA" />
                        <Text style={tw`text-white text-base ml-2`}>FaceCoach is typing...</Text>
                    </View>
                ) : (
                    <>
                        <Text style={tw`text-white text-base leading-6`}>{message.text}</Text>
                        <Text style={tw`text-gray-400 text-xs mt-1`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </>
                )}
            </View>

            {/* Rating buttons for AI messages */}
            {!message.isUser && !message.isLoading && onRate && (
                <TouchableOpacity
                    onPress={() => setShowRating(!showRating)}
                    style={tw`mt-2 flex-row items-center`}
                >
                    <Text style={tw`text-gray-500 text-xs`}>Rate this response</Text>
                    <Ionicons name="chevron-down" size={12} color="#6B7280" />
                </TouchableOpacity>
            )}

            {showRating && (
                <View style={tw`flex-row mt-2 space-x-2`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => {
                                onRate(star);
                                setShowRating(false);
                            }}
                        >
                            <Ionicons name="star" size={20} color="#F59E0B" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const SuggestedQuestionButton = ({
    question,
    onPress
}: {
    question: SuggestedQuestion;
    onPress: (text: string) => void;
}) => (
    <TouchableOpacity
        style={tw`bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 mr-3 mb-2`}
        onPress={() => onPress(question.text)}
    >
        <Text style={tw`text-gray-300 text-sm`}>{question.text}</Text>
    </TouchableOpacity>
);

// ============================================
// MAIN COMPONENT
// ============================================
const FaceCoach = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm FaceCoach. Ask me anything about your routine or scans.",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const scrollViewRef = useRef<ScrollView>(null);
    const userId = 'user123';

    // Load initial suggestions
    useEffect(() => {
        loadSuggestedQuestions();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const loadSuggestedQuestions = async () => {
        try {
            const questions = await apiService.getSuggestedQuestions(userId);
            setSuggestedQuestions(questions);
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Add loading message
        const loadingMessage: Message = {
            id: `loading-${Date.now()}`,
            text: '',
            isUser: false,
            timestamp: new Date(),
            isLoading: true,
        };
        setMessages(prev => [...prev, loadingMessage]);

        try {
            // Send to API
            const response = await apiService.sendMessage(userId, text, messages);

            // Remove loading message and add AI response
            setMessages(prev =>
                prev.filter(msg => !msg.isLoading)
                    .concat({
                        id: Date.now().toString(),
                        text: response.answer,
                        isUser: false,
                        timestamp: new Date(),
                    })
            );

            // Update suggestions if provided
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

            // Remove loading message and show error
            setMessages(prev =>
                prev.filter(msg => !msg.isLoading)
                    .concat({
                        id: Date.now().toString(),
                        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                        isUser: false,
                        timestamp: new Date(),
                    })
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateResponse = async (messageId: string, rating: number) => {
        try {
            await apiService.rateResponse(userId, messageId, rating);
            Alert.alert('Thank you!', 'Your feedback helps improve FaceCoach.');
        } catch (error) {
            console.error('Failed to submit rating:', error);
        }
    };

    const handleSuggestionPress = (text: string) => {
        sendMessage(text);
    };

    const handleSend = () => {
        sendMessage(inputText);
    };

    if (isInitializing) {
        return (
            <View style={tw`flex-1 bg-[#0D0F14] items-center justify-center`}>
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text style={tw`text-white text-base mt-4`}>Loading FaceCoach...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-[#0D0F14]`}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={tw`px-5 flex-row items-center justify-center gap-4 py-4 border-b border-gray-800`}>
                <Text style={tw`text-white text-2xl font-bold`}>Ask Face Coach</Text>
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />            </View>

            <KeyboardAvoidingView
                style={tw`flex-1`}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={tw`flex-1 px-5`}
                    contentContainerStyle={tw`py-4`}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onRate={!message.isUser ? (rating) => handleRateResponse(message.id, rating) : undefined}
                        />
                    ))}
                </ScrollView>

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                    <View style={tw`px-5 py-3 border-t border-gray-800`}>
                        <Text style={tw`text-gray-400 text-sm mb-3`}>Suggested questions:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={tw`flex-row`}>
                                {suggestedQuestions.map((question) => (
                                    <SuggestedQuestionButton
                                        key={question.id}
                                        question={question}
                                        onPress={handleSuggestionPress}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Input Area */}
                <View style={tw`px-5 py-4 border-t border-gray-800 bg-[#0D0F14]`}>
                    <View style={tw`flex-row items-center bg-[#1F2937] rounded-2xl px-4 py-3`}>
                        <TextInput
                            style={tw`flex-1 text-white text-base max-h-20`}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type your question..."
                            placeholderTextColor="#6B7280"
                            multiline
                            maxLength={500}
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={tw`ml-3 ${!inputText.trim() || isLoading ? 'opacity-50' : ''}`}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#60A5FA" />
                            ) : (
                                <Ionicons name="send" size={24} color="#60A5FA" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={tw`text-gray-500 text-xs text-center mt-2`}>
                        FaceCoach can help with exercises, progress, and scan questions
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default FaceCoach;