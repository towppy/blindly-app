import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import baseURL from "../../assets/common/baseurl";
import { getJwt } from "../../assets/common/jwtStore";

const STATUS_COLORS = {
    pending:   "#e7e73c",
    shipped:   "#f1660f",
    delivered: "#00bb3e",
    cancelled: "#ff0202",
};

const STATUSES = ["pending", "shipped", "delivered", "cancelled"];

const Analytics = () => {
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const token = await getJwt();
            const headers = { Authorization: `Bearer ${token || ""}` };
            const [ordersRes, usersRes] = await Promise.all([
                axios.get(`${baseURL}orders`, { headers }),
                axios.get(`${baseURL}users`, { headers }),
            ]);
            setOrders(ordersRes.data || []);
            setUsers(usersRes.data || []);
        } catch (e) {
            console.log("[Analytics] error:", e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    const countByStatus = orders.reduce((acc, o) => {
        const s = (o.status || "pending").toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const totalRevenue = orders
        .filter((o) => o.status?.toLowerCase() !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

    const maxCount = Math.max(...STATUSES.map((s) => countByStatus[s] || 0), 1);

    // User stats
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive !== false).length;
    const inactiveUsers = users.filter((u) => u.isActive === false).length;
    const adminUsers = users.filter((u) => u.isAdmin === true).length;

    const exportPDF = async () => {
        try {
            setExporting(true);
            const now = new Date().toLocaleString("en-US", {
                month: "long", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            });

            const statusRows = STATUSES.map((s) => {
                const count = countByStatus[s] || 0;
                const color = STATUS_COLORS[s];
                return `<tr>
                    <td style="padding:8px 12px;">
                        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;"></span>
                        ${s.charAt(0).toUpperCase() + s.slice(1)}
                    </td>
                    <td style="padding:8px 12px;text-align:center;">${count}</td>
                    <td style="padding:8px 12px;text-align:right;">${orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0}%</td>
                </tr>`;
            }).join("");

            const recentRows = orders.slice(0, 20).map((o) => {
                const s = (o.status || "pending").toLowerCase();
                const color = STATUS_COLORS[s] || "#ccc";
                return `<tr>
                    <td style="padding:6px 12px;font-family:monospace;font-size:12px;">#${String(o.id || o._id || "").slice(-8)}</td>
                    <td style="padding:6px 12px;">
                        <span style="background:${color};color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;">
                            ${o.status || "pending"}
                        </span>
                    </td>
                    <td style="padding:6px 12px;text-align:right;">$${Number(o.totalPrice || 0).toFixed(2)}</td>
                </tr>`;
            }).join("");

            const html = `<!DOCTYPE html><html>
<head>
<meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#1a1a2e;background:#fff;}
  h1{font-size:28px;color:#7c3aed;margin-bottom:4px;}
  .subtitle{color:#666;font-size:13px;margin-bottom:24px;}
  .section{margin-bottom:28px;}
  h2{font-size:16px;color:#444;border-bottom:2px solid #7c3aed;padding-bottom:6px;margin-bottom:14px;}
  .cards{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:0;}
  .card{flex:1;min-width:120px;border-radius:10px;padding:14px 16px;color:#fff;text-align:center;}
  .card .num{font-size:26px;font-weight:800;}
  .card .lbl{font-size:11px;opacity:.9;margin-top:4px;}
  table{width:100%;border-collapse:collapse;}
  thead tr{background:#f3eeff;}
  th{padding:10px 12px;text-align:left;font-size:13px;color:#7c3aed;}
  tbody tr:nth-child(even){background:#fafafa;}
  td{font-size:13px;color:#333;border-bottom:1px solid #eee;}
  .footer{margin-top:32px;text-align:center;color:#999;font-size:11px;}
</style>
</head>
<body>
  <h1>Blindly Analytics Report</h1>
  <div class="subtitle">Generated on ${now}</div>

  <div class="section">
    <h2>Order Summary</h2>
    <div class="cards">
      <div class="card" style="background:#7c3aed"><div class="num">${orders.length}</div><div class="lbl">Total Orders</div></div>
      <div class="card" style="background:#2ECC71"><div class="num">$${totalRevenue.toFixed(2)}</div><div class="lbl">Total Revenue</div></div>
      <div class="card" style="background:#E74C3C"><div class="num">${countByStatus.pending || 0}</div><div class="lbl">Pending</div></div>
      <div class="card" style="background:#F1C40F"><div class="num">${countByStatus.shipped || 0}</div><div class="lbl">Shipped</div></div>
      <div class="card" style="background:#00bb3e"><div class="num">${countByStatus.delivered || 0}</div><div class="lbl">Delivered</div></div>
      <div class="card" style="background:#ff0202"><div class="num">${countByStatus.cancelled || 0}</div><div class="lbl">Cancelled</div></div>
    </div>
  </div>

  <div class="section">
    <h2>User Summary</h2>
    <div class="cards">
      <div class="card" style="background:#1976d2"><div class="num">${totalUsers}</div><div class="lbl">Total Users</div></div>
      <div class="card" style="background:#2ECC71"><div class="num">${activeUsers}</div><div class="lbl">Active Users</div></div>
      <div class="card" style="background:#E74C3C"><div class="num">${inactiveUsers}</div><div class="lbl">Inactive Users</div></div>
      <div class="card" style="background:#e91e63"><div class="num">${adminUsers}</div><div class="lbl">Admins</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Orders by Status</h2>
    <table>
      <thead><tr><th>Status</th><th style="text-align:center;">Count</th><th style="text-align:right;">Share</th></tr></thead>
      <tbody>${statusRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Recent Orders (Last 20)</h2>
    <table>
      <thead><tr><th>Order ID</th><th>Status</th><th style="text-align:right;">Total</th></tr></thead>
      <tbody>${recentRows}</tbody>
    </table>
  </div>

  <div class="footer">Blindly App &mdash; Admin Report &mdash; ${now}</div>
</body></html>`;

            const { uri } = await Print.printToFileAsync({ html, base64: false });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Analytics Report" });
            } else {
                Alert.alert("Saved", `PDF saved to:\n${uri}`);
            }
        } catch (e) {
            console.log("[Analytics] PDF export error:", e.message);
            Alert.alert("Export Failed", "Could not generate PDF. Try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
            }
        >
            {/* Header row */}
            <View style={styles.headerRow}>
                <Text style={styles.heading}>Analytics</Text>
                <TouchableOpacity
                    style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
                    onPress={exportPDF}
                    disabled={exporting}
                >
                    {exporting
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                    }
                    <Text style={styles.exportBtnText}>{exporting ? "Exporting..." : "Export PDF"}</Text>
                </TouchableOpacity>
            </View>

            {/* Order summary cards */}
            <Text style={styles.subheading}>Orders</Text>
            <View style={styles.row}>
                <View style={[styles.summaryCard, { backgroundColor: "#7c3aed" }]}>
                    <Text style={styles.summaryNum}>{orders.length}</Text>
                    <Text style={styles.summaryLabel}>Total Orders</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: "#2ECC71" }]}>
                    <Text style={styles.summaryNum}>${totalRevenue.toFixed(2)}</Text>
                    <Text style={styles.summaryLabel}>Revenue</Text>
                </View>
            </View>
            <View style={styles.row}>
                <View style={[styles.summaryCard, { backgroundColor: "#E74C3C" }]}>
                    <Text style={styles.summaryNum}>{countByStatus.pending || 0}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: "#F1C40F" }]}>
                    <Text style={styles.summaryNum}>{countByStatus.shipped || 0}</Text>
                    <Text style={styles.summaryLabel}>Shipped</Text>
                </View>
            </View>

            {/* User stats cards */}
            <Text style={styles.subheading}>Users</Text>
            <View style={styles.row}>
                <View style={[styles.summaryCard, { backgroundColor: "#1976d2" }]}>
                    <Text style={styles.summaryNum}>{totalUsers}</Text>
                    <Text style={styles.summaryLabel}>Total Users</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: "#e91e63" }]}>
                    <Text style={styles.summaryNum}>{adminUsers}</Text>
                    <Text style={styles.summaryLabel}>Admins</Text>
                </View>
            </View>
            <View style={styles.row}>
                <View style={[styles.summaryCard, { backgroundColor: "#2ECC71" }]}>
                    <Text style={styles.summaryNum}>{activeUsers}</Text>
                    <Text style={styles.summaryLabel}>Active Users</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: "#E74C3C" }]}>
                    <Text style={styles.summaryNum}>{inactiveUsers}</Text>
                    <Text style={styles.summaryLabel}>Inactive Users</Text>
                </View>
            </View>

            {/* Status bar chart */}
            <Text style={styles.subheading}>Orders by Status</Text>
            <View style={styles.chartContainer}>
                {STATUSES.map((s) => {
                    const count = countByStatus[s] || 0;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                        <View key={s} style={styles.barRow}>
                            <Text style={styles.barLabel}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </Text>
                            <View style={styles.barTrack}>
                                <View
                                    style={[
                                        styles.barFill,
                                        { width: `${pct}%`, backgroundColor: STATUS_COLORS[s] },
                                    ]}
                                />
                            </View>
                            <Text style={styles.barCount}>{count}</Text>
                        </View>
                    );
                })}
            </View>

            {/* Recent orders */}
            <Text style={styles.subheading}>Recent Orders</Text>
            {orders.slice(0, 15).map((o) => {
                const statusKey = (o.status || "pending").toLowerCase();
                return (
                    <View key={o.id || o._id} style={styles.orderRow}>
                        <View
                            style={[styles.dot, { backgroundColor: STATUS_COLORS[statusKey] || "#ccc" }]}
                        />
                        <Text style={styles.orderId} numberOfLines={1}>
                            #{String(o.id || o._id || "").slice(-8)}
                        </Text>
                        <Text style={styles.orderStatus}>{o.status}</Text>
                        <Text style={styles.orderPrice}>
                            ${Number(o.totalPrice || 0).toFixed(2)}
                        </Text>
                    </View>
                );
            })}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container:      { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
    center:         { flex: 1, alignItems: "center", justifyContent: "center" },
    headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    heading:        { fontSize: 22, fontWeight: "700", color: "#1a0a3c" },
    exportBtn:      {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#7c3aed", borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    exportBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
    subheading:     { fontSize: 16, fontWeight: "600", color: "#444", marginTop: 20, marginBottom: 10 },
    row:            { flexDirection: "row", gap: 12, marginBottom: 8 },
    summaryCard:    { flex: 1, borderRadius: 12, padding: 16, alignItems: "center" },
    summaryNum:     { fontSize: 22, fontWeight: "800", color: "#fff" },
    summaryLabel:   { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    chartContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 2 },
    barRow:         { flexDirection: "row", alignItems: "center", marginVertical: 6 },
    barLabel:       { width: 80, fontSize: 13, color: "#444" },
    barTrack:       { flex: 1, height: 18, backgroundColor: "#eee", borderRadius: 9, overflow: "hidden" },
    barFill:        { height: "100%", borderRadius: 9 },
    barCount:       { width: 30, textAlign: "right", fontSize: 13, color: "#444", marginLeft: 8 },
    orderRow:       {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        padding: 12, marginBottom: 6, borderRadius: 8, elevation: 1,
    },
    dot:            { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    orderId:        { flex: 1, color: "#333", fontFamily: "monospace" },
    orderStatus:    { width: 75, fontSize: 12, color: "#666", textTransform: "capitalize" },
    orderPrice:     { fontSize: 13, fontWeight: "600", color: "#1a0a3c" },
});

export default Analytics;
