import React, { useContext } from "react";
import {
    StyleSheet,
    View,
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
} from "react-native";
import { addToCart } from "../../Redux/Actions/cartActions";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;
const IMAGE_SIZE = CARD_WIDTH * 0.7;
const FLOAT_OFFSET = IMAGE_SIZE * 0.45; // how much image pokes above card

const FALLBACK_IMAGE = "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const ProductCard = (props) => {
    const { name, price, image, countInStock } = props;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);

    const isAdmin = context?.stateUser?.user?.isAdmin === true;
    const isAuthenticated = context.stateUser.isAuthenticated;
    const outOfStock = countInStock <= 0;
    const showAddButton = !outOfStock && !isAdmin && isAuthenticated;
    const showGhostButton = !outOfStock && (!isAuthenticated || isAdmin);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please log in",
                text2: "You must be logged in to add items to cart",
            });
            navigation.navigate("User", { screen: "Login" });
            return;
        }
        if (isAdmin) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Admins cannot order",
                text2: "Only customers can add items to cart",
            });
            return;
        }
        dispatch(addToCart({ ...props, quantity: 1 }, context.stateUser.user?.email));
        Toast.show({
            topOffset: 60,
            type: "success",
            text1: `${name} added to Cart`,
            text2: "Go to your cart to complete order",
        });
    };

    const displayName = name?.length > 15 ? name.substring(0, 12) + "…" : name;

    return (
        // Outer wrapper adds top margin to make room for the floating image
        <View style={[styles.wrapper, { marginTop: FLOAT_OFFSET + 8 }]}>

            {/* Floating image — sits above the card via negative top margin on card */}
            <Image
                style={[styles.image, { width: IMAGE_SIZE, height: IMAGE_SIZE }]}
                resizeMode="contain"
                source={{ uri: image || FALLBACK_IMAGE }}
            />

            {/* Card body starts directly below the bottom half of the image */}
            <View style={[styles.card, { marginTop: -(FLOAT_OFFSET) }]}>

                {/* Out of stock ribbon */}
                {outOfStock && (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                )}

                {/* Spacer to push content below the overlapping image portion */}
                <View style={{ height: FLOAT_OFFSET + 4 }} />

                <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
                <Text style={styles.price}>₱{Number(price).toFixed(2)}</Text>

                {showAddButton && (
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={handleAddToCart}
                        activeOpacity={0.82}
                    >
                        <Ionicons name="cart-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                )}

                {showGhostButton && (
                    <TouchableOpacity
                        style={styles.addBtnGhost}
                        onPress={handleAddToCart}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart-outline" size={14} color="#7c3aed" style={{ marginRight: 4 }} />
                        <Text style={styles.addBtnGhostText}>Add</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 14 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: CARD_WIDTH,
        marginBottom: 8,
        marginHorizontal: 8,
        alignItems: "center",
    },

    // ── Floating image (sits on top of card) ──────────────────────────────────
    image: {
        zIndex: 2,
        borderRadius: 12,
        backgroundColor: "transparent",
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        width: "100%",
        borderRadius: 18,
        backgroundColor: "#fff",
        alignItems: "center",
        paddingHorizontal: 10,
        shadowColor: "#5b21b6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.11,
        shadowRadius: 14,
        elevation: 6,
    },

    // ── Out of stock ribbon ───────────────────────────────────────────────────
    outOfStockBadge: {
        position: "absolute",
        top: 10,
        right: 0,
        backgroundColor: "#f0ecfb",
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    outOfStockText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#9b8ec4",
        letterSpacing: 0.4,
    },

    // ── Text ──────────────────────────────────────────────────────────────────
    title: {
        fontWeight: "700",
        fontSize: 13,
        color: "#1a1235",
        textAlign: "center",
        letterSpacing: -0.1,
        marginBottom: 4,
    },
    price: {
        fontSize: 17,
        fontWeight: "800",
        color: "#7c3aed",
        marginBottom: 10,
        letterSpacing: -0.3,
    },

    // ── Add button (authenticated) ────────────────────────────────────────────
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#7c3aed",
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 3,
    },
    addBtnText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    // ── Add button ghost (unauthenticated) ────────────────────────────────────
    addBtnGhost: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#e4dff5",
        backgroundColor: "#f0ecfb",
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
    },
    addBtnGhostText: {
        color: "#7c3aed",
        fontSize: 12,
        fontWeight: "700",
    },
});

export default ProductCard;