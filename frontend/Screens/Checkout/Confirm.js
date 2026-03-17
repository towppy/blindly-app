import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import Toast from "react-native-toast-message";
import { clearCart } from "../../Redux/Actions/cartActions";
import styles, { COLORS } from "../../Shared/Checkout/Confirm.styles";

const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const AddressRow = ({ icon, label, value }) => (
    value ? (
        <View style={styles.addressRow}>
            <View style={styles.addressIconWrap}>
                <Ionicons name={icon} size={16} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.addressFieldLabel}>{label}</Text>
                <Text style={styles.addressFieldValue}>{value}</Text>
            </View>
        </View>
    ) : null
);

const Confirm = (props) => {
    const finalOrder = props.route.params;
    const order = finalOrder?.order;
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const computedSubtotal = (order?.orderItems || []).reduce((sum, item) => {
        return sum + Number(item?.price || 0) * Number(item?.quantity || 1);
    }, 0);
    const subtotal = Number(order?.subtotal ?? computedSubtotal);
    const discount = Number(order?.discountAmount || 0);
    const grandTotal = Number(order?.totalAmount ?? Math.max(0, subtotal - discount));

    const confirmOrder = () => {
        getJwt()
            .then((res) => {
                const config = { headers: { Authorization: "Bearer " + res } };
                return axios.post(`${baseURL}orders`, order, config);
            })
            .then(() => {
                Toast.show({ topOffset: 60, type: "success", text1: "Order placed!" });
                setTimeout(() => {
                    dispatch(clearCart());
                    navigation.navigate("Cart Screen", { screen: "Cart" });
                }, 500);
            })
            .catch(() => {
                Toast.show({ topOffset: 60, type: "error", text1: "Something went wrong", text2: "Please try again" });
            });
    };

    if (!order) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="receipt-outline" size={34} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyText}>No order data found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.surface}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.topBar}>
                    <TouchableOpacity style={[styles.topBarBtn, styles.backBtn]} onPress={() => navigation.goBack()} activeOpacity={0.75}>
                        <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.topBarBtn, styles.cancelBtn]} onPress={() => navigation.navigate("Home")} activeOpacity={0.75}>
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.heading}>Confirm Order</Text>

                <View style={styles.shippingCard}>
                    <Text style={styles.sectionLabel}>Shipping To</Text>
                    <AddressRow icon="location-outline"  label="Address"    value={order.shippingAddress1} />
                    {order.shippingAddress2 ? <><View style={styles.divider} /><AddressRow icon="business-outline" label="Address 2" value={order.shippingAddress2} /></> : null}
                    <View style={styles.divider} />
                    <AddressRow icon="map-outline"       label="City"       value={order.city} />
                    <View style={styles.divider} />
                    <AddressRow icon="mail-outline"      label="Zip Code"   value={order.zip} />
                    <View style={styles.divider} />
                    <AddressRow icon="globe-outline"     label="Country"    value={order.country} />
                </View>

                <View style={styles.itemsCard}>
                    <Text style={styles.sectionLabel}>Items</Text>
                    {order.orderItems?.map((item, idx) => (
                        <React.Fragment key={item.id || item._id || idx}>
                            <View style={styles.itemRow}>
                                <View style={styles.itemImageWrap}>
                                    <Image source={{ uri: item.image || FALLBACK_IMAGE }} style={styles.itemImage} resizeMode="cover" />
                                </View>
                                <View style={styles.itemInfoWrap}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.itemMeta}>
                                        ₱{Number(item.price || 0).toFixed(2)} x {Number(item.quantity || 1)}
                                    </Text>
                                </View>
                                <Text style={styles.itemPrice}>
                                    ₱{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                                </Text>
                            </View>
                            {idx < order.orderItems.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                <View style={styles.totalsCard}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>₱{subtotal.toFixed(2)}</Text>
                    </View>
                    {discount > 0 ? (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Discount</Text>
                            <Text style={styles.discountValue}>-₱{discount.toFixed(2)}</Text>
                        </View>
                    ) : null}
                    <View style={[styles.divider, { marginVertical: 8 }]} />
                    <View style={styles.totalRow}>
                        <Text style={styles.grandTotalLabel}>Grand Total</Text>
                        <Text style={styles.grandTotalValue}>₱{grandTotal.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.placeOrderBtn} onPress={confirmOrder} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                    <Text style={styles.placeOrderBtnText}>Place Order</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

export default Confirm;