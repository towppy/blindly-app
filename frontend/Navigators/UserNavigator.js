import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../Screens/User/Login";
import Register from "../Screens/User/Register";
import VerifyEmail from "../Screens/User/VerifyEmail";
import UserProfile from "../Screens/User/UserProfile";
import MyOrders from "../Screens/User/MyOrders";
import NotificationCenter from "../Screens/User/NotificationCenter";
import OrderDetail from "../Screens/User/OrderDetail";
import PromoDetail from "../Screens/User/PromoDetail";
import UserLanding from "../Screens/User/UserLanding";

const Stack = createStackNavigator();

const UserNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="User Landing" component={UserLanding} options={{ title: "My Account" }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
            <Stack.Screen name="Verify Email" component={VerifyEmail} options={{ title: "Verify Email" }} />
            <Stack.Screen name="User Profile" component={UserProfile} options={{ headerShown: false }} />
            <Stack.Screen name="My Orders" component={MyOrders} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationCenter} options={{ title: "Notifications" }} />
            <Stack.Screen name="Order Detail" component={OrderDetail} options={{ title: "Order Details" }} />
            <Stack.Screen name="Promo Detail" component={PromoDetail} options={{ title: "Promo Details" }} />
        </Stack.Navigator>
    );
};

export default UserNavigator;
