import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Button,
    ActivityIndicator,
    Alert,
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

const Register = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [image, setImage] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();

    const takePhoto = async () => {
        const c = await ImagePicker.requestCameraPermissionsAsync();
        if (c.status === "granted") {
            let result = await ImagePicker.launchCameraAsync({
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled) {
                setMainImage(result.assets[0].uri);
                setImage(result.assets[0].uri);
            }
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            "Profile Photo",
            "Choose an option",
            [
                { text: "Take Photo", onPress: takePhoto },
                { text: "Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const register = () => {
        if (email === "" || name === "" || phone === "" || password === "") {
            setError("Please fill in the form correctly");
            return;
        }

        // Email must contain @ and .com
        if (!email.includes("@") || !email.includes(".com")) {
            setError("Please enter a valid email address (must contain @ and .com)");
            return;
        }

        // Phone must be exactly 11 digits
        if (!/^\d{11}$/.test(phone)) {
            setError("Phone number must be exactly 11 digits");
            return;
        }

        setError("");
        setIsSubmitting(true);

        let formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("phone", phone);
        formData.append("isAdmin", false);

        if (image) {
            const newImageUri = "file:///" + image.split("file:/").join("");
            formData.append("image", {
                uri: newImageUri,
                type: mime.getType(newImageUri),
                name: newImageUri.split("/").pop(),
            });
        }

        const config = {
            headers: { "Content-Type": "multipart/form-data" },
        };

        axios
            .post(`${baseURL}users/register`, formData, config)
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Account created successfully",
                        text2: "Please login into your account",
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
                        text2: "Please use a different email address",
                    });
                } else {
                    Toast.show({
                        position: "bottom",
                        bottomOffset: 20,
                        type: "error",
                        text1: "Something went wrong",
                        text2: "Please try again",
                    });
                }
                console.log(err);
            })
            .finally(() => setIsSubmitting(false));
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setMainImage(result.assets[0].uri);
        }
    };

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            if (id_token) {
                setIsSubmitting(true);
                axios.post(`${baseURL}users/google-login`, { idToken: id_token })
                    .then((res) => {
                        Toast.show({
                            topOffset: 60,
                            type: "success",
                            text1: "Google account registered",
                            text2: "You are now signed in",
                        });
                        setTimeout(() => navigation.navigate("Login"), 500);
                    })
                    .catch((err) => {
                        Toast.show({
                            position: "bottom",
                            bottomOffset: 20,
                            type: "error",
                            text1: "Google sign-in failed",
                            text2: "Please try again",
                        });
                        console.log(err);
                    })
                    .finally(() => setIsSubmitting(false));
            }
        }
    }, [response]);

    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === "granted");
        })();
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                setErrorMsg("Permission to access location was denied");
                return;
            }
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
        })();
    }, []);

    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
        >
            <FormContainer title="Register">
                <View style={styles.imageContainer}>
                    <Image
                        style={styles.image}
                        source={mainImage ? { uri: mainImage } : null}
                    />
                    <TouchableOpacity onPress={showImageOptions} style={styles.imagePicker}>
                        <Ionicons name="camera" style={{ color: "white" }} />
                    </TouchableOpacity>
                </View>
                <Input
                    label="Email"
                    placeholder="Enter your email"
                    name="email"
                    id="email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={(text) => setEmail(text.toLowerCase())}
                />
                <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    name="name"
                    id="name"
                    onChangeText={(text) => setName(text)}
                />
                <Input
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    name="phone"
                    id="phone"
                    keyboardType="numeric"
                    onChangeText={(text) => setPhone(text)}
                />
                <Input
                    label="Password"
                    placeholder="Create a password"
                    name="password"
                    id="password"
                    secureTextEntry={true}
                    showToggle={true}
                    onChangeText={(text) => setPassword(text)}
                />
                <View style={styles.buttonGroup}>
                    {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
                    {isSubmitting ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" />
                            <Text style={styles.loadingText}>Registering...</Text>
                        </View>
                    ) : null}
                </View>
                <View>
                    <Button title="Register" onPress={() => register()} disabled={isSubmitting} />
                </View>
                <View style={styles.buttonGroup}>
                    <Button
                        title="Sign Up with Google"
                        onPress={() => promptAsync()}
                        disabled={isSubmitting}
                    />
                </View>
            </FormContainer>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    buttonGroup: {
        width: "80%",
        margin: 10,
        alignItems: "center",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: "#333",
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderWidth: 3,
        padding: 0,
        justifyContent: "center",
        borderRadius: 60,
        borderColor: "#ddd",
        elevation: 4,
        marginBottom: 16,
        backgroundColor: "#f0f0f0",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
    },
    imagePicker: {
        position: "absolute",
        right: 2,
        bottom: 2,
        backgroundColor: "#1976d2",
        padding: 8,
        borderRadius: 20,
        elevation: 6,
    },
});

export default Register;
