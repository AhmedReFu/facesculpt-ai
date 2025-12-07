import { IPA_BASE } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
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

const getMockSuggestions = (): SuggestedQuestion[] => [
    { id: '1', text: 'Why is my jawline puffy today?' },
    { id: '2', text: 'How often should I do lymph drainage?' },
    { id: '3', text: 'When should I rescan my face?' },
    { id: '4', text: 'Best exercises for jawline definition?' }
];

const FaceCoach: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<FaceCoachScreenRouteProp>();
    const token = route.params?.token;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Animation setup for three dots
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    const startTypingAnimation = () => {
        const createAnimation = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: -5,
                        duration: 300,
                        delay,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ])
            );
        Animated.parallel([
            createAnimation(dot1, 0),
            createAnimation(dot2, 150),
            createAnimation(dot3, 300),
        ]).start();
    };

    const stopTypingAnimation = () => {
        dot1.stopAnimation();
        dot2.stopAnimation();
        dot3.stopAnimation();
    };

    useEffect(() => {
        if (isTyping) startTypingAnimation();
        else stopTypingAnimation();
    }, [isTyping]);

    // Keyboard listeners
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
                if (flatListRef.current && messages.length > 0) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, [messages]);

    // Auto scroll on new messages
    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
        }
    }, [messages]);

    // WebSocket initialization
    const initiateWebSocket = (token: string) => {
        if (!token) {
            console.log("No token provided");
            setIsLoadingHistory(false);
            return;
        }

        let cleanBase = IPA_BASE.replace(/^(https?:\/\/)/, '').replace(/\/+$/, '');
        const wsProtocol = cleanBase.includes('localhost') || cleanBase.includes('127.0.0.1') ||
            cleanBase.includes('206.162.244.133') || cleanBase.includes('192.168')
            ? 'ws' : 'wss';

        const WS_URL = `${wsProtocol}://${cleanBase}/ws/chat/?token=${token}`;
        console.log("Connecting to WebSocket:", WS_URL);

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
            console.log("✅ FaceCoach WebSocket connected");
            setIsConnected(true);
        };

        wsRef.current.onmessage = (e) => {
            try {
                console.log("📨 WebSocket Raw Data:", e.data);
                const data = JSON.parse(e.data);
                console.log("📦 Parsed Data:", JSON.stringify(data, null, 2));

                // Handle initial chat history: type="history", messages=[...]
                if (data.type === "history" && data.messages && Array.isArray(data.messages)) {
                    console.log(`✅ Received history with ${data.messages.length} messages`);

                    const historyMessages = data.messages.map((item: any, idx: number) => {
                        const isUserMessage = item.sender === "USER";
                        console.log(`Message ${idx}: sender=${item.sender}, isUser=${isUserMessage}`);

                        return {
                            id: `msg-${item.created_at}-${idx}`,
                            text: item.message,
                            isUser: isUserMessage,
                            timestamp: new Date(item.created_at),
                        };
                    });

                    console.log("✅ Setting messages:", historyMessages.length);
                    setMessages(historyMessages);
                    setIsLoadingHistory(false);
                    setIsTyping(false);
                }
                // Handle real-time messages (AI responses)
                else if (data.sender && data.message) {
                    console.log("💬 Real-time message received:", data.sender);

                    // Only add AI messages here (user messages already added in sendMessage)
                    if (data.sender === "AI") {
                        const newMessage: Message = {
                            id: `msg-${Date.now()}-${Math.random()}`,
                            text: data.message,
                            isUser: false,
                            timestamp: new Date(data.created_at || new Date()),
                        };

                        setMessages(prev => [...prev, newMessage]);
                        setIsTyping(false);
                    }
                }
                // Fallback: try to handle any AI message
                else if (data.message) {
                    console.log("📩 Generic AI message received");

                    const newMessage: Message = {
                        id: `msg-${Date.now()}-${Math.random()}`,
                        text: data.message,
                        isUser: false,
                        timestamp: new Date(),
                    };

                    setMessages(prev => [...prev, newMessage]);
                    setIsTyping(false);
                }
                else {
                    console.log("⚠️ Unexpected data format:", data);
                    setIsTyping(false);
                }
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
                console.error('Raw data was:', e.data);
                setIsTyping(false);
                setIsLoadingHistory(false);
            }
        };

        wsRef.current.onclose = (event) => {
            console.log("❌ WebSocket disconnected:", event.code, event.reason);
            setIsConnected(false);
            setIsLoadingHistory(false);
        };

        wsRef.current.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            setIsConnected(false);
            setIsLoadingHistory(false);
        };
    };

    useEffect(() => {
        if (token) {
            initiateWebSocket(token);
        } else {
            console.log("⚠️ No token available");
            setIsLoadingHistory(false);
        }

        return () => {
            if (wsRef.current) {
                console.log("🔌 Closing WebSocket connection");
                wsRef.current.close();
            }
        };
    }, [token]);

    const sendMessage = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN && inputText.trim()) {
            const messageText = inputText.trim();
            console.log("📤 Sending message:", messageText);

            // Immediately add user message to UI
            const userMessage: Message = {
                id: `msg-${Date.now()}-user`,
                text: messageText,
                isUser: true,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);

            // Clear input and show typing indicator
            setInputText('');
            setIsTyping(true);

            // Send to server
            const payload = JSON.stringify({
                message: messageText,
            });

            wsRef.current.send(payload);
        } else {
            console.log("⚠️ Cannot send - WebSocket not open or empty message");
        }
    };

    const handleSuggestedQuestion = (text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && text.trim()) {
            console.log("📤 Sending suggested question:", text);

            // Immediately add user message to UI
            const userMessage: Message = {
                id: `msg-${Date.now()}-user`,
                text: text,
                isUser: true,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);

            // Show typing indicator
            setIsTyping(true);

            // Send to server
            const payload = JSON.stringify({
                message: text.trim(),
            });

            wsRef.current.send(payload);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View className={`mb-3 ${item.isUser ? 'items-end' : 'items-start'}`}>
            <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${item.isUser
                    ? 'bg-[#60A5FA] rounded-br-sm'
                    : 'bg-[#374151] rounded-bl-sm'
                    }`}
            >
                <Text className="text-white text-[15px] leading-relaxed">
                    {item.text}
                </Text>
            </View>
        </View>
    );

    const renderTypingIndicator = () => (
        <View className="mb-3 items-start">
            <View className="max-w-[80%] bg-[#374151] rounded-2xl rounded-bl-sm px-4 py-3 flex-row space-x-1">
                <Animated.View
                    style={{ transform: [{ translateY: dot1 }] }}
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                />
                <Animated.View
                    style={{ transform: [{ translateY: dot2 }] }}
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                />
                <Animated.View
                    style={{ transform: [{ translateY: dot3 }] }}
                    className="w-2 h-2 bg-gray-400 rounded-full mx-1"
                />
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <SafeAreaView className="flex-1 bg-[#0D0F14]" edges={['top']}>
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

                {/* Suggested Questions - Always show when not loading */}
                {!isLoadingHistory && (
                    <View className="py-3 border-b border-gray-800">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                        >
                            {getMockSuggestions().map((question) => (
                                <TouchableOpacity
                                    key={question.id}
                                    onPress={() => handleSuggestedQuestion(question.text)}
                                    className="bg-transparent border border-gray-600 rounded-full px-4 py-2.5 mr-2"
                                >
                                    <Text className="text-gray-300 text-base">{question.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Loading History State */}
                {isLoadingHistory ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#60A5FA" />
                        <Text className="text-gray-400 mt-3 text-base">Loading conversation...</Text>
                    </View>
                ) : messages.length === 0 ? (
                    /* Empty State - Show default welcome message */
                    <View className="flex-1 px-4 pt-4">
                        <View className="mb-3 items-start">
                            <View className="max-w-[80%] bg-[#374151] rounded-2xl rounded-bl-sm px-4 py-3">
                                <Text className="text-white text-[15px] leading-relaxed">
                                    Hi! I'm FaceCoach. Ask me anything about your routine or scans.
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    /* Messages List */
                    <FlatList
                        data={isTyping ? [...messages, { id: 'typing', text: '', isUser: false, timestamp: new Date() }] : messages}
                        ref={flatListRef}
                        renderItem={({ item }) =>
                            item.id === 'typing' ? renderTypingIndicator() : renderMessage({ item })
                        }
                        keyExtractor={(item) => item.id}
                        className="flex-1"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                                keyboardShouldPersistTaps="handled"
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                )}

                {/* Input Area */}
                <View
                    className="bg-[#0D0F14] px-4 py-3 border-t border-gray-800 mb-8"
                    style={{ paddingBottom: Platform.OS === 'android' ? keyboardHeight : 15 }}
                >
                    <View className="flex-row items-center bg-[#1F2937] rounded-full px-4 py-2 border border-gray-700">
                        <TextInput
                            className="flex-1 text-white text-base py-2"
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type your question..."
                            placeholderTextColor="#6B7280"
                            multiline
                            maxLength={500}
                            editable={isConnected && !isTyping}
                            onSubmitEditing={sendMessage}
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={!inputText.trim() || isTyping || !isConnected}
                            className={`ml-2 rounded-full p-2.5 ${!inputText.trim() || isTyping || !isConnected
                                ? 'bg-gray-600'
                                : 'bg-[#60A5FA]'
                                }`}
                        >
                            {isTyping ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="send" size={18} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default FaceCoach;