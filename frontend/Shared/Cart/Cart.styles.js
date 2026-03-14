import { StyleSheet, Dimensions } from "react-native";

const { height, width } = Dimensions.get("window");

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
    success:        "#10b981",
    successLight:   "#f0fdf4",
};

export const FALLBACK =
    "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

const styles = StyleSheet.create({

    flex: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    emptyContainer: {
        height,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.background,
        gap: 12,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textDark,
        letterSpacing: -0.2,
    },
    emptySubtitle: {
        fontSize: 13,
        color: COLORS.textFaint,
        fontWeight: "500",
    },

    listContent: {
        paddingTop: 12,
        paddingBottom: 110,
        paddingHorizontal: 16,
    },

    itemSurface: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 3,
    },
    itemImageWrapper: {
        width: 70,
        height: 70,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        overflow: "hidden",
        marginRight: 12,
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    itemInfo: {
        flex: 1,
        marginRight: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
        marginBottom: 4,
        lineHeight: 19,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.primary,
        marginBottom: 8,
    },

    // Quantity Controls
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    quantityBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primarySoft,
    },
    quantityText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        marginHorizontal: 12,
        minWidth: 24,
        textAlign: 'center',
    },
    deleteIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.dangerLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: COLORS.dangerLight,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        marginLeft: 4,
        minWidth: 70,
        textAlign: 'right',
    },

    hiddenRow: {
        flex: 1,
        alignItems: "flex-end",
        justifyContent: "center",
        paddingRight: 16,
        // Removed marginBottom to prevent peeking
        height: 70, // Match item row height
        backgroundColor: 'transparent',
    },
    deleteBtn: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: COLORS.danger,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.32,
        shadowRadius: 5,
        elevation: 4,
    },
    deleteBtnText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.3,
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: COLORS.primarySoft,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 20,
        gap: 10,
    },
    totalBlock: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textFaint,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -0.5,
    },

    clearBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerLight,
        gap: 5,
    },
    clearBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.danger,
    },

    checkoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        gap: 6,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    checkoutBtnText: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.white,
        letterSpacing: 0.2,
    },
});

export { height, width };
export default styles;