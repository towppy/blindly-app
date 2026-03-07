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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

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

    const toggleActive = async (userId, makeActive) => {
        setActionLoading(userId);
        try {
            const token = await getJwt();
            await axios.patch(
                `${baseURL}users/${userId}/${makeActive ? "activate" : "deactivate"}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const update = (arr) =>
                arr.map((u) =>
                    (u.id || u._id) === userId ? { ...u, isActive: makeActive } : u
                );
            setUsers((prev) => update(prev));
            setFiltered((prev) => update(prev));
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Action failed");
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
                    {!item.isAdmin && (
                        <View style={styles.actionRow}>
                            {busy ? (
                                <ActivityIndicator size="small" color="#7c3aed" style={{ marginRight: 8 }} />
                            ) : isInactive ? (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.activateBtn]}
                                    onPress={() => toggleActive(uid, true)}
                                >
                                    <Text style={styles.actionBtnText}>Activate</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.deactivateBtn]}
                                    onPress={() =>
                                        Alert.alert(
                                            "Deactivate User",
                                            `Deactivate "${item.name}"? They won't be able to log in.`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Deactivate", style: "destructive", onPress: () => toggleActive(uid, false) },
                                            ]
                                        )
                                    }
                                >
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
        </View>
    );
};

const styles = StyleSheet.create({
    center:         { flex: 1, alignItems: "center", justifyContent: "center" },
    countText:      { fontSize: 12, color: "#888", marginLeft: 16, marginBottom: 4 },
    card:           {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#fff", borderRadius: 12, padding: 14,
        marginBottom: 10, elevation: 1,
    },
    avatar:         {
        width: 46, height: 46, borderRadius: 23,
        alignItems: "center", justifyContent: "center", marginRight: 14,
    },
    avatarText:     { color: "#fff", fontSize: 18, fontWeight: "700" },
    info:           { flex: 1 },
    nameRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
    name:           { fontSize: 15, fontWeight: "700", color: "#1a0a3c" },
    adminBadge:     { backgroundColor: "#ede8fa", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    adminBadgeText: { color: "#7c3aed", fontSize: 11, fontWeight: "600" },
    email:          { fontSize: 13, color: "#666", marginTop: 2 },
    phone:          { fontSize: 12, color: "#999", marginTop: 1 },
    empty:          { textAlign: "center", color: "#aaa", marginTop: 40 },
    statusBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    activeBg:       { backgroundColor: "#d1fae5" },
    inactiveBg:     { backgroundColor: "#fee2e2" },
    statusBadgeText:{ fontSize: 11, fontWeight: "600", color: "#374151" },
    actionRow:      { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
    actionBtn:      { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignItems: "center", justifyContent: "center" },
    actionBtnText:  { color: "#fff", fontSize: 12, fontWeight: "600" },
    activateBtn:    { backgroundColor: "#16a34a" },
    deactivateBtn:  { backgroundColor: "#f97316" },
    deleteBtn:      { backgroundColor: "#dc2626", paddingHorizontal: 10 },
});

export default AdminUsers;
