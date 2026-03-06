import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    LOAD_CART,
} from '../constants';

const cartItems = (state = [], action) => {
    switch (action.type) {
        case LOAD_CART:
            // Load saved cart from SQLite on app start
            return action.payload || [];
        case ADD_TO_CART:
            return [...state, action.payload];
        case REMOVE_FROM_CART:
            return state.filter((cartItem) => cartItem !== action.payload);
        case CLEAR_CART:
            return [];
        default:
            return state;
    }
};

export default cartItems;
