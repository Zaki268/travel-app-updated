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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending approvals
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const response = await fetch(`${API_URL}/settlements/approvals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log(data);
        setPendingApprovals(data);
      } catch (error) {
        Alert.alert("Error", "Failed to load pending approvals");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingApprovals();
  }, [token]);

  const handleApproveSettlement = (approval) => {
    setSelectedApproval(approval);
    setModalVisible(true);
  };

  const confirmApproval = async () => {
    if (!transactionRef.trim()) {
      Alert.alert("Error", "Transaction reference is required");
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch(
        `${API_URL}/settlements/approve/${selectedApproval.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transactionReference: transactionRef,
            adminNotes: adminNotes.trim() || null
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Approval failed");
      
      // Update local state
      setPendingApprovals(prev => 
        prev.filter(item => item.id !== selectedApproval.id)
      );
      
      Alert.alert("Success", "Settlement approved successfully");
      setModalVisible(false);
      setTransactionRef("");
      setAdminNotes("");
    } catch (error) {
      Alert.alert("Approval Failed", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.approvalCard}>
      <View style={styles.approvalHeader}>
        <Text style={styles.approvalId}>Request #{item.reference?.split('-')[1] || item.id.slice(-6)}</Text>
        <Text style={styles.approvalAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.approvalBody}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.owner?.name || "Unknown"}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {item.paymentMethod === "evcplus" ? "EVC Plus" : "Bank Transfer"}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            Requested: {new Date(item.requestedAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            Bookings: {item.bookings?.length || 0}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.approveButton}
        onPress={() => handleApproveSettlement(item)}
      >
        <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
        <Text style={styles.approveButtonText}>Approve Payment</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : pendingApprovals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No pending approvals</Text>
        </View>
      ) : (
        <FlatList
          data={pendingApprovals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Approval Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Approve Settlement</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>Owner Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedApproval?.owner?.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>
                  {selectedApproval?.owner?.phone || "N/A"}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>Payment Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountText]}>
                  ${selectedApproval?.amount?.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method:</Text>
                <Text style={styles.detailValue}>
                  {selectedApproval?.paymentMethod === "evcplus" ? "EVC Plus" : "Bank Transfer"}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>Approval Details</Text>
              <Text style={styles.inputLabel}>Transaction Reference*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Payment gateway reference"
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholderTextColor={COLORS.textSecondary}
              />
              
              <Text style={styles.inputLabel}>Admin Notes</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                placeholder="Optional notes about this approval"
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={confirmApproval}
                disabled={isProcessing || !transactionRef}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={18} color="#fff" />
                    <Text style={styles.approveButtonText}>Confirm Approval</Text>
                  </>
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
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  approvalCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approvalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  approvalId: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  approvalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  approvalBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
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
    marginBottom: 8,
    marginTop: 12,
  },
    approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981', // Emerald green - common approve color
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    gap: 8, // Space between icon and text
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
    approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  textInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  // approveButton: {
  //   backgroundColor: COLORS.success,
  // },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // approveButtonText: {
  //   color: "#fff",
  //   fontWeight: "600",
  //   marginLeft: 8,
  // },
});



// import { Ionicons } from "@expo/vector-icons";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Modal,
//   TextInput,
// } from "react-native";
// import { API_URL } from "../../constants/api";
// import COLORS from "../../constants/color";
// import { useAuthStore } from "../../store/authStore";

// export default function SettlementProcessScreen() {
//   const { token } = useAuthStore();
//   const [pendingSettlements, setPendingSettlements] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedSettlement, setSelectedSettlement] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [transactionRef, setTransactionRef] = useState("");
//   const [isProcessing, setIsProcessing] = useState(false);

//   // Fetch pending settlements
//   useEffect(() => {
//     const fetchSettlements = async () => {
//       try {
//         const response = await fetch(`${API_URL}/settlements/pending`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const data = await response.json();
//         console.log("returned data",data)
//         setPendingSettlements(data);
//       } catch (error) {
//         Alert.alert("Error", "Failed to load settlements");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchSettlements();
//   }, [token]);

//   const handleProcessSettlement = (settlement) => {
//     setSelectedSettlement(settlement);
//     setModalVisible(true);
//   };

//   const confirmProcess = async () => {
//     if (!transactionRef.trim()) {
//       Alert.alert("Error", "Please enter a transaction reference");
//       return;
//     }

//     try {
//       setIsProcessing(true);
      
//       const response = await fetch(
//         `${API_URL}/settlements/process/${selectedSettlement.id}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             transactionReference: transactionRef,
//           }),
//         }
//       );

//       const data = await response.json();
      
//       if (!response.ok) throw new Error(data.error || "Processing failed");
      
