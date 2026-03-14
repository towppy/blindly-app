import React, { useState, useCallback, useContext, useEffect } from "react";
import {
    View,
    ScrollView,
    Text,
    Dimensions,
    TouchableOpacity,
    TextInput,
    StatusBar,
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

const { height, width } = Dimensions.get("window");

const TAB_ITEMS = ["New", "Popular", "Limited"];

const ProductContainer = () => {
    const context = useContext(AuthGlobal);
    const isAdmin = context?.stateUser?.user?.isAdmin === true;
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

    useFocusEffect(
        useCallback(() => {
            setFocus(false);
            setActive(-1);
            dispatch(fetchProducts());
            axios
                .get(`${baseURL}categories`)
                .then((res) => setCategories(res.data))
                .catch(() => console.log("Api categories call error"));
            return () => {
                setProductsFiltered([]);
                setCategories([]);
            };
        }, [dispatch])
    );

    return (
        <Surface style={styles.surface}>
            <StatusBar barStyle="dark-content" backgroundColor="#faf9f7" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome!</Text>
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

            {/* Admin Promo Button */}
            {isAdmin && !focus && (
                <TouchableOpacity
                    style={styles.promoBtn}
                    onPress={() => navigation.navigate("Promo Notification")}
                >
                    <Ionicons name="megaphone-outline" size={16} color="#fff" style={{ marginRight: 7 }} />
                    <Text style={styles.promoBtnText}>Add Promo / Discounts</Text>
                </TouchableOpacity>
            )}

            {/* Content */}
            {focus ? (
                <SearchedProduct productsFiltered={productsFiltered} />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 30 }}
                >
                    {/* Banner */}
                    <View style={styles.bannerWrapper}>
                        <Banner />
                    </View>

                    {/* Help Banner */}
                    <View style={styles.helpBanner}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.helpTitle}>Need help?</Text>
                            <Text style={styles.helpSub}>Track orders or chat with us.</Text>
                        </View>
                        <View style={styles.helpIcon}>
                            <Ionicons name="calendar-outline" size={28} color="#7c3aed" />
                        </View>
                    </View>

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

                    {/* Product Grid */}
                    {productsCtg.length > 0 ? (
                        <View style={styles.listContainer}>
                            {productsCtg.map((item) => (
                                <ProductList key={item.id || item._id} item={item} />
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.center, { height: height / 2 }]}>
                            <Ionicons name="cube-outline" size={48} color="#c4b8e8" />
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </Surface>
    );
};

export default ProductContainer;