import { Image, StyleSheet, Platform, Alert, View, ActivityIndicator, Text, ScrollView } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
export default function HomeScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [vehicleTypeData, setVehicleTypeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const id = await AsyncStorage.getItem('id');
      if (token !== null) {
        // Sử dụng token
        console.log('Token:', token);
        console.log('id:', id);
      }
    } catch (error) {
      console.error('Lỗi lấy token:', error);
    }
  };
  //api lấy thông tin khách hàng
  const fetchCustomerData = async () => {
    const token = await AsyncStorage.getItem('token');
    const id = await AsyncStorage.getItem('id');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/mobile/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
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
  // lấy tất cả dịch vụ từ api
  const fetchAllService = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/services', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        Alert.alert('Lỗi', 'Không thể tải thông tin dịch vụ');
        return;
      }

      const data = await response.json();
      setServiceData(data);
    }
    catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin dịch vụ');
    }
  };
  //lấy tất cả loại xe từ api
  const fetchAllVehicleTypes = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/vehicle-types', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        Alert.alert('Lỗi', 'Không thể tải thông tin các loại xe');
        return;
      }

      const data = await response.json();
      setVehicleTypeData(data);
    }
    catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin loại xe');
    }
  };
  useEffect(() => {

    fetchCustomerData(); // Gọi lần đầu tiên ngay lập tức
    fetchAllService();
    fetchAllVehicleTypes();
    const intervalId = setInterval(() => {
      fetchCustomerData();
      fetchAllService();
      fetchAllVehicleTypes();
    }, 15000);

    // Dọn dẹp interval khi component bị hủy
    return () => clearInterval(intervalId);
  }, []);



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
          <View style={[styles.profileImageContainer]}>
            <TabBarIcon name="person" color="#fff" size={40} />
          </View>
          <View style={styles.name}>
            <Text style={styles.nameText}>{customerData?.customer?.name || 'Loading...'}<HelloWave /></Text>
            <Text style={styles.nameText}>Hạng: {customerData?.customer.customer_rank_id?.rank_name || 'Loading...'}</Text>
            <Text style={styles.nameText}>Đã chi: {customerData.customer.total_spending} VND</Text>
          </View>
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="briefcase" color="#4CAF50" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Dịch vụ</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceScroll}>
          {serviceData && serviceData.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.serviceTime}>Thời gian: {service.time_required} phút</Text>
            </View>
          ))}
        </ScrollView>
      </ThemedView>

      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="car" color="#2196F3" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Loại xe thông dụng</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {vehicleTypeData && vehicleTypeData.map((vehicle) => (
            <View key={vehicle._id} style={styles.vehicleCard}>
              <Text style={styles.vehicleName}>{vehicle.vehicle_type_name}</Text>
              <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
            </View>
          ))}
        </ScrollView>
      </ThemedView>

      <Button onPress={getToken}>Get token</Button>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    // alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 50,
    position: 'absolute',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    top: 60,
    padding: 10,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'left', // Center the text
    margin: 8,
  },
  name: {
    marginLeft: 10,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  serviceScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  serviceCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  serviceTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  vehicleScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  vehicleCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10, // Optional: for spacing above and below the section title
  },
  iconSpacing: {
    marginRight: 8, // Adjust spacing as needed
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});