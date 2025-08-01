import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import styles from "../styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/color";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";
import { Linking } from 'react-native';

export default function BookingForm() {
  const {user, token } = useAuthStore();
  const router = useRouter();

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(null);
  const [seatsBooked, setSeatsBooked] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [tripOptions, setTripOptions] = useState([]);

  // Fetch available trips
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        
        const res = await fetch(`${API_URL}/trips/public`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const formattedTrips = data.trips ? data.trips : data; // handle case if backend doesn't return with `trips: []`
       
      //  console.log("data is: ",formattedTrips)
        setTrips(formattedTrips);
        setTripOptions(
          formattedTrips.map((trip) => ({
            label: `${trip.origin} → ${trip.destination}`,
            value: trip.id,
          }))
        );
      } catch (err) {
        console.error("Error fetching trips:", err.message);
      }
    };

    fetchTrips();
  }, []);
  const calculateTotal = (tripId, seats) => {
  const selectedTrip = trips.find((t) => t.id === tripId);
  const price = selectedTrip?.price || 0;
  const total = price * parseInt(seats || 0);
  setTotalPrice(total);
};


//  const handleSubmit = async () => {
//   if (!tripId || !seatsBooked) {
//     Alert.alert("Missing Fields", "Please select a trip and enter number of seats.");
//     return;
//   }

//   try {
//     setLoading(true);

//     // Register booking
//     const res = await fetch(`${API_URL}/bookings/registerBooking`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         tripId,
//         seatsBooked: parseInt(seatsBooked),
//       }),
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || "Booking failed");

//     const selectedTrip = trips.find((t) => t.id === tripId);
//     const amount = (selectedTrip?.price || 0) * parseInt(seatsBooked || 1);
//     const ownerPhone = selectedTrip?.user?.phone;

//     if (!ownerPhone) {
//       Alert.alert("Missing Info", "Trip owner phone not found.");
//       return;
//     }

//     const ussdCode = `tel:*712*${ownerPhone}*${amount}%23`;

//     // Reset and navigate FIRST before dialing
//     setTripId(null);
//     setSeatsBooked('');
//     router.replace("/(tabs)/profile");

//     // Delay to allow navigation
//     setTimeout(() => {
//       Linking.openURL(ussdCode).catch(err =>
//         Alert.alert("Dialer Error", "Could not open dialer")
//       );
//     }, 1000);

//   } catch (err) {
//     Alert.alert("Error", err.message || "Something went wrong");
//   } finally {
//     setLoading(false);
//   }
// };

const handleSubmit = async () => {
  if (!tripId || !seatsBooked) {
    Alert.alert("Missing Fields", "Please select a trip and enter number of seats.");
    return;
  }

  try {
    setLoading(true);

    // Get trip details for payment calculation
    const selectedTrip = trips.find((t) => t.id === tripId);
   const totalAmount = (selectedTrip?.price || 0) * parseInt(seatsBooked || 1);
    const systemFee = totalAmount * 0.10; // 10% platform fee
    const ownerEarnings = totalAmount - systemFee; // 90% to owner

    // const amount = (selectedTrip?.price || 0) * parseInt(seatsBooked || 1);
    // const ownerPhone = selectedTrip?.user?.phone;

    // if (!ownerPhone) {
    //   Alert.alert("Missing Info", "Trip owner phone not found.");
    //   return;
    // }

    // Prepare payment request
    const paymentRequest = {
      schemaVersion: "1.0",
      requestId: Date.now().toString(), // Using timestamp as request ID
      timestamp: new Date().toISOString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: "M0910291",
        apiUserId: "1000416",
        apiKey: "API-675418888AHX",
        paymentMethod: "mwallet_account",
        payerInfo: {
          accountNo: user.phone // Assuming user's phone is stored in the user object
        },
        transactionInfo: {
          referenceId: `trip_${tripId}`,
          invoiceId: `inv_${Date.now()}`,
          amount: totalAmount,
          currency: "USD",
          description: `Payment for ${seatsBooked} seat(s) on trip ${tripId}`
        }
      }
    };

    // Make payment request
    const paymentRes = await fetch("https://api.waafipay.net/asm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentRequest),
    });

    const paymentData = await paymentRes.json();
    
    // Check payment response
    if (paymentData.responseCode !== "2001") {
      let errorMessage = paymentData.responseMsg;
      if (paymentData.params?.description) {
        errorMessage += ` (${paymentData.params.description})`;
      }
      throw new Error(errorMessage);
    }

    // Payment successful, now register booking
    const res = await fetch(`${API_URL}/bookings/registerBooking`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tripId,
        seatsBooked: parseInt(seatsBooked),
         totalAmount,
        systemFee,
        ownerEarnings,
        paymentStatus: "paid",
        paymentMethod: "evcplus",
        transactionId: paymentData.params?.transactionId,
        // transactionId: "TEST001",

        // paidAt: new Date().toISOString()
        // transactionId: paymentData.params.transactionId // Save transaction ID with booking
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Booking failed");

    // Reset and navigate
    setTripId(null);
    setSeatsBooked('');
    router.replace("/(tabs)/profile");

    Alert.alert("Success", "Booking and payment completed successfully!");

  } catch (err) {
    Alert.alert("Error", err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};  
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}> */}
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Book a Trip</Text>
            <Text style={styles.subtitle}>
              Select a trip and number of seats
            </Text>
          </View>

          <View style={styles.form}>
            {/* Trip Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Trip</Text>
              <DropDownPicker
                open={open}
                setOpen={setOpen}
                items={tripOptions}
                value={tripId}
                // setValue={setTripId}
                setValue={(value) => {
  setTripId(value);
  calculateTotal(value, seatsBooked);
}}

                placeholder="Choose a route"
                style={{ marginTop: 8 }}
                zIndex={1000}
              />
            </View>

            {/* Seats */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Seats to Book</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2"
                  value={seatsBooked}
                  // onChangeText={setSeatsBooked}
                  onChangeText={(value) => {
  setSeatsBooked(value);
  calculateTotal(tripId, value);
}}

                  keyboardType="numeric"
                  placeholderTextColor={COLORS.placeholderText}
                />
              </View>
            </View>

            {tripId && seatsBooked ? (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 16, fontWeight: "bold", color: COLORS.success }}>
      Total Price: ${totalPrice.toFixed(2)}
    </Text>
  </View>
) : null}


            {/* Submit */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Confirm Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
