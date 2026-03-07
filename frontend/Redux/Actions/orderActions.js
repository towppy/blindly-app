import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";
import {
  FETCH_ORDERS_REQUEST,
  FETCH_ORDERS_SUCCESS,
  FETCH_ORDERS_FAIL,
} from "../constants";

export const fetchOrders = () => async (dispatch) => {
  dispatch({ type: FETCH_ORDERS_REQUEST });
  try {
    const token = await getJwt();
    const res = await axios.get(`${baseURL}orders`, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });
    dispatch({ type: FETCH_ORDERS_SUCCESS, payload: res.data });
  } catch (err) {
    dispatch({ type: FETCH_ORDERS_FAIL, payload: err.message });
  }
};
