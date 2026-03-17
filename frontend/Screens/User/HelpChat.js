import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";

function buildLocalFallback(input) {
    const text = String(input || "").toLowerCase();

    if (text.includes("order") || text.includes("track")) {
        return "I can help with order tracking. Open My Orders, select your latest order, then check the status timeline and details. If it looks delayed, share the order ID.";
    }
    if (text.includes("voucher") || text.includes("discount") || text.includes("promo")) {
        return "Claim vouchers on Home, then apply eligible claimed vouchers during Checkout. Check expiry and category rules if it does not apply.";
    }
    if (text.includes("payment") || text.includes("pay") || text.includes("checkout")) {
        return "At checkout, confirm full delivery details, choose payment method, then place the order. If payment fails, retry on stable internet and avoid duplicate orders.";
    }
    if (text.includes("cancel") || text.includes("refund") || text.includes("return")) {
        return "Cancellation or refund depends on current order status. Open order details in My Orders to check available actions.";
    }
    if (text.includes("login") || text.includes("account") || text.includes("password")) {
        return "For account and app settings, go to User Profile. You can update delivery details, phone, password, and other account settings there.";
    }

    return "I am focused on order and system support: orders, vouchers, checkout, payments, account/profile, and app notification issues. Ask with details so I can give exact steps.";
}

const QUICK_PROMPTS = [
    "Track my latest order",
    "Voucher is not applying",
    "Update my delivery details",
    "Payment failed at checkout",
];

function getLocalSuggestions(input) {
    const text = String(input || "").toLowerCase();
    if (text.includes("order") || text.includes("track") || text.includes("status")) {
        return [
            "How do I find my order ID?",
            "What does shipped mean?",
            "What if my order is delayed?",
        ];
    }
    if (text.includes("voucher") || text.includes("discount") || text.includes("promo")) {
        return [
            "Where can I claim vouchers?",
            "Do vouchers expire?",
            "Why is voucher not eligible?",
        ];
    }
    if (text.includes("payment") || text.includes("checkout")) {
        return [
            "What payment methods can I use?",
            "How to avoid duplicate orders?",
            "What to check before checkout?",
        ];
    }
    return QUICK_PROMPTS;
}

const HelpChat = () => {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeSuggestions, setActiveSuggestions] = useState(QUICK_PROMPTS);
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            from: "bot",
            text: "Hello. I am Blindly Support Chatbot for order and system concerns. I can help with order tracking, checkout, vouchers, payment, account/profile, and app notification issues.",
            source: "support",
        },
    ]);

    const canSend = useMemo(() => input.trim().length > 0, [input]);

    const sendMessage = async (prefill) => {
        const trimmed = String(prefill || input).trim();
        if (!trimmed) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            from: "user",
            text: trimmed,
        };

        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInput("");
        setIsTyping(true);

        const history = nextMessages
            .filter((m) => m.from === "user" || m.from === "bot")
            .slice(-10)
            .map((m) => ({
                role: m.from === "user" ? "user" : "assistant",
                content: m.text,
            }));

        try {
            const token = await getJwt();
            const res = await axios.post(
                `${baseURL}notifications/chat-assistant`,
                { message: trimmed, history },
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }
            );

            const botMessage = {
                id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                from: "bot",
                text: res?.data?.reply || buildLocalFallback(trimmed),
                source: res?.data?.source || "fallback",
            };

            setMessages((prev) => [...prev, botMessage]);
            if (Array.isArray(res?.data?.suggestions) && res.data.suggestions.length > 0) {
                setActiveSuggestions(res.data.suggestions.slice(0, 4));
            } else {
                setActiveSuggestions(getLocalSuggestions(trimmed));
            }
        } catch (_e) {
            const botMessage = {
                id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                from: "bot",
                text: buildLocalFallback(trimmed),
                source: "fallback",
            };
            setMessages((prev) => [...prev, botMessage]);
            setActiveSuggestions(getLocalSuggestions(trimmed));
        } finally {
            setIsTyping(false);
        }
    };

    const renderQuickPrompt = ({ item }) => (
        <TouchableOpacity style={styles.quickChip} onPress={() => sendMessage(item)}>
            <Text style={styles.quickChipText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
                <View style={styles.quickWrap}>
                    <Text style={styles.quickTitle}>Try asking:</Text>
                    <FlatList
                        horizontal
                        data={activeSuggestions}
                        keyExtractor={(item) => item}
                        renderItem={renderQuickPrompt}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isUser = item.from === "user";
                    return (
                            <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                            <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.text}</Text>
                                {!isUser && item.source ? (
                                    <Text style={styles.sourceText}>{item.source === "openai" ? "AI Support" : "Smart Support"}</Text>
                                ) : null}
                        </View>
                    );
                }}
            />

                {isTyping ? (
                    <View style={styles.typingRow}>
                        <ActivityIndicator size="small" color="#7c3aed" />
                        <Text style={styles.typingText}>Assistant is typing...</Text>
                    </View>
                ) : null}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask about orders or system issues..."
                    placeholderTextColor="#9b8ec4"
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                        onPress={() => sendMessage()}
                    disabled={!canSend}
                >
                    <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#faf9f7",
    },
    quickWrap: {
        paddingTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 2,
    },
    quickTitle: {
        marginBottom: 8,
        color: "#5d4c8a",
        fontSize: 12,
        fontWeight: "700",
    },
    quickChip: {
        backgroundColor: "#f0ecfb",
        borderWidth: 1,
        borderColor: "#ddd3f3",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    quickChipText: {
        color: "#5b3ea8",
        fontSize: 12,
        fontWeight: "600",
    },
    listContent: {
        padding: 12,
        paddingBottom: 20,
    },
    bubble: {
        maxWidth: "85%",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
    },
    botBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#ede9f8",
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#7c3aed",
    },
    bubbleText: {
        color: "#2d1f52",
        fontSize: 14,
    },
    userBubbleText: {
        color: "#fff",
    },
    sourceText: {
        marginTop: 6,
        fontSize: 10,
        color: "#8a7bb8",
        fontWeight: "700",
    },
    typingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingBottom: 8,
        gap: 8,
    },
    typingText: {
        color: "#7c6aaa",
        fontSize: 12,
        fontWeight: "600",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "#ece7f8",
        backgroundColor: "#fff",
        gap: 8,
    },
    input: {
        flex: 1,
        maxHeight: 90,
        borderWidth: 1,
        borderColor: "#ddd3f3",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: "#2d1f52",
    },
    sendBtn: {
        backgroundColor: "#7c3aed",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        backgroundColor: "#b8abd8",
    },
});

export default HelpChat;
