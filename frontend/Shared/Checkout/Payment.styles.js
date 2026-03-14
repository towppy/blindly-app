import { StyleSheet } from "react-native";

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
};

const makeStyles = (selected) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: COLORS.background,
            paddingHorizontal: 16,
            paddingTop: 24,
        },
        heading: {
            fontSize: 22,
            fontWeight: "800",
            color: COLORS.textDark,
            letterSpacing: -0.4,
            marginBottom: 20,
        },

        // Payment method card
        methodsCard: {
            backgroundColor: COLORS.card,
            borderRadius: 18,
            paddingVertical: 6,
            paddingHorizontal: 4,
            shadowColor: COLORS.primaryDeep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.09,
            shadowRadius: 12,
            elevation: 4,
            marginBottom: 16,
        },
        methodItem: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderRadius: 14,
            marginHorizontal: 6,
            marginVertical: 3,
        },
        methodItemActive: {
            backgroundColor: COLORS.primaryLight,
        },
        methodIconWrap: {
            width: 38,
            height: 38,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            backgroundColor: COLORS.primaryLighter,
        },
        methodIconWrapActive: {
            backgroundColor: COLORS.primary,
        },
        methodLabel: {
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: COLORS.textMuted,
        },
        methodLabelActive: {
            color: COLORS.textDark,
            fontWeight: "700",
        },
        radioOuter: {
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: COLORS.primarySoft,
            alignItems: "center",
            justifyContent: "center",
        },
        radioOuterActive: {
            borderColor: COLORS.primary,
        },
        radioInner: {
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: COLORS.primary,
        },
        divider: {
            height: 1,
            backgroundColor: COLORS.primarySoft,
            marginHorizontal: 16,
        },

        // Card picker
        pickerCard: {
            backgroundColor: COLORS.card,
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 4,
            shadowColor: COLORS.primaryDeep,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.09,
            shadowRadius: 12,
            elevation: 4,
            marginBottom: 16,
        },
        pickerLabel: {
            fontSize: 11,
            fontWeight: "800",
            color: COLORS.textSubtle,
            textTransform: "uppercase",
            letterSpacing: 1.3,
            marginTop: 12,
            marginBottom: 2,
        },
        picker: {
            color: COLORS.textDark,
        },

        // Confirm button
        confirmBtn: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected ? COLORS.primary : COLORS.textFaint,
            borderRadius: 16,
            paddingVertical: 15,
            marginTop: 12,
            gap: 8,
            shadowColor: selected ? COLORS.primary : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selected ? 0.38 : 0,
            shadowRadius: 10,
            elevation: selected ? 5 : 0,
        },
        confirmBtnText: {
            color: COLORS.white,
            fontSize: 16,
            fontWeight: "800",
            letterSpacing: 0.2,
        },
    });

export default makeStyles;