import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button, Card, Paragraph, TextInput, Title } from 'react-native-paper';
import Animated, { FadeInUp, FadeOutDown, Layout } from 'react-native-reanimated';
import { API_URL } from '../../constants/api';
import COLORS from '../../constants/color';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function Vehicles() {
  const [modalVisible, setModalVisible] = useState(false);
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [type, setType] = useState(null);
  const [userId, setUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const vehicleTypes = [
    { label: 'Car', value: 'Car' },
    { label: 'Land Cruiser', value: 'Land_Cruiser' },
    { label: 'Bus', value: 'Bus' },
    { label: 'Truck', value: 'Truck' },
    { label: 'Coaster', value: 'Coaster' },
  ];

  // Fetch owners
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/getAllVhecileOnwers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch owners');
      const data = await res.json();
      setUsers(
        data.map(u => ({ label: `${u.name} (${u.phone})`, value: u.id }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch vehicles
  const fetchRegisteredVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles/getAllVehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      setVehicleList(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRegisteredVehicles();
  }, []);

  const handleSubmit = async () => {
    if (!plateNumber || !model || !capacity || !type || !userId) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const method = editingVehicle ? 'PUT' : 'POST';
      const endpoint = editingVehicle
        ? `${API_URL}/vehicles/${editingVehicle.id}`
        : `${API_URL}/vehicles/registerVehicles`;
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plateNumber, model, capacity, type, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      Alert.alert('Success', editingVehicle ? 'Successfully Updated!' : 'Successfully Saved!');
      // Reset
      setPlateNumber(''); setModel(''); setCapacity(''); setType(null);
      setUserId(null); setEditingVehicle(null); setModalVisible(false);
      fetchRegisteredVehicles();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = v => {
    setEditingVehicle(v);
    setPlateNumber(v.plateNumber);
    setModel(v.model);
    setCapacity(String(v.capacity));
    setType(v.type);
    setUserId(v.userId);
    setModalVisible(true);
  };

  const handleDelete = id => {
    Alert.alert('Confirm', 'Delete this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await fetch(`${API_URL}/vehicles/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to delete');
          Alert.alert('Successfully deleted!');
          fetchRegisteredVehicles();
        } catch (e) { Alert.alert('Error', e.message); }
      } }
    ]);
  };

  // Render vehicle card
  const renderItem = ({ item, index }) => (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeInUp.delay(index * 50)}
      exiting={FadeOutDown}
      style={{ marginVertical: 8 }}
    >
      <Card elevation={4} style={{ borderRadius: 16,backgroundColor: COLORS.cardBackground, overflow: 'hidden' }}>
        <Card.Content>
          <Title style={{ color: COLORS.primary }}>{item.plateNumber}</Title>
          <Paragraph>Model: {item.model}</Paragraph>
          <Paragraph>Capacity: {item.capacity}</Paragraph>
          <Paragraph>Type: {item.type}</Paragraph>
          <Paragraph>Owner: {item.owner?.name || 'N/A'}</Paragraph>
        </Card.Content>
        <Card.Actions style={{ justifyContent: 'flex-end' }}>
          <Button icon="pencil" onPress={() => handleEdit(item)}>Edit</Button>
       <Button
  mode="outlined"
  onPress={() => handleDelete(item.id)}
  icon="delete"
  textColor="red"
  style={{
    borderColor: 'red',
    borderWidth: 1,
  }}
>
  Delete
</Button>

        </Card.Actions>
      </Card>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 16 }}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => setModalVisible(true)}
        style={{ borderRadius: 12, marginBottom: 16,backgroundColor: COLORS.primary }}
      >
        Add Vehicle
      </Button>

      <FlatList
        data={vehicleList}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Modal Form */}
  <Modal visible={modalVisible} animationType="slide" transparent>
  <View
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      padding: 24,
    }}
  >
    <KeyboardAvoidingView
      behavior="padding"
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.textDark,
          marginBottom: 20,
        }}
      >
        {editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}
      </Text>

      {/* Owner Picker */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            marginBottom: 6,
          }}
        >
          Owner *
        </Text>
        <DropDownPicker
          open={userOpen}
          value={userId}
          items={users}
          setOpen={setUserOpen}
          setValue={setUserId}
          placeholder="Select owner"
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 5,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: COLORS.background,
          }}
          dropDownContainerStyle={{
            borderColor: COLORS.border,
          }}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>

      {/* Plate Number */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            marginBottom: 6,
          }}
        >
          Plate Number *
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 5,
            paddingHorizontal: 4,
            // paddingVertical: 4,          
            backgroundColor: COLORS.background,
          }}
        >
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 0,
              paddingHorizontal: 1,
              color: COLORS.text,
              backgroundColor: 'transparent',
            }}
            placeholder="AH sss1090"
            placeholderTextColor={COLORS.placeholderText}
            value={plateNumber}
            onChangeText={setPlateNumber}
          />
        </View>
      </View>

      {/* Model */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            marginBottom: 6,
          }}
        >
          Model *
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 5,
            paddingHorizontal: 12,
            backgroundColor: COLORS.background,
          }}
        >
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{
              flex: 1,
                          paddingVertical: 0,
              paddingHorizontal: 1,
              color: COLORS.text,
              backgroundColor: 'transparent',
            }}
            placeholder="Land Cruiser 2020 V"
            placeholderTextColor={COLORS.placeholderText}
            value={model}
            onChangeText={setModel}
          />
        </View>
      </View>

      {/* Capacity */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            marginBottom: 6,
          }}
        >
          Capacity *
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 5,
            paddingHorizontal: 12,
            backgroundColor: COLORS.background,
          }}
        >
          <Ionicons
            name="pricetag-outline"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{
              flex: 1,
                           paddingVertical: 0,
              paddingHorizontal: 1,
              color: COLORS.text,
              backgroundColor: 'transparent',
            }}
            placeholder="12"
            placeholderTextColor={COLORS.placeholderText}
            value={capacity}
            onChangeText={setCapacity}
          />
        </View>
      </View>

      {/* Type Picker */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.textDark,
            marginBottom: 6,
          }}
        >
          Type *
        </Text>
        <DropDownPicker
          open={typeOpen}
          value={type}
          items={vehicleTypes}
          setOpen={setTypeOpen}
          setValue={setType}
          placeholder="Select type"
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 5,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: COLORS.background,
          }}
          dropDownContainerStyle={{
            borderColor: COLORS.border,
          }}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: COLORS.primary,
          paddingVertical: 12,
          borderRadius: 12,
          marginTop: 10,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: '#fff',
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              {editingVehicle ? 'Save' : 'Register'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Close Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={{ marginTop: 12, marginBottom:15, alignSelf: 'center' }}
      >
        <Text
          style={{
            color: COLORS.secondary,
            fontSize: 16,
          }}
        >
          Close
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </View>
</Modal>


    </View>
  );
}
