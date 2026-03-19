import React, { useState, useCallback, useContext, useEffect } from "react";
import {
    View,
    ScrollView,
    Text,
    Dimensions,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Alert,
    FlatList,
} from "react-native";
import { Surface } from "react-native-paper";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import ProductList from "./ProductList";
import SearchedProduct from "./SearchedProduct";
import Banner from "../../Shared/Banner";
import CategoryFilter from "./CategoryFilter";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../Redux/Actions/productActions";
import styles from "../../Shared/Product/ProductContainer.styles";
import { getJwt } from "../../assets/common/jwtStore";

const { height, width } = Dimensions.get("window");

const TAB_ITEMS = ["New", "Popular", "Limited"];

const ProductContainer = () => {
    const context = useContext(AuthGlobal);
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { items: products } = useSelector((state) => state.products);

    const [productsFiltered, setProductsFiltered] = useState([]);
    const [focus, setFocus] = useState(false);
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState(-1);
    const [productsCtg, setProductsCtg] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [showPriceFilter, setShowPriceFilter] = useState(false);
    const [maxPrice, setMaxPrice] = useState(1000);
    const [activeTab, setActiveTab] = useState(0);
    const [vouchers, setVouchers] = useState([]);
    const [claimedVoucherIds, setClaimedVoucherIds] = useState(new Set());
    const [claimingVoucherId, setClaimingVoucherId] = useState(null);

    const isAuthenticated = context?.stateUser?.isAuthenticated;

    const welcomeName =
        context?.stateUser?.userProfile?.name ||
        context?.stateUser?.user?.name ||
        "Shopper";

    // FIX: Separated loadVouchers from useFocusEffect cleanup
    // and removed it from the dependency array to avoid stale closure loop.
    const loadVouchers = async () => {
        try {
            const availableRes = await axios.get(`${baseURL}vouchers/available`);
            const voucherData = availableRes.data || [];
            console.log("Vouchers fetched:", voucherData.length); // debug
            setVouchers(voucherData);

            if (isAuthenticated) {
                const token = await getJwt();
                const claimedRes = await axios.get(`${baseURL}vouchers/claimed/me`, {
                    headers: { Authorization: `Bearer ${token || ""}` },
                });
                const activeClaims = (claimedRes.data || [])
                    .filter((claim) => claim.status === "claimed" && claim.voucher)
                    .map((claim) => String(claim.voucher.id || claim.voucher._id));
                setClaimedVoucherIds(new Set(activeClaims));
            } else {
                setClaimedVoucherIds(new Set());
            }
        } catch (error) {
            // FIX: Log the error so you can see what's actually failing
            console.log("Voucher load error:", error?.response?.data || error.message);
            setVouchers([]);
        }
    };

    const handleClaimVoucher = async (voucherId) => {
        if (!isAuthenticated) {
            Alert.alert("Login required", "Please login to claim vouchers.");
            navigation.navigate("User", { screen: "Login" });
            return;
        }

        setClaimingVoucherId(voucherId);
        try {
            const token = await getJwt();
            await axios.post(
                `${baseURL}vouchers/${voucherId}/claim`,
                {},
                { headers: { Authorization: `Bearer ${token || ""}` } }
            );
            setClaimedVoucherIds((prev) => new Set([...prev, String(voucherId)]));
        } catch (error) {
            Alert.alert("Claim failed", error?.response?.data?.message || "Unable to claim voucher");
        } finally {
            setClaimingVoucherId(null);
        }
    };

    const searchProduct = (text) => {
        setProductsFiltered(
            products.filter((i) => i.name.toLowerCase().includes(text.toLowerCase()))
        );
    };

    const openList = () => setFocus(true);
    const onBlur = () => setFocus(false);

    useEffect(() => {
        if (products.length > 0) {
            setProductsFiltered(products);
            setProductsCtg(products);
            const prices = products.map((p) => p.price);
            const max = Math.max(...prices);
            setMaxPrice(max);
            setPriceRange([0, max]);
        }
    }, [products]);

    const changeCtg = (ctg) => {
        if (ctg === "all") {
            setProductsCtg(products);
            setActive(true);
        } else {
            setProductsCtg(
                products.filter(
                    (i) =>
                        i.category != null &&
                        (i.category.id === ctg || i.category._id === ctg)
                )
            );
            setActive(true);
        }
    };

    const filterByPrice = (values) => {
        setPriceRange(values);
        const filtered = products.filter(
            (product) => product.price >= values[0] && product.price <= values[1]
        );
        setProductsFiltered(filtered);
        setProductsCtg(filtered);
    };

    // FIX: Removed loadVouchers from dependency array and from cleanup.
    // Vouchers should NOT be cleared on screen blur — only re-fetched on focus.
    useFocusEffect(
        useCallback(() => {
            setFocus(false);
            setActive(-1);
            dispatch(fetchProducts());
            axios
                .get(`${baseURL}categories`)
                .then((res) => setCategories(res.data))
                .catch(() => console.log("Api categories call error"));
            loadVouchers();

            // FIX: Only reset UI state, not vouchers — vouchers are valid until refetched
            return () => {
                setProductsFiltered([]);
                setCategories([]);
                // Removed: setVouchers([]) ← this was clearing vouchers on every blur
            };
        }, [dispatch, isAuthenticated]) // FIX: depend on isAuthenticated directly, not loadVouchers
    );

    return (
        <Surface style={styles.surface}>
            <StatusBar barStyle="dark-content" backgroundColor="#faf9f7" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Get surprised with Blindly! Shop now!</Text>
                    <Text style={{ color: "#9b8ec4", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                        {`Welcome, ${welcomeName}`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.avatarBtn}
                    onPress={() => navigation.navigate("User Profile")}
                >
                    <Ionicons name="person-outline" size={22} color="#3d2c8d" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {TAB_ITEMS.map((tab, idx) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === idx && styles.tabActive]}
                        onPress={() => setActiveTab(idx)}
                    >
                        <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={18} color="#9b8ec4" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search blindbox..."
                        placeholderTextColor="#b0a3d4"
                        value={keyword}
                        onChangeText={(text) => {
                            searchProduct(text);
                            setKeyword(text);
                            setFocus(true);
                        }}
                        onFocus={openList}
                    />
                    {keyword.length > 0 && (
                        <TouchableOpacity onPress={() => { setKeyword(""); onBlur(); }}>
                            <Ionicons name="close-circle" size={18} color="#9b8ec4" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.filterIconBtn}
                    onPress={() => setShowPriceFilter(!showPriceFilter)}
                >
                    <Ionicons name="options-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Price Filter Panel */}
            {showPriceFilter && !focus && (
                <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>
                        Price Range:{" "}
                        <Text style={styles.priceValue}>
                            ${priceRange[0]} – ${priceRange[1]}
                        </Text>
                    </Text>
                    <View style={styles.sliderContainer}>
                        <MultiSlider
                            values={[priceRange[0], priceRange[1]]}
                            min={0}
                            max={maxPrice}
                            step={1}
                            onValuesChange={filterByPrice}
                            selectedStyle={styles.sliderSelected}
                            unselectedStyle={styles.sliderUnselected}
                            markerStyle={styles.sliderMarker}
                            containerStyle={styles.sliderWrapper}
                            trackStyle={styles.sliderTrack}
                            touchDimensions={styles.sliderTouch}
                        />
                    </View>
                    <View style={styles.priceActions}>
                        <TouchableOpacity
                            onPress={() => {
                                setPriceRange([0, maxPrice]);
                                filterByPrice([0, maxPrice]);
                            }}
                        >
                            <Text style={styles.priceReset}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => setShowPriceFilter(false)}
                        >
                            <Text style={styles.applyText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Content */}
            {focus ? (
                <SearchedProduct productsFiltered={productsFiltered} />
            ) : (
                <FlatList
                    data={productsCtg}
                    keyExtractor={(item) => String(item.id || item._id)}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 10 }}
                    contentContainerStyle={{ paddingBottom: 30, paddingTop: 4 }}
                    renderItem={({ item }) => (
                        <ProductList item={item} />
                    )}
                    ListEmptyComponent={
                        <View style={[styles.center, { height: height / 2 }]}>
                            <Ionicons name="cube-outline" size={48} color="#c4b8e8" />
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <>
                            {/* Banner */}
                            <View style={styles.bannerWrapper}>
                                <Banner />
                            </View>

                            {/* Help Banner */}
                            <TouchableOpacity
                                style={styles.helpBanner}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate("Help Chat")}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.helpTitle}>Need help?</Text>
                                    <Text style={styles.helpSub}>Track orders or chat with us.</Text>
                                </View>
                                <View style={styles.helpIcon}>
                                    <Ionicons name="chatbubbles-outline" size={28} color="#7c3aed" />
                                </View>
                            </TouchableOpacity>

                            {/* Vouchers */}
                            {vouchers.length > 0 && (
                                <View style={{ marginHorizontal: 14, marginBottom: 14 }}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Vouchers / Discounts</Text>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        decelerationRate="fast"
                                        snapToInterval={width * 0.58 + 10}
                                        contentContainerStyle={{ paddingRight: 14 }}
                                    >
                                        {vouchers.map((voucher) => {
                                            const voucherId = String(voucher.id || voucher._id);
                                            const alreadyClaimed = claimedVoucherIds.has(voucherId);
                                            const appliesText = voucher.appliesTo === "category"
                                                ? `Category: ${voucher.category?.name || "Selected category"}`
                                                : "All items";

                                            return (
                                                <View
                                                    key={voucherId}
                                                    style={{
                                                        width: width * 0.58,
                                                        backgroundColor: "#fff",
                                                        borderRadius: 14,
                                                        padding: 10,
                                                        marginRight: 10,
                                                        borderWidth: 1,
                                                        borderColor: "#ece7f8",
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 12, color: "#6d6297", fontWeight: "700" }} numberOfLines={1}>
                                                        {voucher.name}
                                                    </Text>
                                                    <Text style={{ fontSize: 20, fontWeight: "800", color: "#e91e63", marginTop: 2 }}>
                                                        {Number(voucher.discountPercent || 0)}% OFF
                                                    </Text>
                                                    <Text style={{ color: "#6d6297", marginTop: 4, fontSize: 12 }} numberOfLines={2}>
                                                        {voucher.description || "Discount voucher"}
                                                    </Text>
                                                    <Text style={{ color: "#8677b6", marginTop: 4, fontSize: 11 }} numberOfLines={1}>
                                                        {appliesText}
                                                    </Text>
                                                    <Text style={{ color: "#8677b6", marginTop: 2, fontSize: 11 }}>
                                                        Claim valid for {Number(voucher.dateExpirationAfterClaimDays || 0)} day(s)
                                                    </Text>
                                                    <Text style={{ color: "#8677b6", marginTop: 2, fontSize: 11 }}>
                                                        Ends on: {voucher.dateExpirationShop ? new Date(voucher.dateExpirationShop).toLocaleDateString() : "-"}
                                                    </Text>
                                                    <TouchableOpacity
                                                        disabled={alreadyClaimed || claimingVoucherId === voucherId}
                                                        onPress={() => handleClaimVoucher(voucherId)}
                                                        style={{
                                                            marginTop: 8,
                                                            backgroundColor: alreadyClaimed ? "#9ca3af" : "#7c3aed",
                                                            borderRadius: 10,
                                                            paddingVertical: 8,
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                                                            {alreadyClaimed
                                                                ? "Claimed"
                                                                : claimingVoucherId === voucherId
                                                                ? "Claiming..."
                                                                : "Claim Voucher"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Category Filter */}
                            <CategoryFilter
                                categories={categories}
                                categoryFilter={changeCtg}
                                productsCtg={productsCtg}
                                active={active}
                                setActive={setActive}
                            />

                            {/* Section Title */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Popularity</Text>
                            </View>
                        </>
                    }
                />
            )}
        </Surface>
    );
};

export default ProductContainer;