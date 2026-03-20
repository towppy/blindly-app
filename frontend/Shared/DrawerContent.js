import { useNavigation } from "@react-navigation/native";
import React, { useContext, useState } from "react";
import { Drawer } from "react-native-paper";
import AuthGlobal from "../Context/Store/AuthGlobal";
import { ThemeContext } from "../Context/Store/Theme";

const DrawerContent = () => {
    const [active, setActive] = useState("");
    const navigation = useNavigation();
    const context = useContext(AuthGlobal);
    const { isDark, toggleMode } = useContext(ThemeContext);
    const isAdmin = context?.stateUser?.user?.isAdmin === true;

    const onClick = (screen) => {
        setActive(screen);
        // Add navigation or other logic if needed
    };

    return (
        <Drawer.Section title="Drawer">
            <Drawer.Item
                label="My Profile"
                onPress={() => navigation.navigate("User", { screen: "User Profile" })}
                icon="account"
            />
            {isAdmin ? (
                <Drawer.Item
                    label="Analytics"
                    active={active === "Analytics"}
                    onPress={() => {
                        setActive("Analytics");
                        navigation.navigate("Admin", { screen: "Analytics" });
                    }}
                    icon="chart-bar"
                />
            ) : null}
            {!isAdmin ? (
                <Drawer.Item
                    label="My Orders"
                    onPress={() => navigation.navigate("User", { screen: "My Orders" })}
                    icon="cart-variant"
                />
            ) : null}
            <Drawer.Item
                label="Notifications"
                active={active === "Notifications"}
                onPress={() => {
                    setActive("Notifications");
                    navigation.navigate("User", { screen: "Notifications" });
                }}
                icon="bell"
            />
            <Drawer.Item
                label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                onPress={toggleMode}
                icon={isDark ? "weather-sunny" : "weather-night"}
            />
        </Drawer.Section>
    );
};

export default DrawerContent;
