import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Orders from "../Screens/Admin/Orders";
import Products from "../Screens/Admin/Products";
import ProductForm from "../Screens/Admin/ProductForm";
import Categories from "../Screens/Admin/Categories";
import StockAlerts from "../Screens/Admin/StockAlerts";
import Analytics from "../Screens/Admin/Analytics";
import Reviews from "../Screens/Admin/Reviews";
import PromoNotification from "../Screens/Admin/PromoNotification";
import AdminUsers from "../Screens/Admin/AdminUsers";
import Vouchers from "../Screens/Admin/Vouchers";
import PushDiagnostics from "../Screens/Admin/PushDiagnostics";
import AuthGlobal from "../Context/Store/AuthGlobal";

const Stack = createStackNavigator();

// ─── Shared screen options ────────────────────────────────────────────────────
const screenOptions = {
    headerStyle: {
        backgroundColor: "#7c3aed",
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
        fontWeight: "700",
        fontSize: 17,
        letterSpacing: -0.2,
    },
    headerBackTitleVisible: false,
};

// ─── Not Authorized screen ────────────────────────────────────────────────────
const NotAuthorized = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.center}>
            <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={36} color="#7c3aed" />
            </View>
            <Text style={styles.title}>Access Denied</Text>
            <Text style={styles.subtitle}>Admin privileges are required{"\n"}to view this area.</Text>
            <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate("User", { screen: "Login" })}
                activeOpacity={0.85}
            >
                <Ionicons name="log-in-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.loginBtnText}>Go to Login</Text>
            </TouchableOpacity>
        </View>
    );
};

// ─── Navigator ────────────────────────────────────────────────────────────────
const AdminNavigator = () => {
    const context = useContext(AuthGlobal);
    const isAdmin = context?.stateUser?.user?.isAdmin === true;

    if (!isAdmin) {
        return (
            <Stack.Navigator screenOptions={screenOptions}>
                <Stack.Screen
                    name="NotAuthorized"
                    component={NotAuthorized}
                    options={{ title: "Admin" }}
                />
            </Stack.Navigator>
        );
    }

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="Products"           component={Products}          options={{ title: "Products" }} />
            <Stack.Screen name="Categories"         component={Categories}        options={{ title: "Categories" }} />
            <Stack.Screen name="Orders"             component={Orders}            options={{ title: "Orders" }} />
            <Stack.Screen name="Stock Alerts"       component={StockAlerts}       options={{ title: "Stock Alerts" }} />
            <Stack.Screen name="ProductForm"        component={ProductForm}       options={{ title: "Product Form" }} />
            <Stack.Screen name="Analytics"          component={Analytics}         options={{ title: "Analytics" }} />
            <Stack.Screen name="Reviews"            component={Reviews}           options={{ title: "Reviews" }} />
            <Stack.Screen name="Promo Notification" component={PromoNotification} options={{ title: "Send Promo" }} />
            <Stack.Screen name="Users"              component={AdminUsers}        options={{ title: "Users" }} />
            <Stack.Screen name="Vouchers / Discounts" component={Vouchers}       options={{ title: "Vouchers / Discounts" }} />
            <Stack.Screen name="Push Diagnostics" component={PushDiagnostics}     options={{ title: "Push Diagnostics" }} />
        </Stack.Navigator>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#faf9f7",
        padding: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ede9f8",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1a1235",
        letterSpacing: -0.4,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#9b8ec4",
        fontWeight: "500",
        textAlign: "center",
        lineHeight: 21,
        marginBottom: 28,
    },
    loginBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#7c3aed",
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 14,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    loginBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});

export default AdminNavigator;