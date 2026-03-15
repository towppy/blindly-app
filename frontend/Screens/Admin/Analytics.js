import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    StatusBar,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";
import styles, { COLORS, STATUS_COLORS, STATUS_SOFT } from "../../Shared/Admin/Analytics.styles";

const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

const TABS = [
    { key: "overview", label: "Overview", icon: "grid-outline"        },
    { key: "orders",   label: "Orders",   icon: "receipt-outline"      },
    { key: "users",    label: "Users",    icon: "people-outline"        },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, soft }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconWrap, { backgroundColor: soft }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.statNum}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ orders, users, countByStatus, totalRevenue, maxCount }) => (
    <>
        {/* Revenue hero */}
        <Text style={styles.sectionLabel}>Revenue</Text>
        <View style={styles.revenueCard}>
            <View>
                <Text style={styles.revenueEyebrow}>Total Earned</Text>
                <Text style={styles.revenueNum}>
                    ₱{totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.revenueSubtext}>Excludes cancelled orders</Text>
            </View>
            <View style={styles.revenueIconWrap}>
                <Ionicons name="trending-up-outline" size={24} color={COLORS.white} />
            </View>
        </View>

        {/* Quick stats */}
        <Text style={styles.sectionLabel}>At a Glance</Text>
        <View style={styles.statRow}>
            <StatCard icon="receipt-outline"          label="Total Orders" value={orders.length}              color={COLORS.primary} soft={COLORS.primaryLight} />
            <StatCard icon="people-outline"           label="Total Users"  value={users.length}               color={COLORS.blue}    soft={COLORS.blueSoft}    />
        </View>
        <View style={styles.statRow}>
            <StatCard icon="time-outline"             label="Pending"      value={countByStatus.pending   || 0} color={COLORS.yellow} soft={COLORS.yellowSoft} />
            <StatCard icon="checkmark-circle-outline" label="Delivered"    value={countByStatus.delivered || 0} color={COLORS.green}  soft={COLORS.greenSoft}  />
        </View>

        {/* Bar chart */}
        <Text style={styles.sectionLabel}>Breakdown</Text>
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Orders by Status</Text>
                <Text style={styles.chartTotal}>{orders.length} total</Text>
            </View>
            {STATUSES.map((s) => {
                const count = countByStatus[s] || 0;
                const pct   = Math.round((count / maxCount) * 100);
                return (
                    <View key={s} style={styles.barRow}>
                        <View style={styles.barTopRow}>
                            <Text style={styles.barStatusLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                            <Text style={styles.barCountLabel}>{count}</Text>
                        </View>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: STATUS_COLORS[s] }]} />
                        </View>
                    </View>
                );
            })}
        </View>
    </>
);

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = ({ orders, countByStatus }) => (
    <>
        <Text style={styles.sectionLabel}>Order Stats</Text>
        <View style={styles.statRow}>
            <StatCard icon="time-outline"             label="Pending"   value={countByStatus.pending   || 0} color={COLORS.yellow} soft={COLORS.yellowSoft} />
            <StatCard icon="car-outline"              label="Shipped"   value={countByStatus.shipped   || 0} color={COLORS.blue}   soft={COLORS.blueSoft}   />
        </View>
        <View style={styles.statRow}>
            <StatCard icon="checkmark-circle-outline" label="Delivered" value={countByStatus.delivered || 0} color={COLORS.green}  soft={COLORS.greenSoft}  />
            <StatCard icon="close-circle-outline"     label="Cancelled" value={countByStatus.cancelled || 0} color={COLORS.red}    soft={COLORS.redSoft}    />
        </View>

        <Text style={styles.sectionLabel}>Recent Orders</Text>
        <View style={styles.ordersCard}>
            <View style={styles.ordersCardHeader}>
                <Text style={styles.ordersCardTitle}>Latest Activity</Text>
                <Text style={styles.ordersCardCount}>Last {Math.min(orders.length, 20)}</Text>
            </View>
            {orders.slice(0, 20).map((o, idx) => {
                const statusKey = (o.status || "pending").toLowerCase();
                const isLast    = idx === Math.min(orders.length, 20) - 1;
                return (
                    <View key={o.id || o._id} style={[styles.orderRow, isLast && styles.orderRowLast]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[statusKey] || COLORS.textFaint }]} />
                        <Text style={styles.orderId} numberOfLines={1}>
                            #{String(o.id || o._id || "").slice(-8)}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: STATUS_SOFT[statusKey] || COLORS.primaryLight }]}>
                            <Text style={[styles.statusPillText, { color: STATUS_COLORS[statusKey] }]}>
                                {o.status || "pending"}
                            </Text>
                        </View>
                        <Text style={styles.orderPrice}>
                            ₱{Number(o.totalPrice || 0).toFixed(2)}
                        </Text>
                    </View>
                );
            })}
        </View>
    </>
);

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = ({ users }) => {
    const total    = users.length;
    const active   = users.filter((u) => u.isActive !== false).length;
    const inactive = users.filter((u) => u.isActive === false).length;
    const admins   = users.filter((u) => u.isAdmin === true).length;

    const avatarColors = [COLORS.primary, COLORS.blue, COLORS.green, COLORS.gold, COLORS.red];

    return (
        <>
            <Text style={styles.sectionLabel}>User Stats</Text>
            <View style={styles.statRow}>
                <StatCard icon="people-outline" label="Total"    value={total}    color={COLORS.primary} soft={COLORS.primaryLight} />
                <StatCard icon="shield-outline" label="Admins"   value={admins}   color={COLORS.blue}    soft={COLORS.blueSoft}    />
            </View>
            <View style={styles.statRow}>
                <StatCard icon="person-outline" label="Active"   value={active}   color={COLORS.green} soft={COLORS.greenSoft} />
                <StatCard icon="ban-outline"    label="Inactive" value={inactive} color={COLORS.red}   soft={COLORS.redSoft}   />
            </View>

            <Text style={styles.sectionLabel}>All Users</Text>
            <View style={styles.usersCard}>
                <View style={styles.ordersCardHeader}>
                    <Text style={styles.ordersCardTitle}>User List</Text>
                    <Text style={styles.ordersCardCount}>{total} total</Text>
                </View>
                {users.slice(0, 25).map((u, idx) => {
                    const isLast   = idx === Math.min(users.length, 25) - 1;
                    const initial  = (u.name || u.email || "?")[0].toUpperCase();
                    const avatarBg = avatarColors[idx % avatarColors.length];
                    return (
                        <View key={u.id || u._id} style={[styles.userRow, isLast && styles.userRowLast]}>
                            <View style={[styles.userAvatar, { backgroundColor: avatarBg }]}>
                                <Text style={styles.userAvatarText}>{initial}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName} numberOfLines={1}>{u.name || "Unnamed"}</Text>
                                <Text style={styles.userEmail} numberOfLines={1}>{u.email || ""}</Text>
                            </View>
                            {u.isAdmin && (
                                <Text style={[styles.userBadge, { backgroundColor: COLORS.primaryLight, color: COLORS.primary }]}>
                                    Admin
                                </Text>
                            )}
                            {u.isActive === false && (
                                <Text style={[styles.userBadge, { backgroundColor: COLORS.redSoft, color: COLORS.red }]}>
                                    Inactive
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Analytics = () => {
    const [orders,     setOrders]     = useState([]);
    const [users,      setUsers]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting,  setExporting]  = useState(false);
    const [activeTab,  setActiveTab]  = useState("overview");

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const token = await getJwt();
            const headers = { Authorization: `Bearer ${token || ""}` };
            const [ordersRes, usersRes] = await Promise.all([
                axios.get(`${baseURL}orders`, { headers }),
                axios.get(`${baseURL}users`,  { headers }),
            ]);
            setOrders(ordersRes.data || []);
            setUsers(usersRes.data  || []);
        } catch (e) {
            console.log("[Analytics] error:", e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Derived
    const countByStatus = orders.reduce((acc, o) => {
        const s = (o.status || "pending").toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const totalRevenue = orders
        .filter((o) => o.status?.toLowerCase() !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    const maxCount = Math.max(...STATUSES.map((s) => countByStatus[s] || 0), 1);

    // PDF export
    const exportPDF = async () => {
        try {
            setExporting(true);
            const now = new Date().toLocaleString("en-US", {
                month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
            });
            const statusRows = STATUSES.map((s) => {
                const count = countByStatus[s] || 0;
                return `<tr>
                    <td style="padding:8px 12px;">${s.charAt(0).toUpperCase() + s.slice(1)}</td>
                    <td style="padding:8px 12px;text-align:center;">${count}</td>
                    <td style="padding:8px 12px;text-align:right;">${orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0}%</td>
                </tr>`;
            }).join("");
            const recentRows = orders.slice(0, 20).map((o) => `<tr>
                <td style="padding:6px 12px;font-family:monospace;">#${String(o.id || o._id || "").slice(-8)}</td>
                <td style="padding:6px 12px;">${o.status || "pending"}</td>
                <td style="padding:6px 12px;text-align:right;">₱${Number(o.totalPrice || 0).toFixed(2)}</td>
            </tr>`).join("");
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1a1235;}h1{font-size:24px;color:#7c3aed;}
.sub{color:#888;font-size:12px;margin-bottom:20px;}h2{font-size:14px;border-bottom:2px solid #7c3aed;padding-bottom:4px;margin-bottom:10px;}
.cards{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;}.card{flex:1;min-width:100px;border-radius:8px;padding:12px;color:#fff;text-align:center;}
.card .n{font-size:20px;font-weight:800;}.card .l{font-size:10px;opacity:.85;}
table{width:100%;border-collapse:collapse;}th{padding:8px 12px;background:#f3eeff;text-align:left;font-size:12px;color:#7c3aed;}
td{font-size:12px;border-bottom:1px solid #eee;}.footer{margin-top:24px;text-align:center;color:#aaa;font-size:10px;}</style>
</head><body>
<h1>Analytics Report</h1><div class="sub">${now}</div>
<h2>Orders</h2>
<div class="cards">
<div class="card" style="background:#7c3aed"><div class="n">${orders.length}</div><div class="l">Total</div></div>
<div class="card" style="background:#d97706"><div class="n">₱${totalRevenue.toFixed(2)}</div><div class="l">Revenue</div></div>
<div class="card" style="background:#b45309"><div class="n">${countByStatus.pending||0}</div><div class="l">Pending</div></div>
<div class="card" style="background:#2563eb"><div class="n">${countByStatus.shipped||0}</div><div class="l">Shipped</div></div>
<div class="card" style="background:#059669"><div class="n">${countByStatus.delivered||0}</div><div class="l">Delivered</div></div>
<div class="card" style="background:#dc2626"><div class="n">${countByStatus.cancelled||0}</div><div class="l">Cancelled</div></div>
</div>
<h2>Status Breakdown</h2>
<table><thead><tr><th>Status</th><th>Count</th><th>Share</th></tr></thead><tbody>${statusRows}</tbody></table>
<h2>Recent Orders</h2>
<table><thead><tr><th>ID</th><th>Status</th><th>Total</th></tr></thead><tbody>${recentRows}</tbody></table>
<h2>Users</h2>
<div class="cards">
<div class="card" style="background:#2563eb"><div class="n">${users.length}</div><div class="l">Total</div></div>
<div class="card" style="background:#059669"><div class="n">${users.filter(u=>u.isActive!==false).length}</div><div class="l">Active</div></div>
<div class="card" style="background:#dc2626"><div class="n">${users.filter(u=>u.isActive===false).length}</div><div class="l">Inactive</div></div>
<div class="card" style="background:#7c3aed"><div class="n">${users.filter(u=>u.isAdmin).length}</div><div class="l">Admins</div></div>
</div>
<div class="footer">Analytics Report &mdash; ${now}</div>
</body></html>`;
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Report" });
            } else {
                Alert.alert("Saved", `PDF saved to:\n${uri}`);
            }
        } catch (e) {
            Alert.alert("Export Failed", "Could not generate PDF.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

            {/* ── Tab bar ── */}
            <View style={styles.tabBar}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={tab.icon}
                            size={18}
                            color={activeTab === tab.key ? COLORS.primary : COLORS.textFaint}
                        />
                        <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* ── Page header ── */}
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.pageTitle}>
                            {TABS.find((t) => t.key === activeTab)?.label}
                        </Text>
                        <Text style={styles.pageSubtitle}>Pull down to refresh</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
                        onPress={exportPDF}
                        disabled={exporting}
                    >
                        {exporting
                            ? <ActivityIndicator size="small" color={COLORS.white} />
                            : <Ionicons name="document-text-outline" size={14} color={COLORS.white} />
                        }
                        <Text style={styles.exportBtnText}>{exporting ? "Exporting…" : "Export"}</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Tab content ── */}
                {activeTab === "overview" && (
                    <OverviewTab
                        orders={orders}
                        users={users}
                        countByStatus={countByStatus}
                        totalRevenue={totalRevenue}
                        maxCount={maxCount}
                    />
                )}
                {activeTab === "orders" && (
                    <OrdersTab orders={orders} countByStatus={countByStatus} />
                )}
                {activeTab === "users" && (
                    <UsersTab users={users} />
                )}

            </ScrollView>
        </View>
    );
};

export default Analytics;