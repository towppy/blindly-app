import React, { useState, useCallback } from "react";
import { View, ScrollView, Text, Dimensions } from "react-native";
import { Surface, Searchbar, Button, Card } from "react-native-paper";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import ProductList from "./ProductList";
import SearchedProduct from "./SearchedProduct";
import Banner from "../../Shared/Banner";
import CategoryFilter from "./CategoryFilter";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";

// style
import ProductContainerStyles from "../../Shared/Product/ProductContainer.styles";

const { height, width } = Dimensions.get("window");

const ProductContainer = () => {
    const [products, setProducts] = useState([]);
    const [productsFiltered, setProductsFiltered] = useState([]);
    const [focus, setFocus] = useState(false);
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState(-1);
    const [initialState, setInitialState] = useState([]);
    const [productsCtg, setProductsCtg] = useState([]);
    const [keyword, setKeyword] = useState("");

    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [showPriceFilter, setShowPriceFilter] = useState(false);
    const [maxPrice, setMaxPrice] = useState(1000);

    const searchProduct = (text) => {
        setProductsFiltered(
            products.filter((i) => i.name.toLowerCase().includes(text.toLowerCase()))
        );
    };

    const openList = () => setFocus(true);
    const onBlur = () => setFocus(false);

    const changeCtg = (ctg) => {
        if (ctg === "all") {
            setProductsCtg(initialState);
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
        
        let filtered = products.filter(
            (product) => product.price >= values[0] && product.price <= values[1]
        );
        
        setProductsFiltered(filtered);
        setProductsCtg(filtered);
    };

    useFocusEffect(
        useCallback(() => {
            setFocus(false);
            setActive(-1);

            axios
                .get(`${baseURL}products`)
                .then((res) => {
                    setProducts(res.data);
                    setProductsFiltered(res.data);
                    setProductsCtg(res.data);
                    setInitialState(res.data);

                    const prices = res.data.map(p => p.price);
                    const max = Math.max(...prices);
                    setMaxPrice(max);
                    setPriceRange([0, max]);
                })
                .catch(() => console.log("Api call error"));

            axios
                .get(`${baseURL}categories`)
                .then((res) => setCategories(res.data))
                .catch(() => console.log("Api categories call error"));

            return () => {
                setProducts([]);
                setProductsFiltered([]);
                setCategories([]);
                setInitialState([]);
            };
        }, [])
    );

    return (
        <Surface style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Searchbar
                placeholder="Search"
                onChangeText={(text) => {
                    searchProduct(text);
                    setKeyword(text);
                    setFocus(true);
                }}
                value={keyword}
                onClearIconPress={onBlur}
            />

            {!focus && (
                <View style={{ width: '90%', marginVertical: 10 }}>
                    <Button 
                        mode="outlined" 
                        onPress={() => setShowPriceFilter(!showPriceFilter)}
                        icon="currency-usd"
                    >
                        {showPriceFilter ? 'Hide Price Filter' : 'Filter by Price'}
                    </Button>
                    
                    {showPriceFilter && (
                        <Card style={{ marginTop: 10, padding: 15 }}>
                            <Text style={{ textAlign: 'center', marginBottom: 10 }}>
                                Price Range: ${priceRange[0]} - ${priceRange[1]}
                            </Text>
                            <View style={{ alignItems: 'center' }}>
                                <MultiSlider
                                    values={[priceRange[0], priceRange[1]]}
                                    min={0}
                                    max={maxPrice}
                                    step={1}
                                    onValuesChange={filterByPrice}
                                    selectedStyle={{
                                        backgroundColor: '#2a9d8f',
                                    }}
                                    unselectedStyle={{
                                        backgroundColor: '#e9ecef',
                                    }}
                                    markerStyle={{
                                        backgroundColor: '#2a9d8f',
                                        height: 24,
                                        width: 24,
                                        borderRadius: 12,
                                    }}
                                    containerStyle={{
                                        height: 40,
                                        width: width * 0.75,
                                    }}
                                    trackStyle={{
                                        height: 4,
                                        borderRadius: 2,
                                    }}
                                    touchDimensions={{
                                        height: 40,
                                        width: 40,
                                        borderRadius: 20,
                                        slipDisplacement: 40,
                                    }}
                                />
                            </View>
                            <View style={{ 
                                flexDirection: 'row', 
                                justifyContent: 'space-between',
                                marginTop: 10 
                            }}>
                                <Button 
                                    mode="text" 
                                    onPress={() => {
                                        setPriceRange([0, maxPrice]);
                                        filterByPrice([0, maxPrice]);
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button 
                                    mode="text" 
                                    onPress={() => setShowPriceFilter(false)}
                                >
                                    Apply
                                </Button>
                            </View>
                        </Card>
                    )}
                </View>
            )}

            {focus ? (
                <SearchedProduct productsFiltered={productsFiltered} />
            ) : (
                <ScrollView>
                    <Banner />
                    <CategoryFilter
                        categories={categories}
                        categoryFilter={changeCtg}
                        productsCtg={productsCtg}
                        active={active}
                        setActive={setActive}
                    />

                    {productsCtg.length > 0 ? (
                        <View style={ProductContainerStyles.styles.listContainer}>
                            {productsCtg.map((item) => (
                                <ProductList key={item.id || item._id} item={item} />
                            ))}
                        </View>
                    ) : (
                        <View
                            style={[
                                ProductContainerStyles.styles.center,
                                { height: height / 2 },
                            ]}
                        >
                            <Text>No products found</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </Surface>
    );
};

export default ProductContainer;