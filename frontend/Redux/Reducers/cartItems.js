import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    LOAD_CART,
    SET_CART_ITEM_QUANTITY,
} from '../constants';

const getProductId = (item) => String(item?.id || item?._id || item?.product_id || "");

const sanitizeQuantity = (value) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 1) return 1;
    return Math.floor(qty);
};

const mergeUniqueItems = (items) => {
    const merged = [];

    for (const raw of items || []) {
        const item = { ...raw };
        const productId = getProductId(item);
        if (!productId) continue;

        const quantity = sanitizeQuantity(item.quantity);
        const existingIndex = merged.findIndex((entry) => getProductId(entry) === productId);

        if (existingIndex >= 0) {
            merged[existingIndex] = {
                ...merged[existingIndex],
                ...item,
                id: merged[existingIndex].id || item.id || item._id || productId,
                _id: merged[existingIndex]._id || item._id || item.id || productId,
                quantity: sanitizeQuantity(merged[existingIndex].quantity) + quantity,
            };
        } else {
            merged.push({
                ...item,
                id: item.id || item._id || productId,
                _id: item._id || item.id || productId,
                quantity,
            });
        }
    }

    return merged;
};

const cartItems = (state = [], action) => {
    switch (action.type) {
        case LOAD_CART:
            // Load and normalize persisted cart to avoid duplicate product rows
            return mergeUniqueItems(action.payload || []);
        case ADD_TO_CART: {
            const incoming = action.payload || {};
            const incomingId = getProductId(incoming);
            if (!incomingId) return state;

            const idx = state.findIndex((item) => getProductId(item) === incomingId);
            const incomingQty = sanitizeQuantity(incoming.quantity);
            if (idx === -1) {
                return [
                    ...state,
                    {
                        ...incoming,
                        id: incoming.id || incoming._id || incomingId,
                        _id: incoming._id || incoming.id || incomingId,
                        quantity: incomingQty,
                    },
                ];
            }

            return state.map((item, index) =>
                index === idx
                    ? {
                        ...item,
                        ...incoming,
                        id: item.id || incoming.id || incoming._id || incomingId,
                        _id: item._id || incoming._id || incoming.id || incomingId,
                        quantity: sanitizeQuantity(item.quantity) + incomingQty,
                    }
                    : item
            );
        }
        case REMOVE_FROM_CART:
            return state.filter((cartItem) => {
                const currentId = getProductId(cartItem);
                const targetId = getProductId(action.payload);
                if (targetId) {
                    return currentId !== targetId;
                }
                return cartItem !== action.payload;
            });
        case SET_CART_ITEM_QUANTITY: {
            const targetId = getProductId(action.payload?.item);
            if (!targetId) return state;

            return state.map((cartItem) =>
                getProductId(cartItem) === targetId
                    ? { ...cartItem, quantity: sanitizeQuantity(action.payload?.quantity) }
                    : cartItem
            );
        }
        case CLEAR_CART:
            return [];
        default:
            return state;
    }
};

export default cartItems;
