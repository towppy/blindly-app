import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const COLORS = {
    bg:           "#f5f3ff",
    surface:      "#fff",
    surfaceAlt:   "#faf9f7",
    border:       "#ede9f8",
    primary:      "#7c3aed",
    primaryLight: "#ede9f8",
    primarySoft:  "#f0ecfb",
    accent:       "#5b21b6",
    gold:         "#d97706",
    goldSoft:     "#fef3c7",
    green:        "#059669",
    greenSoft:    "#d1fae5",
    red:          "#dc2626",
    redSoft:      "#fee2e2",
    blue:         "#2563eb",
    blueSoft:     "#dbeafe",
    yellow:       "#b45309",
    yellowSoft:   "#fef9c3",
    textDark:     "#1a1235",
    textMid:      "#4b4370",
    textMuted:    "#7c6aaa",
    textFaint:    "#b0a3d4",
    white:        "#fff",
};

export const STATUS_COLORS = {
    pending:   COLORS.yellow,
    shipped:   COLORS.blue,
    delivered: COLORS.green,
    cancelled: COLORS.red,
};

export const STATUS_SOFT = {
    pending:   COLORS.yellowSoft,
    shipped:   COLORS.blueSoft,
    delivered: COLORS.greenSoft,
    cancelled: COLORS.redSoft,
};

const styles = StyleSheet.create({

    // ── Layout ────────────────────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scrollContent: {
        paddingBottom: 48,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.bg,
    },

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBar: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
        gap: 4,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabItemActive: {
        borderBottomColor: COLORS.primary,
    },
    tabIcon: {
        fontSize: 18,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: "600",
        color: COLORS.textFaint,
        letterSpacing: 0.3,
    },
    tabLabelActive: {
        color: COLORS.primary,
    },

    // ── Page header ───────────────────────────────────────────────────────────
    pageHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 14,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.textDark,
        letterSpacing: -0.3,
    },
    pageSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 8,
        gap: 5,
    },
    exportBtnText: {
        color: COLORS.white,
        fontWeight: "700",
        fontSize: 12,
    },

    // ── Section label ─────────────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 16,
    },

    // ── Revenue hero ──────────────────────────────────────────────────────────
    revenueCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    revenueEyebrow: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: "rgba(255,255,255,0.65)",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    revenueNum: {
        fontSize: 30,
        fontWeight: "800",
        color: COLORS.white,
        letterSpacing: -0.8,
    },
    revenueSubtext: {
        fontSize: 11,
        color: "rgba(255,255,255,0.55)",
        marginTop: 3,
    },
    revenueIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },

    // ── Stat cards ────────────────────────────────────────────────────────────
    statRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    statNum: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.textDark,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
        fontWeight: "500",
    },

    // ── Chart card ────────────────────────────────────────────────────────────
    chartCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    chartTotal: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    barRow: {
        marginBottom: 12,
    },
    barTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 5,
    },
    barStatusLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textMid,
        textTransform: "capitalize",
    },
    barCountLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    barTrack: {
        height: 7,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 4,
    },

    // ── Orders card ───────────────────────────────────────────────────────────
    ordersCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        marginHorizontal: 16,
        marginBottom: 12,
    },
    ordersCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surfaceAlt,
    },
    ordersCardTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    ordersCardCount: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    orderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 10,
        backgroundColor: COLORS.surface,
    },
    orderRowLast: {
        borderBottomWidth: 0,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    orderId: {
        flex: 1,
        fontSize: 12,
        fontFamily: "monospace",
        color: COLORS.textMid,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "capitalize",
    },
    orderPrice: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textDark,
        width: 68,
        textAlign: "right",
    },

    // ── Users list card ───────────────────────────────────────────────────────
    usersCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        marginHorizontal: 16,
        marginBottom: 12,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 10,
    },
    userRowLast: {
        borderBottomWidth: 0,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    userAvatarText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.white,
    },
    userName: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textDark,
    },
    userEmail: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    userBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
        fontSize: 10,
        fontWeight: "700",
        overflow: "hidden",
    },
});

export default styles;