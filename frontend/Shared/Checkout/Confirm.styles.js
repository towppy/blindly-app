import { StyleSheet, Dimensions } from "react-native";

const { height } = Dimensions.get("window");

export const COLORS = {
    primary:        "#7c3aed",
    primaryDeep:    "#5b21b6",
    primaryLight:   "#ede9f8",
    primaryLighter: "#f0ecfb",
    primarySoft:    "#e4dff5",
    background:     "#faf9f7",
    card:           "#fff",
    textDark:       "#1a1235",
    textMuted:      "#7c6aaa",
    textSubtle:     "#9b8ec4",
    textFaint:      "#b0a3d4",
    white:          "#fff",
    danger:         "#ef4444",
    dangerLight:    "#fef2f2",
};

const styles = StyleSheet.create({
    surface: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        minHeight: height,
        paddingHorizontal: 16,
        paddingBottom: 40,
        backgroundColor: COLORS.background,
    },

    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 8,
    },
    topBarBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 5,
    },
    backBtn: {
        backgroundColor: COLORS.primaryLight,
    },
    cancelBtn: {
        backgroundColor: COLORS.dangerLight,
    },
    backBtnText: {
        color: COLORS.primary,
        fontWeight: "700",
        fontSize: 14,
    },
    cancelBtnText: {
        color: COLORS.danger,
        fontWeight: "700",
        fontSize: 14,
    },

    heading: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.textDark,
        letterSpacing: -0.4,
        alignSelf: "flex-start",
        marginTop: 8,
        marginBottom: 16,
    },

    shippingCard: {
        width: "100%",
        backgroundColor: COLORS.card,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 14,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 12,
        elevation: 4,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: COLORS.textSubtle,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        marginBottom: 14,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
        gap: 10,
    },
    addressIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    addressFieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textFaint,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 1,
    },
    addressFieldValue: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.primarySoft,
        marginVertical: 6,
    },

    itemsCard: {
        width: "100%",
        backgroundColor: COLORS.card,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingTop: 16,
        paddingBottom: 8,
        marginBottom: 14,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 12,
        elevation: 4,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
    },
    itemImageWrap: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        overflow: "hidden",
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    itemName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
        lineHeight: 19,
    },
    itemInfoWrap: {
        flex: 1,
        marginRight: 8,
    },
    itemMeta: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textSubtle,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
    },

    totalsCard: {
        width: "100%",
        backgroundColor: COLORS.card,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 12,
        elevation: 4,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    discountValue: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.danger,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.textDark,
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.primary,
    },

    placeOrderBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 15,
        marginTop: 4,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
        elevation: 5,
    },
    placeOrderBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.background,
        gap: 10,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.textMuted,
    },
});

export default styles;