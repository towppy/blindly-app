import React, { useCallback, useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import baseURL from "../../assets/common/baseurl";
import OrderCard from "../../Shared/OrderCard";
import AuthGlobal from "../../Context/Store/AuthGlobal";

const OrderDetail = ({ route }) => {
    const { orderId } = route.params || {};
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const context = useContext(AuthGlobal);
    const isAdmin = context?.stateUser?.user?.isAdmin === true;

    useFocusEffect(
        useCallback(() => {
            if (!orderId) {
                setError("No order ID provided");
                setLoading(false);
                return;
            }
            let isMounted = true;
            setLoading(true);
            setError("");
            getJwt()
                .then((token) =>
                    axios.get(`${baseURL}orders/${orderId}`, {
                        headers: { Authorization: `Bearer ${token || ""}` },
                    })
                )
                .then((res) => {
                    if (isMounted) {
                        setOrder(res.data);
                        setLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        setError("Failed to load order");
                        setLoading(false);
                    }
                });
            return () => {
                isMounted = false;
            };
        }, [orderId])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error || "Order not found"}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <OrderCard item={order} update={true} isAdmin={isAdmin} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    center:    { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 },
    error:     { fontSize: 16, color: "#E74C3C" },
});

export default OrderDetail;
