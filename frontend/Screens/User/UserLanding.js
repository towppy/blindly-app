import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const UserLanding = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Ionicons name="person-circle-outline" size={100} color="#7c3aed" />
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
                Sign in to manage your profile, track orders, and more.
            </Text>

            <TouchableOpacity
                style={[styles.btn, styles.loginBtn]}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
            >
                <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.btnIcon} />
                <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.btn, styles.registerBtn]}
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.8}
            >
                <Ionicons name="person-add-outline" size={20} color="#7c3aed" style={styles.btnIcon} />
                <Text style={styles.registerBtnText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1a0a3c",
        marginTop: 20,
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 40,
        lineHeight: 20,
    },
    btn: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 14,
    },
    btnIcon: {
        marginRight: 8,
    },
    loginBtn: {
        backgroundColor: "#7c3aed",
    },
    loginBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    registerBtn: {
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#7c3aed",
    },
    registerBtnText: {
        color: "#7c3aed",
        fontSize: 16,
        fontWeight: "700",
    },
});

export default UserLanding;
