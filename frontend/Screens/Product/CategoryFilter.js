import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    View,
    Text,
} from "react-native";

const CategoryFilter = (props) => {
    return (
        <ScrollView
            bounces={true}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.row}>
                <TouchableOpacity
                    onPress={() => {
                        props.categoryFilter("all");
                        props.setActive(-1);
                    }}
                    activeOpacity={0.75}
                >
                    <View style={[styles.pill, props.active === -1 ? styles.pillActive : styles.pillInactive]}>
                        <Text style={[styles.pillText, props.active === -1 ? styles.pillTextActive : styles.pillTextInactive]}>
                            All
                        </Text>
                    </View>
                </TouchableOpacity>

                {props.categories.map((item) => {
                    const catId = item.id || item._id;
                    const idx = props.categories.indexOf(item);
                    const isActive = props.active === idx;
                    return (
                        <TouchableOpacity
                            key={catId}
                            onPress={() => {
                                props.categoryFilter(catId);
                                props.setActive(idx);
                            }}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}>
                                <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                                    {item.name}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: "#faf8ff",
        borderBottomWidth: 1,
        borderBottomColor: "#ede8fa",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1.5,
        // shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 3,
    },
    pillActive: {
        backgroundColor: "#7c3aed",
        borderColor: "#7c3aed",
        shadowColor: "rgba(124, 58, 237, 0.35)",
    },
    pillInactive: {
        backgroundColor: "#ffffff",
        borderColor: "#ddd6fe",
        shadowColor: "rgba(124, 58, 237, 0.08)",
    },
    pillText: {
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    pillTextActive: {
        color: "#ffffff",
    },
    pillTextInactive: {
        color: "#7c3aed",
    },
});

export default CategoryFilter;