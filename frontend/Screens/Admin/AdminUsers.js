import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    Alert,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar, RadioButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";

// Deactivation reasons
const DEACTIVATION_REASONS = [
    { id: "inappropriate", label: "Inappropriate behavior", icon: "warning" },
    { id: "spam", label: "Spam account", icon: "mail-unread" },
    { id: "fake", label: "Fake identity", icon: "person-remove" },
    { id: "inactive", label: "Account inactive", icon: "time" },
    { id: "violation", label: "Terms violation", icon: "document-text" },
    { id: "other", label: "Other reason", icon: "ellipsis-horizontal" },
];

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    
    // Modal states
    const [deactivateModal, setDeactivateModal] = useState({ visible: false, userId: null, userName: "" });
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    const fetchUsers = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const token = await getJwt();
            const res = await axios.get(`${baseURL}users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
            setFiltered(res.data);
        } catch (e) {
            console.log("AdminUsers fetch error:", e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchUsers(); }, [fetchUsers]));

    const search = (text) => {
        if (!text.trim()) { setFiltered(users); return; }
        const q = text.toLowerCase();
        setFiltered(
            users.filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            )
        );
    };

    const openDeactivateModal = (userId, userName) => {
        setSelectedReason("");
        setCustomReason("");
        setShowCustomInput(false);
        setDeactivateModal({ visible: true, userId, userName });
    };

    const closeDeactivateModal = () => {
        setDeactivateModal({ visible: false, userId: null, userName: "" });
        setSelectedReason("");
        setCustomReason("");
        setShowCustomInput(false);
    };

    const handleReasonSelect = (reasonId) => {
        setSelectedReason(reasonId);
        setShowCustomInput(reasonId === "other");
        if (reasonId !== "other") {
            setCustomReason("");
        }
    };

    const confirmDeactivate = async () => {
        if (!selectedReason) {
            Alert.alert("Error", "Please select a reason for deactivation");
            return;
        }

        if (selectedReason === "other" && !customReason.trim()) {
            Alert.alert("Error", "Please provide a reason");
            return;
        }

        const { userId, userName } = deactivateModal;
        const reasonText = selectedReason === "other" 
            ? customReason.trim() 
            : DEACTIVATION_REASONS.find(r => r.id === selectedReason)?.label;

        setActionLoading(userId);
        closeDeactivateModal();

        try {
            const token = await getJwt();
            await axios.patch(
                `${baseURL}users/${userId}/deactivate`,
                { reason: reasonText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const update = (arr) =>
                arr.map((u) =>
                    (u.id || u._id) === userId ? { ...u, isActive: false, deactivationReason: reasonText } : u
                );
            setUsers((prev) => update(prev));
            setFiltered((prev) => update(prev));
            
            Alert.alert("Success", `${userName} has been deactivated`);
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Deactivation failed");
        } finally {
            setActionLoading(null);
        }
    };

    const toggleActive = async (userId, makeActive) => {
        if (!makeActive) {
            // If deactivating, open modal instead of direct action
            const user = users.find(u => (u.id || u._id) === userId);
            openDeactivateModal(userId, user?.name || "User");
            return;
        }

        // For activation, proceed directly
        setActionLoading(userId);
        try {
            const token = await getJwt();
            await axios.patch(
                `${baseURL}users/${userId}/activate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const update = (arr) =>
                arr.map((u) =>
                    (u.id || u._id) === userId ? { ...u, isActive: true, deactivationReason: null } : u
                );
            setUsers((prev) => update(prev));
            setFiltered((prev) => update(prev));
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Activation failed");
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = (userId, userName) => {
        Alert.alert(
            "Delete User",
            `Permanently delete "${userName}"? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(userId);
                        try {
                            const token = await getJwt();
                            await axios.delete(`${baseURL}users/${userId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            const remove = (arr) =>
                                arr.filter((u) => (u.id || u._id) !== userId);
                            setUsers((prev) => remove(prev));
                            setFiltered((prev) => remove(prev));
                        } catch (e) {
                            Alert.alert("Error", e.response?.data?.message || "Delete failed");
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const uid = item.id || item._id;
        const isInactive = item.isActive === false;
        const busy = actionLoading === uid;
        return (
            <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: item.isAdmin ? "#7c3aed" : "#e91e63" }]}>
                    <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "?"}</Text>
                </View>
                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        {item.isAdmin ? (
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                        ) : null}
                        <View style={[styles.statusBadge, isInactive ? styles.inactiveBg : styles.activeBg]}>
                            <Text style={styles.statusBadgeText}>
                                {isInactive ? "Inactive" : "Active"}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.email}>{item.email}</Text>
                    {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
                    
                    {/* Show deactivation reason if inactive */}
                    {isInactive && item.deactivationReason && (
                        <View style={styles.reasonContainer}>
                            <Ionicons name="information-circle" size={14} color="#f97316" />
                            <Text style={styles.reasonText}>Reason: {item.deactivationReason}</Text>
                        </View>
                    )}
                    
                    {!item.isAdmin && (
                        <View style={styles.actionRow}>
                            {busy ? (
                                <ActivityIndicator size="small" color="#7c3aed" style={{ marginRight: 8 }} />
                            ) : isInactive ? (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.activateBtn]}
                                    onPress={() => toggleActive(uid, true)}
                                >
                                    <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={styles.actionBtnText}>Activate</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.deactivateBtn]}
                                    onPress={() => toggleActive(uid, false)}
                                >
                                    <Ionicons name="ban" size={14} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={styles.actionBtnText}>Deactivate</Text>
                                </TouchableOpacity>
                            )}
                            {!busy && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.deleteBtn]}
                                    onPress={() => deleteUser(uid, item.name)}
                                >
                                    <Ionicons name="trash-outline" size={14} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const DeactivationModal = () => (
        <Modal
            visible={deactivateModal.visible}
            transparent
            animationType="slide"
            onRequestClose={closeDeactivateModal}
        >
            <TouchableWithoutFeedback onPress={closeDeactivateModal}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalIconContainer}>
                                    <Ionicons name="alert-circle" size={30} color="#f97316" />
                                </View>
                                <Text style={styles.modalTitle}>Deactivate User</Text>
                                <Text style={styles.modalSubtitle}>
                                    {deactivateModal.userName}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.modalCloseBtn}
                                    onPress={closeDeactivateModal}
                                >
                                    <Ionicons name="close" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.reasonLabel}>Select reason for deactivation:</Text>

                            <RadioButton.Group onValueChange={handleReasonSelect} value={selectedReason}>
                                {DEACTIVATION_REASONS.map((reason) => (
                                    <TouchableOpacity
                                        key={reason.id}
                                        style={styles.reasonOption}
                                        onPress={() => handleReasonSelect(reason.id)}
                                    >
                                        <View style={styles.reasonLeft}>
                                            <Ionicons 
                                                name={reason.icon} 
                                                size={20} 
                                                color={selectedReason === reason.id ? "#7c3aed" : "#888"} 
                                            />
                                            <Text style={[
                                                styles.reasonOptionText,
                                                selectedReason === reason.id && styles.selectedReasonText
                                            ]}>
                                                {reason.label}
                                            </Text>
                                        </View>
                                        <RadioButton.Android 
                                            value={reason.id} 
                                            color="#7c3aed"
                                            uncheckedColor="#ccc"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </RadioButton.Group>

                            {showCustomInput && (
                                <View style={styles.customInputContainer}>
                                    <Text style={styles.customInputLabel}>Please specify:</Text>
                                    <TextInput
                                        style={styles.customInput}
                                        placeholder="Enter reason..."
                                        value={customReason}
                                        onChangeText={setCustomReason}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            )}

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtn]}
                                    onPress={closeDeactivateModal}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={confirmDeactivate}
                                >
                                    <Ionicons name="ban" size={16} color="#fff" style={{ marginRight: 5 }} />
                                    <Text style={styles.confirmBtnText}>Deactivate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <Searchbar
                placeholder="Search by name or email"
                onChangeText={search}
                style={{ margin: 12 }}
            />
            <Text style={styles.countText}>
                {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.id || item._id)}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 12 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchUsers(true); }}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>No users found</Text>
                }
            />
            <DeactivationModal />
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    countText: { fontSize: 12, color: "#888", marginLeft: 16, marginBottom: 4 },
    card: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#fff", borderRadius: 12, padding: 14,
        marginBottom: 10, elevation: 1,
    },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        alignItems: "center", justifyContent: "center", marginRight: 14,
    },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
    info: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    name: { fontSize: 15, fontWeight: "700", color: "#1a0a3c" },
    adminBadge: { backgroundColor: "#ede8fa", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    adminBadgeText: { color: "#7c3aed", fontSize: 11, fontWeight: "600" },
    email: { fontSize: 13, color: "#666", marginTop: 2 },
    phone: { fontSize: 12, color: "#999", marginTop: 1 },
    empty: { textAlign: "center", color: "#aaa", marginTop: 40 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    activeBg: { backgroundColor: "#d1fae5" },
    inactiveBg: { backgroundColor: "#fee2e2" },
    statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#374151" },
    actionRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
    actionBtn: { 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "row",
    },
    actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    activateBtn: { backgroundColor: "#16a34a" },
    deactivateBtn: { backgroundColor: "#f97316" },
    deleteBtn: { backgroundColor: "#dc2626", paddingHorizontal: 10 },
    
    // Reason display
    reasonContainer: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginTop: 4,
        backgroundColor: "#fff7ed",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    reasonText: { 
        fontSize: 11, 
        color: "#f97316", 
        marginLeft: 4,
        fontWeight: "500",
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        width: "90%",
        maxWidth: 400,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        alignItems: "center",
        marginBottom: 20,
        position: "relative",
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff7ed",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a0a3c",
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#666",
    },
    modalCloseBtn: {
        position: "absolute",
        right: 0,
        top: 0,
        padding: 5,
    },
    reasonLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    reasonOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    reasonLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    reasonOptionText: {
        fontSize: 15,
        color: "#333",
        marginLeft: 12,
        flex: 1,
    },
    selectedReasonText: {
        color: "#7c3aed",
        fontWeight: "500",
    },
    customInputContainer: {
        marginTop: 16,
        marginBottom: 8,
    },
    customInputLabel: {
        fontSize: 13,
        color: "#666",
        marginBottom: 8,
    },
    customInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        backgroundColor: "#f9f9f9",
        minHeight: 80,
        textAlignVertical: "top",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
    },
    cancelBtn: {
        backgroundColor: "#f5f5f5",
    },
    cancelBtnText: {
        color: "#666",
        fontSize: 15,
        fontWeight: "600",
    },
    confirmBtn: {
        backgroundColor: "#f97316",
    },
    confirmBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});

export default AdminUsers;