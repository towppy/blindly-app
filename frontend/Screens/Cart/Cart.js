import React, { useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Text, View, TouchableHighlight, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SwipeListView } from "react-native-swipe-list-view";
import { removeFromCart, clearCart, updateCartItemQuantity } from "../../Redux/Actions/cartActions";
import { Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import styles, { COLORS, FALLBACK } from "../../Shared/Cart/Cart.styles";

const Cart = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const context = useContext(AuthGlobal);
    const cartItems = useSelector((s) => s.cartItems);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        const initialQuantities = {};
        cartItems.forEach((item, index) => {
            const itemId = item.id || item._id || index;
            initialQuantities[itemId] = item.quantity || 1;
        });
        setQuantities(initialQuantities);
    }, [cartItems]);

    const total = cartItems.reduce((sum, item) => {
        const itemId = item.id || item._id;
        const quantity = quantities[itemId] || item.quantity || 1;
        return sum + (item.price * quantity);
    }, 0);

    useEffect(() => {
        if (!context.stateUser.isAuthenticated) {
            navigation.navigate("User", { screen: "Login" });
        }
    }, [context.stateUser.isAuthenticated, navigation]);

    const handleQuantityChange = (item, operation) => {
        const itemId = item.id || item._id;
        const currentQty = quantities[itemId] || item.quantity || 1;
        let newQty = operation === 'increase' ? currentQty + 1 : currentQty - 1;
        
        if (newQty < 1) {
            Alert.alert(
                "Remove Item",
                "Do you want to remove this item from your cart?",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Remove", 
                        onPress: () => {
                            dispatch(removeFromCart(item, context.stateUser.user?.email));
                        },
                        style: "destructive"
                    }
                ]
            );
            return;
        }

        setQuantities(prev => ({ ...prev, [itemId]: newQty }));
        dispatch(updateCartItemQuantity(item, newQty, context.stateUser.user?.email));
    };

    const handleDelete = (item) => {
        Alert.alert(
            "Remove Item",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Remove", 
                    onPress: () => dispatch(removeFromCart(item, context.stateUser.user?.email)),
                    style: "destructive"
                }
            ]
        );
    };

    const handleClearCart = () => {
        if (cartItems.length === 0) return;
        
        Alert.alert(
            "Clear Cart",
            "Are you sure you want to remove all items?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Clear All", 
                    onPress: () => dispatch(clearCart(context.stateUser.user?.email)),
                    style: "destructive"
                }
            ]
        );
    };

    if (!context.stateUser.isAuthenticated) return null;

    if (context?.stateUser?.user?.isAdmin === true) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Ionicons name="shield-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Admin Account</Text>
                <Text style={styles.emptySubtitle}>Admins cannot place orders.</Text>
            </View>
        );
    }

    const renderItem = ({ item, index }) => {
        const itemId = item.id || item._id || index;
        const quantity = quantities[itemId] || item.quantity || 1;

        return (
            <TouchableHighlight
                underlayColor={COLORS.primaryLighter}
                style={{ borderRadius: 16, marginBottom: 10 }}
            >
                <View style={styles.itemSurface}>
                    <View style={styles.itemImageWrapper}>
                        <Image
                            source={{ uri: item.image || FALLBACK }}
                            style={styles.itemImage}
                            resizeMode="cover"
                        />
                    </View>
                    
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                            ₱{Number(item.price).toFixed(2)}
                        </Text>
                        
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityBtn}
                                onPress={() => handleQuantityChange(item, 'decrease')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="remove" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            
                            <Text style={styles.quantityText}>{quantity}</Text>
                            
                            <TouchableOpacity
                                style={styles.quantityBtn}
                                onPress={() => handleQuantityChange(item, 'increase')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            
                           
                        </View>
                    </View>
                    
                    <Text style={styles.itemTotal}>
                        ₱{(item.price * quantity).toFixed(2)}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    };

    const renderHiddenItem = (rowData) => (
        <View style={styles.hiddenRow}>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(rowData.item)}
                activeOpacity={0.8}
            >
                <Ionicons name="trash" color={COLORS.white} size={22} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.flex}>
            {cartItems.length > 0 ? (
                <SwipeListView
                    data={cartItems}
                    renderItem={renderItem}
                    renderHiddenItem={renderHiddenItem}
                    disableRightSwipe
                    rightOpenValue={-88}
                    keyExtractor={(item, i) => String(item.id || item._id || i)}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="cart-outline" size={36} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add items to get started</Text>
                </View>
            )}

            {cartItems.length > 0 && (
                <View style={styles.bottomBar}>
                    <View style={styles.totalBlock}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>₱{total.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={handleClearCart}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                        <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => navigation.navigate("Checkout")}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.checkoutBtnText}>Checkout</Text>
                        <Ionicons name="arrow-forward" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default Cart;