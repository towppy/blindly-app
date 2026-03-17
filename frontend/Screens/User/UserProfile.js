import React, { useContext, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, Modal } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { logoutUser } from "../../Context/Actions/Auth.actions";
import Input from "../../Shared/Input";
import Toast from "react-native-toast-message";
import AddressMapPicker from "../../Shared/AddressMapPicker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import styles, { COLORS } from "../../Shared/User/UserProfile.styles";

const ACCOUNT_ACTION_REASONS = [
    "Privacy concerns",
    "I am not using this account anymore",
    "Too many notifications",
    "I have another account",
    "I found a better app",
    "Other",
];

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

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [accountActionReason, setAccountActionReason] = useState(ACCOUNT_ACTION_REASONS[0]);
    const [isAccountActionLoading, setIsAccountActionLoading] = useState(false);
    const [showAccountActionModal, setShowAccountActionModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [pendingAccountAction, setPendingAccountAction] = useState("");

    const requiredProfileFields = {
        phone:            String(phone || "").trim(),
        deliveryAddress1: String(deliveryAddress1 || "").trim(),
        deliveryCity:     String(deliveryCity || "").trim(),
        deliveryZip:      String(deliveryZip || "").trim(),
        deliveryCountry:  String(deliveryCountry || "").trim(),
    };
    const missingRequiredFields = Object.entries(requiredProfileFields)
        .filter(([, v]) => !v)
        .map(([k]) => k);
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
            Number.isFinite(profile?.deliveryLocation?.latitude) &&
            Number.isFinite(profile?.deliveryLocation?.longitude)
        ) {
            setDeliveryLocation({
                latitude:  Number(profile.deliveryLocation.latitude),
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
        Toast.show({ topOffset: 60, type: "success", text1: "Location selected", text2: "Review details, then tap Save Profile" });
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
        let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImage(uri);
            uploadProfileImage(uri);
        }
    };

    const showImageOptions = () => {
        Alert.alert("Change Profile Photo", "Choose an option", [
            { text: "Take Photo", onPress: takePhoto },
            { text: "Choose from Gallery", onPress: pickImage },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const uploadProfileImage = async (uri) => {
        try {
            const jwt = await getJwt();
            if (!jwt) { Toast.show({ topOffset: 60, type: "error", text1: "Session expired" }); return; }
            const formData = new FormData();
            const fileName = uri.split("/").pop();
            const fileType = fileName.split(".").pop();
            const mimeType = ["jpg", "jpeg"].includes(fileType) ? "image/jpeg" : fileType === "png" ? "image/png" : "image/jpeg";
            formData.append("image", { uri, type: mimeType, name: fileName });
            const response = await axios.put(`${baseURL}users/profile-photo`, formData, {
                headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "multipart/form-data" },
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
            if (!jwt) { Toast.show({ topOffset: 60, type: "error", text1: "Session expired", text2: "Please login again" }); return; }
            const payload = {
                name, phone, deliveryAddress1, deliveryAddress2,
                deliveryCity, deliveryZip, deliveryCountry,
                ...(deliveryLocation ? { deliveryLocation } : {}),
            };
            const response = await axios.put(`${baseURL}users/profile`, payload, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            hydrateProfileForm(response.data);
            Toast.show({ topOffset: 60, type: "success", text1: "Profile updated" });
        } catch {
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
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
            setShowChangePassword(false);
        } catch (err) {
            Toast.show({ topOffset: 60, type: "error", text1: err?.response?.data?.message || "Failed to change password" });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const performAccountAction = async (type) => {
        try {
            setIsAccountActionLoading(true);
            const jwt = await getJwt();
            if (!jwt) {
                Toast.show({ topOffset: 60, type: "error", text1: "Session expired", text2: "Please login again" });
                return;
            }

            if (type === "deactivate") {
                await axios.patch(
                    `${baseURL}users/me/deactivate`,
                    { reason: accountActionReason },
                    { headers: { Authorization: `Bearer ${jwt}` } }
                );
                Toast.show({ topOffset: 60, type: "success", text1: "Account deactivated" });
            } else {
                await axios.delete(`${baseURL}users/me`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                    data: { reason: accountActionReason },
                });
                Toast.show({ topOffset: 60, type: "success", text1: "Account deleted" });
            }

            logoutUser(context.dispatch);
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: error?.response?.data?.message || "Account action failed",
            });
        } finally {
            setIsAccountActionLoading(false);
        }
    };

    const openReasonModalForAction = (type) => {
        setPendingAccountAction(type);
        setAccountActionReason(ACCOUNT_ACTION_REASONS[0]);
        setShowAccountActionModal(false);
        setShowReasonModal(true);
    };

    const confirmAccountActionWithReason = () => {
        if (!pendingAccountAction) return;
        setShowReasonModal(false);
        performAccountAction(pendingAccountAction);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.subContainer}>

                {/* ── Profile image ── */}
                <TouchableOpacity onPress={showImageOptions} style={styles.profileImageContainer}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person-outline" size={36} color={COLORS.textSubtle} />
                            <Text style={styles.profileImagePlaceholderText}>Add photo</Text>
                        </View>
                    )}
                    <View style={styles.cameraIconOverlay}>
                        <Ionicons name="camera" size={15} color={COLORS.white} />
                    </View>
                </TouchableOpacity>

                {/* ── Name + badges ── */}
                <Text style={styles.nameText}>{userProfile?.name || ""}</Text>

                {userProfile?.isAdmin && (
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                )}

                <View style={[styles.completionBadge, isCheckoutReady ? styles.completeBadge : styles.incompleteBadge]}>
                    <Text style={[styles.completionBadgeText, isCheckoutReady ? styles.completeBadgeText : styles.incompleteBadgeText]}>
                        {isCheckoutReady ? "✓  Checkout Ready" : "⚠  Profile Incomplete"}
                    </Text>
                </View>
                {!isCheckoutReady && (
                    <Text style={styles.missingFieldsText}>Please fill out your delivery address</Text>
                )}

                {/* ── Account info ── */}
                <View style={styles.formBlock}>
                    <Text style={styles.sectionHeader}>Account Info</Text>
                    <Text style={styles.emailText}>{userProfile?.email || ""}</Text>
                    <Input label="Name"  placeholder="Your name"         value={name}  onChangeText={setName} />
                    <Input label="Phone" placeholder="Your phone number" value={phone} keyboardType="numeric" onChangeText={setPhone} />

                    {/* ── Delivery address ── */}
                    <Text style={styles.sectionHeader}>Delivery Address</Text>
                    <Input label="Address Line 1"          placeholder="Street, building, etc." value={deliveryAddress1} onChangeText={setDeliveryAddress1} />
                    <Input label="Address Line 2 (optional)" placeholder="Unit, floor, etc."   value={deliveryAddress2} onChangeText={setDeliveryAddress2} />
                    <Input label="City"     placeholder="City or municipality" value={deliveryCity}    onChangeText={setDeliveryCity} />
                    <Input label="Zip Code" placeholder="Postal/Zip code"      value={deliveryZip}     keyboardType="numeric" onChangeText={setDeliveryZip} />
                    <Input label="Country"  placeholder="Country"              value={deliveryCountry} onChangeText={setDeliveryCountry} />

                    <TouchableOpacity style={styles.mapButton} onPress={() => setMapVisible(true)} activeOpacity={0.8}>
                        <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.mapButtonText}>Set Address from Map</Text>
                    </TouchableOpacity>

                    <View style={styles.saveWrapper}>
                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                            onPress={saveProfile}
                            disabled={isSaving}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>{isSaving ? "Saving…" : "Save Profile"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Change password ── */}
                <TouchableOpacity
                    style={styles.changePasswordToggle}
                    onPress={() => {
                        setShowChangePassword((v) => !v);
                        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name={showChangePassword ? "close-outline" : "lock-closed-outline"} size={16} color={COLORS.primary} />
                    <Text style={styles.changePasswordToggleText}>
                        {showChangePassword ? "Cancel" : "Change Password"}
                    </Text>
                </TouchableOpacity>

                {showChangePassword && (
                    <View style={styles.changePasswordBlock}>
                        <Input label="Current Password"    placeholder="Enter current password" value={currentPassword} secureTextEntry showToggle onChangeText={setCurrentPassword} />
                        <Input label="New Password"        placeholder="Enter new password"      value={newPassword}     secureTextEntry showToggle onChangeText={setNewPassword} />
                        <Input label="Confirm New Password" placeholder="Re-enter new password" value={confirmPassword}  secureTextEntry showToggle onChangeText={setConfirmPassword} />
                        <View style={styles.updatePasswordWrapper}>
                            <TouchableOpacity
                                style={[styles.updatePasswordBtn, isChangingPassword && styles.updatePasswordBtnDisabled]}
                                onPress={changePassword}
                                disabled={isChangingPassword}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.white} style={{ marginRight: 8 }} />
                                <Text style={styles.updatePasswordBtnText}>
                                    {isChangingPassword ? "Updating…" : "Update Password"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.accountActionTriggerBtn, isAccountActionLoading && styles.accountActionBtnDisabled]}
                    onPress={() => setShowAccountActionModal(true)}
                    disabled={isAccountActionLoading}
                    activeOpacity={0.8}
                >
                    <Ionicons name="settings-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.accountActionTriggerText}>Account Actions</Text>
                </TouchableOpacity>

                {/* ── Sign out ── */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => logoutUser(context.dispatch)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>

            </ScrollView>

            <AddressMapPicker
                visible={mapVisible}
                initialLocation={deliveryLocation}
                onClose={() => setMapVisible(false)}
                onPicked={onMapPicked}
            />

            <Modal
                visible={showAccountActionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAccountActionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Account Actions</Text>
                        <Text style={styles.modalSubtitle}>Choose what you want to do with your account.</Text>

                        <TouchableOpacity
                            style={styles.modalDeactivateBtn}
                            onPress={() => openReasonModalForAction("deactivate")}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="pause-circle-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.modalDeactivateText}>Deactivate Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalDeleteBtn}
                            onPress={() => openReasonModalForAction("delete")}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="trash-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                            <Text style={styles.modalDeleteText}>Delete Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={() => setShowAccountActionModal(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showReasonModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReasonModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Reason</Text>
                        <Text style={styles.modalSubtitle}>
                            {pendingAccountAction === "delete"
                                ? "Choose a reason before deleting your account."
                                : "Choose a reason before deactivating your account."}
                        </Text>

                        <View style={styles.accountReasonPickerWrap}>
                            <Picker selectedValue={accountActionReason} onValueChange={setAccountActionReason}>
                                {ACCOUNT_ACTION_REASONS.map((reason) => (
                                    <Picker.Item key={reason} label={reason} value={reason} />
                                ))}
                            </Picker>
                        </View>

                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtnSmall}
                                onPress={() => setShowReasonModal(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalCancelText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={pendingAccountAction === "delete" ? styles.modalDeleteBtnSmall : styles.modalDeactivateBtnSmall}
                                onPress={confirmAccountActionWithReason}
                                activeOpacity={0.85}
                                disabled={isAccountActionLoading}
                            >
                                <Text style={styles.modalActionConfirmText}>
                                    {pendingAccountAction === "delete" ? "Delete" : "Deactivate"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default UserProfile;