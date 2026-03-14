import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet, Button, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import FormContainer from "../../Shared/FormContainer";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { loginUser } from "../../Context/Actions/Auth.actions";
import Input from "../../Shared/Input";
import * as Google from 'expo-auth-session/providers/google';
import Toast from "react-native-toast-message";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";

const Login = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const handleSubmit = () => {
        const user = { email, password };
        if (email === "" || password === "") {
            setError("Please fill in your credentials");
        } else {
            setError("");
            setIsSubmitting(true);
            loginUser(user, context.dispatch).finally(() => setIsSubmitting(false));
        }
    };

    useEffect(() => {
        if (context.stateUser.isAuthenticated === true) {
            navigation.navigate("User Profile");
        }
    }, [context.stateUser.isAuthenticated]);

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                setIsSubmitting(true);
                axios.post(`${baseURL}users/google-login`, { idToken: id_token })
                    .then((res) => {
                        Toast.show({
                            topOffset: 60,
                            type: 'success',
                            text1: 'Google login successful',
                            text2: 'You are now signed in',
                        });
                        // You may want to dispatch loginUser here with the returned token
                        // or navigate to the profile screen
                    })
                    .catch((err) => {
                        Toast.show({
                            position: 'bottom',
                            bottomOffset: 20,
                            type: 'error',
                            text1: 'Google sign-in failed',
                            text2: 'Please try again',
                        });
                        console.log(err);
                    })
                    .finally(() => setIsSubmitting(false));
            }
        }
    }, [response]);

    return (
        <FormContainer title="Login">
            <Input
                label="Email"
                placeholder="Enter your email"
                name="email"
                id="email"
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Input
                label="Password"
                placeholder="Enter your password"
                name="password"
                id="password"
                secureTextEntry={true}
                showToggle={true}
                value={password}
                onChangeText={(text) => setPassword(text)}
            />
            <View style={styles.buttonGroup}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {isSubmitting ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" />
                        <Text style={styles.loadingText}>Signing in...</Text>
                    </View>
                ) : null}
                <Button title="Login" onPress={() => handleSubmit()} disabled={isSubmitting} />
            </View>
            <View style={styles.buttonGroup}>
                <Button
                    title="Sign In with Google"
                    onPress={() => promptAsync()}
                    disabled={isSubmitting}
                />
            </View>
            <View style={styles.buttonGroup}>
                <Text style={styles.middleText}>Don't have an account yet?</Text>
                <Button
                    title="Register"
                    onPress={() => navigation.navigate("Register")}
                />
            </View>
        </FormContainer>
    );
};

const styles = StyleSheet.create({
    buttonGroup: {
        width: "80%",
        alignItems: "center",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: "#333",
    },
    errorText: {
        color: "#d32f2f",
        marginBottom: 8,
        fontWeight: "600",
    },
    middleText: {
        marginBottom: 20,
        alignSelf: "center",
        color: "#333",
        fontSize: 14,
    },
});

export default Login;
