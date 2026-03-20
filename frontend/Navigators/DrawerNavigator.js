import * as React from "react";
import { Dimensions, Image, View, Text } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Main from "./Main";
import DrawerContent from "../Shared/DrawerContent";
import { ThemeContext } from "../Context/Store/Theme";


const NativeDrawer = createDrawerNavigator();
const { width, height } = Dimensions.get("window");

const getDrawerStyles = (colorScheme) => {
    const isDark = colorScheme === "dark";

    const colors = isDark
        ? {
              drawerBg:         "#1a1025",
              drawerBorder:     "#2e1f4a",
              headerBg:         "#120d1c",
              headerText:       "#f0eaff",
              headerTint:       "#a78bfa",
              statusBarStyle:   "light",
              overlayColor:     "rgba(0,0,0,0.6)",
          }
        : {
              drawerBg:         "#faf8ff",
              drawerBorder:     "#ede8fa",
              headerBg:         "#ffffff",
              headerText:       "#1a0a3c",
              headerTint:       "#7c3aed",
              statusBarStyle:   "dark",
              overlayColor:     "rgba(109,40,217,0.08)",
          };

    // Responsive drawer width — narrower on large tablets, wider on small phones
    const drawerWidth =
        width < 360 ? "70%"
        : width < 480 ? "62%"
        : width < 768 ? "55%"
        : "40%";

    return {
        colors,
        drawerStyle: {
            width: drawerWidth,
            backgroundColor: colors.drawerBg,
            borderRightWidth: 1,
            borderRightColor: colors.drawerBorder,
            // subtle shadow cast onto main content
            shadowColor: "#7c3aed",
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 24,
            elevation: 16,
        },
        overlayStyle: {
            backgroundColor: colors.overlayColor,
        },
        screenOptions: {
            headerStyle: {
                backgroundColor: colors.headerBg,
                // hairline border under header
                borderBottomWidth: 1,
                borderBottomColor: colors.drawerBorder,
                elevation: 0,
                shadowOpacity: 0,
                height: 70, // Increased height for better logo placement
            },
            headerTintColor: colors.headerTint,
            headerTitleAlign: "center",
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                        source={require('../assets/images/logo.png')} // Adjust path to your logo
                        style={{ 
                            width: 32, 
                            height: 32, 
                            marginRight: 8,
                            tintColor: colors.headerTint // Optional: if logo should match tint
                        }} 
                        resizeMode="contain"
                    />
                    <Text style={{ 
                        fontSize: 22, 
                        fontWeight: "700",
                        letterSpacing: -0.3,
                        color: colors.headerText,
                    }}>
                        Blindly
                    </Text>
                </View>
            ),
        },
    };
};

const DrawerNavigator = () => {
    const { mode } = React.useContext(ThemeContext);
    const { drawerStyle, overlayStyle, screenOptions } = getDrawerStyles(mode);

    return (
        <NativeDrawer.Navigator
            screenOptions={{
                ...screenOptions,
                drawerStyle,
                overlayColor: overlayStyle.backgroundColor,
                swipeEdgeWidth: 60,
                swipeMinDistance: 5,
            }}
            drawerContent={() => <DrawerContent />}
        >
            <NativeDrawer.Screen name="Main" component={Main} />
        </NativeDrawer.Navigator>
    );
};

export default DrawerNavigator;