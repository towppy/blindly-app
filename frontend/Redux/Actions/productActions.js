import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import {
  FETCH_PRODUCTS_REQUEST,
  FETCH_PRODUCTS_SUCCESS,
  FETCH_PRODUCTS_FAIL,
} from "../constants";

export const fetchProducts = () => async (dispatch) => {
  dispatch({ type: FETCH_PRODUCTS_REQUEST });
  try {
    const res = await axios.get(`${baseURL}products`);
    dispatch({ type: FETCH_PRODUCTS_SUCCESS, payload: res.data });
  } catch (err) {
    dispatch({ type: FETCH_PRODUCTS_FAIL, payload: err.message });
  }
};
