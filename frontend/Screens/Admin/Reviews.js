import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from "react-native";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../../assets/common/baseurl";

const Stars = ({ rating }) => (
    <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons
                key={i}
                name={i <= rating ? "star" : "star-outline"}
                size={14}
                color="#F1C40F"
            />
        ))}
    </View>
);

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState("");

    const fetchReviews = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const jwt = await getJwt();
            setToken(jwt || "");
            const res = await axios.get(`${baseURL}reviews`, {
                headers: { Authorization: `Bearer ${jwt || ""}` },
            });
            setReviews(res.data || []);
        } catch (e) {
            console.log("[Reviews] error:", e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchReviews();
        }, [fetchReviews])
    );

    const deleteReview = (id) => {
        Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await axios.delete(`${baseURL}reviews/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        setReviews((prev) => prev.filter((r) => (r.id || r._id) !== id));
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete review");
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id || item._id)}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews(true)} />
            }
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={
                <View style={styles.center}>
                    <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No reviews yet</Text>
                </View>
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productName} numberOfLines={1}>
                                {item.product?.name || "Unknown product"}
                            </Text>
                            <Text style={styles.userName}>
                                by {item.user?.name || item.user?.email || "Unknown user"}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => deleteReview(item.id || item._id)}
                            style={styles.deleteBtn}
                        >
                            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>
                    <Stars rating={item.rating} />
                    {item.comment ? (
                        <Text style={styles.comment}>{item.comment}</Text>
                    ) : null}
                    <Text style={styles.date}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </Text>
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    center:      { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
    emptyText:   { color: "#aaa", marginTop: 12, fontSize: 15 },
    card:        { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
    cardHeader:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
    productName: { fontSize: 14, fontWeight: "700", color: "#1a0a3c" },
    userName:    { fontSize: 12, color: "#666", marginTop: 1 },
    deleteBtn:   { padding: 4 },
    comment:     { fontSize: 13, color: "#444", marginTop: 6 },
    date:        { fontSize: 11, color: "#aaa", marginTop: 6 },
});

export default Reviews;
