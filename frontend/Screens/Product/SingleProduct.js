import React, { useState, useCallback, useContext } from "react";
import {
    Image, View, StyleSheet, Text, ScrollView,
    TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews as fetchReviewsAction } from "../../Redux/Actions/reviewActions";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import Toast from "react-native-toast-message";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import baseURL from "../../assets/common/baseurl";

const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const StarRow = ({ rating, onSelect, size = 16 }) => (
    <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity
                key={i}
                onPress={() => onSelect && onSelect(i)}
                disabled={!onSelect}
                style={{ marginRight: 2 }}
            >
                <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={size}
                    color="#F1C40F"
                />
            </TouchableOpacity>
        ))}
    </View>
);

const SingleProduct = ({ route }) => {
    const [item] = useState(route.params?.item || {});
    const context = useContext(AuthGlobal);
    const isAuthenticated = context?.stateUser?.isAuthenticated;
    const isAdmin = context?.stateUser?.user?.isAdmin === true;

    const dispatch = useDispatch();
    const { items: reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);
    const [canReview, setCanReview] = useState(false);
    const [myReview, setMyReview] = useState(null);

    // New review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Edit review state
    const [editMode, setEditMode] = useState(false);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState("");

    const productId = item.id || item._id;

    const fetchReviews = useCallback(() => {
        dispatch(fetchReviewsAction(productId));
    }, [productId, dispatch]);

    const checkCanReview = useCallback(async () => {
        if (!isAuthenticated || isAdmin) return;
        try {
            const token = await getJwt();
            const res = await axios.get(`${baseURL}reviews/can-review/${productId}`, {
                headers: { Authorization: `Bearer ${token || ""}` },
            });
            setCanReview(res.data.canReview);
            if (res.data.existingReview) {
                const r = res.data.existingReview;
                setMyReview(r);
                setEditRating(r.rating);
                setEditComment(r.comment || "");
            } else {
                setMyReview(null);
            }
        } catch (e) {
            console.log("[SingleProduct] can-review error:", e.message);
        }
    }, [productId, isAuthenticated, isAdmin]);

    useFocusEffect(
        useCallback(() => {
            fetchReviews();
            checkCanReview();
        }, [fetchReviews, checkCanReview])
    );

    const submitReview = async () => {
        setSubmitting(true);
        try {
            const token = await getJwt();
            await axios.post(
                `${baseURL}reviews`,
                { productId, rating, comment },
                { headers: { Authorization: `Bearer ${token || ""}` } }
            );
            Toast.show({ type: "success", text1: "Review submitted!" });
            setComment("");
            setRating(5);
            await fetchReviews();
            await checkCanReview();
        } catch (e) {
            Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to submit review" });
        } finally {
            setSubmitting(false);
        }
    };

    const submitEdit = async () => {
        setSubmitting(true);
        try {
            const token = await getJwt();
            await axios.put(
                `${baseURL}reviews/${myReview.id || myReview._id}`,
                { rating: editRating, comment: editComment },
                { headers: { Authorization: `Bearer ${token || ""}` } }
            );
            Toast.show({ type: "success", text1: "Review updated!" });
            setEditMode(false);
            await fetchReviews();
            await checkCanReview();
        } catch (e) {
            Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to update review" });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteReview = (reviewId, isOwn = false) => {
        Alert.alert(
            "Delete Review",
            isOwn ? "Delete your review?" : "Delete this review?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getJwt();
                            await axios.delete(`${baseURL}reviews/${reviewId}`, {
                                headers: { Authorization: `Bearer ${token || ""}` },
                            });
                            if (isOwn) {
                                setMyReview(null);
                                setCanReview(true);
                                setEditMode(false);
                            }
                            fetchReviews();
                        } catch (e) {
                            Toast.show({ type: "error", text1: "Failed to delete review" });
                        }
                    },
                },
            ]
        );
    };

    // Derived values
    const categoryName =
        item.category && typeof item.category === "object"
            ? item.category.name
            : item.category || "";

    const stockCount = Number(item.countInStock || 0);
    const stockLabel =
        stockCount <= 0
            ? { text: "Out of Stock", color: "#E74C3C" }
            : stockCount <= 10
            ? { text: `Only ${stockCount} left`, color: "#F39C12" }
            : { text: "In Stock", color: "#2ECC71" };

    const avgRating =
        reviews.length
            ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
            : null;

    const myReviewId = myReview ? (myReview.id || myReview._id) : null;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Product Image */}
            <Image
                source={{ uri: item.image || FALLBACK_IMAGE }}
                resizeMode="contain"
                style={styles.image}
            />

            {/* Info block */}
            <View style={styles.infoBox}>
                <Text style={styles.name}>{item.name}</Text>

                <View style={styles.metaRow}>
                    <Ionicons name="business-outline" size={14} color="#888" />
                    <Text style={styles.metaText}>{item.brand}</Text>
                </View>

                {categoryName ? (
                    <View style={styles.metaRow}>
                        <Ionicons name="pricetag-outline" size={14} color="#888" />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{categoryName}</Text>
                        </View>
                    </View>
                ) : null}

                <View style={styles.metaRow}>
                    <Ionicons name="cube-outline" size={14} color="#888" />
                    <Text style={[styles.metaText, { color: stockLabel.color, fontWeight: "600" }]}>
                        {stockLabel.text}
                    </Text>
                </View>

                <Text style={styles.price}>${Number(item.price || 0).toFixed(2)}</Text>

                {item.description ? (
                    <View style={styles.descriptionBox}>
                        <Text style={styles.sectionLabel}>Description</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                ) : null}
            </View>

            {/* Reviews section */}
            <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeaderRow}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {avgRating ? (
                        <View style={styles.avgRow}>
                            <Ionicons name="star" size={15} color="#F1C40F" />
                            <Text style={styles.avgText}>{avgRating} ({reviews.length})</Text>
                        </View>
                    ) : null}
                </View>

                {/* Write a review form — only for authenticated non-admin who has ordered and hasn't reviewed */}
                {isAuthenticated && !isAdmin && canReview && !myReview ? (
                    <View style={styles.reviewForm}>
                        <Text style={styles.formTitle}>Write a Review</Text>
                        <StarRow rating={rating} onSelect={setRating} size={28} />
                        <TextInput
                            style={styles.input}
                            placeholder="Share your thoughts (optional)"
                            placeholderTextColor="#aaa"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={3}
                        />
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={submitReview}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Review</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* User's own review with edit/delete */}
                {isAuthenticated && !isAdmin && myReview ? (
                    <View style={[styles.reviewCard, styles.myReviewCard]}>
                        <View style={styles.reviewTopRow}>
                            <Text style={styles.reviewUserName}>Your Review</Text>
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    onPress={() => setEditMode((v) => !v)}
                                    style={styles.iconBtn}
                                >
                                    <Ionicons name="pencil-outline" size={18} color="#7c3aed" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => deleteReview(myReviewId, true)}
                                    style={styles.iconBtn}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {editMode ? (
                            <>
                                <StarRow rating={editRating} onSelect={setEditRating} size={28} />
                                <TextInput
                                    style={styles.input}
                                    value={editComment}
                                    onChangeText={setEditComment}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Update your comment"
                                    placeholderTextColor="#aaa"
                                />
                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={submitEdit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <StarRow rating={myReview.rating} />
                                {myReview.comment ? (
                                    <Text style={styles.reviewComment}>{myReview.comment}</Text>
                                ) : null}
                            </>
                        )}
                    </View>
                ) : null}

                {/* All other reviews */}
                {reviewsLoading ? (
                    <ActivityIndicator color="#7c3aed" style={{ marginTop: 16 }} />
                ) : reviews.length === 0 ? (
                    <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
                ) : (
                    reviews
                        .filter((r) => {
                            // Don't duplicate the current user's review (already shown above)
                            if (!isAdmin && myReviewId && (r.id || r._id) === myReviewId) return false;
                            return true;
                        })
                        .map((r) => (
                            <View key={r.id || r._id} style={styles.reviewCard}>
                                <View style={styles.reviewTopRow}>
                                    <Text style={styles.reviewUserName}>
                                        {r.user?.name || "User"}
                                    </Text>
                                    <View style={styles.actionRow}>
                                        <Text style={styles.reviewDate}>
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                                        </Text>
                                        {isAdmin ? (
                                            <TouchableOpacity
                                                onPress={() => deleteReview(r.id || r._id)}
                                                style={styles.iconBtn}
                                            >
                                                <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                                <StarRow rating={r.rating} />
                                {r.comment ? (
                                    <Text style={styles.reviewComment}>{r.comment}</Text>
                                ) : null}
                            </View>
                        ))
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: "#f5f5f5" },
    image:           { width: "100%", height: 260, backgroundColor: "#fff" },

    infoBox:         { backgroundColor: "#fff", padding: 20, marginBottom: 8 },
    name:            { fontSize: 22, fontWeight: "800", color: "#1a0a3c", marginBottom: 8 },
    metaRow:         { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
    metaText:        { fontSize: 14, color: "#555" },
    badge:           { backgroundColor: "#ede8fa", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText:       { color: "#7c3aed", fontSize: 12, fontWeight: "600" },
    price:           { fontSize: 24, fontWeight: "800", color: "#e91e63", marginTop: 10, marginBottom: 4 },
    descriptionBox:  { marginTop: 14 },
    sectionLabel:    { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", marginBottom: 4 },
    description:     { fontSize: 14, color: "#444", lineHeight: 21 },

    reviewsSection:  { backgroundColor: "#fff", padding: 20 },
    reviewsHeaderRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    sectionTitle:    { fontSize: 18, fontWeight: "700", color: "#1a0a3c" },
    avgRow:          { flexDirection: "row", alignItems: "center", gap: 4 },
    avgText:         { fontSize: 14, fontWeight: "600", color: "#555" },

    reviewForm:      { backgroundColor: "#f8f4ff", borderRadius: 12, padding: 16, marginBottom: 16 },
    formTitle:       { fontSize: 15, fontWeight: "700", color: "#1a0a3c", marginBottom: 10 },
    input:           {
        borderWidth: 1, borderColor: "#ddd", borderRadius: 8,
        padding: 10, marginTop: 10, marginBottom: 10,
        fontSize: 14, color: "#333", minHeight: 70, textAlignVertical: "top",
        backgroundColor: "#fff",
    },
    submitBtn:       { backgroundColor: "#7c3aed", borderRadius: 8, padding: 12, alignItems: "center" },
    submitBtnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },

    reviewCard:      { backgroundColor: "#f9f9f9", borderRadius: 10, padding: 14, marginBottom: 10 },
    myReviewCard:    { borderWidth: 1.5, borderColor: "#ede8fa", backgroundColor: "#faf8ff" },
    reviewTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    reviewUserName:  { fontSize: 14, fontWeight: "700", color: "#1a0a3c" },
    reviewDate:      { fontSize: 11, color: "#aaa" },
    reviewComment:   { fontSize: 13, color: "#444", marginTop: 6, lineHeight: 19 },
    actionRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBtn:         { padding: 2 },
    noReviews:       { color: "#aaa", fontSize: 14, textAlign: "center", marginTop: 16 },
});

export default SingleProduct;
