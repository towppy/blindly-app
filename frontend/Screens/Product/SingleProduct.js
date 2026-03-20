import React, { useState, useCallback, useContext, useRef } from "react";
import {
    Image, View, StyleSheet, Text, ScrollView,
    TouchableOpacity, TextInput, ActivityIndicator, Alert,
    FlatList, Dimensions, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews as fetchReviewsAction } from "../../Redux/Actions/reviewActions";
import { addToCart, updateCartItemQuantity } from "../../Redux/Actions/cartActions";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import mime from "mime";
import Toast from "react-native-toast-message";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import baseURL from "../../assets/common/baseurl";
import { Picker } from "@react-native-picker/picker";

const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";
const ADMIN_DELETE_REASONS = [
    "Inappropriate language",
    "Hate speech or harassment",
    "Spam or irrelevant content",
    "Misleading information",
    "Policy violation",
    "Other",
];

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
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);
    const isAuthenticated = context?.stateUser?.isAuthenticated;
    const isAdmin = context?.stateUser?.user?.isAdmin === true;
    const [quantity, setQuantity] = useState(1);

    const dispatch = useDispatch();
    const { items: reviews, loading: reviewsLoading } = useSelector((state) => state.reviews);
    const cartItems = useSelector((state) => state.cartItems);
    const [canReview, setCanReview] = useState(false);
    const [myReview, setMyReview] = useState(null);
    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");

    // New review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviewImages, setReviewImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Edit review state
    const [editMode, setEditMode] = useState(false);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState("");
    const [editImages, setEditImages] = useState([]);
    const [adminDeleteModal, setAdminDeleteModal] = useState({ visible: false, reviewId: null });
    const [adminDeleteReason, setAdminDeleteReason] = useState(ADMIN_DELETE_REASONS[0]);

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
            setEligibleOrders(res.data.eligibleOrders || []);
            if (res.data.eligibleOrders && res.data.eligibleOrders.length > 0) {
                setSelectedOrderId(res.data.eligibleOrders[0]._id);
            } else {
                setSelectedOrderId("");
            }
            const ownReview = Array.isArray(res.data.existingReviews) && res.data.existingReviews.length > 0
                ? res.data.existingReviews[0]
                : null;

            if (ownReview) {
                const r = ownReview;
                setMyReview(r);
                setEditRating(r.rating);
                setEditComment(r.comment || "");
                setEditImages(Array.isArray(r.images) ? r.images : []);
            } else {
                setMyReview(null);
                setEditImages([]);
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
            if (!selectedOrderId) {
                Toast.show({ type: "error", text1: "Please select an order to review" });
                setSubmitting(false);
                return;
            }
            const token = await getJwt();
            const formData = new FormData();
            formData.append("productId", productId);
            formData.append("orderId", selectedOrderId);
            formData.append("rating", String(rating));
            formData.append("comment", comment || "");
            reviewImages.forEach((uri, idx) => {
                formData.append("images", {
                    uri,
                    type: mime.getType(uri) || "image/jpeg",
                    name: uri.split("/").pop() || `review-${idx}.jpg`,
                });
            });
            await axios.post(
                `${baseURL}reviews`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token || ""}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            Toast.show({ type: "success", text1: "Review submitted!" });
            setComment("");
            setRating(5);
            setReviewImages([]);
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
            const formData = new FormData();
            formData.append("rating", String(editRating));
            formData.append("comment", editComment || "");
            const existingRemote = editImages.filter((uri) => String(uri).startsWith("http"));
            existingRemote.forEach((url) => formData.append("existingImages", url));
            editImages
                .filter((uri) => String(uri).startsWith("file://") || String(uri).startsWith("content://"))
                .forEach((uri, idx) => {
                    formData.append("images", {
                        uri,
                        type: mime.getType(uri) || "image/jpeg",
                        name: uri.split("/").pop() || `review-edit-${idx}.jpg`,
                    });
                });
            await axios.put(
                `${baseURL}reviews/${myReview.id || myReview._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token || ""}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
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
        if (isAdmin && !isOwn) {
            setAdminDeleteReason(ADMIN_DELETE_REASONS[0]);
            setAdminDeleteModal({ visible: true, reviewId });
            return;
        }

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

    const confirmAdminDelete = async () => {
        try {
            const token = await getJwt();
            await axios.delete(`${baseURL}reviews/${adminDeleteModal.reviewId}`, {
                headers: { Authorization: `Bearer ${token || ""}` },
                data: { reason: adminDeleteReason },
            });
            setAdminDeleteModal({ visible: false, reviewId: null });
            fetchReviews();
        } catch (_e) {
            Toast.show({ type: "error", text1: "Failed to delete review" });
        }
    };

    const pickImages = async (mode = "new") => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            Toast.show({ type: "error", text1: "Gallery permission is required" });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const uris = (result.assets || []).map((a) => a.uri).filter(Boolean);
            if (mode === "edit") {
                setEditImages((prev) => [...prev, ...uris].slice(0, 5));
            } else {
                setReviewImages((prev) => [...prev, ...uris].slice(0, 5));
            }
        }
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
    const originalPrice = Number(item.originalPrice || item.price || 0);
    const discountedPrice = Number(item.effectivePrice || item.price || 0);
    const promoActive = item.hasActivePromo === true && discountedPrice < originalPrice;

    const increaseQty = () => {
        if (quantity < Math.max(1, stockCount)) {
            setQuantity((prev) => prev + 1);
        }
    };

    const decreaseQty = () => {
        if (quantity > 1) {
            setQuantity((prev) => prev - 1);
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Toast.show({ type: "error", text1: "Please login first" });
            navigation.navigate("User", { screen: "Login" });
            return false;
        }
        if (isAdmin) {
            Toast.show({ type: "error", text1: "Admin accounts cannot place orders" });
            return false;
        }
        if (stockCount <= 0) {
            Toast.show({ type: "error", text1: "Product is out of stock" });
            return false;
        }

        const productRef = String(item.id || item._id || "");
        const existing = (cartItems || []).find(
            (cartItem) => String(cartItem.id || cartItem._id || "") === productRef
        );

        if (existing) {
            const existingQty = Number(existing.quantity || 1);
            const mergedQty = Math.min(existingQty + Number(quantity || 1), Math.max(1, stockCount));
            dispatch(updateCartItemQuantity(existing, mergedQty, context?.stateUser?.user?.email));
            Toast.show({ type: "success", text1: "Cart quantity updated" });
        } else {
            dispatch(
                addToCart(
                    {
                        ...item,
                        quantity,
                        originalPrice,
                        price: promoActive ? discountedPrice : originalPrice,
                    },
                    context?.stateUser?.user?.email
                )
            );
            Toast.show({ type: "success", text1: "Added to cart" });
        }

        return true;
    };

    const handleOrderNow = () => {
        const added = handleAddToCart();
        if (!added) return;
        navigation.navigate("Cart Screen", { screen: "Checkout" });
    };

    // Carousel logic
    // Ensure imagesArr is always an array of strings
    let imagesArr = [];
    if (Array.isArray(item.images) && item.images.length > 0) {
        imagesArr = item.images.filter(Boolean).map(String);
    } else if (item.image) {
        imagesArr = [String(item.image)];
    } else {
        imagesArr = [FALLBACK_IMAGE];
    }
    if (!Array.isArray(imagesArr) || imagesArr.length === 0) {
        console.warn('[SingleProduct] imagesArr is not valid:', imagesArr);
    }
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);
    const windowWidth = Dimensions.get('window').width;

    const onViewRef = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    });
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Product Images Carousel with indicators */}
            <View style={styles.carouselWrapper}>
                <FlatList
                    ref={flatListRef}
                    data={imagesArr}
                    keyExtractor={(img, idx) => img + idx}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={true}
                    renderItem={({ item: img }) => (
                        <Image
                            source={{ uri: img || FALLBACK_IMAGE }}
                            resizeMode="contain"
                            style={[styles.image, { width: windowWidth }]}
                        />
                    )}
                    onViewableItemsChanged={onViewRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    initialNumToRender={1}
                    windowSize={2}
                />
                {/* Dots indicator */}
                <View style={styles.dotsContainer}>
                    {imagesArr.map((_, idx) => (
                        <View
                            key={idx}
                            style={[styles.dot, activeIndex === idx && styles.activeDot]}
                        />
                    ))}
                </View>
            </View>

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

                {promoActive ? (
                    <View style={styles.promoPriceWrap}>
                        <View style={styles.promoPriceRow}>
                            <Text style={styles.promoPrice}>P{discountedPrice.toFixed(2)}</Text>
                            <Text style={styles.originalPrice}>P{originalPrice.toFixed(2)}</Text>
                            {!!item.promo?.name && <Text style={styles.promoNameTag}>{item.promo.name}</Text>}
                        </View>
                        <Text style={styles.promoEndsText}>
                            Ends in: {item.promo?.endsAt ? new Date(item.promo.endsAt).toLocaleDateString() : "-"}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.price}>P{originalPrice.toFixed(2)}</Text>
                )}

                <View style={styles.purchaseBox}>
                    <View style={styles.quantityRow}>
                        <Text style={styles.quantityLabel}>Quantity</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={decreaseQty}>
                                <Ionicons name="remove" size={16} color="#7c3aed" />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.qtyBtn, quantity >= Math.max(1, stockCount) && styles.qtyBtnDisabled]}
                                onPress={increaseQty}
                                disabled={quantity >= Math.max(1, stockCount)}
                            >
                                <Ionicons name="add" size={16} color="#7c3aed" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={[styles.cartBtn, stockCount <= 0 && styles.disabledAction]}
                            onPress={handleAddToCart}
                            disabled={stockCount <= 0}
                        >
                            <Ionicons name="cart-outline" size={16} color="#7c3aed" />
                            <Text style={styles.cartBtnText}>Add to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.orderBtn, stockCount <= 0 && styles.disabledAction]}
                            onPress={handleOrderNow}
                            disabled={stockCount <= 0}
                        >
                            <Ionicons name="flash-outline" size={16} color="#fff" />
                            <Text style={styles.orderBtnText}>Order Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
                        {eligibleOrders.length > 1 && (
                            <View style={{ marginBottom: 10 }}>
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#7c3aed", marginBottom: 4 }}>Select Order</Text>
                                <Picker
                                    selectedValue={selectedOrderId}
                                    onValueChange={setSelectedOrderId}
                                    style={{ backgroundColor: "#f5f1ff", borderRadius: 8 }}
                                >
                                    {eligibleOrders.map((order) => (
                                        <Picker.Item
                                            key={order._id}
                                            label={`Order #${order._id.slice(-6)} (${new Date(order.dateOrdered).toLocaleDateString()})`}
                                            value={order._id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        )}
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
                        <TouchableOpacity style={styles.pickImageBtn} onPress={() => pickImages("new")}> 
                            <Ionicons name="images-outline" size={16} color="#7c3aed" />
                            <Text style={styles.pickImageBtnText}>Upload review images</Text>
                        </TouchableOpacity>
                        {reviewImages.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                {reviewImages.map((uri, idx) => (
                                    <View key={`${uri}-${idx}`} style={styles.previewWrap}>
                                        <Image source={{ uri }} style={styles.previewImage} />
                                        <TouchableOpacity
                                            style={styles.previewRemove}
                                            onPress={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                                        >
                                            <Ionicons name="close" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : null}
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
                                <TouchableOpacity style={styles.pickImageBtn} onPress={() => pickImages("edit")}>
                                    <Ionicons name="images-outline" size={16} color="#7c3aed" />
                                    <Text style={styles.pickImageBtnText}>Manage review images</Text>
                                </TouchableOpacity>
                                {editImages.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                        {editImages.map((uri, idx) => (
                                            <View key={`${uri}-${idx}`} style={styles.previewWrap}>
                                                <Image source={{ uri }} style={styles.previewImage} />
                                                <TouchableOpacity
                                                    style={styles.previewRemove}
                                                    onPress={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                                                >
                                                    <Ionicons name="close" size={14} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : null}
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
                                {Array.isArray(myReview.images) && myReview.images.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                        {myReview.images.map((uri, idx) => (
                                            <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.reviewImage} />
                                        ))}
                                    </ScrollView>
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
                                {Array.isArray(r.images) && r.images.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                        {r.images.map((uri, idx) => (
                                            <Image key={`${uri}-${idx}`} source={{ uri }} style={styles.reviewImage} />
                                        ))}
                                    </ScrollView>
                                ) : null}
                            </View>
                        ))
                )}
            </View>
            <View style={{ height: 40 }} />

            <Modal
                visible={adminDeleteModal.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setAdminDeleteModal({ visible: false, reviewId: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Delete Review</Text>
                        <Text style={styles.modalText}>Select reason for deletion:</Text>
                        <View style={styles.reasonPickerWrap}>
                            <Picker selectedValue={adminDeleteReason} onValueChange={setAdminDeleteReason}>
                                {ADMIN_DELETE_REASONS.map((reason) => (
                                    <Picker.Item key={reason} label={reason} value={reason} />
                                ))}
                            </Picker>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAdminDeleteModal({ visible: false, reviewId: null })}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={confirmAdminDelete}>
                                <Text style={styles.confirmText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: "#f5f5f5" },
    carouselWrapper: { width: "100%", height: 260, backgroundColor: "#fff", alignItems: 'center', justifyContent: 'center' },
    image:           { height: 260, backgroundColor: "#fff", borderRadius: 8 },
    dotsContainer:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 10, left: 0, right: 0 },
    dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc', marginHorizontal: 4 },
    activeDot:       { backgroundColor: '#7c3aed', width: 12, height: 12, borderRadius: 6 },

    infoBox:         { backgroundColor: "#fff", padding: 20, marginBottom: 8 },
    name:            { fontSize: 22, fontWeight: "800", color: "#1a0a3c", marginBottom: 8 },
    metaRow:         { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 },
    metaText:        { fontSize: 14, color: "#555" },
    badge:           { backgroundColor: "#ede8fa", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText:       { color: "#7c3aed", fontSize: 12, fontWeight: "600" },
    price:           { fontSize: 24, fontWeight: "800", color: "#e91e63", marginTop: 10, marginBottom: 4 },
    promoPriceWrap:  { marginTop: 10, marginBottom: 4 },
    promoPriceRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
    promoPrice:      { fontSize: 24, fontWeight: "800", color: "#e91e63" },
    originalPrice:   { fontSize: 15, color: "#9b8ec4", textDecorationLine: "line-through", fontWeight: "600" },
    promoNameTag:    { fontSize: 11, color: "#0f766e", backgroundColor: "#d1fae5", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, fontWeight: "700" },
    promoEndsText:   { marginTop: 2, color: "#7c3aed", fontWeight: "700", fontSize: 12 },
    purchaseBox:     { marginTop: 12, marginBottom: 6 },
    quantityRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    quantityLabel:   { fontSize: 14, fontWeight: "700", color: "#3d2c8d" },
    quantityControls:{ flexDirection: "row", alignItems: "center", gap: 10 },
    qtyBtn:          {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#d8cef0",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyBtnDisabled:  { opacity: 0.4 },
    qtyValue:        { minWidth: 20, textAlign: "center", fontSize: 15, fontWeight: "700", color: "#1a0a3c" },
    actionButtonsRow:{ flexDirection: "row", marginTop: 12, gap: 10 },
    cartBtn:         {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#7c3aed",
        borderRadius: 10,
        paddingVertical: 10,
        backgroundColor: "#f5f1ff",
    },
    cartBtnText:     { color: "#7c3aed", fontWeight: "700" },
    orderBtn:        {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 10,
        paddingVertical: 10,
        backgroundColor: "#7c3aed",
    },
    orderBtnText:    { color: "#fff", fontWeight: "700" },
    disabledAction:  { opacity: 0.45 },
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
    pickImageBtn:    {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    pickImageBtnText:{ color: "#7c3aed", fontWeight: "600", fontSize: 13 },
    previewWrap:     { marginRight: 8, position: "relative" },
    previewImage:    { width: 58, height: 58, borderRadius: 8, backgroundColor: "#eee" },
    previewRemove:   {
        position: "absolute",
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#e11d48",
        alignItems: "center",
        justifyContent: "center",
    },
    submitBtn:       { backgroundColor: "#7c3aed", borderRadius: 8, padding: 12, alignItems: "center" },
    submitBtnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },

    reviewCard:      { backgroundColor: "#f9f9f9", borderRadius: 10, padding: 14, marginBottom: 10 },
    myReviewCard:    { borderWidth: 1.5, borderColor: "#ede8fa", backgroundColor: "#faf8ff" },
    reviewTopRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    reviewUserName:  { fontSize: 14, fontWeight: "700", color: "#1a0a3c" },
    reviewDate:      { fontSize: 11, color: "#aaa" },
    reviewComment:   { fontSize: 13, color: "#444", marginTop: 6, lineHeight: 19 },
    reviewImage:     { width: 72, height: 72, borderRadius: 8, marginRight: 8, backgroundColor: "#eee" },
    actionRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBtn:         { padding: 2 },
    noReviews:       { color: "#aaa", fontSize: 14, textAlign: "center", marginTop: 16 },
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
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#1a0a3c" },
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

export default SingleProduct;
