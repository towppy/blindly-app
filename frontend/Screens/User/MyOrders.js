import React, { useCallback, useContext, useState } from "react";
import {
    View, FlatList, Text, TouchableOpacity,
    Modal, ScrollView, Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../Redux/Actions/orderActions";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import OrderCard from "../../Shared/OrderCard";
import { Ionicons } from "@expo/vector-icons";

import styles, { STATUS_FILTERS, STATUS_COLORS, COLORS, FALLBACK_IMAGE } from "../../Shared/User/MyOrders.styles";

const MyOrders = () => {
    const dispatch = useDispatch();
    const { items: orderList, loading } = useSelector((state) => state.orders);
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedOrder, setSelectedOrder] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (
                context.stateUser.isAuthenticated === false ||
                context.stateUser.isAuthenticated === null
            ) {
                navigation.navigate("User", { screen: "Login" });
                return;
            }
            dispatch(fetchOrders());
        }, [context.stateUser.isAuthenticated, navigation, dispatch])
    );

    const filteredOrders =
        activeFilter === "All"
            ? orderList
            : orderList.filter(
                  (o) => String(o.status).toLowerCase() === activeFilter.toLowerCase()
              );

    if (loading) {
        return (
            <View style={styles.center}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="time-outline" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.loadingText}>Loading your orders…</Text>
            </View>
        );
    }

    const chipLabel = (f) =>
        f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);

    const chipBorderColor = (f) =>
        f === "All" ? COLORS.primary : STATUS_COLORS[f.toLowerCase()] ?? COLORS.primary;

    const chipActiveColor = (f) =>
        f === "All" ? COLORS.primary : STATUS_COLORS[f.toLowerCase()] ?? COLORS.primary;

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterBar}
                contentContainerStyle={styles.filterBarContent}
            >
                {STATUS_FILTERS.map((f) => {
                    const isActive = activeFilter === f;
                    return (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.chip,
                                { borderColor: chipBorderColor(f) },
                                isActive && [
                                    styles.chipActive,
                                    { backgroundColor: chipActiveColor(f), borderColor: chipActiveColor(f) },
                                ],
                            ]}
                            onPress={() => setActiveFilter(f)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                {chipLabel(f)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {filteredOrders.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="bag-outline" size={32} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyText}>
                        No {activeFilter === "All" ? "" : activeFilter + " "}orders yet
                    </Text>
                    <Text style={styles.emptySubtext}>
                        Your {activeFilter !== "All" ? activeFilter : ""} orders will appear here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => String(item.id || item._id || Math.random())}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.cardWrapper}
                            onPress={() => setSelectedOrder(item)}
                            activeOpacity={0.82}
                        >
                            <OrderCard item={item} update={false} isAdmin={false} />
                        </TouchableOpacity>
                    )}
                />
            )}

            <Modal
                visible={!!selectedOrder}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedOrder(null)}
            >
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <View style={styles.dragHandle} />

                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Order Details</Text>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedOrder(null)}
                            >
                                <Ionicons name="close" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.orderMeta}>
                                    <Text style={styles.orderNum}>
                                        Order #{selectedOrder.id || selectedOrder._id}
                                    </Text>
                                    <Text style={styles.orderDate}>
                                        {selectedOrder.dateOrdered
                                            ? new Date(selectedOrder.dateOrdered).toLocaleDateString(
                                                  "en-US",
                                                  { year: "numeric", month: "long", day: "numeric" }
                                              )
                                            : "Date unavailable"}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor:
                                                    STATUS_COLORS[
                                                        String(selectedOrder.status).toLowerCase()
                                                    ] ?? "#aaa",
                                            },
                                        ]}
                                    >
                                        <Text style={styles.statusBadgeText}>
                                            {String(selectedOrder.status).toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.sectionLabel}>Items Ordered</Text>
                                {(selectedOrder.orderItems || []).map((oi, idx) => (
                                    <View key={oi.id || oi._id || `item-${idx}`} style={styles.itemRow}>
                                        <View style={styles.itemImageWrapper}>
                                            <Image
                                                source={{ uri: oi.image || FALLBACK_IMAGE }}
                                                style={styles.itemImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName} numberOfLines={2}>
                                                {oi.name || "Product"}
                                            </Text>
                                            <Text style={styles.itemUnit}>
                                                ₱{Number(oi.price || 0).toFixed(2)} × {oi.quantity || 0}
                                            </Text>
                                        </View>
                                        <Text style={styles.itemSubtotal}>
                                            ₱{((oi.price || 0) * (oi.quantity || 0)).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}

                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total Amount</Text>
                                    <Text style={styles.totalAmount}>
                                        ₱{Number(selectedOrder.totalPrice || 0).toFixed(2)}
                                    </Text>
                                </View>

                                <Text style={styles.sectionLabel}>Shipping Address</Text>
                                <View style={styles.shippingBox}>
                                    <Text style={styles.shippingText}>
                                        {selectedOrder.shippingAddress1 || ""}
                                        {selectedOrder.shippingAddress2
                                            ? `, ${selectedOrder.shippingAddress2}`
                                            : ""}
                                    </Text>
                                    <Text style={styles.shippingText}>
                                        {selectedOrder.city || ""}, {selectedOrder.zip || ""}
                                    </Text>
                                    <Text style={styles.shippingText}>
                                        {selectedOrder.country || ""}
                                    </Text>
                                </View>

                                {String(selectedOrder.status || "").toLowerCase() === "delivered" && (
                                    <>
                                        <View style={styles.divider} />
                                        <Text style={styles.sectionLabel}>Rate Products</Text>
                                        {(selectedOrder.orderItems || []).map((oi, idx) => (
                                            <View key={oi.id || oi._id || `review-${idx}`} style={styles.reviewRow}>
                                                <Text style={styles.reviewItemName} numberOfLines={1}>
                                                    {oi.name || "Product"}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.reviewBtn}
                                                    activeOpacity={0.8}
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
                                                    <Ionicons
                                                        name="star"
                                                        size={13}
                                                        color="#fff"
                                                        style={{ marginRight: 5 }}
                                                    />
                                                    <Text style={styles.reviewBtnText}>Review</Text>
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

export default MyOrders;