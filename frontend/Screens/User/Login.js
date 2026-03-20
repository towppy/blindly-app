import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import FormContainer from "../../Shared/FormContainer";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginUser, setCurrentUser } from "../../Context/Actions/Auth.actions";
import Input from "../../Shared/Input";
import Toast from "react-native-toast-message";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { Ionicons } from "@expo/vector-icons";
import styles, { COLORS } from "../../Shared/User/Login.styles";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { setJwt } from "../../assets/common/jwtStore";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const EXPO_PROXY_REDIRECT = "https://auth.expo.io/@towppy/frontend-expo";

const Login = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const revealAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (context.stateUser.isAuthenticated === true) {
            navigation.navigate("User Profile");
        }
    }, [context.stateUser.isAuthenticated]);

    useEffect(() => {
        Animated.timing(revealAnim, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [revealAnim]);

    const handleGoogleSignIn = async () => {
        setIsSubmitting(true);
        try {
            const returnUrl = Linking.createURL("expo-auth-session");
            const nonce = Math.random().toString(36).substring(2, 18);

            const googleAuthUrl =
                `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
                `&redirect_uri=${encodeURIComponent(EXPO_PROXY_REDIRECT)}` +
                `&response_type=id_token` +
                `&scope=${encodeURIComponent("openid profile email")}` +
                `&nonce=${nonce}` +
                `&prompt=select_account`;

            const proxyStartUrl =
                `${EXPO_PROXY_REDIRECT}/start?` +
                `authUrl=${encodeURIComponent(googleAuthUrl)}` +
                `&returnUrl=${encodeURIComponent(returnUrl)}`;

            const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);

            if (result.type === "success" && result.url) {
                const params = new URLSearchParams(
                    result.url.split("#")[1] || result.url.split("?")[1] || ""
                );
                const idToken = params.get("id_token");

                if (idToken) {
                    const res = await axios.post(`${baseURL}users/google-login`, { idToken });
                    const { token, user } = res.data;

                  await setJwt(token);
const decoded = jwtDecode(token);
context.dispatch(setCurrentUser(decoded, user));

Toast.show({ topOffset: 60, type: "success", text1: "Google login successful", text2: "You are now signed in" });
                } else {
                    const errorMsg = params.get("error") || "No ID token received";
                    Toast.show({ topOffset: 60, type: "error", text1: "Google Sign-In Error", text2: errorMsg });
                }
            } else if (result.type === "cancel" || result.type === "dismiss") {
                console.log("Google Sign-In cancelled");
            }
        } catch (err) {
            console.error("Google Sign-In error:", err);
            Toast.show({ topOffset: 60, type: "error", text1: "Google sign-in failed", text2: err?.response?.data?.message || "Please try again" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = () => {
        if (!email || !password) {
            setError("Please fill in your credentials");
            return;
        }
        setError("");
        setIsSubmitting(true);
        loginUser({ email, password }, context.dispatch).finally(() => setIsSubmitting(false));
    };

    return (
        <FormContainer title="Login">
            <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                showToggle
                value={password}
                onChangeText={setPassword}
            />

            <Animated.View
                style={[
                    styles.formCard,
                    {
                        opacity: revealAnim,
                        transform: [{
                            translateY: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                        }],
                    },
                ]}
            >
            <View style={styles.buttonGroup}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {isSubmitting && (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Signing in…</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.loginBtn, isSubmitting && styles.loginBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="log-in-outline" size={18} color={COLORS.white} />
                    <Text style={styles.loginBtnText}>Login</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.googleBtn, isSubmitting && styles.googleBtnDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="logo-google" size={18} color="#DB4437" />
                    <Text style={styles.googleBtnText}>Sign in with Google</Text>
                </TouchableOpacity>
            </View>
            </Animated.View>

            <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Don't have an account yet?</Text>
                <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={() => navigation.navigate("Register")}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-add-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.registerBtnText}>Register</Text>
                </TouchableOpacity>
            </View>
        </FormContainer>
    );
};

export default Login;