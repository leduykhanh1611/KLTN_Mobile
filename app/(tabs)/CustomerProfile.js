import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';

export default function CustomerProfileScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    license_plate: '',
    vehicle_type_name: '',
    manufacturer: '',
    model: '',
    year: '',
    color: '',
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      try {
        const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/mobile/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, 
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error Response:', errorText);
          Alert.alert('Lỗi', 'Không thể tải thông tin khách hàng');
          return;
        }

        const data = await response.json();
        await AsyncStorage.setItem('idCus', data.customer._id);
        setCustomerData(data);
      } catch (error) {
        console.error('Fetch Error:', error);
        Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin khách hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const handleUpdateCustomer = async () => {
    const token = await AsyncStorage.getItem('token');
    const idCus = await AsyncStorage.getItem('idCus');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/${idCus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData.customer),
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công');
        setEditingCustomer(false);
      } else {
        Alert.alert('Lỗi', 'Cập nhật thông tin không thành công');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật thông tin');
    }
  };

  const handleAddVehicle = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newVehicle, customer_id: customerData.customer._id }),
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Xe đã được thêm thành công');
        setNewVehicle({ license_plate: '', vehicle_type_name: '', manufacturer: '', model: '', year: '', color: '' });
      } else {
        Alert.alert('Lỗi', 'Không thể thêm xe');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm xe');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Xe đã được xóa');
      } else {
        Alert.alert('Lỗi', 'Không thể xóa xe');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xóa xe');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D3D47" />
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.headerText}>Thông tin Khách hàng</ThemedText>
        </View>
      }>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Thông tin cá nhân</ThemedText>
        
        {editingCustomer ? (
          <View>
            <TextInput placeholder="Tên" value={customerData.customer.name} onChangeText={(text) => setCustomerData({ ...customerData, customer: { ...customerData.customer, name: text } })} style={styles.input} />
            <TextInput placeholder="Email" value={customerData.customer.email} onChangeText={(text) => setCustomerData({ ...customerData, customer: { ...customerData.customer, email: text } })} style={styles.input} />
            <Button title="Lưu" onPress={handleUpdateCustomer} />
          </View>
        ) : (
          <View>
            <Text>Tên: {customerData.customer.name}</Text>
            <Text>Email: {customerData.customer.email}</Text>
            <Text>Số điện thoại: {customerData.customer.phone_number}</Text>
            <Text>Địa: {customerData.customer.address}</Text>
            <Button title="Chỉnh sửa" onPress={() => setEditingCustomer(true)} />
          </View>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Thêm Xe</ThemedText>
        <TextInput placeholder="Biển số" value={newVehicle.license_plate} onChangeText={(text) => setNewVehicle({ ...newVehicle, license_plate: text })} style={styles.input} />
        <Button title="Thêm Xe" onPress={handleAddVehicle} />

        <ThemedText type="subtitle" style={styles.sectionTitle}>Danh sách xe</ThemedText>
        {customerData.vehicles.map((vehicle) => (
          <View key={vehicle._id} style={styles.vehicleContainer}>
            <Text>Biển số: {vehicle.license_plate}</Text>
            <Button title="Xóa" onPress={() => handleDeleteVehicle(vehicle._id)} />
          </View>
        ))}
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  headerText: {
    fontSize: 24,
    color: 'white',
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    marginBottom: 15,
    borderBottomWidth: 1,
    padding: 10,
  },
  vehicleContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
