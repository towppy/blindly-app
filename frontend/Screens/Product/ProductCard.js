import React, { useContext } from "react";
import {
    StyleSheet,
    View,
    Dimensions,
    Image,
    Text,
    Button,
} from "react-native";
import { addToCart } from "../../Redux/Actions/cartActions";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import AuthGlobal from "../../Context/Store/AuthGlobal";

var { width } = Dimensions.get("window");

// Product images come from the API (item.image). Fallback when no image: placeholder URL.
const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const ProductCard = (props) => {
    const { name, price, image, countInStock } = props;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);

    const handleAddToCart = () => {
        if (!context.stateUser.isAuthenticated) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please log in",
                text2: "You must be logged in to add items to cart",
            });
            navigation.navigate("User", { screen: "Login" });
            return;
        }
        dispatch(addToCart({ ...props, quantity: 1 }));
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: `${name} added to Cart`,
            text2: "Go to your cart to complete order",
        });
    };

    return (
        <View style={styles.container}>
            <Image
                style={styles.image}
                resizeMode="contain"
                source={{ uri: image || FALLBACK_IMAGE }}
            />
            <View style={styles.card} />
            <Text style={styles.title}>
                {name.length > 15 ? name.substring(0, 12) + "..." : name}
            </Text>
            <Text style={styles.price}>${price}</Text>
            {countInStock > 0 ? (
                <View style={{ marginBottom: 60 }}>
                    <Button
                        title="Add"
                        color="green"
                        onPress={handleAddToCart}
                    />
                </View>
            ) : (
                <Text style={{ marginTop: 20 }}>Currently Unavailable</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width / 2 - 20,
        height: width / 1.7,
        padding: 10,
        borderRadius: 10,
        marginTop: 55,
        marginBottom: 5,
        marginLeft: 10,
        alignItems: "center",
        elevation: 8,
        backgroundColor: "white",
    },
    image: {
        width: width / 2 - 20 - 10,
        height: width / 2 - 20 - 30,
        backgroundColor: "transparent",
        position: "absolute",
        top: -45,
    },
    card: {
        marginBottom: 10,
        height: width / 2 - 20 - 90,
        backgroundColor: "transparent",
        width: width / 2 - 20 - 10,
    },
    title: {
        fontWeight: "bold",
        fontSize: 14,
        textAlign: "center",
    },
    price: {
        fontSize: 20,
        color: "orange",
        marginTop: 10,
    },
});

export default ProductCard;
