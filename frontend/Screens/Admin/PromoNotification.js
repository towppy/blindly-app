import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";

const PromoNotification = ({ navigation }) => {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [details, setDetails] = useState("");
    const [sending, setSending] = useState(false);

    const send = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert("Required fields", "Title and message are required.");
            return;
        }
        setSending(true);
        try {
            const token = await getJwt();
            const res = await axios.post(
                `${baseURL}notifications/broadcast`,
                { title: title.trim(), body: body.trim(), details: details.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Toast.show({ type: "success", text1: "Promo sent!", text2: res.data.message });
            setTitle("");
            setBody("");
            setDetails("");
            navigation.goBack();
        } catch (e) {
            Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to send" });
        } finally {
            setSending(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.headerBox}>
                <Ionicons name="megaphone-outline" size={40} color="#7c3aed" />
                <Text style={styles.headerText}>Send Promo Notification</Text>
                <Text style={styles.subText}>Broadcasts instantly to all registered users</Text>
            </View>

            <View style={styles.formBox}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Flash Sale — 50% Off Today!"
                    placeholderTextColor="#bbb"
                    maxLength={80}
                />
                <Text style={styles.charCount}>{title.length}/80</Text>

                <Text style={styles.label}>Short Message *</Text>
                <TextInput
                    style={[styles.input, styles.multiLine]}
                    value={body}
                    onChangeText={setBody}
                    placeholder="Message shown in the push notification"
                    placeholderTextColor="#bbb"
                    multiline
                    numberOfLines={3}
                    maxLength={160}
                />
                <Text style={styles.charCount}>{body.length}/160</Text>

                <Text style={styles.label}>Full Details (optional)</Text>
                <TextInput
                    style={[styles.input, styles.multiLine, { minHeight: 110 }]}
                    value={details}
                    onChangeText={setDetails}
                    placeholder="Full promo details — shown when user taps the notification"
                    placeholderTextColor="#bbb"
                    multiline
                />

                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                    onPress={send}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.sendBtnText}>Send to All Users</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:    { padding: 20, backgroundColor: "#f5f5f5", flexGrow: 1 },
    headerBox:   { alignItems: "center", marginBottom: 24, paddingTop: 8 },
    headerText:  { fontSize: 20, fontWeight: "800", color: "#1a0a3c", marginTop: 10 },
    subText:     { fontSize: 13, color: "#888", marginTop: 4, textAlign: "center" },
    formBox:     { backgroundColor: "#fff", borderRadius: 16, padding: 20, elevation: 2 },
    label:       { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 16 },
    input:       {
        borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10,
        padding: 12, fontSize: 14, color: "#333", backgroundColor: "#fafafa",
    },
    multiLine:   { textAlignVertical: "top", minHeight: 72 },
    charCount:   { fontSize: 11, color: "#ccc", textAlign: "right", marginTop: 3 },
    sendBtn:     {
        backgroundColor: "#7c3aed", borderRadius: 12, padding: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        marginTop: 24,
    },
    sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default PromoNotification;
