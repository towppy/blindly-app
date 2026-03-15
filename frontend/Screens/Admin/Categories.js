import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    ActivityIndicator,
    Animated,
    PanResponder,
    TouchableOpacity,
    Modal,
    Pressable,
    Keyboard,
} from "react-native";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";
import { getJwt } from "../../assets/common/jwtStore";
import styles, { width, COLORS } from "../../Shared/Admin/Categories.styles";

// ─── Constants ────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = width * 0.25;
const ACTION_WIDTH    = 72;

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
const ConfirmModal = ({ visible, categoryName, onConfirm, onCancel }) => (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
        <Pressable style={styles.modalOverlay} onPress={onCancel}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
                <Text style={styles.modalIcon}>🗑️</Text>
                <Text style={styles.modalTitle}>Delete Category?</Text>
                <Text style={styles.modalBody}>
                    <Text style={styles.modalBold}>"{categoryName}"</Text> will be permanently removed.
                </Text>
                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
                        <Text style={styles.modalConfirmText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Pressable>
    </Modal>
);

// ─── Category Form Modal (Add & Edit) ─────────────────────────────────────────
const CategoryFormModal = ({ visible, editingItem, onSubmit, onCancel, isSubmitting }) => {
    const [name, setName] = useState("");
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setName(editingItem?.name || "");
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
                Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            scaleAnim.setValue(0.85);
            fadeAnim.setValue(0);
        }
    }, [visible, editingItem]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        Keyboard.dismiss();
        onSubmit(name.trim());
    };

    const isEditing = !!editingItem;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onCancel}>
            <Pressable style={styles.modalOverlay} onPress={onCancel}>
                <Animated.View
                    style={[styles.modalCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
                >
                    <Pressable onPress={() => {}}>
                        <Text style={styles.modalIcon}>{isEditing ? "✏️" : "🏷️"}</Text>
                        <Text style={styles.modalTitle}>{isEditing ? "Edit Category" : "New Category"}</Text>
                        <Text style={styles.modalSubtitle}>
                            {isEditing ? "Update the category name below." : "Enter a name for the new category."}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Category name"
                            placeholderTextColor={COLORS.textFaint}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, !name.trim() && styles.modalConfirmBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={!name.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>{isEditing ? "Update" : "Add"}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ isFiltered }) => {
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.emptyIcon}>{isFiltered ? "🔍" : "🏷️"}</Text>
            <Text style={styles.emptyTitle}>{isFiltered ? "No results found" : "No categories yet"}</Text>
            <Text style={styles.emptySubtitle}>{isFiltered ? "Try a different search term" : "Tap + to add your first category"}</Text>
        </Animated.View>
    );
};

