import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    LOAD_CART,
} from '../constants';
import {
    addCartItem,
    removeCartItem,
    clearCartDB,
    getCartItems,
    initCartDB,
} from '../cartDatabase';

// Thunk: Load cart from SQLite for a user on app start or login
export const loadCartFromDB = (userId) => {
    return async (dispatch) => {
        if (!userId) {
            dispatch({ type: LOAD_CART, payload: [] });
            return;
        }
        try {
            await initCartDB();
            const items = await getCartItems(userId);
            dispatch({ type: LOAD_CART, payload: items });
            console.log('[Cart] Loaded from SQLite for user', userId, ':', items.length, 'items');
        } catch (error) {
            console.error('[Cart] Load error:', error);
        }
    };
};

// Thunk: Add to cart and persist to SQLite for a user
export const addToCart = (payload, userId) => {
    return async (dispatch) => {
        if (!userId) return;
        dispatch({ type: ADD_TO_CART, payload });
        await addCartItem(payload, userId);
    };
};

// Thunk: Remove from cart and persist to SQLite for a user
export const removeFromCart = (payload, userId) => {
    return async (dispatch) => {
        if (!userId) return;
        dispatch({ type: REMOVE_FROM_CART, payload });
        await removeCartItem(payload, userId);
    };
};

// Thunk: Clear cart and clear SQLite for a user (after checkout or logout)
export const clearCart = (userId) => {
    return async (dispatch) => {
        if (!userId) {
            dispatch({ type: CLEAR_CART });
            return;
        }
        dispatch({ type: CLEAR_CART });
        await clearCartDB(userId);
        console.log('[Cart] Cleared from SQLite for user', userId);
    };
};

// Thunk: Update cart item quantity and persist to SQLite for a user
export const updateCartItemQuantity = (item, quantity, userId) => {
    return async (dispatch, getState) => {
        if (!userId) return;
        // Update the item in Redux state
        const updatedItem = { ...item, quantity };
        // Remove the old item and add the updated one
        dispatch({ type: REMOVE_FROM_CART, payload: item });
        dispatch({ type: ADD_TO_CART, payload: updatedItem });
        // Persist to SQLite
        await addCartItem(updatedItem, userId);
    };
};
