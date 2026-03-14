import React, { useCallback, useState, useMemo, useRef } from "react";
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ScrollView, Modal, Animated,
} from "react-native";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";
import { getJwt } from "../../assets/common/jwtStore";
import OrderCard from "../../Shared/OrderCard";
import { Ionicons } from "@expo/vector-icons";

// ─── Constants ────────────────────────────────────────────────────────────────
const DATE_FILTERS = ["All", "Today", "This Week", "This Month"];

const STATUS_OPTIONS = [
    { label: "All Statuses", value: "all",       icon: "list-outline",         color: "#7c6aaa" },
    { label: "Pending",      value: "pending",   icon: "time-outline",         color: "#f59e0b" },
    { label: "Shipped",      value: "shipped",   icon: "bicycle-outline",      color: "#3b82f6" },
    { label: "Delivered",    value: "delivered", icon: "checkmark-circle-outline", color: "#10b981" },
    { label: "Cancelled",    value: "cancelled", icon: "close-circle-outline", color: "#ef4444" },
];

const DATE_ICON_MAP = {
    "Today":      "today-outline",
    "This Week":  "calendar-outline",
    "This Month": "calendar-clear-outline",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const isToday = (date) => {
    const d = new Date(date), now = new Date();
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
};
const isThisWeek = (date) => {
    const d = new Date(date), now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
};
const isThisMonth = (date) => {
    const d = new Date(date), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const filterByDate = (orders, filter) => {
    if (filter === "All")        return orders;
    if (filter === "Today")      return orders.filter((o) => isToday(o.dateOrdered));
    if (filter === "This Week")  return orders.filter((o) => isThisWeek(o.dateOrdered));
    if (filter === "This Month") return orders.filter((o) => isThisMonth(o.dateOrdered));
    return orders;
};

const filterByStatus = (orders, status) => {
    if (status === "all") return orders;
    return orders.filter((o) => String(o.status).toLowerCase() === status);
};

const groupByDate = (orders) => {
    const groups = {};
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    orders.forEach((order) => {
        const d = new Date(order.dateOrdered);
        let label;
        if (isToday(d)) {
            label = "Today";
        } else if (
            d.getDate() === yesterday.getDate() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getFullYear() === yesterday.getFullYear()
        ) {
            label = "Yesterday";
        } else {
            label = d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
        }
        if (!groups[label]) groups[label] = [];
        groups[label].push(order);
    });

    const result = [];
    Object.entries(groups).forEach(([label, items]) => {
        result.push({ type: "header", label, count: items.length });
        items.forEach((item) => result.push({ type: "item", data: item }));
    });
    return result;
};

// ─── Status Dropdown ──────────────────────────────────────────────────────────
const StatusDropdown = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const selected = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

    const openDropdown = () => {
        setOpen(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    };
    const closeDropdown = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() =>
            setOpen(false)
        );
    };
    const select = (val) => {
        onChange(val);
        closeDropdown();
    };

    return (
        <>
            {/* Trigger button */}
            <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={openDropdown}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={selected.icon}
                    size={14}
                    color={selected.color}
                    style={{ marginRight: 6 }}
                />
                <Text style={[styles.dropdownTriggerText, { color: selected.color }]}>
                    {selected.label}
                </Text>
                <Ionicons name="chevron-down" size={13} color="#9b8ec4" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* Dropdown modal */}
            <Modal visible={open} transparent animationType="none" onRequestClose={closeDropdown}>
                <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={closeDropdown} />
                <Animated.View style={[styles.dropdownMenu, { opacity: fadeAnim,
                    transform: [{ scaleY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                }]}>
                    <Text style={styles.dropdownMenuTitle}>Filter by Status</Text>
                    {STATUS_OPTIONS.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.dropdownOption, isSelected && styles.dropdownOptionActive]}
                                onPress={() => select(opt.value)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.dropdownOptionIcon, { backgroundColor: opt.color + "1a" }]}>
                                    <Ionicons name={opt.icon} size={16} color={opt.color} />
                                </View>
                                <Text style={[styles.dropdownOptionText, isSelected && { color: "#7c3aed", fontWeight: "800" }]}>
                                    {opt.label}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="#7c3aed" style={{ marginLeft: "auto" }} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>
            </Modal>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Orders = () => {
    const [orderList, setOrderList]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(false);
    const [dateFilter, setDateFilter]   = useState("All");
    const [statusFilter, setStatusFilter] = useState("all");

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            setLoading(true);
            setError(false);

            getJwt()
                .then((res) => {
                    const token = res || "";
                    return axios.get(`${baseURL}orders`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                })
                .then((res) => {
                    if (isMounted) {
                        const sorted = (res.data || []).sort(
                            (a, b) => new Date(b.dateOrdered) - new Date(a.dateOrdered)
                        );
                        setOrderList(sorted);
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    if (isMounted) { setError(true); setLoading(false); }
                });

            return () => { isMounted = false; setOrderList([]); };
        }, [])
    );

    const filteredList = useMemo(() => {
        const byDate   = filterByDate(orderList, dateFilter);
        const byStatus = filterByStatus(byDate, statusFilter);
        return byStatus;
    }, [orderList, dateFilter, statusFilter]);

    const groupedData = useMemo(() => groupByDate(filteredList), [filteredList]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <View style={styles.stateIcon}>
                    <Ionicons name="time-outline" size={34} color="#7c3aed" />
                </View>
                <Text style={styles.stateTitle}>Loading orders…</Text>
            </View>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <View style={styles.center}>
                <View style={[styles.stateIcon, { backgroundColor: "#fef2f2" }]}>
                    <Ionicons name="cloud-offline-outline" size={34} color="#ef4444" />
                </View>
                <Text style={[styles.stateTitle, { color: "#ef4444" }]}>Failed to load orders</Text>
                <Text style={styles.stateSubtitle}>Check your connection and try again.</Text>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>

            {/* ── Filter bar ── */}
            <View style={styles.filterBar}>

                {/* Row 1 — date chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterBarContent}
                >
                    {DATE_FILTERS.map((f) => {
                        const isActive = dateFilter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.chip, isActive && styles.chipActive]}
                                onPress={() => setDateFilter(f)}
                                activeOpacity={0.75}
                            >
                                {DATE_ICON_MAP[f] && (
                                    <Ionicons
                                        name={DATE_ICON_MAP[f]}
                                        size={13}
                                        color={isActive ? "#fff" : "#7c6aaa"}
                                        style={{ marginRight: 5 }}
                                    />
                                )}
                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                    {f}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Row 2 — status dropdown + count */}
                <View style={styles.filterRow2}>
                    <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
                    <View style={styles.summaryPill}>
                        <Ionicons name="layers-outline" size={12} color="#7c6aaa" style={{ marginRight: 4 }} />
                        <Text style={styles.summaryText}>
                            {filteredList.length} order{filteredList.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── Empty state ── */}
            {filteredList.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.stateIcon}>
                        <Ionicons name="receipt-outline" size={34} color="#7c3aed" />
                    </View>
                    <Text style={styles.stateTitle}>No orders found</Text>
                    <Text style={styles.stateSubtitle}>Try adjusting the date or status filter.</Text>
                </View>
            ) : (
                <FlatList
                    data={groupedData}
                    keyExtractor={(item, i) =>
                        item.type === "header"
                            ? `header-${item.label}`
                            : String(item.data?.id || item.data?._id || i)
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        if (item.type === "header") {
                            return (
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionDot} />
                                    <Text style={styles.sectionHeaderText}>{item.label}</Text>
                                    <View style={styles.sectionLine} />
                                    <View style={styles.sectionCount}>
                                        <Text style={styles.sectionCountText}>{item.count}</Text>
                                    </View>
                                </View>
                            );
                        }
                        return (
                            <View style={styles.cardWrapper}>
                                <OrderCard item={item.data} update={true} isAdmin={true} />
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#faf9f7" },

    // States
    center: {
        flex: 1, alignItems: "center", justifyContent: "center",
        backgroundColor: "#faf9f7", padding: 24, gap: 10,
    },
    stateIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: "#ede9f8", alignItems: "center",
        justifyContent: "center", marginBottom: 4,
    },
    stateTitle: { fontSize: 17, fontWeight: "700", color: "#1a1235", letterSpacing: -0.2 },
    stateSubtitle: { fontSize: 13, color: "#b0a3d4", fontWeight: "500", textAlign: "center", lineHeight: 20 },

    // Filter bar
    filterBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4dff5" },
    filterBarContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },

    // Date chips
    chip: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1.5,
        borderColor: "#e4dff5", backgroundColor: "#fff", marginRight: 8,
    },
    chipActive: {
        backgroundColor: "#7c3aed", borderColor: "#7c3aed",
        shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
    },
    chipText: { fontSize: 13, fontWeight: "700", color: "#7c6aaa" },
    chipTextActive: { color: "#fff" },

    // Row 2 (dropdown + count)
    filterRow2: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
    },

    // Dropdown trigger
    dropdownTrigger: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#f0ecfb", borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 7,
        borderWidth: 1.5, borderColor: "#e4dff5",
    },
    dropdownTriggerText: { fontSize: 13, fontWeight: "700" },

    // Dropdown menu (floats over content)
    dropdownBackdrop: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    },
    dropdownMenu: {
        position: "absolute", top: 120, left: 16, right: 16,
        backgroundColor: "#fff", borderRadius: 18,
        paddingVertical: 8, paddingHorizontal: 6,
        shadowColor: "#5b21b6", shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
        borderWidth: 1, borderColor: "#e4dff5",
        zIndex: 999,
    },
    dropdownMenuTitle: {
        fontSize: 11, fontWeight: "800", color: "#b0a3d4",
        textTransform: "uppercase", letterSpacing: 1.2,
        paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8,
    },
    dropdownOption: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 12, paddingVertical: 11,
        borderRadius: 12, marginBottom: 2,
    },
    dropdownOptionActive: { backgroundColor: "#f0ecfb" },
    dropdownOptionIcon: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    dropdownOptionText: { fontSize: 14, fontWeight: "600", color: "#1a1235" },

    // Summary pill
    summaryPill: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#f0ecfb", paddingHorizontal: 10,
        paddingVertical: 6, borderRadius: 20,
    },
    summaryText: { fontSize: 12, fontWeight: "700", color: "#7c6aaa" },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },

    // Section header
    sectionHeader: {
        flexDirection: "row", alignItems: "center",
        marginTop: 20, marginBottom: 10,
    },
    sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7c3aed", marginRight: 8 },
    sectionHeaderText: {
        fontSize: 11, fontWeight: "800", color: "#7c6aaa",
        textTransform: "uppercase", letterSpacing: 1.3, marginRight: 8,
    },
    sectionLine: { flex: 1, height: 1, backgroundColor: "#e4dff5", marginRight: 8 },
    sectionCount: { backgroundColor: "#ede9f8", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    sectionCountText: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },

    // Card
    cardWrapper: {
        borderRadius: 16, overflow: "hidden", marginBottom: 10,
        shadowColor: "#5b21b6", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09, shadowRadius: 10, elevation: 3,
    },
});

export default Orders;