//       // Update local state
//       setPendingSettlements(prev => 
//         prev.filter(item => item.id !== selectedSettlement.id)
//       );
      
//       Alert.alert("Success", "Settlement processed successfully");
//       setModalVisible(false);
//       setTransactionRef("");
//     } catch (error) {
//       Alert.alert("Error", error.message);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <View style={styles.settlementCard}>
//       <View style={styles.settlementHeader}>
//         <Text style={styles.settlementId}>#{item.id.slice(-6)}</Text>
//         <Text style={styles.settlementAmount}>${item.amount.toFixed(2)}</Text>
//       </View>
      
//       <View style={styles.settlementBody}>
//         <View style={styles.settlementRow}>
//           <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
//           <Text style={styles.settlementText}>{item.owner.name}</Text>
//         </View>
        
//         <View style={styles.settlementRow}>
//           <Ionicons name="phone-portrait-outline" size={16} color={COLORS.textSecondary} />
//           <Text style={styles.settlementText}>{item.owner.phone || "N/A"}</Text>
//         </View>
        
//         <View style={styles.settlementRow}>
//           <Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />
//           <Text style={styles.settlementText}>{item.paymentMethod}</Text>
//         </View>
        
//         <View style={styles.settlementRow}>
//           <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
//           <Text style={styles.settlementText}>
//             {new Date(item.createdAt).toLocaleString()}
//           </Text>
//         </View>
//       </View>
      
//       <TouchableOpacity
//         style={styles.processButton}
//         onPress={() => handleProcessSettlement(item)}
//       >
//         <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
//         <Text style={styles.processButtonText}>Process Payment</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
    
//     <View style={styles.container}>
//           {isLoading ? (
//         <ActivityIndicator size="large" style={styles.loader} />
//       ) : pendingSettlements.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="checkmark-done-outline" size={48} color={COLORS.textSecondary} />
//           <Text style={styles.emptyText}>No pending settlements</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={pendingSettlements}
//           renderItem={renderItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContainer}
//         />
//       )}

//       {/* Process Modal */}
//       <Modal
//         visible={modalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Process Settlement</Text>
            
//             <View style={styles.modalDetailRow}>
//               <Text style={styles.modalLabel}>Owner:</Text>
//               <Text style={styles.modalValue}>{selectedSettlement?.owner.name}</Text>
//             </View>
            
//             <View style={styles.modalDetailRow}>
//               <Text style={styles.modalLabel}>Amount:</Text>
//               <Text style={[styles.modalValue, styles.amountText]}>
//                 ${selectedSettlement?.amount.toFixed(2)}
//               </Text>
//             </View>
            
//             <View style={styles.modalDetailRow}>
//               <Text style={styles.modalLabel}>Method:</Text>
//               <Text style={styles.modalValue}>
//                 {selectedSettlement?.paymentMethod}
//               </Text>
//             </View>
            
//             <Text style={styles.inputLabel}>Transaction Reference</Text>
//             <TextInput
//               style={styles.textInput}
//               placeholder="Enter payment reference"
//               value={transactionRef}
//               onChangeText={setTransactionRef}
//               placeholderTextColor={COLORS.textSecondary}
//             />
            
//             <View style={styles.modalButtonContainer}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setModalVisible(false)}
//                 disabled={isProcessing}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.confirmButton]}
//                 onPress={confirmProcess}
//                 disabled={isProcessing}
//               >
//                 {isProcessing ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.confirmButtonText}>Confirm</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   loader: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: COLORS.textSecondary,
//   },
//   listContainer: {
//     padding: 16,
//   },
//   settlementCard: {
//     backgroundColor: COLORS.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   settlementHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   settlementId: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//   },
//   settlementAmount: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: COLORS.primary,
//   },
//   settlementBody: {
//     marginBottom: 16,
//   },
//   settlementRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   settlementText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: COLORS.textPrimary,
//   },
//   processButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.primary,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   processButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContainer: {
//     width: "90%",
//     backgroundColor: COLORS.background,
//     borderRadius: 12,
//     padding: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: COLORS.textPrimary,
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   modalDetailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   modalLabel: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//   },
//   modalValue: {
//     fontSize: 16,
//     color: COLORS.textPrimary,
//     fontWeight: "500",
//   },
//   amountText: {
//     color: COLORS.primary,
//     fontWeight: "700",
//   },
//   inputLabel: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   textInput: {
//     backgroundColor: COLORS.inputBackground,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     color: COLORS.textPrimary,
//   },
//   modalButtonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 24,
//   },
//   modalButton: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: "center",
//     marginHorizontal: 8,
//   },
//   cancelButton: {
//     backgroundColor: COLORS.textSecondary,
//   },
//   confirmButton: {
//     backgroundColor: COLORS.primary,
//   },
//   cancelButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   confirmButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
// });