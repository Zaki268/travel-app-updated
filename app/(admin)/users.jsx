import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import { useAuthStore } from "../../store/authStore";
import RefreshButton from "../components/RefreshButton";

export default function UsersScreen() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});

  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`${API_URL}/auth/getAllUsers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("User fetch error:", err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleShowUser = (user) => {
    setSelectedUser(user);
    setUpdatedUser({ ...user });
    setEditMode(false);
    setModalVisible(true);
  };

  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/updateUser/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user");

      Alert.alert("✅ Success", "User updated successfully");
      setModalVisible(false);
      fetchUsers(); // Refresh
    } catch (err) {
      Alert.alert("❌ Error", err.message);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter((u) =>
          u.name.toLowerCase().includes(text.toLowerCase()) ||
          u.email.toLowerCase().includes(text.toLowerCase()) ||
          u.role.toLowerCase().includes(text.toLowerCase()) 

        )
      );
    }
  };
const handleDeleteUser = () => {
  Alert.alert(
    "⚠️ Confirm Delete",
    "Are you sure you want to delete this user?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin/deleteUser/${selectedUser.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log(res)
            const data = await res.json();
            console.log('Server Delete Response:', data);

            if (!res.ok) throw new Error(data.message || "Failed to delete user");

            Alert.alert("✅ Success", "User deleted successfully");
            setModalVisible(false);
            fetchUsers(); // Refresh list
          } catch (err) {
            console.error('❌ Error in Delete:', err);
            Alert.alert("❌ Error", err.message);
          }
        },
      },
    ]
  );
};




  const renderUserItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleShowUser(item)} style={styles.userCard}>
      <Ionicons name="person-circle-outline" size={48} color={COLORS.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{item.role}</Text>
        </View>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderUserModal = () => (
    <Modal visible={modalVisible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>
              👤 {editMode ? "Edit User" : "User Details"}
            </Text>

            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                value={updatedUser.name}
                onChangeText={(text) =>
                  setUpdatedUser((prev) => ({ ...prev, name: text }))
                }
                editable={editMode}
                style={[styles.input, !editMode && styles.readonlyInput]}
              />
            </View>

            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                value={updatedUser.email}
                onChangeText={(text) =>
                  setUpdatedUser((prev) => ({ ...prev, email: text }))
                }
                editable={editMode}
                style={[styles.input, !editMode && styles.readonlyInput]}
              />
            </View>

            <View style={styles.modalItem}>
              <Text style={styles.modalLabel}>Role</Text>
              {editMode ? (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={updatedUser.role}
                    onValueChange={(value) =>
                      setUpdatedUser((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <Picker.Item label="Admin" value="admin" />
                    <Picker.Item label="Traveler" value="traveler" />
                    <Picker.Item label="Vehicle Owner" value="vehicle_owner" />
                  </Picker>
                </View>
              ) : (
                <Text style={styles.modalValue}>{updatedUser.role}</Text>
              )}
            </View>

            {editMode ? (
              <TouchableOpacity onPress={handleUpdateUser} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              
            )}
            <TouchableOpacity
  onPress={handleDeleteUser}
  style={styles.deleteBtn}
>
  <Text style={styles.deleteText}>Delete User</Text>
</TouchableOpacity>


            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loadingUsers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}> All Users</Text>

      <View style={styles.topBar}>
        <TextInput
          placeholder="🔍 Search by name or email"
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={handleSearch}
          style={styles.searchInput}
        />
        <RefreshButton onRefresh={fetchUsers} loading={loadingUsers} />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {renderUserModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: COLORS.cardBackground,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  roleTag: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 12,
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    width: "90%",
    maxHeight: "80%",
    borderRadius: 24,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  modalItem: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
    backgroundColor: "#fff",
  },
  readonlyInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  editBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  editText: {
    color: COLORS.black,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  closeBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  closeText: {
    color: "#000",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  deleteBtn: {
  backgroundColor: COLORS.error,
  paddingVertical: 12,
  borderRadius: 12,
  marginTop: 10,
},
deleteText: {
  backgroundColor: 'red',
  color: "#fff",
  fontSize: 16,
  textAlign: "center",
  fontWeight: "600",
  paddingVertical: 12,
  borderRadius: 12,
},

});




