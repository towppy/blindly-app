import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PromoDetail = ({ route }) => {
    const { title = "Promo", body = "", details = "" } = route.params || {};

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.banner}>
                <Ionicons name="pricetag-outline" size={48} color="#fff" />
            </View>
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.body}>{body}</Text>
                {details ? (
                    <>
                        <View style={styles.divider} />
                        <Text style={styles.detailsLabel}>Full Details</Text>
                        <Text style={styles.details}>{details}</Text>
                    </>
                ) : null}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:    { flexGrow: 1, backgroundColor: "#f5f5f5", padding: 20 },
    banner:       {
        backgroundColor: "#7c3aed", borderRadius: 20, height: 140,
        alignItems: "center", justifyContent: "center", marginBottom: 20,
    },
    card:         { backgroundColor: "#fff", borderRadius: 16, padding: 24, elevation: 2 },
    title:        { fontSize: 22, fontWeight: "800", color: "#1a0a3c", marginBottom: 14 },
    body:         { fontSize: 16, color: "#444", lineHeight: 26 },
    divider:      { height: 1, backgroundColor: "#eee", marginVertical: 18 },
    detailsLabel: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", marginBottom: 8 },
    details:      { fontSize: 14, color: "#555", lineHeight: 23 },
});

export default PromoDetail;
