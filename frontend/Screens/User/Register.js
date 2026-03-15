import React, { useState, useEffect } from "react";
import {
    View, Text, Image, TouchableOpacity,
    ActivityIndicator, Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import FormContainer from "../../Shared/FormContainer";
import Input from "../../Shared/Input";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import Toast from "react-native-toast-message";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";
import mime from "mime";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import styles, { COLORS } from "../../Shared/User/Register.styles";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const Register = () => {
    const [email, setEmail]         = useState("");
    const [name, setName]           = useState("");
    const [phone, setPhone]         = useState("");
    const [password, setPassword]   = useState("");
    const [error, setError]         = useState("");
    const [image, setImage]         = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();

    // Log your client ID to make sure it's loaded
    console.log("Google Client ID:", process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: makeRedirectUri({
            scheme: "exp", // This works with Expo Go
        }),
    });

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            await Location.getCurrentPositionAsync({});
        })();
    }, []);

    useEffect(() => {
        console.log("Google Response:", response);
        
        if (response?.type === "success") {
            console.log("Success! Params:", response.params);
            console.log("Authentication:", response.authentication);
            
            const { authentication } = response;
            
            if (authentication?.accessToken) {
                setIsSubmitting(true);
                
                // Get user info from Google
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${authentication.accessToken}` },
                })
                .then(userInfoResponse => userInfoResponse.json())
                .then(userInfo => {
                    console.log("Google User Info:", userInfo);
                    
                    // Send to your backend
                    return axios.post(`${baseURL}users/google-login`, {
                        email: userInfo.email,
                        name: userInfo.name,
                        googleId: userInfo.sub,
                        profilePicture: userInfo.picture,
                        idToken: authentication.idToken || authentication.accessToken
                    });
                })
                .then((res) => {
                    console.log("Backend response:", res.data);
                    Toast.show({ 
                        topOffset: 60, 
                        type: "success", 
                        text1: "Google account registered", 
                        text2: "You are now signed in" 
                    });
                    setTimeout(() => navigation.navigate("Login"), 500);
                })
                .catch((err) => {
                    console.log("Error details:", {
                        message: err.message,
                        response: err.response?.data,
                        status: err.response?.status
                    });
                    Toast.show({ 
                        topOffset: 60, 
                        type: "error", 
                        text1: "Google sign-in failed", 
                        text2: err?.response?.data?.message || "Please try again" 
                    });
                })
                .finally(() => setIsSubmitting(false));
            }
        } else if (response?.type === "error") {
            console.log("Google Auth Error:", response.error);
            Toast.show({ 
                topOffset: 60, 
                type: "error", 
                text1: "Google sign-in failed", 
                text2: response.error?.message || "Authentication failed" 
            });
        }
    }, [response]);

    const takePhoto = async () => {
        const c = await ImagePicker.requestCameraPermissionsAsync();
        if (c.status === "granted") {
            let result = await ImagePicker.launchCameraAsync({ aspect: [4, 3], quality: 1 });
            if (!result.canceled) {
                setMainImage(result.assets[0].uri);
                setImage(result.assets[0].uri);
            }
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 1,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setMainImage(result.assets[0].uri);
        }
    };

    const showImageOptions = () => {
        Alert.alert("Profile Photo", "Choose an option", [
            { text: "Take Photo", onPress: takePhoto },
            { text: "Choose from Gallery", onPress: pickImage },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const register = () => {
        if (!email || !name || !phone || !password) {
            setError("Please fill in the form correctly");
            return;
        }
        if (!email.includes("@") || !email.includes(".com")) {
            setError("Please enter a valid email address");
            return;
        }
        if (!/^\d{11}$/.test(phone)) {
            setError("Phone number must be exactly 11 digits");
            return;
        }
        setError("");
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("phone", phone);
        formData.append("isAdmin", false);

        if (image) {
            const uri = "file:///" + image.split("file:/").join("");
            formData.append("image", { uri, type: mime.getType(uri), name: uri.split("/").pop() });
        }

        axios
            .post(`${baseURL}users/register`, formData, { headers: { "Content-Type": "multipart/form-data" } })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    Toast.show({ topOffset: 60, type: "success", text1: "Account created!", text2: "Please login to continue" });
                    setTimeout(() => navigation.navigate("Login"), 500);
                }
            })
            .catch((err) => {
                const status = err?.response?.status;
                const message = err?.response?.data?.message || "";
                if (status === 409 || message.toLowerCase().includes("email already")) {
                    Toast.show({ topOffset: 60, type: "error", text1: "Email already taken", text2: "Please use a different email" });
                } else {
                    Toast.show({ topOffset: 60, type: "error", text1: "Something went wrong", text2: "Please try again" });
                }
                console.log(err);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <KeyboardAwareScrollView viewIsInsideTabBar extraHeight={200} enableOnAndroid>
            <FormContainer title="Register">

                {/* Avatar picker */}
                <View style={styles.imageContainer}>
                    {mainImage ? (
                        <Image source={{ uri: mainImage }} style={styles.image} />
                    ) : (
                        <Ionicons name="person-outline" size={40} color={COLORS.textSubtle} />
                    )}
                    <TouchableOpacity onPress={showImageOptions} style={styles.imagePicker} activeOpacity={0.85}>
                        <Ionicons name="camera" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                </View>

                <Input label="Email"         placeholder="Enter your email"         autoCapitalize="none" keyboardType="email-address" onChangeText={(t) => setEmail(t.toLowerCase())} />
                <Input label="Full Name"     placeholder="Enter your name"          onChangeText={setName} />
                <Input label="Phone Number"  placeholder="11-digit phone number"    keyboardType="numeric" onChangeText={setPhone} />
                <Input label="Password"      placeholder="Create a password"        secureTextEntry showToggle onChangeText={setPassword} />

                {/* Error + loading */}
                <View style={styles.buttonGroup}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    {isSubmitting && (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Registering…</Text>
                        </View>
                    )}
                </View>

                {/* Register button */}
                <TouchableOpacity
                    style={[styles.registerBtn, isSubmitting && styles.registerBtnDisabled]}
                    onPress={register}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
                    <Text style={styles.registerBtnText}>Create Account</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Google button */}
                <TouchableOpacity
                    style={[styles.googleBtn, isSubmitting && styles.googleBtnDisabled]}
                    onPress={() => {
                        console.log("Google button pressed");
                        promptAsync();
                    }}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="logo-google" size={18} color="#DB4437" />
                    <Text style={styles.googleBtnText}>Sign up with Google</Text>
                </TouchableOpacity>

            </FormContainer>
        </KeyboardAwareScrollView>
    );
};

export default Register;