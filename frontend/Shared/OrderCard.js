import React, { useEffect, useState, useRef } from "react";
import {
    View, Text, Animated, TouchableOpacity,
    ActivityIndicator, StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { getJwt } from "../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../assets/common/baseurl";
import { useNavigation } from "@react-navigation/native";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
    PENDING:   "pending",
    SHIPPED:   "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
};

const STATUS_CONFIG = {
    [STATUS.PENDING]:   { label: "Pending",   emoji: "🕐", accent: "#f59e0b", pill: "#fef3c7", text: "#92400e" },
    [STATUS.SHIPPED]:   { label: "Shipped",   emoji: "🚚", accent: "#3b82f6", pill: "#dbeafe", text: "#1e40af" },
    [STATUS.DELIVERED]: { label: "Delivered", emoji: "✅", accent: "#10b981", pill: "#d1fae5", text: "#065f46" },
    [STATUS.CANCELLED]: { label: "Cancelled", emoji: "✖",  accent: "#ef4444", pill: "#fee2e2", text: "#991b1b" },
};

const adminTransitions = {
    [STATUS.PENDING]:   [STATUS.SHIPPED,   STATUS.CANCELLED],
    [STATUS.SHIPPED]:   [STATUS.DELIVERED, STATUS.CANCELLED],
    [STATUS.DELIVERED]: [],
    [STATUS.CANCELLED]: [],
};

const userTransitions = {
    [STATUS.PENDING]:   [STATUS.CANCELLED],
    [STATUS.SHIPPED]:   [STATUS.DELIVERED, STATUS.CANCELLED],
    [STATUS.DELIVERED]: [],
    [STATUS.CANCELLED]: [],
};

const normalizeStatus = (value) => {
    if (!value) return "";
    const lowered = String(value).toLowerCase();
    if (lowered === "3") return STATUS.PENDING;
    if (lowered === "2") return STATUS.SHIPPED;
    if (lowered === "1") return STATUS.DELIVERED;
    return lowered;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderCard = ({ item, update, isAdmin = false }) => {
    const currentStatus = normalizeStatus(item.status);
    const cfg           = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[STATUS.PENDING];
    const transitions   = isAdmin ? adminTransitions : userTransitions;
    const allowed       = transitions[currentStatus] || [];

    const [statusChange, setStatusChange] = useState(allowed[0] || currentStatus);
    const [isUpdating,   setIsUpdating]   = useState(false);
    const navigation = useNavigation();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, []);

    const updateOrder = () => {
        if (isUpdating) return;
        setIsUpdating(true);
        getJwt()
            .then((res) => {
                const config = { headers: { Authorization: `Bearer ${res || ""}` } };
                return axios.put(`${baseURL}orders/${item.id || item._id}`, { status: statusChange }, config);
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    Toast.show({ topOffset: 60, type: "success", text1: "Order Updated" });
                    setTimeout(() => navigation.navigate("Products"), 500);
                }
            })
            .catch(() => Toast.show({ topOffset: 60, type: "error", text1: "Something went wrong", text2: "Please try again" }))
            .finally(() => setIsUpdating(false));
    };

    const address = [item.shippingAddress1, item.shippingAddress2].filter(Boolean).join(", ");
    const orderId = item.id || item._id?.slice(-8) || "—";
    const date    = item.dateOrdered?.split("T")[0] || "";

    return (
        <Animated.View style={[styles.card, { borderLeftColor: cfg.accent, opacity: fadeAnim }]}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.orderId}>#{orderId}</Text>
                    {date ? <Text style={styles.date}>{date}</Text> : null}
                </View>
                <View style={[styles.pill, { backgroundColor: cfg.pill }]}>
                    <Text style={[styles.pillText, { color: cfg.text }]}>
                        {cfg.emoji}  {cfg.label}
                    </Text>
                </View>
            </View>

            {/* ── Details ── */}
            <View style={styles.details}>
                {address      ? <DetailRow icon="📍" value={address} />          : null}
                {item.city    ? <DetailRow icon="🏙️" value={item.city} />        : null}
                {item.country ? <DetailRow icon="🌏" value={item.country} />     : null}
            </View>

            {/* ── Price ── */}
            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={[styles.priceValue, { color: cfg.accent }]}>₱ {item.totalPrice}</Text>
            </View>

            {/* ── Update ── */}
            {update && allowed.length > 0 && (
                <View style={styles.updateSection}>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={statusChange}
                            onValueChange={setStatusChange}
                            style={styles.picker}
                        >
                            {allowed.map((val) => {
                                const c = STATUS_CONFIG[val];
                                return <Picker.Item key={val} label={`${c.emoji}  ${c.label}`} value={val} />;
                            })}
                        </Picker>
                    </View>
                    <TouchableOpacity
                        style={[styles.updateBtn, { backgroundColor: cfg.accent }]}
                        onPress={updateOrder}
                        disabled={isUpdating}
                        activeOpacity={0.85}
                    >
                        {isUpdating
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.updateBtnText}>Confirm Update</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}

        </Animated.View>
    );
};

// ─── Detail row ───────────────────────────────────────────────────────────────
const DetailRow = ({ icon, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailIcon}>{icon}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginHorizontal: 12,
        marginVertical: 6,
        borderLeftWidth: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    headerLeft: {
        gap: 2,
    },
    orderId: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1235",
    },
    date: {
        fontSize: 11,
        color: "#b0a3d4",
    },
    pill: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pillText: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.3,
    },

    // Details
    details: {
        paddingHorizontal: 12,
        paddingBottom: 8,
        gap: 4,
        borderTopWidth: 1,
        borderTopColor: "#f5f3ff",
        paddingTop: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    detailIcon: {
        fontSize: 12,
        width: 18,
    },
    detailValue: {
        flex: 1,
        fontSize: 12,
        color: "#4b4370",
    },

    // Price
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "#f5f3ff",
    },
    priceLabel: {
        fontSize: 12,
        color: "#b0a3d4",
        fontWeight: "600",
    },
    priceValue: {
        fontSize: 16,
        fontWeight: "800",
    },

    // Update
    updateSection: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 6,
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: "#f5f3ff",
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: "#e4dff5",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#faf9f7",
    },
    picker: {
        height: 40,
        fontSize: 13,
    },
    updateBtn: {
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    updateBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
});

export default OrderCard;