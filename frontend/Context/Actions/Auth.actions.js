import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";
import { setJwt, getJwt, deleteJwt } from "../../assets/common/jwtStore";
import { clearCart, loadCartFromDB } from "../../Redux/Actions/cartActions";

async function addLocalNotificationHistory(item) {
    try {
        const existing = await AsyncStorage.getItem("notificationHistory");
        const arr = existing ? JSON.parse(existing) : [];
        const updated = [item, ...arr.filter((n) => n.id !== item.id)].slice(0, 100);
        await AsyncStorage.setItem("notificationHistory", JSON.stringify(updated));
    } catch (_e) {}
}

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = (user, dispatch, reduxDispatch) => {
    // Clear cart for previous user (if any)
    if (reduxDispatch) reduxDispatch(clearCart(user?.email));
    return fetch(`${baseURL}users/login`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (res.status === 403) {
                return res.json().then((data) => {
                    if (data?.code === "EMAIL_NOT_VERIFIED") {
                        Toast.show({
                            topOffset: 60,
                            type: "error",
                            text1: "Email not verified",
                            text2: "Please verify your email first.",
                        });
                        return;
                    }
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "Account Deactivated",
                        text2: data.message || "Your account has been deactivated",
                    });
                    // Don't call logoutUser — no session exists yet
                });
            }
            return res.json().then(async (data) => {
                if (data && data.token) {
                    const token = data.token;
                    return setJwt(token).then(() => {
                        const decoded = jwtDecode(token);
                        dispatch(setCurrentUser(decoded, user));
                        addLocalNotificationHistory({
                            id: `login-${Date.now()}-${decoded.userId || "user"}`,
                            title: "Login successful",
                            body: `Welcome back, ${decoded.email || "user"}!`,
                            date: new Date().toISOString(),
                            type: "login",
                        });
                        // Load cart for this user
                        if (reduxDispatch && decoded && decoded.email) {
                            reduxDispatch(loadCartFromDB(decoded.email));
                        }
                    });
                } else {
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: data?.message || "Login failed",
                        text2: "Please provide correct credentials",
                    });
                    logoutUser(dispatch, reduxDispatch);
                }
            });
        })
        .catch((err) => {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please provide correct credentials",
                text2: "",
            });
            console.log(err);
            logoutUser(dispatch);
        });
};

export const getUserProfile = (id) => {
    fetch(`${baseURL}users/${id}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.json())
        .then((data) => console.log(data));
};

export const logoutUser = async (dispatch, reduxDispatch, userId) => {
    try {
        const token = await getJwt();
        const pushToken = await AsyncStorage.getItem("pushToken");
        if (token && pushToken) {
            // Best-effort: tell server to remove this push token so stale
            // notifications are not sent after logout.
            fetch(`${baseURL}users/push-token`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token: pushToken }),
            }).catch(() => {});
        }
    } catch (_) {}
    await deleteJwt();
    await AsyncStorage.removeItem("pushToken");
    if (reduxDispatch && userId) {
        await reduxDispatch(clearCart(userId));
    }
    dispatch(setCurrentUser({}));
};

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user,
    };
};

export const resendVerificationEmail = async (email) => {
    return fetch(`${baseURL}users/resend-verification`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    }).then((res) => res.json());
};
