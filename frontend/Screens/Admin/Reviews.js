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
    TextInput,
    Modal,
} from "react-native";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import baseURL from "../../assets/common/baseurl";

const DELETE_REASONS = [
    "Inappropriate language",
    "Hate speech or harassment",
    "Spam or irrelevant content",
    "Misleading information",
    "Policy violation",
    "Other",
];

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
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [deleteModal, setDeleteModal] = useState({ visible: false, reviewId: null });
    const [deleteReason, setDeleteReason] = useState(DELETE_REASONS[0]);

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

    const openDeleteModal = (id) => {
        setDeleteReason(DELETE_REASONS[0]);
        setDeleteModal({ visible: true, reviewId: id });
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${baseURL}reviews/${deleteModal.reviewId}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { reason: deleteReason },
            });
            setReviews((prev) => prev.filter((r) => (r.id || r._id) !== deleteModal.reviewId));
            setDeleteModal({ visible: false, reviewId: null });
        } catch (_e) {
            Alert.alert("Error", "Failed to delete review");
        }
    };

    const filteredReviews = reviews.filter((r) => {
        const text = `${r.product?.name || ""} ${r.user?.name || ""} ${r.user?.email || ""} ${r.comment || ""}`.toLowerCase();
        const queryOk = !search.trim() || text.includes(search.toLowerCase());
        const ratingOk = ratingFilter === "all" || String(r.rating) === ratingFilter;
        return queryOk && ratingOk;
    });

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.filtersWrap}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by product, user, or comment"
                    value={search}
                    onChangeText={setSearch}
                />
                <View style={styles.ratingPickerWrap}>
                    <Picker selectedValue={ratingFilter} onValueChange={setRatingFilter}>
                        <Picker.Item label="All ratings" value="all" />
                        <Picker.Item label="5 stars" value="5" />
                        <Picker.Item label="4 stars" value="4" />
                        <Picker.Item label="3 stars" value="3" />
                        <Picker.Item label="2 stars" value="2" />
                        <Picker.Item label="1 star" value="1" />
                    </Picker>
                </View>
            </View>

            <FlatList
            data={filteredReviews}
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
                            onPress={() => openDeleteModal(item.id || item._id)}
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

        <Modal visible={deleteModal.visible} transparent animationType="fade" onRequestClose={() => setDeleteModal({ visible: false, reviewId: null })}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Delete Review</Text>
                    <Text style={styles.modalText}>Select a reason for deleting this review:</Text>
                    <View style={styles.reasonPickerWrap}>
                        <Picker selectedValue={deleteReason} onValueChange={setDeleteReason}>
                            {DELETE_REASONS.map((reason) => (
                                <Picker.Item key={reason} label={reason} value={reason} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModal({ visible: false, reviewId: null })}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmDelete}>
                            <Text style={styles.confirmText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    center:      { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
    emptyText:   { color: "#aaa", marginTop: 12, fontSize: 15 },
    filtersWrap: { paddingHorizontal: 12, paddingTop: 12, gap: 8 },
    searchInput: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e8e8e8",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    ratingPickerWrap: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e8e8e8",
        borderRadius: 10,
        overflow: "hidden",
    },
    card:        { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
    cardHeader:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
    productName: { fontSize: 14, fontWeight: "700", color: "#1a0a3c" },
    userName:    { fontSize: 12, color: "#666", marginTop: 1 },
    deleteBtn:   { padding: 4 },
    comment:     { fontSize: 13, color: "#444", marginTop: 6 },
    date:        { fontSize: 11, color: "#aaa", marginTop: 6 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
    },
    modalTitle: { fontSize: 17, fontWeight: "700", color: "#1a0a3c" },
    modalText: { marginTop: 8, color: "#555" },
    reasonPickerWrap: {
        borderWidth: 1,
        borderColor: "#e8e8e8",
        borderRadius: 10,
        marginTop: 10,
        overflow: "hidden",
    },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
    confirmBtn: { backgroundColor: "#e11d48", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    cancelText: { color: "#555", fontWeight: "600" },
    confirmText: { color: "#fff", fontWeight: "700" },
});

export default Reviews;
