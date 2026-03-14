import React from "react";
import { View, Image, FlatList, TouchableOpacity } from "react-native";
import { Surface, Text, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../../Shared/Product/SearchedProduct.styles";

const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const SearchedProduct = ({ productsFiltered }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.wrapper}>
            {productsFiltered.length > 0 ? (
                <Surface style={styles.listSurface}>
                    <FlatList
                        data={productsFiltered}
                        keyExtractor={(item) => item._id || item.id}
                        numColumns={2}
                        key={"flatlist-2"}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.cardTouch}
                                onPress={() => navigation.navigate("Product Detail", { item })}
                                activeOpacity={0.85}
                            >
                                <Surface style={styles.card}>
                                    <Image
                                        style={styles.image}
                                        source={{ uri: item.image || FALLBACK_IMAGE }}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
                                    <Divider style={styles.divider} />
                                    <Text style={styles.price}>${item.price}</Text>
                                </Surface>
                            </TouchableOpacity>
                        )}
                    />
                </Surface>
            ) : (
                <View style={styles.center}>
                    <Ionicons name="cube-outline" size={44} color="#c4b8e8" />
                    <Text style={styles.emptyText}>No products match{"\n"}the selected criteria</Text>
                </View>
            )}
        </View>
    );
};

export default SearchedProduct;