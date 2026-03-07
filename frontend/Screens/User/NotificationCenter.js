import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const loadNotifications = useCallback(async () => {
        setRefreshing(true);
        try {
            // System tray notifications (currently visible)
            const delivered = await Notifications.getPresentedNotificationsAsync();
            const fromTray = delivered.map((n) => ({
                id: n.request.identifier,
                title: n.request.content.title || "Notification",
                body: n.request.content.body || "",
                date: n.date ? new Date(n.date) : new Date(),
                orderId: n.request.content.data?.orderId || null,
                type: n.request.content.data?.type || null,
                promoTitle: n.request.content.data?.title || null,
                promoBody: n.request.content.data?.body || null,
                promoDetails: n.request.content.data?.details || null,
            }));

            // Persisted history (survives notification dismissal)
            const stored = await AsyncStorage.getItem("notificationHistory");
            const history = stored ? JSON.parse(stored) : [];
            const fromHistory = history.map((n) => ({
                ...n,
                date: new Date(n.date),
            }));

            // Merge: deduplicate by id, tray entries take precedence
            const ids = new Set(fromTray.map((n) => n.id));
            const merged = [...fromTray, ...fromHistory.filter((n) => !ids.has(n.id))];
            merged.sort((a, b) => b.date - a.date);
            setNotifications(merged);
        } catch (err) {
            console.log("Error loading notifications:", err.message);
        }
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications])
    );

    const clearAll = async () => {
        await Notifications.dismissAllNotificationsAsync();
        await AsyncStorage.removeItem("notificationHistory");
        setNotifications([]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                if (item.orderId) {
                    navigation.navigate("Order Detail", { orderId: item.orderId });
                } else if (item.type === "promo") {
                    navigation.navigate("Promo Detail", {
                        title: item.promoTitle || item.title,
                        body: item.promoBody || item.body,
                        details: item.promoDetails || "",
                    });
                }
            }}
            activeOpacity={item.orderId || item.type === "promo" ? 0.7 : 1}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.type === "promo" ? "pricetag" : "notifications"}
                    size={24}
                    color={item.type === "promo" ? "#7c3aed" : "#e91e63"}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>
                    {item.date.toLocaleDateString()} {item.date.toLocaleTimeString()}
                </Text>
                {item.orderId ? (
                    <Text style={styles.tapHint}>Tap to view order details</Text>
                ) : item.type === "promo" ? (
                    <Text style={[styles.tapHint, { color: "#7c3aed" }]}>Tap to view promo details</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {notifications.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={loadNotifications} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <Text style={styles.emptySubtext}>
                            Notifications will appear here when you receive stock alerts, order updates, etc.
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    clearBtn: {
        alignSelf: "flex-end",
        padding: 12,
        paddingBottom: 4,
    },
    clearText: { color: "#e91e63", fontWeight: "600" },
    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 12,
        marginVertical: 4,
        padding: 14,
        borderRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: { flex: 1 },
    title: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 2 },
    body: { fontSize: 13, color: "#333", marginBottom: 4 },
    date: { fontSize: 11, color: "#666" },
    tapHint: { fontSize: 11, color: "#7c3aed", marginTop: 3, fontStyle: "italic" },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 120,
        paddingHorizontal: 40,
    },
    emptyText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 16 },
    emptySubtext: { fontSize: 13, color: "#888", textAlign: "center", marginTop: 8 },
});

export default NotificationCenter;
