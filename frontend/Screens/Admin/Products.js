import React, { useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ListItem from "./ListItem";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";

const { height, width } = Dimensions.get("window");

const COLORS = {
    primary:     "#7c3aed",
    primaryDeep: "#5b21b6",
    primarySoft: "#e4dff5",
    primaryLighter: "#f0ecfb",
    background:  "#faf9f7",
    card:        "#fff",
    textDark:    "#1a1235",
    textMuted:   "#9b8ec4",
    textFaint:   "#b0a3d4",
    border:      "#f0ecfb",
    white:       "#fff",
};

const NAV_ITEMS = [
    { label: "Orders",      icon: "bag-outline",        screen: "Orders"       },
    { label: "Add Product", icon: "add-circle-outline", screen: "ProductForm"  },
    { label: "Stock Alerts",icon: "warning-outline",    screen: "Stock Alerts" },
    { label: "Categories",  icon: "pricetag-outline",   screen: "Categories"   },
    { label: "Reviews",     icon: "star-outline",       screen: "Reviews"      },
    { label: "Users",       icon: "people-outline",     screen: "Users"        },
];

// ─── Dropdown Menu ────────────────────────────────────────────────────────────
const DropdownMenu = () => {
    const [open, setOpen]     = useState(false);
    const animHeight          = useRef(new Animated.Value(0)).current;
    const animOpacity         = useRef(new Animated.Value(0)).current;
    const animRotate          = useRef(new Animated.Value(0)).current;
    const navigation          = useNavigation();

    const ITEM_HEIGHT = 44;
    const MENU_HEIGHT = NAV_ITEMS.length * ITEM_HEIGHT;

    const toggle = () => {
        const opening = !open;
        setOpen(opening);
        Animated.parallel([
            Animated.spring(animHeight, {
                toValue: opening ? MENU_HEIGHT : 0,
                friction: 12,
                tension: 80,
                useNativeDriver: false,
            }),
            Animated.timing(animOpacity, {
                toValue: opening ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(animRotate, {
                toValue: opening ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleNav = (screen) => {
        toggle();
        setTimeout(() => navigation.navigate(screen), 150);
    };

    const chevronRotation = animRotate.interpolate({
        inputRange:  [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    return (
        <View style={styles.dropdownWrapper}>
            {/* Trigger */}
            <TouchableOpacity style={styles.dropdownTrigger} onPress={toggle} activeOpacity={0.85}>
                <View style={styles.dropdownTriggerLeft}>
                    <Ionicons name="grid-outline" size={16} color={COLORS.white} />
                    <Text style={styles.dropdownTriggerText}>Admin Menu</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
                    <Ionicons name="chevron-down" size={16} color={COLORS.white} />
                </Animated.View>
            </TouchableOpacity>

            {/* Dropdown panel */}
            <Animated.View style={[styles.dropdownPanel, { height: animHeight, opacity: animOpacity }]}>
                {NAV_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={item.screen}
                        style={[
                            styles.dropdownItem,
                            index < NAV_ITEMS.length - 1 && styles.dropdownItemBorder,
                        ]}
                        onPress={() => handleNav(item.screen)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dropdownItemIcon}>
                            <Ionicons name={item.icon} size={16} color={COLORS.primary} />
                        </View>
                        <Text style={styles.dropdownItemLabel}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={13} color={COLORS.textFaint} />
                    </TouchableOpacity>
                ))}
            </Animated.View>
        </View>
    );
};

// ─── List header ──────────────────────────────────────────────────────────────
const ListHeader = () => (
    <View style={styles.listHeader}>
        <Text style={[styles.headerCell, { width: 44 }]} />
        <Text style={[styles.headerCell, { flex: 2 }]}>Name</Text>
        <Text style={[styles.headerCell, { flex: 1.2 }]}>Brand</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Category</Text>
        <Text style={[styles.headerCell, { width: 64, textAlign: "right" }]}>Price</Text>
        <Text style={[styles.headerCell, { width: 36 }]} />
    </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Products = () => {
    const [productList,   setProductList]   = useState([]);
    const [productFilter, setProductFilter] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [token,         setToken]         = useState("");
    const [refreshing,    setRefreshing]    = useState(false);
    const [deletingId,    setDeletingId]    = useState(null);
    const [searchText,    setSearchText]    = useState("");

    const searchProduct = (text) => {
        setSearchText(text);
        if (!text.trim()) { setProductFilter(productList); return; }
        setProductFilter(
            productList.filter((i) => i.name.toLowerCase().includes(text.toLowerCase()))
        );
    };

    const deleteProduct = (id) => {
        if (deletingId) return;
        setDeletingId(id);
        axios
            .delete(`${baseURL}products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(() => {
                const filter = (items) => items.filter((item) => (item.id || item._id) !== id);
                setProductList((prev) => filter(prev));
                setProductFilter((prev) => filter(prev));
            })
            .catch(console.log)
            .finally(() => setDeletingId(null));
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        axios.get(`${baseURL}products`).then((res) => {
            setProductList(res.data);
            setProductFilter(res.data);
            setRefreshing(false);
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            getJwt().then((res) => setToken(res || "")).catch(console.log);
            axios
                .get(`${baseURL}products`)
                .then((res) => {
                    setProductList(res.data);
                    setProductFilter(res.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
            return () => {
                setProductList([]);
                setProductFilter([]);
                setLoading(true);
            };
        }, [])
    );

    return (
        <View style={styles.container}>

            {/* ── Dropdown nav ── */}
            <DropdownMenu />

            {/* ── Search ── */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={15} color={COLORS.textFaint} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products…"
                    placeholderTextColor={COLORS.textFaint}
                    value={searchText}
                    onChangeText={searchProduct}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => searchProduct("")}>
                        <Ionicons name="close-circle" size={15} color={COLORS.textFaint} />
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Count ── */}
            <Text style={styles.countText}>
                {productFilter.length} product{productFilter.length !== 1 ? "s" : ""}
            </Text>

            {/* ── List ── */}
            {loading ? (
                <View style={styles.spinner}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListHeaderComponent={ListHeader}
                    stickyHeaderIndices={[0]}
                    data={productFilter}
                    renderItem={({ item, index }) => (
                        <ListItem
                            item={item}
                            index={index}
                            deleteProduct={deleteProduct}
                            isDeleting={deletingId === (item.id || item._id)}
                        />
                    )}
                    keyExtractor={(item) => String(item.id || item._id)}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="cube-outline" size={40} color={COLORS.textFaint} />
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                    contentContainerStyle={productFilter.length === 0 && styles.emptyContainer}
                />
            )}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // Dropdown
    dropdownWrapper: {
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 2,
        zIndex: 10,
    },
    dropdownTrigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    dropdownTriggerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dropdownTriggerText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "700",
    },
    dropdownPanel: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderTopWidth: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: "hidden",
        shadowColor: "#1a1235",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        height: 44,
        gap: 12,
    },
    dropdownItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dropdownItemIcon: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLighter,
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownItemLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textDark,
    },

    // Search
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 4,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textDark,
    },

    // Count
    countText: {
        fontSize: 11,
        color: COLORS.textFaint,
        marginLeft: 14,
        marginBottom: 4,
    },

    // List header
    listHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    headerCell: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },

    // Spinner / empty
    spinner: {
        height: height / 2,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: { flex: 1 },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textFaint,
    },
});

export default Products;