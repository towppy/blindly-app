import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";

const COLORS = {
    bg: "#f5f5f5",
    card: "#ffffff",
    text: "#1a0a3c",
    muted: "#7c7c8a",
    accent: "#7c3aed",
    ok: "#16a34a",
    warn: "#f97316",
    border: "#ece7fb",
};

const StatCard = ({ label, value, icon, tint }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconWrap, { backgroundColor: tint + "22" }]}>
            <Ionicons name={icon} size={16} color={tint} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const PushDiagnostics = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState({
        totalUsers: 0,
        pushReadyUsers: 0,
        usersWithoutTokens: 0,
        totalTokens: 0,
    });
    const [users, setUsers] = useState([]);

    const fetchDiagnostics = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const token = await getJwt();
            const res = await axios.get(`${baseURL}users/admin/push-readiness`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSummary(res.data?.summary || {
                totalUsers: 0,
                pushReadyUsers: 0,
                usersWithoutTokens: 0,
                totalTokens: 0,
            });
            setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
        } catch (err) {
            console.log("PushDiagnostics fetch error:", err?.response?.data || err.message);
            setSummary({ totalUsers: 0, pushReadyUsers: 0, usersWithoutTokens: 0, totalTokens: 0 });
            setUsers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDiagnostics();
        }, [fetchDiagnostics])
    );

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            if (a.pushReady === b.pushReady) {
                return (b.tokenCount || 0) - (a.tokenCount || 0);
            }
            return a.pushReady ? -1 : 1;
        });
    }, [users]);

    const renderUser = ({ item }) => {
        const expo = item?.byType?.expo || 0;
        const fcm = item?.byType?.fcm || 0;
        const unknown = item?.byType?.unknown || 0;

        return (
            <View style={styles.userCard}>
                <View style={styles.userHeader}>
                    <View style={styles.userMain}>
                        <Text numberOfLines={1} style={styles.userName}>{item.name || "Unnamed User"}</Text>
                        <Text numberOfLines={1} style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.pushReady ? styles.readyBadge : styles.notReadyBadge]}>
                        <Ionicons
                            name={item.pushReady ? "checkmark-circle" : "alert-circle"}
                            size={13}
                            color={item.pushReady ? COLORS.ok : COLORS.warn}
                        />
                        <Text style={[styles.statusText, { color: item.pushReady ? COLORS.ok : COLORS.warn }]}>
                            {item.pushReady ? "Ready" : "No Token"}
                        </Text>
                    </View>
                </View>

                <View style={styles.countRow}>
                    <Text style={styles.countText}>Total: {item.tokenCount || 0}</Text>
                    <Text style={styles.countText}>Expo: {expo}</Text>
                    <Text style={styles.countText}>FCM: {fcm}</Text>
                    <Text style={styles.countText}>Unknown: {unknown}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.summaryWrap}>
                <StatCard label="Users" value={summary.totalUsers || 0} icon="people" tint={COLORS.accent} />
                <StatCard label="Push Ready" value={summary.pushReadyUsers || 0} icon="checkmark-circle" tint={COLORS.ok} />
                <StatCard label="No Token" value={summary.usersWithoutTokens || 0} icon="alert-circle" tint={COLORS.warn} />
                <StatCard label="Tokens" value={summary.totalTokens || 0} icon="notifications" tint={COLORS.accent} />
            </View>

            <Text style={styles.hintText}>Users are sorted by readiness, then token count.</Text>

            <FlatList
                data={sortedUsers}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderUser}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchDiagnostics(true);
                        }}
                    />
                }
                contentContainerStyle={sortedUsers.length === 0 ? styles.emptyContainer : styles.listPadding}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off" size={34} color="#bbb" />
                        <Text style={styles.emptyText}>No diagnostics data found.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 12,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.bg,
    },
    summaryWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    statCard: {
        width: "48.5%",
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
    },
    statIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
    },
    statLabel: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.muted,
    },
    hintText: {
        fontSize: 12,
        color: COLORS.muted,
        marginBottom: 8,
        marginLeft: 2,
    },
    listPadding: {
        paddingBottom: 20,
    },
    userCard: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    userHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    userMain: {
        flex: 1,
        marginRight: 8,
    },
    userName: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
    },
    userEmail: {
        marginTop: 2,
        fontSize: 12,
        color: COLORS.muted,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
    },
    readyBadge: {
        backgroundColor: "#ecfdf3",
        borderColor: "#bbf7d0",
    },
    notReadyBadge: {
        backgroundColor: "#fff7ed",
        borderColor: "#fed7aa",
    },
    statusText: {
        marginLeft: 4,
        fontSize: 11,
        fontWeight: "700",
    },
    countRow: {
        marginTop: 8,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    countText: {
        fontSize: 12,
        color: COLORS.text,
        backgroundColor: "#f7f4ff",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    emptyContainer: {
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 80,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: COLORS.muted,
    },
});

export default PushDiagnostics;
