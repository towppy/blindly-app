import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import makeStyles, { COLORS } from "../../Shared/Checkout/Payment.styles";

const methods = [
    { name: "Cash on Delivery", value: 1, icon: "cash-outline" },
    { name: "Bank Transfer",    value: 2, icon: "business-outline" },
    { name: "Card Payment",     value: 3, icon: "card-outline" },
];

const paymentCards = [
    { name: "Wallet",     value: 1 },
    { name: "Visa",       value: 2 },
    { name: "MasterCard", value: 3 },
    { name: "Other",      value: 4 },
];

const Payment = ({ route }) => {
    const order = route.params?.order;
    const [selected, setSelected] = useState("");
    const [card, setCard] = useState("");
    const navigation = useNavigation();

    const styles = makeStyles(selected);

    return (
        <View style={styles.container}>
            {/* ── Top bar with Back and Cancel buttons ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 4, marginTop: 8 }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontWeight: '700', marginLeft: 4, fontSize: 15 }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Home')}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
                    <Text style={{ color: COLORS.danger, fontWeight: '700', marginLeft: 4, fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.heading}>Payment Method</Text>

            <View style={styles.methodsCard}>
                {methods.map((item, i) => {
                    const isActive = selected === item.value;
                    return (
                        <React.Fragment key={item.value}>
                            <TouchableOpacity
                                style={[styles.methodItem, isActive && styles.methodItemActive]}
                                onPress={() => setSelected(item.value)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.methodIconWrap, isActive && styles.methodIconWrapActive]}>
                                    <Ionicons
                                        name={item.icon}
                                        size={18}
                                        color={isActive ? COLORS.white : COLORS.textMuted}
                                    />
                                </View>
                                <Text style={[styles.methodLabel, isActive && styles.methodLabelActive]}>
                                    {item.name}
                                </Text>
                                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                                    {isActive && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                            {i < methods.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    );
                })}
            </View>

            {selected === 3 && (
                <View style={styles.pickerCard}>
                    <Text style={styles.pickerLabel}>Select Card Type</Text>
                    <Picker
                        style={styles.picker}
                        selectedValue={card}
                        onValueChange={setCard}
                    >
                        {paymentCards.map((c) => (
                            <Picker.Item key={c.value} label={c.name} value={c.name} />
                        ))}
                    </Picker>
                </View>
            )}

            <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => navigation.navigate("Confirm", { order })}
                activeOpacity={0.85}
                disabled={!selected}
            >
                <Ionicons name="arrow-forward-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.confirmBtnText}>Confirm Payment</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Payment;