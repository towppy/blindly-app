import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Checkout from "../Screens/Checkout/Checkout";
import Payment from "../Screens/Checkout/Payment";
import Confirm from "../Screens/Checkout/Confirm";

const Tab = createMaterialTopTabNavigator();


function MyTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarPressColor: 'transparent',
                tabBarPressOpacity: 1,
                tabBarAllowFontScaling: true,
                tabBarIndicatorStyle: { backgroundColor: 'transparent' },
                tabBarStyle: { pointerEvents: 'none' },
            }}
            // Prevent tab press
            screenListeners={{
                tabPress: (e) => {
                    e.preventDefault();
                },
            }}
        >
            <Tab.Screen name="Shipping" component={Checkout} />
            <Tab.Screen name="Payment" component={Payment} />
            <Tab.Screen name="Confirm" component={Confirm} />
        </Tab.Navigator>
    );
}

export default function CheckoutNavigator() {
    return <MyTabs />;
}