// ─── Swipeable Item ───────────────────────────────────────────────────────────
const SwipeableItem = ({ item, onEdit, onDeleteRequest, isDeleting }) => {
    const translateX   = useRef(new Animated.Value(0)).current;
    const entranceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(entranceAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    }, []);

    const resetSwipe = useCallback(() => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
    }, [translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 15,
            onPanResponderMove: (_, g) => {
                const clamped = Math.max(-ACTION_WIDTH * 1.4, Math.min(ACTION_WIDTH * 1.4, g.dx));
                translateX.setValue(clamped);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < -SWIPE_THRESHOLD) {
                    Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true, friction: 6 }).start();
                } else if (g.dx > SWIPE_THRESHOLD) {
                    Animated.spring(translateX, { toValue: ACTION_WIDTH, useNativeDriver: true, friction: 6 }).start();
                } else {
                    resetSwipe();
                }
            },
        })
    ).current;

    const deleteOpacity = translateX.interpolate({ inputRange: [-ACTION_WIDTH, 0], outputRange: [1, 0.3], extrapolate: "clamp" });
    const editOpacity   = translateX.interpolate({ inputRange: [0, ACTION_WIDTH], outputRange: [0.3, 1], extrapolate: "clamp" });

    return (
        <Animated.View style={[
            styles.swipeRow,
            {
                opacity: entranceAnim,
                transform: [{ scale: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
        ]}>
            {/* Edit action — revealed on swipe right */}
            <Animated.View style={[styles.actionLeft, { opacity: editOpacity }]}>
                <TouchableOpacity style={styles.actionLeftInner} onPress={() => { resetSwipe(); onEdit(item); }}>
                    <Text style={styles.actionIcon}>✏️</Text>
                    <Text style={styles.actionLabel}>Edit</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Delete action — revealed on swipe left */}
            <Animated.View style={[styles.actionRight, { opacity: deleteOpacity }]}>
                <TouchableOpacity style={styles.actionRightInner} onPress={() => { resetSwipe(); onDeleteRequest(item); }}>
                    {isDeleting ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <>
                            <Text style={styles.actionIcon}>🗑️</Text>
                            <Text style={styles.actionLabel}>Delete</Text>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Sliding card */}
            <Animated.View style={[styles.item, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
                <View style={styles.itemDot} />
                <Text style={styles.itemName}>{item.name}</Text>
                <TouchableOpacity style={styles.editIconBtn} onPress={() => onEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Categories = () => {
    const [categories,  setCategories]  = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [token,       setToken]       = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [formVisible, setFormVisible] = useState(false);
    const [isSubmitting,setIsSubmitting]= useState(false);
    const [deletingId,  setDeletingId]  = useState(null);
    const [confirmItem, setConfirmItem] = useState(null);

    useEffect(() => {
        getJwt().then((res) => setToken(res || "")).catch(() => {});
        axios.get(`${baseURL}categories`)
            .then((res) => setCategories(res.data))
            .catch(() => alert("Error loading categories"));
        return () => { setCategories([]); setToken(""); };
    }, []);

    const filtered = searchQuery.trim()
        ? categories.filter((c) => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
        : categories;

    const openAdd  = () => { setEditingItem(null); setFormVisible(true); };
    const openEdit = (item) => { setEditingItem(item); setFormVisible(true); };
    const closeForm = () => { setFormVisible(false); setEditingItem(null); };

    const submitCategory = (name) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const config  = { headers: { Authorization: `Bearer ${token}` } };
        const payload = { name };
        const id      = editingItem?.id || editingItem?._id;
        const request = id
            ? axios.put(`${baseURL}categories/${id}`, payload, config)
            : axios.post(`${baseURL}categories`, payload, config);

        request
            .then((res) => {
                if (id) {
                    setCategories((prev) => prev.map((item) => (item.id || item._id) === id ? res.data : item));
                } else {
                    setCategories((prev) => [...prev, res.data]);
                }
                closeForm();
            })
            .catch(() => alert(id ? "Error updating category" : "Error adding category"))
            .finally(() => setIsSubmitting(false));
    };

    const confirmDelete = () => {
        if (!confirmItem || deletingId) return;
        const id = confirmItem.id || confirmItem._id;
        setConfirmItem(null);
        setDeletingId(id);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        axios.delete(`${baseURL}categories/${id}`, config)
            .then(() => setCategories((prev) => prev.filter((item) => (item.id || item._id) !== id)))
            .catch(() => alert("Error deleting category"))
            .finally(() => setDeletingId(null));
    };

    return (
        <View style={styles.container}>
            {/* Search bar */}
            <View style={styles.searchWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search categories…"
                    placeholderTextColor={COLORS.textFaint}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.id || item._id)}
                contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.listContent}
                ListEmptyComponent={<EmptyState isFiltered={!!searchQuery.trim()} />}
                renderItem={({ item }) => (
                    <SwipeableItem
                        item={item}
                        onEdit={openEdit}
                        onDeleteRequest={setConfirmItem}
                        isDeleting={deletingId === (item.id || item._id)}
                    />
                )}
            />

            {/* FAB — Add category */}
            <TouchableOpacity style={styles.fab} onPress={openAdd} activeOpacity={0.85}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Add / Edit Modal */}
            <CategoryFormModal
                visible={formVisible}
                editingItem={editingItem}
                onSubmit={submitCategory}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                visible={!!confirmItem}
                categoryName={confirmItem?.name || ""}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmItem(null)}
            />
        </View>
    );
};

export default Categories;