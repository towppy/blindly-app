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

// Thunk: Load cart from SQLite on app start
export const loadCartFromDB = () => {
    return async (dispatch) => {
        try {
            await initCartDB();
            const items = await getCartItems();
            dispatch({ type: LOAD_CART, payload: items });
            console.log('[Cart] Loaded from SQLite:', items.length, 'items');
        } catch (error) {
            console.error('[Cart] Load error:', error);
        }
    };
};

// Thunk: Add to cart and persist to SQLite
export const addToCart = (payload) => {
    return async (dispatch) => {
        dispatch({ type: ADD_TO_CART, payload });
        await addCartItem(payload);
    };
};

// Thunk: Remove from cart and persist to SQLite
export const removeFromCart = (payload) => {
    return async (dispatch) => {
        dispatch({ type: REMOVE_FROM_CART, payload });
        await removeCartItem(payload);
    };
};

// Thunk: Clear cart and clear SQLite (after checkout)
export const clearCart = () => {
    return async (dispatch) => {
        dispatch({ type: CLEAR_CART });
        await clearCartDB();
        console.log('[Cart] Cleared from SQLite');
    };
};
