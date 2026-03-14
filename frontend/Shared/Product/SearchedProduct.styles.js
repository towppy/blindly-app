import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    wrapper: {
        width: width,
    },
    listSurface: {
        backgroundColor: "#faf9f7",
        paddingTop: 8,
    },
    columnWrapper: {
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    cardTouch: {
        width: (width - 48) / 2,
    },
    card: {
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#fff",
        shadowColor: "#7c3aed",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        padding: 10,
    },
    image: {
        width: "100%",
        height: (width - 48) / 2,
        borderRadius: 12,
        backgroundColor: "#f0ecfb",
        marginBottom: 8,
    },
    name: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1a1235",
        marginBottom: 2,
    },
    description: {
        fontSize: 11,
        color: "#9b8ec4",
        fontWeight: "500",
        marginBottom: 6,
        numberOfLines: 1,
    },
    divider: {
        backgroundColor: "#f0ecfb",
        marginBottom: 6,
    },
    price: {
        fontSize: 14,
        fontWeight: "800",
        color: "#7c3aed",
    },

    // Empty state
    center: {
        justifyContent: "center",
        alignItems: "center",
        height: 200,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#b0a3d4",
        textAlign: "center",
    },
});

export default styles;