import { StyleSheet, Dimensions } from "react-native";

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
    danger:         "#ef4444",
    dangerLight:    "#fef2f2",
};

var { width } = Dimensions.get("window");
export { width };

const ACTION_WIDTH = 72;

const styles = StyleSheet.create({

    // ─── Layout ───────────────────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 100,
    },
    listEmpty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
    },

    // ─── Search ───────────────────────────────────────────────────────────────
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 6,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.primarySoft,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textDark,
    },

    // ─── Swipe Row ────────────────────────────────────────────────────────────
    swipeRow: {
        position: "relative",
        marginHorizontal: 12,
        marginVertical: 5,
        borderRadius: 12,
        overflow: "hidden",
    },
    actionLeft: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: ACTION_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
    },
    actionLeftInner: {
        alignItems: "center",
        justifyContent: "center",
    },
    actionRight: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: ACTION_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.dangerLight,
        borderRadius: 12,
    },
    actionRightInner: {
        alignItems: "center",
        justifyContent: "center",
    },
    actionIcon: {
        fontSize: 20,
    },
    actionLabel: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 2,
        color: COLORS.textMuted,
    },

    // ─── Item Card ────────────────────────────────────────────────────────────
    item: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    itemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginRight: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textDark,
    },

    // ─── Edit Icon Button (inline on card) ────────────────────────────────────
    editIconBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLighter,
        justifyContent: "center",
        alignItems: "center",
    },
    editIconText: {
        fontSize: 16,
    },

    // ─── FAB ──────────────────────────────────────────────────────────────────
    fab: {
        position: "absolute",
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 30,
        color: COLORS.white,
        lineHeight: 34,
        fontWeight: "300",
    },

    // ─── Modal Shared ─────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(26,18,53,0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    modalCard: {
        width: "100%",
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: COLORS.textDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    modalIcon: {
        fontSize: 36,
        textAlign: "center",
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.textDark,
        textAlign: "center",
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 16,
    },
    modalBody: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
    },
    modalBold: {
        fontWeight: "700",
        color: COLORS.textDark,
    },
    modalInput: {
        width: "100%",
        height: 46,
        borderWidth: 1.5,
        borderColor: COLORS.primarySoft,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        color: COLORS.textDark,
        backgroundColor: COLORS.primaryLighter,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: "row",
        width: "100%",
        gap: 10,
    },
    modalCancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primarySoft,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.primaryLighter,
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMuted,
    },
    modalConfirmBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    modalConfirmBtnDisabled: {
        backgroundColor: COLORS.textFaint,
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.white,
    },

    // ─── Empty State ──────────────────────────────────────────────────────────
    emptyState: {
        alignItems: "center",
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 52,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.textDark,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: "center",
        paddingHorizontal: 24,
    },
});

export default styles;