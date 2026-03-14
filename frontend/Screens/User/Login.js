import React, { useState, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import FormContainer from "../../Shared/FormContainer";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginUser } from "../../Context/Actions/Auth.actions";
import Input from "../../Shared/Input";
import * as Google from "expo-auth-session/providers/google";
import Toast from "react-native-toast-message";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { Ionicons } from "@expo/vector-icons";
import styles, { COLORS } from "../../Shared/User/Login.styles";

const Login = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId:   process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId:    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId:    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        if (context.stateUser.isAuthenticated === true) {
            navigation.navigate("User Profile");
        }
    }, [context.stateUser.isAuthenticated]);

    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            if (id_token) {
                setIsSubmitting(true);
                axios
                    .post(`${baseURL}users/google-login`, { idToken: id_token })
                    .then(() => {
                        Toast.show({ topOffset: 60, type: "success", text1: "Google login successful", text2: "You are now signed in" });
                    })
                    .catch((err) => {
                        console.log(err);
                        Toast.show({ topOffset: 60, type: "error", text1: "Google sign-in failed", text2: "Please try again" });
                    })
                    .finally(() => setIsSubmitting(false));
            }
        }
    }, [response]);

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
                    onPress={() => promptAsync()}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="logo-google" size={18} color="#DB4437" />
                    <Text style={styles.googleBtnText}>Sign in with Google</Text>
                </TouchableOpacity>
            </View>

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