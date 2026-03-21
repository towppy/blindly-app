import React, { useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import mime from "mime";

import { getJwt } from "../../assets/common/jwtStore";
import baseURL from "../../assets/common/baseurl";

const TAB = {
    VOUCHER: "voucher",
    PROMO: "promo",
};

const EMPTY_VOUCHER_FORM = {
    name: "",
    description: "",
    image: "",
    dateExpirationShop: "",
    dateExpirationAfterClaimDays: "7",
    discountPercent: "10",
    appliesTo: "all",
    category: "",
    isActive: true,
};

const EMPTY_PROMO_FORM = {
    name: "",
    description: "",
    discountPercent: "10",
    product: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
};

function dateOnly(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

function asMoney(value) {
    return Number(value || 0).toFixed(2);
}

const Vouchers = () => {
    const [activeTab, setActiveTab] = useState(TAB.VOUCHER);
    const [vouchers, setVouchers] = useState([]);
    const [promos, setPromos] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [voucherForm, setVoucherForm] = useState(EMPTY_VOUCHER_FORM);
    const [promoForm, setPromoForm] = useState(EMPTY_PROMO_FORM);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getJwt();
            const config = { headers: { Authorization: `Bearer ${token || ""}` } };

            const [voucherRes, promoRes, categoryRes, productRes] = await Promise.all([
                axios.get(`${baseURL}vouchers/admin`, config),
                axios.get(`${baseURL}promos/admin`, config),
                axios.get(`${baseURL}categories`),
                axios.get(`${baseURL}products`),
            ]);

            setVouchers(voucherRes.data || []);
            setPromos(promoRes.data || []);
            setCategories(categoryRes.data || []);
            setProducts(productRes.data || []);
        } catch (_error) {
            Alert.alert("Error", "Failed to load voucher/promo management data");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const resetForms = () => {
        setEditingId(null);
        setVoucherForm(EMPTY_VOUCHER_FORM);
        setPromoForm(EMPTY_PROMO_FORM);
    };

    const openCreate = () => {
        resetForms();
        const today = dateOnly(new Date().toISOString());
        const nextWeek = dateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        setVoucherForm((prev) => ({ ...prev, dateExpirationShop: nextWeek }));
        setPromoForm((prev) => ({ ...prev, startsAt: today, endsAt: nextWeek }));
        setModalVisible(true);
    };

    const openEditVoucher = (item) => {
        setActiveTab(TAB.VOUCHER);
        setEditingId(item.id || item._id);
        setVoucherForm({
            name: item.name || "",
            description: item.description || "",
            image: item.image || "",
            dateExpirationShop: dateOnly(item.dateExpirationShop),
            dateExpirationAfterClaimDays: String(item.dateExpirationAfterClaimDays || 7),
            discountPercent: String(item.discountPercent || 10),
            appliesTo: item.appliesTo || "all",
            category: item.category?.id || item.category?._id || "",
            isActive: item.isActive !== false,
        });
        setModalVisible(true);
    };

    const openEditPromo = (item) => {
        setActiveTab(TAB.PROMO);
        setEditingId(item.id || item._id);
        setPromoForm({
            name: item.name || "",
            description: item.description || "",
            discountPercent: String(item.discountPercent || 10),
            product: item.product?.id || item.product?._id || "",
            startsAt: dateOnly(item.startsAt),
            endsAt: dateOnly(item.endsAt),
            isActive: item.isActive !== false,
        });
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForms();
    };

    const openImagePicker = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== "granted") {
            Alert.alert("Permission required", "Gallery permission is needed to upload an image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setVoucherForm((s) => ({ ...s, image: result.assets[0].uri }));
        }
    };

    const saveVoucher = async () => {
        if (!voucherForm.name.trim()) {
            Alert.alert("Validation", "Voucher name is required");
            return;
        }
        if (!voucherForm.dateExpirationShop.trim()) {
            Alert.alert("Validation", "Shop expiration date is required");
            return;
        }
        if (voucherForm.appliesTo === "category" && !voucherForm.category) {
            Alert.alert("Validation", "Pick a category when voucher applies to category only");
            return;
        }

        setSaving(true);
        try {
            const token = await getJwt();
            const config = {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                    "Content-Type": "multipart/form-data",
                },
            };

            const payload = new FormData();
            payload.append("name", voucherForm.name.trim());
            payload.append("description", voucherForm.description || "");
            payload.append("dateExpirationShop", voucherForm.dateExpirationShop);
            payload.append("dateExpirationAfterClaimDays", String(Number(voucherForm.dateExpirationAfterClaimDays)));
            payload.append("discountPercent", String(Number(voucherForm.discountPercent)));
            payload.append("appliesTo", voucherForm.appliesTo);
            payload.append("isActive", voucherForm.isActive ? "true" : "false");

            if (voucherForm.appliesTo === "category") {
                payload.append("category", voucherForm.category);
            }

            if (voucherForm.image && (voucherForm.image.startsWith("file://") || voucherForm.image.startsWith("content://"))) {
                payload.append("image", {
                    uri: voucherForm.image,
                    type: mime.getType(voucherForm.image) || "image/jpeg",
                    name: voucherForm.image.split("/").pop() || "voucher.jpg",
                });
            } else {
                payload.append("existingImage", voucherForm.image || "");
            }

            if (editingId && activeTab === TAB.VOUCHER) {
                const res = await axios.put(`${baseURL}vouchers/${editingId}`, payload, config);
                setVouchers((prev) => prev.map((v) => ((v.id || v._id) === editingId ? res.data : v)));
            } else {
                const res = await axios.post(`${baseURL}vouchers`, payload, config);
                setVouchers((prev) => [res.data, ...prev]);
            }

            closeModal();
        } catch (error) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to save voucher");
        } finally {
            setSaving(false);
        }
    };

    const savePromo = async () => {
        if (!promoForm.name.trim()) {
            Alert.alert("Validation", "Promo name is required");
            return;
        }
        if (!promoForm.product) {
            Alert.alert("Validation", "Select a product for this promo");
            return;
        }
        if (!promoForm.endsAt) {
            Alert.alert("Validation", "Promo end date is required");
            return;
        }

        const payload = {
            name: promoForm.name.trim(),
            description: promoForm.description || "",
            discountPercent: Number(promoForm.discountPercent),
            product: promoForm.product,
            startsAt: promoForm.startsAt || undefined,
            endsAt: promoForm.endsAt,
            isActive: promoForm.isActive,
        };

        setSaving(true);
        try {
            const token = await getJwt();
            const config = { headers: { Authorization: `Bearer ${token || ""}` } };

            if (editingId && activeTab === TAB.PROMO) {
                const res = await axios.put(`${baseURL}promos/${editingId}`, payload, config);
                setPromos((prev) => prev.map((p) => ((p.id || p._id) === editingId ? res.data : p)));
            } else {
                const res = await axios.post(`${baseURL}promos`, payload, config);
                setPromos((prev) => [res.data, ...prev]);
            }

            closeModal();
        } catch (error) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to save promo");
        } finally {
            setSaving(false);
        }
    };

    const deleteVoucher = (id) => {
        Alert.alert("Deactivate voucher", "Deactivate this voucher?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deactivate",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await getJwt();
                        await axios.delete(`${baseURL}vouchers/${id}`, {
                            headers: { Authorization: `Bearer ${token || ""}` },
                        });
                        setVouchers((prev) => prev.map((v) => ((v.id || v._id) === id ? { ...v, isActive: false } : v)));
                    } catch (_error) {
                        Alert.alert("Error", "Failed to deactivate voucher");
                    }
                },
            },
        ]);
    };

    const deletePromo = (id) => {
        Alert.alert("Deactivate promo", "Deactivate this promo?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deactivate",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await getJwt();
                        await axios.delete(`${baseURL}promos/${id}`, {
                            headers: { Authorization: `Bearer ${token || ""}` },
                        });
                        setPromos((prev) => prev.map((p) => ((p.id || p._id) === id ? { ...p, isActive: false } : p)));
                    } catch (_error) {
                        Alert.alert("Error", "Failed to deactivate promo");
                    }
                },
            },
        ]);
    };

    const notifyVoucherUsers = async (id) => {
        try {
            const token = await getJwt();
            const res = await axios.post(
                `${baseURL}vouchers/${id}/notify`,
                {},
                { headers: { Authorization: `Bearer ${token || ""}` } }
            );
            Alert.alert("Notify Users", res?.data?.message || "Users have been notified.");
        } catch (error) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to notify users");
        }
    };

    const voucherData = useMemo(() => vouchers, [vouchers]);
    const promoData = useMemo(() => promos, [promos]);

    const renderVoucher = ({ item }) => {
        const id = item.id || item._id;
        const scopeText = item.appliesTo === "category"
            ? `Category: ${item.category?.name || "Unknown"}`
            : "All items";

        return (
            <View style={[styles.card, item.isActive === false && styles.inactiveCard]}>
                <View style={styles.rowBetween}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.discount}>{Number(item.discountPercent || 0)}% OFF</Text>
                </View>
                <Text style={styles.meta}>{item.description || "No description"}</Text>
                <Text style={styles.meta}>{scopeText}</Text>
                <Text style={styles.meta}>Ends: {item.dateExpirationShop ? new Date(item.dateExpirationShop).toLocaleDateString() : "-"}</Text>
                <Text style={styles.meta}>Claim valid: {Number(item.dateExpirationAfterClaimDays || 0)} day(s)</Text>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditVoucher(item)}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.notifyBtn]} onPress={() => notifyVoucherUsers(id)}>
                        <Ionicons name="notifications-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Notify</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteVoucher(id)}>
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Deactivate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderPromo = ({ item }) => {
        const id = item.id || item._id;
        const productName = item.product?.name || "Unknown product";
        const originalPrice = Number(item.product?.price || 0);
        const discounted = Number((originalPrice * (1 - Number(item.discountPercent || 0) / 100)).toFixed(2));

        return (
            <View style={[styles.card, item.isActive === false && styles.inactiveCard]}>
                <View style={styles.rowBetween}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.discount}>{Number(item.discountPercent || 0)}% OFF</Text>
                </View>
                <Text style={styles.meta}>{item.description || "No description"}</Text>
                <Text style={styles.meta}>Product: {productName}</Text>
                <Text style={styles.meta}>Price: P{asMoney(discounted)} (from P{asMoney(originalPrice)})</Text>
                <Text style={styles.meta}>Starts: {item.startsAt ? new Date(item.startsAt).toLocaleDateString() : "-"}</Text>
                <Text style={styles.meta}>Ends in: {item.endsAt ? new Date(item.endsAt).toLocaleDateString() : "-"}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditPromo(item)}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deletePromo(id)}>
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Deactivate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Voucher/Promo Management</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>{activeTab === TAB.VOUCHER ? "Add Voucher" : "Add Promo"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === TAB.VOUCHER && styles.tabBtnActive]}
                    onPress={() => setActiveTab(TAB.VOUCHER)}
                >
                    <Text style={[styles.tabText, activeTab === TAB.VOUCHER && styles.tabTextActive]}>Voucher</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === TAB.PROMO && styles.tabBtnActive]}
                    onPress={() => setActiveTab(TAB.PROMO)}
                >
                    <Text style={[styles.tabText, activeTab === TAB.PROMO && styles.tabTextActive]}>Promo</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                </View>
            ) : (
                <FlatList
                    data={activeTab === TAB.VOUCHER ? voucherData : promoData}
                    keyExtractor={(item) => String(item.id || item._id)}
                    renderItem={activeTab === TAB.VOUCHER ? renderVoucher : renderPromo}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ListEmptyComponent={<Text style={styles.empty}>{activeTab === TAB.VOUCHER ? "No vouchers yet." : "No promos yet."}</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {editingId ? `Edit ${activeTab === TAB.VOUCHER ? "Voucher" : "Promo"}` : `Add ${activeTab === TAB.VOUCHER ? "Voucher" : "Promo"}`}
                    </Text>

                    {activeTab === TAB.VOUCHER ? (
                        <>
                            <Text style={styles.label}>Voucher Name</Text>
                            <TextInput style={styles.input} value={voucherForm.name} onChangeText={(v) => setVoucherForm((s) => ({ ...s, name: v }))} />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                value={voucherForm.description}
                                onChangeText={(v) => setVoucherForm((s) => ({ ...s, description: v }))}
                            />

                            <Text style={styles.label}>Voucher Image</Text>
                            <View style={styles.imageRow}>
                                <View style={styles.imagePreviewWrap}>
                                    {voucherForm.image ? (
                                        <Image source={{ uri: voucherForm.image }} style={styles.imagePreview} />
                                    ) : (
                                        <Ionicons name="image-outline" size={24} color="#9b8ec4" />
                                    )}
                                </View>
                                <TouchableOpacity style={styles.uploadBtn} onPress={openImagePicker}>
                                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                                    <Text style={styles.uploadBtnText}>Upload Image</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Shop Expiration Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="2026-12-31"
                                value={voucherForm.dateExpirationShop}
                                onChangeText={(v) => setVoucherForm((s) => ({ ...s, dateExpirationShop: v }))}
                            />

                            <Text style={styles.label}>Expiration After Claim (days)</Text>
                            <TextInput
                                style={styles.input}
                                value={voucherForm.dateExpirationAfterClaimDays}
                                onChangeText={(v) => setVoucherForm((s) => ({ ...s, dateExpirationAfterClaimDays: v }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Discount (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={voucherForm.discountPercent}
                                onChangeText={(v) => setVoucherForm((s) => ({ ...s, discountPercent: v }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Applies To</Text>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={voucherForm.appliesTo}
                                    onValueChange={(value) => setVoucherForm((s) => ({ ...s, appliesTo: value }))}
                                    style={styles.picker}
                                    dropdownIconColor="#3d2c8d"
                                >
                                    <Picker.Item label="All Items" value="all" />
                                    <Picker.Item label="By Category" value="category" />
                                </Picker>
                            </View>

                            {voucherForm.appliesTo === "category" ? (
                                <>
                                    <Text style={styles.label}>Category</Text>
                                    <View style={styles.pickerWrap}>
                                        <Picker
                                            selectedValue={voucherForm.category}
                                            onValueChange={(value) => setVoucherForm((s) => ({ ...s, category: value }))}
                                            style={styles.picker}
                                            dropdownIconColor="#3d2c8d"
                                        >
                                            <Picker.Item label="Select category" value="" />
                                            {categories.map((c) => (
                                                <Picker.Item key={c.id || c._id} label={c.name} value={c.id || c._id} />
                                            ))}
                                        </Picker>
                                    </View>
                                </>
                            ) : null}

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Active</Text>
                                <Switch
                                    value={voucherForm.isActive}
                                    onValueChange={(value) => setVoucherForm((s) => ({ ...s, isActive: value }))}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Promo Name</Text>
                            <TextInput style={styles.input} value={promoForm.name} onChangeText={(v) => setPromoForm((s) => ({ ...s, name: v }))} />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                value={promoForm.description}
                                onChangeText={(v) => setPromoForm((s) => ({ ...s, description: v }))}
                            />

                            <Text style={styles.label}>Discount (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={promoForm.discountPercent}
                                onChangeText={(v) => setPromoForm((s) => ({ ...s, discountPercent: v }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Product</Text>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={promoForm.product}
                                    onValueChange={(value) => setPromoForm((s) => ({ ...s, product: value }))}
                                    style={styles.picker}
                                    dropdownIconColor="#3d2c8d"
                                >
                                    <Picker.Item label="Select product" value="" />
                                    {products.map((p) => (
                                        <Picker.Item key={p.id || p._id} label={p.name} value={p.id || p._id} />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Starts At (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="2026-03-20"
                                value={promoForm.startsAt}
                                onChangeText={(v) => setPromoForm((s) => ({ ...s, startsAt: v }))}
                            />

                            <Text style={styles.label}>Ends At (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="2026-03-31"
                                value={promoForm.endsAt}
                                onChangeText={(v) => setPromoForm((s) => ({ ...s, endsAt: v }))}
                            />

                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Active</Text>
                                <Switch
                                    value={promoForm.isActive}
                                    onValueChange={(value) => setPromoForm((s) => ({ ...s, isActive: value }))}
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveBtn}
                            onPress={activeTab === TAB.VOUCHER ? saveVoucher : savePromo}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#faf9f7", padding: 12 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    header: { fontSize: 20, fontWeight: "800", color: "#1a1235" },
    tabRow: {
        flexDirection: "row",
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: "#ece7f8",
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        alignItems: "center",
        borderRadius: 8,
        paddingVertical: 9,
    },
    tabBtnActive: { backgroundColor: "#7c3aed" },
    tabText: { color: "#6d6297", fontWeight: "700" },
    tabTextActive: { color: "#fff" },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#7c3aed",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addBtnText: { color: "#fff", fontWeight: "700" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ece7f8",
    },
    inactiveCard: { opacity: 0.6 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 16, fontWeight: "700", color: "#1a1235", flex: 1, paddingRight: 10 },
    discount: { fontSize: 14, fontWeight: "800", color: "#e91e63" },
    meta: { color: "#6d6297", marginTop: 4 },
    actions: { flexDirection: "row", marginTop: 10, gap: 8 },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#7c3aed",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    deleteBtn: { backgroundColor: "#ef4444" },
    notifyBtn: { backgroundColor: "#2563eb" },
    actionText: { color: "#fff", fontWeight: "700" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    empty: { textAlign: "center", marginTop: 24, color: "#8e84b6" },
    modalContainer: { padding: 16, backgroundColor: "#faf9f7" },
    modalTitle: { fontSize: 22, fontWeight: "800", color: "#1a1235", marginBottom: 12 },
    label: { color: "#3d2c8d", fontWeight: "700", marginBottom: 6, marginTop: 8 },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e6e0f5",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        color: "#1a1235",
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    pickerWrap: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e6e0f5" },
    picker: { color: "#1a1235", backgroundColor: "#fff" },
    imageRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    imagePreviewWrap: {
        width: 72,
        height: 72,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd3f3",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    uploadBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#7c3aed",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    uploadBtnText: {
        color: "#fff",
        fontWeight: "700",
    },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
    footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 24, gap: 10 },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#d1caeb",
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    saveBtn: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: "#7c3aed",
        paddingVertical: 12,
        alignItems: "center",
    },
    cancelText: { color: "#3d2c8d", fontWeight: "700" },
    saveText: { color: "#fff", fontWeight: "700" },
});

export default Vouchers;
