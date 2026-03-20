import React, { memo } from "react";
import { TouchableOpacity, View, Dimensions, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ProductCard from "./ProductCard";

var { width } = Dimensions.get("window");

const ProductList = (props) => {
    const { item, isFavorite, onToggleFavorite } = props;
    const navigation = useNavigation();

    return (
        <TouchableOpacity
            style={styles.touchWrap}
            onPress={() => navigation.navigate("Product Detail", { item })}
            activeOpacity={0.9}
        >
            <View style={styles.innerWrap}>
                <ProductCard {...item} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    touchWrap: {
        width: "50%",
        paddingVertical: 4,
    },
    innerWrap: {
        width: width / 2,
        backgroundColor: "transparent",
    },
});

export default memo(ProductList);
