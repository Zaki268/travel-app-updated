import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from "react-native";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import { useAuthStore } from "../../store/authStore";

export default function SettlementProcessScreen() {
  const { token } = useAuthStore();
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending settlements
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const response = await fetch(`${API_URL}/settlements/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log("returned data",data)
        setPendingSettlements(data);
      } catch (error) {
        Alert.alert("Error", "Failed to load settlements");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettlements();
  }, [token]);

  const handleProcessSettlement = (settlement) => {
    setSelectedSettlement(settlement);
    setModalVisible(true);
  };

  const confirmProcess = async () => {
    if (!transactionRef.trim()) {
      Alert.alert("Error", "Please enter a transaction reference");
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch(
        `${API_URL}/settlements/process/${selectedSettlement.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionReference: transactionRef,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Processing failed");
      
      // Update local state
      setPendingSettlements(prev => 
        prev.filter(item => item.id !== selectedSettlement.id)
      );
      
      Alert.alert("Success", "Settlement processed successfully");
      setModalVisible(false);
      setTransactionRef("");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.settlementCard}>
      <View style={styles.settlementHeader}>
        <Text style={styles.settlementId}>#{item.id.slice(-6)}</Text>
        <Text style={styles.settlementAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.settlementBody}>
        <View style={styles.settlementRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.settlementText}>{item.owner.name}</Text>
        </View>
        
        <View style={styles.settlementRow}>
          <Ionicons name="phone-portrait-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.settlementText}>{item.owner.phone || "N/A"}</Text>
        </View>
        
        <View style={styles.settlementRow}>
          <Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.settlementText}>{item.paymentMethod}</Text>
        </View>
        
        <View style={styles.settlementRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.settlementText}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.processButton}
        onPress={() => handleProcessSettlement(item)}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
        <Text style={styles.processButtonText}>Process Payment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    
    <View style={styles.container}>
          {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : pendingSettlements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No pending settlements</Text>
        </View>
      ) : (
        <FlatList
          data={pendingSettlements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Process Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Process Settlement</Text>
            
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalLabel}>Owner:</Text>
              <Text style={styles.modalValue}>{selectedSettlement?.owner.name}</Text>
            </View>
            
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalLabel}>Amount:</Text>
              <Text style={[styles.modalValue, styles.amountText]}>
                ${selectedSettlement?.amount.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.modalDetailRow}>
              <Text style={styles.modalLabel}>Method:</Text>
              <Text style={styles.modalValue}>
                {selectedSettlement?.paymentMethod}
              </Text>
            </View>
            
            <Text style={styles.inputLabel}>Transaction Reference</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter payment reference"
              value={transactionRef}
              onChangeText={setTransactionRef}
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmProcess}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 16,
  },
  settlementCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settlementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settlementId: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  settlementBody: {
    marginBottom: 16,
  },
  settlementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  settlementText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  processButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  amountText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});