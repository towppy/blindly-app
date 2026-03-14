import { StyleSheet } from "react-native";

// ─── Design Tokens ───────────────────────────────────────────────────────────
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
    bannerHighlight:"rgba(255,255,255,0.8)",
    white:          "#fff",
};

export const STATUS_COLORS = {
    pending:   "#f59e0b",
    shipped:   "#3b82f6",
    delivered: "#10b981",
    cancelled: "#ef4444",
};

export const FALLBACK_IMAGE =
    "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";

export const STATUS_FILTERS = ["All", "pending", "shipped", "delivered", "cancelled"];

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.background,
        gap: 12,
    },

    // Loading / empty state
    loadingText: {
        color: COLORS.textMuted,
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    emptyText: {
        color: COLORS.textSubtle,
        fontSize: 15,
        fontWeight: "600",
    },
    emptySubtext: {
        color: COLORS.textFaint,
        fontSize: 13,
    },

    // ── Filter bar ────────────────────────────────────────────────────────────
    filterBar: {
        flexGrow: 0,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primarySoft,
    },
    filterBarContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    chip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: COLORS.card,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        // subtle shadow under active chip
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    chipText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    chipTextActive: {
        color: COLORS.white,
    },

    // ── FlatList list ─────────────────────────────────────────────────────────
    listContent: {
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 16,
        gap: 12,
    },
    cardWrapper: {
        borderRadius: 16,
        overflow: "hidden",
        // card lift
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 3,
    },

    // ── Modal backdrop & sheet ────────────────────────────────────────────────
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(26,18,53,0.55)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 8,
        paddingBottom: 28,
        maxHeight: "90%",
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primarySoft,
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    sheetTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: COLORS.textDark,
        letterSpacing: -0.3,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },

    // ── Order meta ────────────────────────────────────────────────────────────
    orderMeta: {
        backgroundColor: COLORS.primaryLighter,
        borderRadius: 14,
        padding: 14,
        marginBottom: 18,
    },
    orderNum: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textMuted,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 15,
        color: COLORS.textDark,
        fontWeight: "600",
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.2,
    },

    // ── Section labels ────────────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: COLORS.textSubtle,
        textTransform: "uppercase",
        letterSpacing: 1.4,
        marginBottom: 12,
        marginTop: 2,
    },

    // ── Order items ───────────────────────────────────────────────────────────
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 10,
    },
    itemImageWrapper: {
        width: 58,
        height: 58,
        borderRadius: 10,
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
    },
    itemName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textDark,
        marginBottom: 3,
        lineHeight: 19,
    },
    itemUnit: {
        fontSize: 12,
        color: COLORS.textFaint,
        fontWeight: "500",
    },
    itemSubtotal: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.primary,
    },

    // ── Total row ─────────────────────────────────────────────────────────────
    divider: {
        height: 1,
        backgroundColor: COLORS.primarySoft,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -0.5,
    },

    // ── Shipping ──────────────────────────────────────────────────────────────
    shippingBox: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primarySoft,
    },
    shippingText: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 22,
        fontWeight: "500",
    },

    // ── Review section ────────────────────────────────────────────────────────
    reviewRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    reviewItemName: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textDark,
        fontWeight: "500",
        marginRight: 10,
    },
    reviewBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        // glow
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
    },
    reviewBtnText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});

export default styles;