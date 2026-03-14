import { StyleSheet } from "react-native";

// ─── Design Tokens ────────────────────────────────────────────────────────────
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
    success:        "#10b981",
    successLight:   "#f0fdf4",
    warning:        "#f59e0b",
    warningLight:   "#fffbeb",
    danger:         "#ef4444",
    dangerLight:    "#fef2f2",
};

// ─── Dynamic style factory ────────────────────────────────────────────────────
// profileReady drives the confirm button appearance
const makeStyles = (profileReady = false) =>
    StyleSheet.create({

        // ── Scroll container ──────────────────────────────────────────────────
        scrollView: {
            backgroundColor: COLORS.background,
        },

        // ── Info banner (shown when profile incomplete) ───────────────────────
        banner: {
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 16,
            marginTop: 16,
            marginBottom: 4,
            backgroundColor: COLORS.warningLight,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: COLORS.warning,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 10,
        },
        bannerReady: {
            backgroundColor: COLORS.successLight,
            borderColor: COLORS.success,
        },
        bannerText: {
            flex: 1,
            fontSize: 13,
            fontWeight: "600",
            color: COLORS.warning,
            lineHeight: 19,
        },
        bannerTextReady: {
            color: COLORS.success,
        },

        // ── Address summary card ──────────────────────────────────────────────
        summaryCard: {
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: COLORS.card,
            borderRadius: 18,
            paddingHorizontal: 18,
            paddingVertical: 16,
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

        // Each address row
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
        addressFieldEmpty: {
            fontSize: 13,
            fontWeight: "500",
            color: COLORS.textFaint,
            fontStyle: "italic",
        },

        divider: {
            height: 1,
            backgroundColor: COLORS.primarySoft,
            marginVertical: 12,
        },

        // ── Action buttons ────────────────────────────────────────────────────
        buttonsBlock: {
            marginHorizontal: 16,
            marginTop: 20,
            gap: 10,
        },

        // Confirm / complete profile button — changes with profileReady
        confirmBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: profileReady ? COLORS.primary : COLORS.textFaint,
            borderRadius: 16,
            paddingVertical: 15,
            gap: 8,
            shadowColor: profileReady ? COLORS.primary : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: profileReady ? 0.38 : 0,
            shadowRadius: 10,
            elevation: profileReady ? 5 : 0,
        },
        confirmBtnText: {
            color: COLORS.white,
            fontSize: 16,
            fontWeight: "800",
            letterSpacing: 0.2,
        },

        // Go to profile button
        profileBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.primaryLighter,
            borderRadius: 16,
            paddingVertical: 13,
            borderWidth: 1.5,
            borderColor: COLORS.primarySoft,
            gap: 8,
        },
        profileBtnText: {
            color: COLORS.primary,
            fontSize: 15,
            fontWeight: "700",
        },

        // Bottom spacer
        bottomPad: {
            height: 40,
        },
    });

export default makeStyles;