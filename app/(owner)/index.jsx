import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import { useAuthStore } from "../../store/authStore";
import styles from "../styles/home.styles";

export default function OwnerHome() {
  const { token, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

 const [balance, setBalance] = useState(0); // 👈 add this line

const fetchBookings = async () => {
  try {
    const res = await fetch(`${API_URL}/bookings/ownerBookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (res.ok && Array.isArray(data.bookings)) {
      setBookings(data.bookings);
      setBalance(data.balance); // 👈 set balance from response
    } else {
      console.warn("Unexpected bookings data:", data);
      setBookings([]);
    }
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    setBookings([]);
  } finally {
    setLoading(false);
  }
};


  const STATUS_COLORS = {
    PENDING: COLORS.primary,
    CONFIRMED: "#1976D2",
    CANCELLED: "#767676",
    EXPIRED: COLORS.textSecondary,
  };
  

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      Alert.alert("Success", `Booking ${newStatus.toLowerCase()} successfully.`);
      fetchBookings();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />;
  }

return (
  <ScrollView
    style={{ flex: 1, backgroundColor: COLORS.background }}
    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
  >
    {/* Wallet Card */}
    <View
      style={{
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Ionicons name="wallet-outline" size={32} color="#fff" style={{ marginRight: 12 }} />
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Total Balance Received</Text>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4 }}>
          ${balance.toFixed(2)}
        </Text>
      </View>
    </View>

    {/* <RefreshButton onPress={fetchBookings} /> */}

    <Text style={[styles.quickTextTitle, { marginBottom: 8 }]}>📦 Your Trip Bookings</Text>

    {loading && (
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
    )}

    {bookings.length === 0 && !loading && (
      <Text style={{ marginTop: 20, color: COLORS.textSecondary }}>No bookings yet.</Text>
    )}

    {Array.isArray(bookings) && bookings.map((booking) => (
      <View
        key={booking.id}
        style={{
          marginTop: 16,
          backgroundColor: COLORS.cardBackground,
          borderRadius: 16,
          padding: 16,
          borderColor: COLORS.border,
          borderWidth: 1,
          shadowColor: COLORS.black,
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="person-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={{ fontWeight: '600', fontSize: 16, color: COLORS.textDark }}>
            {booking.user.name} booked {booking.seatsBooked} seat(s)
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            {booking.user.phone || 'N/A'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            {booking.trip?.origin} → {booking.trip?.destination}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            {new Date(booking.trip?.date).toLocaleDateString()} at {booking.trip?.time}
          </Text>
        </View>

        {/* Status Tag */}
        <View
          style={{
            backgroundColor: (STATUS_COLORS[booking.status] || COLORS.primary) + '20',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            alignSelf: 'flex-start',
            marginTop: 10,
          }}
        >
          <Text style={{
            color: STATUS_COLORS[booking.status] || COLORS.primary,
            fontWeight: '600',
            fontSize: 13,
          }}>
            {booking.status}
          </Text>
        </View>

        {/* Confirm / Cancel Buttons */}
        {booking.status === 'PENDING' && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => updateBookingStatus(booking.id, 'CONFIRMED')}
              style={{
                flex: 1,
                backgroundColor: "#1976D2",
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateBookingStatus(booking.id, 'CANCELLED')}
              style={{
                flex: 1,
                backgroundColor: "#767676",
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ))}
  </ScrollView>
);

}
