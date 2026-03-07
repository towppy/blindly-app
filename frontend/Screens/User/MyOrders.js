import React, { useCallback, useContext, useState } from "react";
import {
    View, FlatList, Text, StyleSheet, TouchableOpacity,
    Modal, ScrollView, Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../Redux/Actions/orderActions";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import OrderCard from "../../Shared/OrderCard";
import { Ionicons } from "@expo/vector-icons";

const STATUS_FILTERS = ["All", "pending", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
    pending: "#E74C3C",
    shipped: "#F1C40F",
    delivered: "#2ECC71",
    cancelled: "#9B59B6",
};
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const MyOrders = () => {
    const dispatch = useDispatch();
    const { items: orderList, loading } = useSelector((state) => state.orders);
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (context.stateUser.isAuthenticated === false || context.stateUser.isAuthenticated === null) {
                navigation.navigate("User", { screen: "Login" });
                return () => {};
            }
            dispatch(fetchOrders());
            return () => {};
        }, [context.stateUser.isAuthenticated, navigation, dispatch])
    );

    const filteredOrders = activeFilter === "All"
        ? orderList
        : orderList.filter((o) => String(o.status).toLowerCase() === activeFilter);

    if (loading) {
        return (
            <View style={styles.center}>
                <Text style={styles.infoText}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Status filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterBar}
                contentContainerStyle={styles.filterBarContent}
            >
                {STATUS_FILTERS.map((f) => {
                    const isActive = activeFilter === f;
                    const color = STATUS_COLORS[f] || "#2a9d8f";
                    return (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.chip,
                                { borderColor: f === "All" ? "#2a9d8f" : color },
                                isActive && { backgroundColor: f === "All" ? "#2a9d8f" : color },
                            ]}
                            onPress={() => setActiveFilter(f)}
                        >
                            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {filteredOrders.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.infoText}>
                        No {activeFilter === "All" ? "" : activeFilter + " "}orders yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => String(item.id || item._id)}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setSelectedOrder(item)} activeOpacity={0.8}>
                            <OrderCard item={item} update={false} isAdmin={false} />
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Order detail bottom sheet */}
            <Modal
                visible={!!selectedOrder}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedOrder(null)}
            >
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Order Details</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.orderNum}>
                                    Order #{selectedOrder.id || selectedOrder._id}
                                </Text>
                                <Text style={styles.orderDate}>
                                    Placed:{" "}
                                    {selectedOrder.dateOrdered
                                        ? new Date(selectedOrder.dateOrdered).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "—"}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                STATUS_COLORS[String(selectedOrder.status).toLowerCase()] || "#aaa",
                                        },
                                    ]}
                                >
                                    <Text style={styles.statusBadgeText}>
                                        {String(selectedOrder.status).toUpperCase()}
                                    </Text>
                                </View>

                                <Text style={styles.sectionLabel}>Items Ordered</Text>
                                {(selectedOrder.orderItems || []).map((oi, idx) => (
                                    <View key={oi.id || idx} style={styles.itemRow}>
                                        <Image
                                            source={{ uri: oi.image || FALLBACK_IMAGE }}
                                            style={styles.itemImage}
                                        />
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName} numberOfLines={2}>
                                                {oi.name}
                                            </Text>
                                            <Text style={styles.itemUnit}>
                                                ${Number(oi.price).toFixed(2)} × {oi.quantity}
                                            </Text>
                                        </View>
                                        <Text style={styles.itemSubtotal}>
                                            ${(oi.price * oi.quantity).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}

                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalAmount}>
                                        ${Number(selectedOrder.totalPrice).toFixed(2)}
                                    </Text>
                                </View>

                                <Text style={styles.sectionLabel}>Shipping Address</Text>
                                <Text style={styles.shippingText}>
                                    {selectedOrder.shippingAddress1}
                                    {selectedOrder.shippingAddress2
                                        ? `, ${selectedOrder.shippingAddress2}`
                                        : ""}
                                </Text>
                                <Text style={styles.shippingText}>
                                    {selectedOrder.city}, {selectedOrder.zip}
                                </Text>
                                <Text style={[styles.shippingText, { marginBottom: 24 }]}>
                                    {selectedOrder.country}
                                </Text>

                                {String(selectedOrder.status).toLowerCase() === "delivered" && (
                                    <>
                                        <View style={styles.divider} />
                                        <Text style={styles.sectionLabel}>Rate Products</Text>
                                        {(selectedOrder.orderItems || []).map((oi, idx) => (
                                            <View key={oi.id || idx} style={styles.reviewRow}>
                                                <Text style={styles.reviewItemName} numberOfLines={1}>
                                                    {oi.name}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.reviewBtn}
                                                    onPress={() => {
                                                        setSelectedOrder(null);
                                                        navigation.navigate("Home", {
                                                            screen: "Product Detail",
                                                            params: {
                                                                item: {
                                                                    _id: oi.product,
                                                                    id: oi.product,
                                                                    name: oi.name,
                                                                    image: oi.image,
                                                                    price: oi.price,
                                                                },
                                                            },
                                                        });
                                                    }}
                                                >
                                                    <Ionicons name="star-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                                                    <Text style={styles.reviewBtnText}>Review Now</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" },
    infoText: { color: "#666", fontSize: 15 },

    // Filter bar
    filterBar: { flexGrow: 0, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
    filterBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: "#fff",
        marginRight: 8,
    },
    chipText: { fontSize: 13, color: "#555", fontWeight: "600" },
    chipTextActive: { color: "#fff" },

    // Modal / bottom sheet
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 20,
        maxHeight: "88%",
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sheetTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },

    orderNum: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 3 },
    orderDate: { fontSize: 13, color: "#777", marginBottom: 10 },
    statusBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 18,
    },
    statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
        marginTop: 4,
    },

    itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    itemImage: { width: 54, height: 54, borderRadius: 8, backgroundColor: "#f0f0f0", marginRight: 12 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
    itemUnit: { fontSize: 12, color: "#888", marginTop: 2 },
    itemSubtotal: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },

    divider: { height: 1, backgroundColor: "#ebebeb", marginVertical: 14 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    totalLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
    totalAmount: { fontSize: 18, fontWeight: "800", color: "#2a9d8f" },

    shippingText: { fontSize: 13, color: "#555", lineHeight: 21 },

    reviewRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    reviewItemName: { flex: 1, fontSize: 13, color: "#333", marginRight: 10 },
    reviewBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2a9d8f",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    reviewBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});

export default MyOrders;
