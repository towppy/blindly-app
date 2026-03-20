import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import FormContainer from "../../Shared/FormContainer";
import Input from "../../Shared/Input";
import baseURL from "../../assets/common/baseurl";

const VerifyEmail = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const initialEmail = useMemo(() => String(route.params?.email || "").toLowerCase(), [route.params?.email]);
    const [email, setEmail] = useState(initialEmail);
    const [isResending, setIsResending] = useState(false);
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
        }).start();
    }, [cardAnim]);

    const handleResend = async () => {
        if (!email) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Email is required",
                text2: "Enter the account email to resend verification.",
            });
            return;
        }

        setIsResending(true);
        try {
            const res = await axios.post(`${baseURL}users/resend-verification`, {
                email: String(email).trim().toLowerCase(),
            });
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: "Verification email sent",
                text2: res?.data?.message || "Please check your inbox.",
            });
            setTimeout(() => navigation.navigate("Login"), 700);
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to resend",
                text2: error?.response?.data?.message || "Please try again.",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <FormContainer title="Verify Email">
            <Animated.View
                style={[
                    styles.card,
                    {
                        opacity: cardAnim,
                        transform: [
                            {
                                translateY: cardAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [14, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <View style={styles.heroIconWrap}>
                    <Ionicons name="mail-open-outline" size={22} color="#7c3aed" />
                </View>
                <Text style={styles.helperText}>Check your inbox for the verify link, then come back and log in.</Text>

                <Input
                    label="Email"
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(v) => setEmail(v.toLowerCase())}
                />

                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={[styles.secondaryBtn, isResending && styles.btnDisabled]}
                        onPress={handleResend}
                        disabled={isResending}
                        activeOpacity={0.85}
                    >
                        {isResending ? (
                            <ActivityIndicator color="#7c3aed" size="small" />
                        ) : (
                            <>
                                <Ionicons name="mail-outline" size={18} color="#7c3aed" />
                                <Text style={styles.secondaryBtnText}>Resend verification email</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate("Login")} activeOpacity={0.85}>
                        <Text style={styles.linkBtnText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </FormContainer>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e9d5ff",
        padding: 14,
        backgroundColor: "#ffffff",
        shadowColor: "#5b21b6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    heroIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ecfdf5",
        borderWidth: 1,
        borderColor: "#a7f3d0",
        marginBottom: 10,
    },
    helperText: {
        color: "#473a72",
        marginBottom: 10,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "600",
    },
    buttonGroup: {
        marginTop: 6,
        gap: 10,
    },
    secondaryBtn: {
        borderWidth: 1,
        borderColor: "#d7ccf5",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        backgroundColor: "#f5f2ff",
    },
    secondaryBtnText: {
        color: "#7c3aed",
        fontWeight: "700",
        fontSize: 14,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    linkBtn: {
        alignItems: "center",
        paddingVertical: 4,
    },
    linkBtnText: {
        color: "#7c3aed",
        fontSize: 13,
        fontWeight: "700",
    },
});

export default VerifyEmail;
