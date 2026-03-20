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
    danger:         "#ef4444",
    dangerLight:    "#fef2f2",
};

const styles = StyleSheet.create({
    formCard: {
        width: "90%",
        backgroundColor: "#ffffff",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#e9d5ff",
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 6,
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 4,
    },
    // Avatar
    imageContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: "#a7f3d0",
        borderStyle: "dashed",
        backgroundColor: "#ecfdf5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        elevation: 4,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 55,
    },
    imagePicker: {
        position: "absolute",
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.white,
        elevation: 6,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    // Button group wrapper
    buttonGroup: {
        width: "88%",
        alignItems: "center",
        marginBottom: 10,
    },

    // Error
    errorText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "center",
        backgroundColor: COLORS.dangerLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
    },

    // Loading
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        gap: 8,
    },
    loadingText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: "600",
    },

    // Register button
    registerBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6d28d9",
        borderRadius: 14,
        paddingVertical: 14,
        width: "88%",
        marginBottom: 10,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38,
        shadowRadius: 10,
        elevation: 5,
    },
    registerBtnDisabled: {
        opacity: 0.6,
    },
    registerBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    // Divider
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "88%",
        marginVertical: 14,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.primarySoft,
    },
    dividerText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.textFaint,
        letterSpacing: 0.5,
    },

    // Google button
    googleBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ecfdf5",
        borderRadius: 14,
        paddingVertical: 13,
        width: "88%",
        borderWidth: 1.5,
        borderColor: "#a7f3d0",
        gap: 8,
        shadowColor: COLORS.primaryDeep,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    googleBtnDisabled: {
        opacity: 0.6,
    },
    googleBtnText: {
        color: COLORS.textDark,
        fontSize: 15,
        fontWeight: "800",
    },
});

export default styles;