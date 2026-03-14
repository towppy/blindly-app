import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    surface: {
        flex: 1,
        backgroundColor: "#faf9f7",
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: "#faf9f7",
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: "800",
        color: "#1a1235",
        letterSpacing: -0.5,
    },
    avatarBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ede9f8",
        alignItems: "center",
        justifyContent: "center",
    },

    // Tabs
    tabRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f0ecfb",
    },
    tabActive: {
        backgroundColor: "#7c3aed",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#7c6aaa",
    },
    tabTextActive: {
        color: "#fff",
    },

    // Search
    searchRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        marginBottom: 12,
        gap: 10,
        alignItems: "center",
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0ecfb",
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#1a1235",
        fontWeight: "500",
    },
    filterIconBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "#7c3aed",
        alignItems: "center",
        justifyContent: "center",
    },

    // Price Filter
    priceCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#7c3aed",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    priceLabel: {
        fontSize: 13,
        color: "#7c6aaa",
        fontWeight: "600",
        textAlign: "center",
    },
    priceValue: {
        color: "#7c3aed",
        fontWeight: "700",
    },
    priceActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    priceReset: {
        color: "#9b8ec4",
        fontSize: 14,
        fontWeight: "600",
    },
    applyBtn: {
        backgroundColor: "#7c3aed",
        paddingHorizontal: 22,
        paddingVertical: 8,
        borderRadius: 10,
    },
    applyText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },

    // Promo Button
    promoBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5b21b6",
        borderRadius: 12,
        paddingVertical: 11,
        marginHorizontal: 20,
        marginBottom: 12,
    },
    promoBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },

    // Banner
    bannerWrapper: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        marginHorizontal: 20,
    },

    // Help Banner
    helpBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#7c3aed",
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 18,
        padding: 18,
    },
    helpTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 2,
    },
    helpSub: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
    },
    helpIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    // Section
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a1235",
        letterSpacing: -0.3,
    },

    // Product List
 
listContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12, // Slightly reduced padding
    justifyContent: "flex-start", // Changed from "space-between"
    gap: 12, // Consistent gap between items
},

    // Empty
    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    emptyText: {
        color: "#b0a3d4",
        fontSize: 15,
        fontWeight: "600",
    },

    // MultiSlider
    sliderContainer: {
        alignItems: "center",
        marginVertical: 8,
    },
    sliderTrack: {
        height: 4,
        borderRadius: 2,
    },
    sliderSelected: {
        backgroundColor: "#7c3aed",
    },
    sliderUnselected: {
        backgroundColor: "#e4dff5",
    },
    sliderMarker: {
        backgroundColor: "#7c3aed",
        height: 22,
        width: 22,
        borderRadius: 11,
        shadowColor: "#7c3aed",
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    sliderWrapper: {
        height: 40,
        width: width * 0.72,
    },
    sliderTouch: {
        height: 40,
        width: 40,
        borderRadius: 20,
        slipDisplacement: 40,
    },
});

export default styles;