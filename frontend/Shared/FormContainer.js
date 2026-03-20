import React from "react";
import { ScrollView, Dimensions, StyleSheet, Text, View } from "react-native";

var { width } = Dimensions.get("window");

const FormContainer = ({ children, title }) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.titleChip}>
                <Text style={styles.title}>{title}</Text>
            </View>
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        marginBottom: 60,
        width: width,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f5ff",
        paddingVertical: 20,
    },
    titleChip: {
        backgroundColor: "#ecfdf5",
        borderWidth: 1,
        borderColor: "#a7f3d0",
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#5b21b6",
    },
});

export default FormContainer;
