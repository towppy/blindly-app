import React, { useCallback, useState } from "react";
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
import { getJwt } from "../../assets/common/jwtStore";
import baseURL from "../../assets/common/baseurl";
import mime from "mime";

const EMPTY_FORM = {
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

const MONTHS = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12",
];

function daysInMonth(year, month) {
    return new Date(Number(year), Number(month), 0).getDate();
}

const Vouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(String(new Date().getFullYear()));
    const [pickerMonth, setPickerMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
    const [pickerDay, setPickerDay] = useState(String(new Date().getDate()).padStart(2, "0"));

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getJwt();
            const config = { headers: { Authorization: `Bearer ${token || ""}` } };
            const [voucherRes, categoryRes] = await Promise.all([
                axios.get(`${baseURL}vouchers/admin`, config),
                axios.get(`${baseURL}categories`),
            ]);
            setVouchers(voucherRes.data || []);
            setCategories(categoryRes.data || []);
        } catch (_error) {
            Alert.alert("Error", "Failed to load vouchers");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const resetForm = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const openCreate = () => {
        resetForm();
        const now = new Date();
        setPickerYear(String(now.getFullYear()));
        setPickerMonth(String(now.getMonth() + 1).padStart(2, "0"));
        setPickerDay(String(now.getDate()).padStart(2, "0"));
        setModalVisible(true);
    };

    const openEdit = (item) => {
        setEditingId(item.id || item._id);
        const dateOnly = item.dateExpirationShop ? new Date(item.dateExpirationShop).toISOString().slice(0, 10) : "";
        setForm({
            name: item.name || "",
            description: item.description || "",
            image: item.image || "",
            dateExpirationShop: dateOnly,
            dateExpirationAfterClaimDays: String(item.dateExpirationAfterClaimDays || 7),
            discountPercent: String(item.discountPercent || 10),
            appliesTo: item.appliesTo || "all",
            category: item.category?.id || item.category?._id || "",
            isActive: item.isActive !== false,
        });
        const dateBase = item.dateExpirationShop ? new Date(item.dateExpirationShop) : new Date();
        setPickerYear(String(dateBase.getFullYear()));
        setPickerMonth(String(dateBase.getMonth() + 1).padStart(2, "0"));
        setPickerDay(String(dateBase.getDate()).padStart(2, "0"));
        setModalVisible(true);
    };

    const confirmPickedDate = () => {
        const maxDays = daysInMonth(pickerYear, pickerMonth);
        const normalizedDay = Math.min(Number(pickerDay), maxDays);
        const day = String(normalizedDay).padStart(2, "0");
        setPickerDay(day);
        setForm((s) => ({ ...s, dateExpirationShop: `${pickerYear}-${pickerMonth}-${day}` }));
        setShowDatePicker(false);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
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
            setForm((s) => ({ ...s, image: result.assets[0].uri }));
        }
    };

    const saveVoucher = async () => {
        if (!form.name.trim()) {
            Alert.alert("Validation", "Voucher name is required");
            return;
        }
        if (!form.dateExpirationShop.trim()) {
            Alert.alert("Validation", "Date expiration for shop availability is required");
            return;
        }
        if (form.appliesTo === "category" && !form.category) {
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
            payload.append("name", form.name.trim());
            payload.append("description", form.description || "");
            payload.append("dateExpirationShop", form.dateExpirationShop);
            payload.append("dateExpirationAfterClaimDays", String(Number(form.dateExpirationAfterClaimDays)));
            payload.append("discountPercent", String(Number(form.discountPercent)));
            payload.append("appliesTo", form.appliesTo);
            payload.append("isActive", form.isActive ? "true" : "false");

            if (form.appliesTo === "category") {
                payload.append("category", form.category);
            }

            if (form.image && (form.image.startsWith("file://") || form.image.startsWith("content://"))) {
                payload.append("image", {
                    uri: form.image,
                    type: mime.getType(form.image) || "image/jpeg",
                    name: form.image.split("/").pop() || "voucher.jpg",
                });
            } else {
                payload.append("existingImage", form.image || "");
            }

            if (editingId) {
                const res = await axios.put(`${baseURL}vouchers/${editingId}`, payload, config);
                setVouchers((prev) => prev.map((v) => ((v.id || v._id) === editingId ? res.data : v)));
            } else {
                const res = await axios.post(`${baseURL}vouchers`, payload, config);
                setVouchers((prev) => [res.data, ...prev]);
            }

            closeModal();
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to save voucher";
            Alert.alert("Error", msg);
        } finally {
            setSaving(false);
        }
    };

    const deleteVoucher = (id) => {
        Alert.alert("Delete voucher", "Deactivate this voucher?", [
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

    const notifyUsers = async (id) => {
        try {
            const token = await getJwt();
            const res = await axios.post(
                `${baseURL}vouchers/${id}/notify`,
                {},
                { headers: { Authorization: `Bearer ${token || ""}` } }
            );
            if (res?.data?.voucher) {
                const updatedVoucher = res.data.voucher;
                setVouchers((prev) =>
                    prev.map((v) => ((v.id || v._id) === (updatedVoucher.id || updatedVoucher._id) ? updatedVoucher : v))
                );
            }
            Alert.alert("Notify Users", res?.data?.message || "Users have been notified.");
        } catch (error) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to notify users");
        }
    };

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
                <Text style={styles.meta}>
                    Shop expiry: {item.dateExpirationShop ? new Date(item.dateExpirationShop).toLocaleDateString() : "-"}
                </Text>
                <Text style={styles.meta}>
                    Claim valid: {Number(item.dateExpirationAfterClaimDays || 0)} day(s)
                </Text>
                <Text style={styles.meta}>
                    Last notified: {item.lastNotifiedAt ? new Date(item.lastNotifiedAt).toLocaleString() : "Never"}
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                        <Ionicons name="create-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.notifyBtn]} onPress={() => notifyUsers(id)}>
                        <Ionicons name="notifications-outline" size={16} color="#fff" />
                        <Text style={styles.actionText}>Notify Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteVoucher(id)}>
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
                <Text style={styles.header}>Vouchers / Discounts</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                </View>
            ) : (
                <FlatList
                    data={vouchers}
                    keyExtractor={(item) => String(item.id || item._id)}
                    renderItem={renderVoucher}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    ListEmptyComponent={<Text style={styles.empty}>No vouchers yet.</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" onRequestClose={closeModal}>
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{editingId ? "Edit Voucher" : "Add Voucher"}</Text>

                    <Text style={styles.label}>Voucher Name</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((s) => ({ ...s, name: v }))} />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        value={form.description}
                        onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                    />

                    <Text style={styles.label}>Voucher Image</Text>
                    <View style={styles.imageRow}>
                        <View style={styles.imagePreviewWrap}>
                            {form.image ? (
                                <Image source={{ uri: form.image }} style={styles.imagePreview} />
                            ) : (
                                <Ionicons name="image-outline" size={24} color="#9b8ec4" />
                            )}
                        </View>
                        <TouchableOpacity style={styles.uploadBtn} onPress={openImagePicker}>
                            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                            <Text style={styles.uploadBtnText}>Upload Image</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Shop Expiration Date</Text>
                    <TouchableOpacity
                        style={styles.dateBtn}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={16} color="#3d2c8d" />
                        <Text style={styles.dateBtnText}>
                            {form.dateExpirationShop || "Select date"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Expiration After Claim (days)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.dateExpirationAfterClaimDays}
                        onChangeText={(v) => setForm((s) => ({ ...s, dateExpirationAfterClaimDays: v }))}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Discount (%)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.discountPercent}
                        onChangeText={(v) => setForm((s) => ({ ...s, discountPercent: v }))}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Applies To</Text>
                    <View style={styles.pickerWrap}>
                        <Picker
                            selectedValue={form.appliesTo}
                            onValueChange={(value) => setForm((s) => ({ ...s, appliesTo: value }))}
                        >
                            <Picker.Item label="All Items" value="all" />
                            <Picker.Item label="By Category" value="category" />
                        </Picker>
                    </View>

                    {form.appliesTo === "category" ? (
                        <>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={form.category}
                                    onValueChange={(value) => setForm((s) => ({ ...s, category: value }))}
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
                            value={form.isActive}
                            onValueChange={(value) => setForm((s) => ({ ...s, isActive: value }))}
                        />
                    </View>

                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={saveVoucher} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>

            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.dateModalCard}>
                        <Text style={styles.dateModalTitle}>Select Shop Expiration Date</Text>
                        <View style={styles.datePickersRow}>
                            <View style={styles.datePickerBox}>
                                <Text style={styles.datePickerLabel}>Year</Text>
                                <Picker
                                    selectedValue={pickerYear}
                                    onValueChange={(value) => setPickerYear(value)}
                                >
                                    {Array.from({ length: 8 }).map((_, idx) => {
                                        const year = String(new Date().getFullYear() + idx);
                                        return <Picker.Item key={year} label={year} value={year} />;
                                    })}
                                </Picker>
                            </View>
                            <View style={styles.datePickerBox}>
                                <Text style={styles.datePickerLabel}>Month</Text>
                                <Picker
                                    selectedValue={pickerMonth}
                                    onValueChange={(value) => setPickerMonth(value)}
                                >
                                    {MONTHS.map((m) => (
                                        <Picker.Item key={m} label={m} value={m} />
                                    ))}
                                </Picker>
                            </View>
                            <View style={styles.datePickerBox}>
                                <Text style={styles.datePickerLabel}>Day</Text>
                                <Picker
                                    selectedValue={pickerDay}
                                    onValueChange={(value) => setPickerDay(value)}
                                >
                                    {Array.from({ length: daysInMonth(pickerYear, pickerMonth) }).map((_, idx) => {
                                        const d = String(idx + 1).padStart(2, "0");
                                        return <Picker.Item key={d} label={d} value={d} />;
                                    })}
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.dateModalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDatePicker(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={confirmPickedDate}>
                                <Text style={styles.saveText}>Set Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#faf9f7", padding: 12 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    header: { fontSize: 20, fontWeight: "800", color: "#1a1235" },
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
    },
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
    dateBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e6e0f5",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    dateBtnText: {
        color: "#3d2c8d",
        fontWeight: "600",
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    pickerWrap: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e6e0f5" },
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
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    dateModalCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
    },
    dateModalTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1a1235",
        marginBottom: 8,
    },
    datePickersRow: {
        flexDirection: "row",
        gap: 8,
    },
    datePickerBox: {
        flex: 1,
    },
    datePickerLabel: {
        color: "#6d6297",
        fontSize: 12,
        marginBottom: 2,
        fontWeight: "700",
    },
    dateModalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 8,
    },
});

export default Vouchers;
