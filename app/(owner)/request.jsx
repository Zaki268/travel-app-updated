
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

export default function SettlementRequestScreen() {
  const { token, user } = useAuthStore();
  const [pendingBalance, setPendingBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("evcplus");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({
    evcplus: user?.phone || "",
    bank: "",
  });

  // Fetch balance and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get pending balance from /owner endpoint
        const balanceRes = await fetch(`${API_URL}/settlements/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const balanceData = await balanceRes.json();
        
        // Get history from /settlements/history endpoint
        const historyRes = await fetch(`${API_URL}/settlements/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const historyData = await historyRes.json();

        // Handle balance response (both direct field and summary object formats)
        const balance = balanceData.pendingBalance || balanceData.summary?.pendingBalance || 0;
        setPendingBalance(balance);
        
        // Handle history response (both array and object-with-data formats)
        const historyItems = Array.isArray(historyData) ? historyData : historyData.data || [];
        setSettlementHistory(historyItems);

        // Initialize payment details if available
        if (balanceData.paymentDetails) {
          setPaymentDetails(prev => ({
            ...prev,
            ...balanceData.paymentDetails
          }));
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load settlement data");
        console.error("Fetch error:", error);
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
        body: JSON.stringify({ 
          paymentMethod,
          paymentDetails: paymentDetails[paymentMethod] 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }
      
      Alert.alert(
        "Request Submitted", 
        `Your settlement request for $${data.settlement?.amount?.toFixed(2) || pendingBalance.toFixed(2)} has been submitted for admin approval.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              setPendingBalance(0); // Optimistic update
              // if (data.settlement?.id) {
              //   navigation.replace("SettlementStatus", { 
              //     settlementId: data.settlement.id 
              //   });
              // }
            } 
          }
        ]
      );
    } catch (error) {
      Alert.alert("Request Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethodInput = () => {
    switch (paymentMethod) {
      case "evcplus":
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EVC Plus Number</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputText}>
                {paymentDetails.evcplus || "Not set"}
              </Text>
              {/* <TouchableOpacity onPress={() => navigation.navigate("PaymentSettings")}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        );
      case "bank":
        return (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Account</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputText}>
                {paymentDetails.evcplus || "Not configured"}
              </Text>
              {/* <TouchableOpacity onPress={() => navigation.navigate("PaymentSettings")}>
                <Text style={styles.changeText}>Setup</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderHistoryItems = () => {
    // Ensure we always have an array to work with
    const items = Array.isArray(settlementHistory) 
      ? settlementHistory 
      : settlementHistory.data || [];

    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={40} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No withdrawal history yet</Text>
        </View>
      );
    }

    return items.map((item) => (
      <TouchableOpacity 
        key={item.id} 
        style={styles.historyItem}
        // onPress={() => navigation.navigate("SettlementStatus", { settlementId: item.id })}
      >
        <View style={styles.historyLeft}>
          <Text style={styles.historyAmount}>${item.amount?.toFixed(2)}</Text>
          <Text style={styles.historyMethod}>
            {item.paymentMethod === "evcplus" ? "EVC Plus" : "Bank Transfer"}
          </Text>
        </View>
        <View style={styles.historyRight}>
          <View style={[
            styles.statusBadge,
            (item.status === "completed" || item.status === "processed") && styles.statusBadgeSuccess,
            (item.status === "pending" || item.status === "requested") && styles.statusBadgeWarning,
            item.status === "failed" && styles.statusBadgeError,
          ]}>
            <Text style={styles.historyStatus}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
          {/* <Text style={styles.historyDate}>
            {new Date(item.paidTo || item.createdAt).toLocaleDateString()}
          </Text> */}
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Withdrawal Request</Text>
        
        {isLoadingBalance ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
              <View style={styles.balanceTextContainer}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>${pendingBalance.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.paymentSection}>
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

                {/* <TouchableOpacity 
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
                    Bank
                  </Text>
                </TouchableOpacity> */}
              </View>

              {renderPaymentMethodInput()}
            </View>
          </>
        )}
      </View>

      {/* Important Notice */}
      <View style={styles.noticeCard}>
        <Ionicons name="information-circle" size={20} color={COLORS.warning} />
        <Text style={styles.noticeText}>
          Withdrawal requests are processed within 24-48 hours. A 2% processing fee applies.
        </Text>
      </View>

      {/* Request Button */}
      <TouchableOpacity
        style={[
          styles.requestButton,
          (isLoading || pendingBalance <= 0) && styles.requestButtonDisabled
        ]}
        onPress={handleRequestSettlement}
        disabled={isLoading || pendingBalance <= 0}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="cash-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.requestButtonText}>
              {pendingBalance > 0 ? "Request Withdrawal" : "No Funds Available"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Settlement History */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <View style={styles.historyContainer}>
        {renderHistoryItems()}
      </View>
    </ScrollView>
  );
}

// ... keep your existing StyleSheet ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  balanceTextContainer: {
    marginLeft: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  paymentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  methodOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  methodText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  methodTextActive: {
    color: "#fff",
  },
  inputContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  changeText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: COLORS.warningLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "flex-start",
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
  requestButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },
  historyContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statusBadgeWarning: {
    backgroundColor: COLORS.warningLight,
  },
  statusBadgeError: {
    backgroundColor: COLORS.errorLight,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});