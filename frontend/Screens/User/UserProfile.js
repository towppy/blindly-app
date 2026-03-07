import React, { useContext, useState, useCallback } from "react";
import { View, Text, ScrollView, Button, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { logoutUser } from "../../Context/Actions/Auth.actions";
import Input from "../../Shared/Input";
import Toast from "react-native-toast-message";
import AddressMapPicker from "../../Shared/AddressMapPicker";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UserProfile = () => {
    const context = useContext(AuthGlobal);
    const [userProfile, setUserProfile] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [deliveryAddress1, setDeliveryAddress1] = useState("");
    const [deliveryAddress2, setDeliveryAddress2] = useState("");
    const [deliveryCity, setDeliveryCity] = useState("");
    const [deliveryZip, setDeliveryZip] = useState("");
    const [deliveryCountry, setDeliveryCountry] = useState("Philippines");
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigation = useNavigation();
    const [image, setImage] = useState(null);

    // Change password state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const requiredProfileFields = {
        phone: String(phone || "").trim(),
        deliveryAddress1: String(deliveryAddress1 || "").trim(),
        deliveryCity: String(deliveryCity || "").trim(),
        deliveryZip: String(deliveryZip || "").trim(),
        deliveryCountry: String(deliveryCountry || "").trim(),
    };
    const missingRequiredFields = Object.entries(requiredProfileFields)
        .filter(([, value]) => !value)
        .map(([key]) => key);
    const isCheckoutReady = missingRequiredFields.length === 0;

    const hydrateProfileForm = (profile) => {
        setUserProfile(profile);
        setName(profile?.name || "");
        setPhone(profile?.phone || "");
        setImage(profile?.image || "");
        setDeliveryAddress1(profile?.deliveryAddress1 || "");
        setDeliveryAddress2(profile?.deliveryAddress2 || "");
        setDeliveryCity(profile?.deliveryCity || "");
        setDeliveryZip(profile?.deliveryZip || "");
        setDeliveryCountry(profile?.deliveryCountry || "Philippines");
        if (
            Number.isFinite(profile?.deliveryLocation?.latitude)
            && Number.isFinite(profile?.deliveryLocation?.longitude)
        ) {
            setDeliveryLocation({
                latitude: Number(profile.deliveryLocation.latitude),
                longitude: Number(profile.deliveryLocation.longitude),
            });
        } else {
            setDeliveryLocation(null);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (
                context.stateUser.isAuthenticated === false ||
                context.stateUser.isAuthenticated === null
            ) {
                navigation.navigate("User Landing");
                return;
            }
            getJwt()
                .then((res) => {
                    axios
                        .get(`${baseURL}users/${context.stateUser.user.userId}`, {
                            headers: { Authorization: `Bearer ${res}` },
                        })
                        .then((user) => hydrateProfileForm(user.data));
                })
                .catch((error) => console.log(error));
            return () => setUserProfile("");
        }, [context.stateUser.isAuthenticated])
    );

    const onMapPicked = (picked) => {
        setMapVisible(false);
        setDeliveryLocation(picked.coordinate);
        setDeliveryAddress1(picked.address1 || "");
        setDeliveryCity(picked.city || "");
        setDeliveryZip(picked.zip || "");
        setDeliveryCountry(picked.country || "Philippines");
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: "Location selected",
            text2: "Review details, then tap Save Profile",
        });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImage(uri);
            uploadProfileImage(uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== "granted") {
            Toast.show({ topOffset: 60, type: "error", text1: "Camera permission denied" });
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImage(uri);
            uploadProfileImage(uri);
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            "Change Profile Photo",
            "Choose an option",
            [
                { text: "Take Photo", onPress: takePhoto },
                { text: "Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const uploadProfileImage = async (uri) => {
        try {
            const jwt = await getJwt();
            if (!jwt) {
                Toast.show({ topOffset: 60, type: "error", text1: "Session expired" });
                return;
            }

            const formData = new FormData();
            const fileName = uri.split("/").pop();
            const fileType = fileName.split(".").pop();
            const mimeType = fileType === "jpg" || fileType === "jpeg" ? "image/jpeg" 
                : fileType === "png" ? "image/png" 
                : "image/jpeg";

            formData.append("image", {
                uri: uri,
                type: mimeType,
                name: fileName,
            });

            const response = await axios.put(`${baseURL}users/profile-photo`, formData, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setImage(response.data.image);
            Toast.show({ topOffset: 60, type: "success", text1: "Photo updated" });
        } catch (error) {
            console.error("Upload error:", error?.response?.data || error.message);
            Toast.show({ topOffset: 60, type: "error", text1: "Failed to upload photo" });
        }
    };

    const saveProfile = async () => {
        try {
            setIsSaving(true);
            const jwt = await getJwt();
            if (!jwt) {
                Toast.show({ topOffset: 60, type: "error", text1: "Session expired", text2: "Please login again" });
                return;
            }

            const payload = {
                name,
                phone,
                deliveryAddress1,
                deliveryAddress2,
                deliveryCity,
                deliveryZip,
                deliveryCountry,
                ...(deliveryLocation ? { deliveryLocation } : {}),
            };

            const response = await axios.put(`${baseURL}users/profile`, payload, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            hydrateProfileForm(response.data);
            Toast.show({ topOffset: 60, type: "success", text1: "Profile updated" });
        } catch (_error) {
            Toast.show({ topOffset: 60, type: "error", text1: "Failed to save profile" });
        } finally {
            setIsSaving(false);
        }
    };

    const changePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ topOffset: 60, type: "error", text1: "Please fill in all password fields" });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ topOffset: 60, type: "error", text1: "New passwords do not match" });
            return;
        }
        try {
            setIsChangingPassword(true);
            const jwt = await getJwt();
            await axios.put(
                `${baseURL}users/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            Toast.show({ topOffset: 60, type: "success", text1: "Password changed successfully" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowChangePassword(false);
        } catch (err) {
            const msg = err?.response?.data?.message || "Failed to change password";
            Toast.show({ topOffset: 60, type: "error", text1: msg });
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.subContainer}>
                {/* Profile Image */}
                <TouchableOpacity onPress={showImageOptions} style={styles.profileImageContainer}>
                    {image ? (
                        <Image 
                            source={{ uri: image }} 
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.profileImagePlaceholderText}>Tap to add photo</Text>
                        </View>
                    )}
                    <View style={styles.cameraIconOverlay}>
                        <Ionicons name="camera" size={16} color="white" />
                    </View>
                </TouchableOpacity>
                
                <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1a1a" }}>
                    {userProfile ? userProfile.name : ""}
                </Text>
                {userProfile && userProfile.isAdmin ? (
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                ) : null}
                <View style={[styles.completionBadge, isCheckoutReady ? styles.completeBadge : styles.incompleteBadge]}>
                    <Text style={styles.completionBadgeText}>
                        {isCheckoutReady ? "✓ Checkout Ready" : "⚠ Profile Incomplete"}
                    </Text>
                </View>
                {!isCheckoutReady ? (
                    <Text style={styles.missingFieldsText}>
                        Please fill out your address
                    </Text>
                ) : null}
                <View style={{ marginTop: 20, width: "100%", alignItems: "center" }}>
                    <Text style={styles.sectionHeader}>Account Info</Text>
                    <Text style={styles.emailText}>
                        {userProfile ? userProfile.email : ""}
                    </Text>
                    <Input label="Name" placeholder="Your name" value={name} onChangeText={setName} />
                    <Input label="Phone" placeholder="Your phone number" value={phone} keyboardType="numeric" onChangeText={setPhone} />

                    <Text style={styles.sectionHeader}>Delivery Address</Text>
                    <Input label="Address Line 1" placeholder="Street, building, etc." value={deliveryAddress1} onChangeText={setDeliveryAddress1} />
                    <Input label="Address Line 2 (optional)" placeholder="Unit, floor, etc." value={deliveryAddress2} onChangeText={setDeliveryAddress2} />
                    <Input label="City" placeholder="City or municipality" value={deliveryCity} onChangeText={setDeliveryCity} />
                    <Input label="Zip Code" placeholder="Postal/Zip code" value={deliveryZip} keyboardType="numeric" onChangeText={setDeliveryZip} />
                    <Input label="Country" placeholder="Country" value={deliveryCountry} onChangeText={setDeliveryCountry} />
                    <TouchableOpacity style={styles.mapButton} onPress={() => setMapVisible(true)}>
                        <Text style={styles.mapButtonText}>📍 Set Address from Map</Text>
                    </TouchableOpacity>
                    <View style={{ width: "88%", marginTop: 8 }}>
                        <Button title={isSaving ? "Saving..." : "Save Profile"} disabled={isSaving} onPress={saveProfile} />
                    </View>
                </View>

                {/* Change Password Section */}
                <TouchableOpacity
                    style={styles.changePasswordToggle}
                    onPress={() => {
                        setShowChangePassword((v) => !v);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                    }}
                >
                    <Ionicons name="lock-closed-outline" size={16} color="#1976d2" style={{ marginRight: 6 }} />
                    <Text style={styles.changePasswordToggleText}>
                        {showChangePassword ? "Cancel Change Password" : "Change Password"}
                    </Text>
                </TouchableOpacity>

                {showChangePassword && (
                    <View style={{ width: "100%", alignItems: "center" }}>
                        <Input
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            secureTextEntry={true}
                            showToggle={true}
                            onChangeText={setCurrentPassword}
                        />
                        <Input
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            secureTextEntry={true}
                            showToggle={true}
                            onChangeText={setNewPassword}
                        />
                        <Input
                            label="Confirm New Password"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            secureTextEntry={true}
                            showToggle={true}
                            onChangeText={setConfirmPassword}
                        />
                        <View style={{ width: "88%", marginTop: 4, marginBottom: 8 }}>
                            <Button
                                title={isChangingPassword ? "Updating..." : "Update Password"}
                                disabled={isChangingPassword}
                                onPress={changePassword}
                            />
                        </View>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        logoutUser(context.dispatch);
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
            <AddressMapPicker
                visible={mapVisible}
                initialLocation={deliveryLocation}
                onClose={() => setMapVisible(false)}
                onPicked={onMapPicked}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    subContainer: {
        alignItems: "center",
        marginTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: "#e91e63",
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    profileImagePlaceholderText: {
        color: "#888",
        fontSize: 12,
    },
    profileImageContainer: {
        position: "relative",
        marginBottom: 12,
    },
    cameraIconOverlay: {
        position: "absolute",
        right: 0,
        bottom: 12,
        backgroundColor: "#1976d2",
        padding: 8,
        borderRadius: 20,
        elevation: 4,
    },
    adminBadge: {
        backgroundColor: "#e91e63",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginTop: 8,
    },
    adminBadgeText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 13,
        letterSpacing: 1,
    },
    mapButton: {
        backgroundColor: "#1976d2",
        marginHorizontal: 10,
        marginVertical: 10,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    mapButtonText: {
        color: "white",
        fontWeight: "600",
    },
    completionBadge: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginTop: 12,
    },
    completeBadge: {
        backgroundColor: "#2e7d32",
    },
    incompleteBadge: {
        backgroundColor: "#d32f2f",
    },
    completionBadgeText: {
        color: "white",
        fontWeight: "700",
        letterSpacing: 0.4,
    },
    missingFieldsText: {
        marginTop: 8,
        color: "#b71c1c",
        fontSize: 12,
        marginHorizontal: 16,
        textAlign: "center",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#dc2626",
        borderRadius: 12,
        paddingVertical: 14,
        width: "88%",
        marginTop: 30,
        marginBottom: 16,
    },
    logoutBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        alignSelf: "flex-start",
        marginLeft: "6%",
        marginTop: 20,
        marginBottom: 6,
    },
    emailText: {
        fontSize: 15,
        color: "#555",
        marginBottom: 4,
    },
    changePasswordToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "#e3f0ff",
        borderRadius: 10,
        width: "88%",
        justifyContent: "center",
    },
    changePasswordToggleText: {
        color: "#1976d2",
        fontWeight: "700",
        fontSize: 14,
    },
});

export default UserProfile;
