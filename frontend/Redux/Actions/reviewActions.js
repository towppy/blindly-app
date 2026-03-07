import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import {
  FETCH_REVIEWS_REQUEST,
  FETCH_REVIEWS_SUCCESS,
  FETCH_REVIEWS_FAIL,
} from "../constants";

export const fetchReviews = (productId) => async (dispatch) => {
  dispatch({ type: FETCH_REVIEWS_REQUEST });
  try {
    const res = await axios.get(`${baseURL}reviews/product/${productId}`);
    dispatch({ type: FETCH_REVIEWS_SUCCESS, payload: { productId, reviews: res.data } });
  } catch (err) {
    dispatch({ type: FETCH_REVIEWS_FAIL, payload: err.message });
  }
};
