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
import { Ionicons } from "@expo/vector-icons";
import mime from "mime";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import styles, { COLORS } from "../../Shared/User/Register.styles";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { jwtDecode } from "jwt-decode";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const EXPO_PROXY_REDIRECT = "https://auth.expo.io/@towppy/frontend-expo";

const Register = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [image, setImage] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            await Location.getCurrentPositionAsync({});
        })();
    }, []);

    const handleGoogleSignUp = async () => {
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
                  //  const decoded = jwtDecode(idToken);
                  //  const { sub: googleId, email: googleEmail, name: googleName, picture: googlePhoto } = decoded;

                    await axios.post(`${baseURL}users/google-login`, {
    idToken,  // backend needs the raw token, not the decoded fields
});

                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Google account registered",
                        text2: "You are now signed in",
                    });
                    setTimeout(() => navigation.navigate("Login"), 500);
                } else {
                    const errorMsg = params.get("error") || "No ID token received";
                    Toast.show({ topOffset: 60, type: "error", text1: "Google Sign-In Error", text2: errorMsg });
                }
            } else if (result.type === "cancel" || result.type === "dismiss") {
                console.log("Google Sign-Up cancelled by user");
            }
        } catch (err) {
            console.error("Google Sign-Up error:", err);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Google sign-up failed",
                text2: err?.response?.data?.message || err.message || "Please try again",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const takePhoto = async () => {
        try {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.status === "granted") {
                let result = await ImagePicker.launchCameraAsync({ 
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3], 
                    quality: 1 
                });
                if (!result.canceled) {
                    setMainImage(result.assets[0].uri);
                    setImage(result.assets[0].uri);
                }
            } else {
                Alert.alert("Permission Required", "Camera permission is needed to take photos");
            }
        } catch (error) {
            console.error("Error taking photo:", error);
            Alert.alert("Error", "Failed to take photo");
        }
    };

    const pickImage = async () => {
        try {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (galleryPermission.status === "granted") {
                let result = await ImagePicker.launchImageLibraryAsync({ 
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3], 
                    quality: 1 
                });
                if (!result.canceled) {
                    setMainImage(result.assets[0].uri);
                    setImage(result.assets[0].uri);
                }
            } else {
                Alert.alert("Permission Required", "Gallery permission is needed to select photos");
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
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
            const filename = image.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            
            formData.append("image", {
                uri: image,
                name: filename,
                type
            });
        }

        axios
            .post(`${baseURL}users/register`, formData, { 
                headers: { 
                    "Content-Type": "multipart/form-data" 
                } 
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    Toast.show({ 
                        topOffset: 60, 
                        type: "success", 
                        text1: "Account created!", 
                        text2: "Please login to continue" 
                    });
                    setTimeout(() => navigation.navigate("Login"), 500);
                }
            })
            .catch((err) => {
                const status = err?.response?.status;
                const message = err?.response?.data?.message || "";
                if (status === 409 || message.toLowerCase().includes("email already")) {
                    Toast.show({ 
                        topOffset: 60, 
                        type: "error", 
                        text1: "Email already taken", 
                        text2: "Please use a different email" 
                    });
                } else {
                    Toast.show({ 
                        topOffset: 60, 
                        type: "error", 
                        text1: "Something went wrong", 
                        text2: "Please try again" 
                    });
                }
                console.log(err);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <KeyboardAwareScrollView viewIsInsideTabBar extraHeight={200} enableOnAndroid>
            <FormContainer title="Register">

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

                <Input 
                    label="Email"        
                    placeholder="Enter your email"       
                    autoCapitalize="none" 
                    keyboardType="email-address" 
                    onChangeText={(t) => setEmail(t.toLowerCase())} 
                    value={email}
                />
                <Input 
                    label="Full Name"    
                    placeholder="Enter your name"        
                    onChangeText={setName} 
                    value={name}
                />
                <Input 
                    label="Phone Number" 
                    placeholder="11-digit phone number"  
                    keyboardType="numeric" 
                    onChangeText={setPhone} 
                    value={phone}
                    maxLength={11}
                />
                <Input 
                    label="Password"     
                    placeholder="Create a password"      
                    secureTextEntry 
                    showToggle 
                    onChangeText={setPassword} 
                    value={password}
                />

                <View style={styles.buttonGroup}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    {isSubmitting && (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Registering…</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.registerBtn, isSubmitting && styles.registerBtnDisabled]}
                    onPress={register}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
                    <Text style={styles.registerBtnText}>Create Account</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                    style={[styles.googleBtn, isSubmitting && styles.googleBtnDisabled]}
                    onPress={handleGoogleSignUp}
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