import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';

export default function CustomerProfileScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      try {
        const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/${id}`, {
          method: 'GET',
          headers: {
            // 'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
          },
        });
        const data = await response.json();
        console.log(data);
        if (response.ok) {
          setCustomerData(data);
        } else {
          Alert.alert('Lỗi', 'Không thể tải thông tin khách hàng');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin khách hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D3D47" />
      </View>
    );
  }

  if (!customerData) {
    return (
      <View style={styles.centered}>
        <Text>Không có dữ liệu khách hàng</Text>
      </View>
    );
  }

  const { customer, vehicles } = customerData;

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
        <Text style={styles.infoText}>Tên: {customer.name}</Text>
        <Text style={styles.infoText}>Email: {customer.email}</Text>
        <Text style={styles.infoText}>Số điện thoại: {customer.phone_number}</Text>
        <Text style={styles.infoText}>Địa chỉ: {customer.address}</Text>
        <Text style={styles.infoText}>Hạng khách hàng: {customer.customer_rank_id.rank_name}</Text>
        <Text style={styles.infoText}>Mức giảm giá: {customer.customer_rank_id.discount_rate}%</Text>
        <Text style={styles.infoText}>Tổng chi tiêu: {customer.total_spending} VND</Text>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Thông tin xe</ThemedText>
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <View key={vehicle._id} style={styles.vehicleContainer}>
              <Text style={styles.infoText}>Biển số: {vehicle.license_plate}</Text>
              <Text style={styles.infoText}>Loại xe: {vehicle.vehicle_type_id.vehicle_type_name}</Text>
              <Text style={styles.infoText}>Nhà sản xuất: {vehicle.manufacturer}</Text>
              <Text style={styles.infoText}>Mẫu xe: {vehicle.model}</Text>
              <Text style={styles.infoText}>Màu sắc: {vehicle.color}</Text>
              <Text style={styles.infoText}>Năm sản xuất: {vehicle.year}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>Không có thông tin xe</Text>
        )}
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
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  vehicleContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
