import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import { useAuthStore } from "../../store/authStore";

export default function AdminHome() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchSummaryStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/summaryStats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching summary stats:", err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryStats();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>👑 Welcome, Admin!</Text>
        <Text style={styles.headerSubtitle}>Manage your dashboard with ease</Text>
      </LinearGradient>

      {/* <View style={styles.refreshContainer}>
        <RefreshButton onRefresh={fetchSummaryStats} loading={loading} />
      </View> */}

      {initialLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>

          <View style={styles.cardsContainer}>
            <StatCard
              icon="people-outline"
              label="Users"
              value={stats?.totalUsers ?? 0}
              color={COLORS.primary}
            />
            <StatCard
              icon="car-sport-sharp"
              label="Trips"
              value={stats?.totalTrips ?? 0}
              color={COLORS.primary}
            />
            <StatCard
              icon="car-outline"
              label="Vehicles"
              value={stats?.totalVehicles ?? 0}
              color={COLORS.primary}
            />
            <StatCard
              icon="document-text-outline"
              label="Bookings"
              value={stats?.totalBookings ?? 0}
              color={COLORS.primary}
            />
          </View>

          {stats?.recentUsers?.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.sectionTitle}>Recent Users</Text>
              <FlatList
                data={stats.recentUsers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item, index }) => (
                  <View style={styles.userCard}>
                    <Ionicons
                      name="person-circle-outline"
                      size={40}
                      color={COLORS.primary}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <Text style={styles.userRole}>
                      Role: <Text style={{ textTransform: "capitalize" }}>{item.role}</Text>
                    </Text>
                    <Text style={styles.userDate}>
                      Joined: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F3F4F6"]}
      style={styles.statCard}
    >
      <Ionicons name={icon} size={30} color={color} style={{ marginBottom: 8 }} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#E0E7FF",
    fontSize: 14,
    marginTop: 4,
  },
  refreshContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 20,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userCard: {
    width: 200,
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  userName: {
    fontWeight: "600",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 4,
  },
  userDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
