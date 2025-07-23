import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import { useAuthStore } from "../../store/authStore";

export default function SettlementRequestScreen({ navigation }) {
  const { token, user } = useAuthStore();
  const [pendingBalance, setPendingBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("evcplus");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [settlementHistory, setSettlementHistory] = useState([]);

  // Fetch balance and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get pending balance
        const balanceRes = await fetch(`${API_URL}/settlements/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const balanceData = await balanceRes.json();
        console.log("pending balance ",balanceData);
        setPendingBalance(balanceData.pendingBalance || 0);

        // Get settlement history
        const historyRes = await fetch(`${API_URL}/settlements/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const historyData = await historyRes.json();
        setSettlementHistory(historyData);
      } catch (error) {
        Alert.alert("Error", "Failed to load settlement data");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchData();
  }, [token]);

  const handleRequestSettlement = async () => {
    if (pendingBalance <= 0) {
      Alert.alert("No Balance", "You have no pending earnings to withdraw");
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/settlements/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Request failed");
      
      Alert.alert(
        "Request Submitted", 
        `Your settlement request for $${data.amount.toFixed(2)} has been submitted.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Earnings Summary</Text>
        
        {isLoadingBalance ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
              <Text style={styles.balanceLabel}>Available for withdrawal:</Text>
              <Text style={styles.balanceAmount}>${pendingBalance.toFixed(3)}</Text>
            </View>

            <View style={styles.paymentMethodContainer}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.methodOptions}>
                <TouchableOpacity 
                  style={[
                    styles.methodButton, 
                    paymentMethod === "evcplus" && styles.methodButtonActive
                  ]}
                  onPress={() => setPaymentMethod("evcplus")}
                >
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={20} 
                    color={paymentMethod === "evcplus" ? "#fff" : COLORS.textPrimary} 
                  />
                  <Text style={[
                    styles.methodText,
                    paymentMethod === "evcplus" && styles.methodTextActive
                  ]}>
                    EVC Plus
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.methodButton, 
                    paymentMethod === "bank" && styles.methodButtonActive
                  ]}
                  onPress={() => setPaymentMethod("bank")}
                >
                  <Ionicons 
                    name="card-outline" 
                    size={20} 
                    color={paymentMethod === "bank" ? "#fff" : COLORS.textPrimary} 
                  />
                  <Text style={[
                    styles.methodText,
                    paymentMethod === "bank" && styles.methodTextActive
                  ]}>
                    Bank Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Request Button */}
      <TouchableOpacity
        style={styles.requestButton}
        onPress={handleRequestSettlement}
        disabled={isLoading || pendingBalance <= 0}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cash-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.requestButtonText}>Request Withdrawal</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Settlement History */}
      <Text style={styles.sectionTitle}>Recent Settlements</Text>
      {settlementHistory.length === 0 ? (
        <Text style={styles.emptyText}>No settlement history yet</Text>
      ) : (
        <View style={styles.historyContainer}>
          {settlementHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyAmount}>${item.amount.toFixed(2)}</Text>
                <Text style={styles.historyMethod}>{item.paymentMethod}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={[
                  styles.historyStatus,
                  item.status === "processed" && styles.statusProcessed,
                  item.status === "pending" && styles.statusPending,
                ]}>
                  {item.status}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 10,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  paymentMethodContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  methodOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  methodText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  methodTextActive: {
    color: "#fff",
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginVertical: 20,
  },
  historyContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  historyMethod: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  statusProcessed: {
    color: COLORS.success,
  },
  statusPending: {
    color: COLORS.warning,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});