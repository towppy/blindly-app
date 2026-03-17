import React, { useEffect, useState, useContext } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Picker } from "@react-native-picker/picker";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import AuthGlobal from "../../Context/Store/AuthGlobal";
import Toast from "react-native-toast-message";
import { getJwt } from "../../assets/common/jwtStore";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { Ionicons } from "@expo/vector-icons";
import makeStyles, { COLORS } from "../../Shared/Checkout/Checkout.styles";


// ─── Address field row 
const AddressRow = ({ icon, label, value, styles }) => (
    <View style={styles.addressRow}>
        <View style={styles.addressIconWrap}>
            <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.addressFieldLabel}>{label}</Text>
            {value ? (
                <Text style={styles.addressFieldValue}>{value}</Text>
            ) : (
                <Text style={styles.addressFieldEmpty}>Not set</Text>
            )}
        </View>
    </View>
);

// ─── Component 
const Checkout = () => {
    const [user, setUser]                   = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileReady, setProfileReady]   = useState(false);
    const [orderItems, setOrderItems]       = useState([]);
    const [address, setAddress]             = useState("");
    const [address2, setAddress2]           = useState("");
    const [city, setCity]                   = useState("");
    const [zip, setZip]                     = useState("");
    const [country, setCountry]             = useState("Philippines");
    const [phone, setPhone]                 = useState("");
    const [claimedVouchers, setClaimedVouchers] = useState([]);
    const [selectedVoucherClaimId, setSelectedVoucherClaimId] = useState("");

    const navigation = useNavigation();
    const cartItems  = useSelector((s) => s.cartItems);
    const context    = useContext(AuthGlobal);

    // Re-compute styles whenever profileReady changes
    const styles = makeStyles(profileReady);

    const isProfileComplete = (profile) =>
        !!(
            String(profile?.phone || "").trim() &&
            String(profile?.deliveryAddress1 || "").trim() &&
            String(profile?.deliveryCity || "").trim() &&
            String(profile?.deliveryZip || "").trim() &&
            String(profile?.deliveryCountry || "").trim()
        );

    const selectedClaim = claimedVouchers.find((c) => (c.id || c._id) === selectedVoucherClaimId);
    const selectedVoucher = selectedClaim?.voucher;

    const cartSubtotal = (orderItems || []).reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);

    const selectedVoucherCategory = selectedVoucher?.category?.id || selectedVoucher?.category?._id;
    const eligibleSubtotal = selectedVoucher
        ? (selectedVoucher.appliesTo === "category"
            ? (orderItems || []).reduce((sum, item) => {
                const itemCategory = item?.category?.id || item?.category?._id || item?.category;
                if (selectedVoucherCategory && String(itemCategory) === String(selectedVoucherCategory)) {
                    return sum + Number(item.price || 0) * Number(item.quantity || 1);
                }
                return sum;
            }, 0)
            : cartSubtotal)
        : 0;

    const estimatedDiscount = selectedVoucher
        ? Number(((eligibleSubtotal * Number(selectedVoucher.discountPercent || 0)) / 100).toFixed(2))
        : 0;

    const estimatedTotal = Math.max(0, Number((cartSubtotal - estimatedDiscount).toFixed(2)));

    useEffect(() => {
        setOrderItems(cartItems);
        setLoadingProfile(true);

        if (context.stateUser.isAuthenticated) {
            setUser(context.stateUser.user.userId);
            getJwt()
                .then((jwt) => {
                    if (!jwt) return;
                    return axios.get(`${baseURL}users/${context.stateUser.user.userId}`, {
                        headers: { Authorization: `Bearer ${jwt}` },
                    });
                })
                .then((response) => {
                    const profile = response?.data;
                    if (!profile) { setProfileReady(false); return; }

                    if (profile.phone)            setPhone(profile.phone);
                    if (profile.deliveryAddress1) setAddress(profile.deliveryAddress1);
                    if (profile.deliveryAddress2) setAddress2(profile.deliveryAddress2);
                    if (profile.deliveryCity)     setCity(profile.deliveryCity);
                    if (profile.deliveryZip)      setZip(profile.deliveryZip);
                    if (profile.deliveryCountry)  setCountry(profile.deliveryCountry);

                    const complete = isProfileComplete(profile);
                    setProfileReady(complete);
                    if (!complete) {
                        Toast.show({
                            topOffset: 60,
                            type: "error",
                            text1: "Complete your profile first",
                            text2: "Add phone and delivery address in User Profile",
                        });
                    }
                })
                .catch(() => setProfileReady(false))
                .finally(() => setLoadingProfile(false));

            getJwt()
                .then((jwt) => {
                    if (!jwt) return;
                    return axios.get(`${baseURL}vouchers/claimed/me`, {
                        headers: { Authorization: `Bearer ${jwt}` },
                    });
                })
                .then((response) => {
                    const claims = (response?.data || []).filter(
                        (claim) => claim.status === "claimed" && claim.voucher
                    );
                    setClaimedVouchers(claims);
                })
                .catch(() => setClaimedVouchers([]));
        } else {
            navigation.navigate("User", { screen: "Login" });
            Toast.show({ topOffset: 60, type: "error", text1: "Please login to checkout" });
            setLoadingProfile(false);
        }

        return () => setOrderItems([]);
    }, [cartItems, context.stateUser.isAuthenticated]);

    const checkOut = () => {
        if (loadingProfile) {
            Toast.show({ topOffset: 60, type: "info", text1: "Loading profile…" });
            return;
        }
        if (!profileReady) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Profile required before checkout",
                text2: "Please complete delivery details in User Profile",
            });
            navigation.navigate("User", { screen: "User Profile" });
            return;
        }
        navigation.navigate("Payment", {
            order: {
                city, country,
                dateOrdered: Date.now(),
                orderItems,
                phone,
                    voucherClaimId: selectedVoucherClaimId || undefined,
                shippingAddress1: address,
                shippingAddress2: address2,
                status: "pending",
                user,
                zip,
            },
        });
    };

    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar
            extraHeight={200}
            enableOnAndroid
            style={styles.scrollView}
        >
            {/* ── Top bar with Back and Cancel buttons ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 16 }}>
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

            {/* ── Status banner ── */}
            <View style={[styles.banner, profileReady && styles.bannerReady]}>
                <Ionicons
                    name={profileReady ? "checkmark-circle" : "alert-circle"}
                    size={22}
                    color={profileReady ? COLORS.success : COLORS.warning}
                />
                <Text style={[styles.bannerText, profileReady && styles.bannerTextReady]}>
                    {profileReady
                        ? "Your delivery details are ready. Review and confirm below."
                        : "Your profile is incomplete. Add phone & delivery address before checking out."}
                </Text>
            </View>

            {/* ── Address summary card ── */}
            <View style={styles.summaryCard}>
                <Text style={styles.sectionLabel}>Shipping Address</Text>

                <AddressRow icon="call-outline"          label="Phone"           value={phone}    styles={styles} />
                <View style={styles.divider} />
                <AddressRow icon="location-outline"      label="Address Line 1"  value={address}  styles={styles} />
                {address2 ? (
                    <>
                        <View style={styles.divider} />
                        <AddressRow icon="business-outline"  label="Address Line 2"  value={address2} styles={styles} />
                    </>
                ) : null}
                <View style={styles.divider} />
                <AddressRow icon="map-outline"           label="City"            value={city}     styles={styles} />
                <View style={styles.divider} />
                <AddressRow icon="mail-outline"          label="Zip Code"        value={zip}      styles={styles} />
                <View style={styles.divider} />
                <AddressRow icon="globe-outline"         label="Country"         value={country}  styles={styles} />
            </View>

            <View style={[styles.summaryCard, { marginTop: 12 }]}> 
                <Text style={styles.sectionLabel}>Voucher / Discount</Text>
                {claimedVouchers.length > 0 ? (
                    <>
                        <View style={{ borderWidth: 1, borderColor: "#ddd3f3", borderRadius: 10, marginTop: 10 }}>
                            <Picker
                                selectedValue={selectedVoucherClaimId}
                                onValueChange={(value) => setSelectedVoucherClaimId(value)}
                            >
                                <Picker.Item label="No voucher" value="" />
                                {claimedVouchers.map((claim) => {
                                    const claimId = claim.id || claim._id;
                                    const voucher = claim.voucher;
                                    const scopeText = voucher?.appliesTo === "category" ? `(${voucher?.category?.name || "Category"})` : "(All items)";
                                    const label = `${voucher?.name || "Voucher"} - ${Number(voucher?.discountPercent || 0)}% ${scopeText}`;
                                    return <Picker.Item key={claimId} label={label} value={claimId} />;
                                })}
                            </Picker>
                        </View>
                        <Text style={{ marginTop: 8, color: "#6d6297" }}>Subtotal: PHP {cartSubtotal.toFixed(2)}</Text>
                        <Text style={{ marginTop: 4, color: "#6d6297" }}>Estimated discount: PHP {estimatedDiscount.toFixed(2)}</Text>
                        <Text style={{ marginTop: 4, color: "#3d2c8d", fontWeight: "700" }}>
                            Estimated total: PHP {estimatedTotal.toFixed(2)}
                        </Text>
                    </>
                ) : (
                    <Text style={{ marginTop: 8, color: "#6d6297" }}>No claimed vouchers available.</Text>
                )}
            </View>

            {/* ── Action buttons ── */}
            <View style={styles.buttonsBlock}>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={checkOut}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={profileReady ? "arrow-forward-circle-outline" : "person-outline"}
                        size={20}
                        color={COLORS.white}
                    />
                    <Text style={styles.confirmBtnText}>
                        {profileReady ? "Confirm Order" : "Complete Profile First"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate("User", { screen: "User Profile" })}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.profileBtnText}>Go to User Profile</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomPad} />
        </KeyboardAwareScrollView>
    );
};

export default Checkout;