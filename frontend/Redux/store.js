/**
 * Redux store: holds cart, products, orders and reviews state.
 * Screens use useSelector / useDispatch to read and dispatch actions.
 */
import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import cartItems from './Reducers/cartItems';
import products from './Reducers/products';
import orders from './Reducers/orders';
import reviews from './Reducers/reviews';

const reducers = combineReducers({
    cartItems,
    products,
    orders,
    reviews,
});

const store = createStore(reducers, applyMiddleware(thunk));

export default store;
