import React, { useState, useCallback } from "react";
import { View, ScrollView, Text, Dimensions } from "react-native";
import { Surface, Searchbar } from "react-native-paper";
import ProductList from "./ProductList";
import SearchedProduct from "./SearchedProduct";
import Banner from "../../Shared/Banner";
import CategoryFilter from "./CategoryFilter";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useFocusEffect } from "@react-navigation/native";

// style
import ProductContainerStyles from "../../Shared/Product/ProductContainer.styles";

const { height } = Dimensions.get("window");

const ProductContainer = () => {
    const [products, setProducts] = useState([]);
    const [productsFiltered, setProductsFiltered] = useState([]);
    const [focus, setFocus] = useState(false);
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState(-1);
    const [initialState, setInitialState] = useState([]);
    const [productsCtg, setProductsCtg] = useState([]);
    const [keyword, setKeyword] = useState("");

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