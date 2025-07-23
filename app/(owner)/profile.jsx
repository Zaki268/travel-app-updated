import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AdminProfile() {
  const { token, user, setUser, logout } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => logout() },
    ]);
  };

  const handleProfileUpdate = async () => {
    if (profileData.password && profileData.password !== profileData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (profileData.password && profileData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const payload = {
        name: profileData.name || undefined,
        email: profileData.email || undefined,
        phone: profileData.phone || undefined,
        password: profileData.password || undefined,
      };

      const response = await fetch(`${API_URL}/admin/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const textResponse = await response.text();
      const data = textResponse ? JSON.parse(textResponse) : {};

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update profile");
      }

      const updatedUser = { ...user, ...data.user };
      await setUser(updatedUser);

      setModalVisible(false);
      Alert.alert("✅ Profile Updated", "Your profile was updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err.message.includes("500")
          ? "Server error. Please try again later."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={90} color={COLORS.primary} />
        <Text style={styles.nameText}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.card}>
        <ProfileRow icon="person-outline" label="Name" value={user?.name} />
        <ProfileRow icon="mail-outline" label="Email" value={user?.email} />
        <ProfileRow
          icon="call-outline"
          label="Phone"
          value={user?.phone || "Not provided"}
        />
      </View>

      {/* ACTION BUTTONS */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#000" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <InputField
            label="Full Name"
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            icon="person-outline"
          />
          <InputField
            label="Email"
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            icon="mail-outline"
            keyboardType="email-address"
          />
          <InputField
            label="Phone"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            icon="call-outline"
            keyboardType="phone-pad"
          />
          <InputField
            label="New Password (optional)"
            value={profileData.password}
            onChangeText={(text) => setProfileData({ ...profileData, password: text })}
            icon="lock-closed-outline"
            secureTextEntry
          />
          {profileData.password ? (
            <InputField
              label="Confirm Password"
              value={profileData.confirmPassword}
              onChangeText={(text) => setProfileData({ ...profileData, confirmPassword: text })}
              icon="lock-closed-outline"
              secureTextEntry
            />
          ) : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleProfileUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          {...props}
          style={styles.textInput}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: COLORS.muted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    color: COLORS.primary,
    textTransform: "capitalize",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#000",
   
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
});
