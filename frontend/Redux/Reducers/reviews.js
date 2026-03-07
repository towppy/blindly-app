import {
  FETCH_REVIEWS_REQUEST,
  FETCH_REVIEWS_SUCCESS,
  FETCH_REVIEWS_FAIL,
} from "../constants";

const initialState = { loading: false, items: [], error: null, productId: null };

const reviews = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_REVIEWS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_REVIEWS_SUCCESS:
      return {
        loading: false,
        items: action.payload.reviews,
        productId: action.payload.productId,
        error: null,
      };
    case FETCH_REVIEWS_FAIL:
      return { loading: false, items: [], error: action.payload, productId: null };
    default:
      return state;
  }
};

export default reviews;
