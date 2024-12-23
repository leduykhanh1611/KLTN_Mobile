import { ImageBackground, Image, StyleSheet, Platform, Alert, View, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Picker } from '@react-native-picker/picker';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { router } from 'expo-router';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function HomeScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [vehicleTypeData, setVehicleTypeData] = useState(null);
  const [priceData, setPriceData] = useState([]); // Initialize as an empty array
  const [filteredData, setFilteredData] = useState([]);
  const [promotionData, setPromotionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [appointments, setAppointments] = useState([]); // All appointments
  const [processingCount, setProcessingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Function to calculate remaining days until end_date
  const calculateRemainingDays = (endDate) => {
    const currentDate = new Date();
    const end = new Date(endDate);
    const timeDiff = end - currentDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  };

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
      const data = await response.json();
      await AsyncStorage.setItem('idCus', data?.customer._id);
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


      const data = await response.json();
      setVehicleTypeData(data);
    }
    catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin loại xe');
    }
  };
  const fetchPriceData = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/prices/filterprice/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPriceData(data || []); // Ensure data is an array
      setFilteredData(data || []); // Initially show all data
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin giá tham khảo');
    }
  };
  // Fetch promotions from API
  const fetchPromotionData = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/promotions/mobile/getAll/lines', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setPromotionData(data);
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải thông tin khuyến mãi');
    }
  };
  const filterData = () => {
    if (priceData && priceData.length > 0) { // Check if priceData has data
      const filtered = priceData.filter(item =>
        (vehicleTypeFilter ? item.vehicle_type === vehicleTypeFilter : true) &&
        (serviceFilter ? item.service === serviceFilter : true)
      );
      setFilteredData(filtered);
    }
  };
  const fetchAppointments = async () => {
    const idCus = await AsyncStorage.getItem('idCus');
    const token = await AsyncStorage.getItem('token');

    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/appointments/mobile/appointment/customer/${idCus}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();

      // Phân loại lịch hẹn
      const processingAppointments = data.filter(app => app.status === 'waiting');
      const completedAppointments = data.filter(app => app.status === 'completed');

      // Cập nhật trạng thái
      setAppointments(data);
      if (data.length === 0) {
        setProcessingCount(0);
        setCompletedCount(0);
        return;
      }
      setProcessingCount(processingAppointments.length);
      setCompletedCount(completedAppointments.length);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterData();
  }, [vehicleTypeFilter, serviceFilter]);

  useEffect(() => {
    fetchCustomerData(); // Gọi lần đầu tiên ngay lập tức
    fetchAllService();
    fetchAllVehicleTypes();
    fetchPriceData();
    fetchPromotionData();
    fetchAppointments();
    const intervalId = setInterval(() => {
      fetchCustomerData();
      fetchAllService();
      fetchAllVehicleTypes();
      fetchPromotionData();
      fetchAppointments();
    }, 15000);

    // Dọn dẹp interval khi component bị hủy
    return () => clearInterval(intervalId);
  }, []);
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAppointment = () => {
    router.push('/(tabs)/explore');
  };
  const handleHistory = () => {
    router.push('/(tabs)/AppointmentListScreen');
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
        <View style={styles.headerBackground}>
          <View style={styles.headerOverlay}>
            {/* <View style={styles.profileImageContainer}>
              <TabBarIcon name="person" color="#fff" size={40} />
            </View> */}

            {/* Thêm phần đếm số lịch hẹn */}
            <View style={styles.counterRow}>
              <TouchableOpacity
                onPress={() => handleHistory()}
                style={styles.counter}>
                <Text style={styles.counterLabel}>Đang xử lý</Text>
                <Text style={styles.counterValue}>{processingCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleHistory()}
                style={styles.counter}>
                <Text style={styles.counterLabel}>Đã hoàn thành</Text>
                <Text style={styles.counterValue}>{completedCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Phần thông tin khách hàng */}
            <View style={styles.name}>
              <Text style={styles.nameText}>
                {customerData?.customer?.name || 'Loading...'}
              </Text>
              <Text style={styles.rankText}>
                Hạng: {customerData?.customer.customer_rank_id?.rank_name || 'Loading...'}
              </Text>
              <Text style={styles.spendingText}>
                Đã chi: {formatPrice(customerData.customer.total_spending)}
              </Text>
            </View>
          </View>
        </View>
      }>


      {/* Phần Khuyến mãi */}
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="gift" color="#FF6347" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Chương trình khuyến mãi</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotionScroll}>
          {promotionData && promotionData.map((promotion) => {
            const remainingDays = calculateRemainingDays(promotion.end_date);
            return (
              <TouchableOpacity key={promotion._id} style={styles.promotionCard}
                onPress={() => handleAppointment()}
              >
                <Image
                  source={require('@/assets/images/KM.jpg')}
                  style={styles.promotionImage}
                />

                <View style={styles.promotionContent}>
                  <Text style={styles.promotionDescription}>{promotion.description}</Text>
                  <View style={styles.remainingDaysBadge}>
                    <Text style={styles.remainingDaysText}>Còn {remainingDays} ngày</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ThemedView>

      {/* Phần Dịch vụ */}
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="briefcase" color="#4CAF50" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Dịch vụ</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceScroll}>
          {serviceData && serviceData.map((service) => (
            <TouchableOpacity key={service._id} style={styles.serviceCard}
              onPress={() => handleAppointment()}
            >
              <Image
                source={{ uri: service.image_url }}
                style={styles.serviceImage}
              />
              <View style={styles.serviceContent}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                <Text style={styles.serviceTime}>Thời gian: {service.time_required} phút</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Phần Loại Xe */}
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="car" color="#2196F3" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Loại xe thông dụng</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {vehicleTypeData && vehicleTypeData.map((vehicle) => (
            <View key={vehicle._id} style={styles.vehicleCard}>
              <Image
                source={{ uri: vehicle.image_url }}
                style={styles.vehicleImage}
              />
              <View style={styles.vehicleContent}>
                <Text style={styles.vehicleName}>{vehicle.vehicle_type_name}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Phần Bảng giá */}
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="pricetags" color="#FFA500" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Bảng giá hiện hành</ThemedText>
        </View>
      </ThemedView>

      {/* Bộ lọc */}
      <ThemedView style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TabBarIcon name="car" color="#2196F3" size={24} style={styles.filterIcon} />
          <Picker
            selectedValue={vehicleTypeFilter}
            onValueChange={(value) => setVehicleTypeFilter(value)}
            style={styles.picker}
            dropdownIconColor="#2196F3"
          >
            <Picker.Item label="Tất cả loại xe" value="" color='#2196F3' />
            {[...new Set(priceData.map(item => item.vehicle_type))].map(type => (
              <Picker.Item key={type} label={type} value={type} color='#2196F3' />
            ))}
          </Picker>
        </View>

        <View style={styles.filterRow}>
          <TabBarIcon name="pricetag" color="#FFA500" size={24} style={styles.filterIcon} />
          <Picker
            selectedValue={serviceFilter}
            onValueChange={(value) => setServiceFilter(value)}
            style={styles.picker}
            dropdownIconColor="#FFA500"
          >
            <Picker.Item label="Tất cả dịch vụ" value="" color='#FFA500' />
            {[...new Set(priceData.map(item => item.service))].map(service => (
              <Picker.Item key={service} label={service} value={service} color='#FFA500' />
            ))}
          </Picker>
        </View>
      </ThemedView>

      {/* Danh sách giá */}
      <ThemedView style={styles.priceContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filteredData.map(price => (
            <TouchableOpacity key={price.priceline_id} style={styles.priceCard}
              onPress={() => handleAppointment()}
            >
              <Text style={styles.serviceName}>Dịch vụ: {price.service}</Text>
              <Text style={styles.vehicleType}>Loại xe: {price.vehicle_type}</Text>
              <Text style={styles.priceAmount}>Giá: {formatPrice(price.price)}</Text>
              <Text style={styles.serviceTime}>Thời gian: {price.time_required} phút</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

    </ParallaxScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  // Styles cho Header
  headerBackground: {
    width: '100%',
    height: 260,
    justifyContent: 'flex-end',
    backgroundColor: '#1D3D47',
  },
  headerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 65,
    paddingHorizontal: 0,
  },
  profileImageContainer: {
    width: 80,
    height: 100,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 15,
  },
  counter: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    flex: 1,
    marginHorizontal: 5,
  },
  counterLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    alignItems: 'center',
  },
  nameText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rankText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginVertical: 5,
  },
  spendingText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  // Styles cho Khuyến mãi
  promotionScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
    marginBottom: -35,
  },
  promotionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 10,
    width: 250,
    overflow: 'hidden',
  },
  promotionImage: {
    width: '100%',
    height: 120,
  },
  promotionContent: {
    padding: 10,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  remainingDaysBadge: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  remainingDaysText: {
    fontSize: 12,
    color: '#fff',
  },
  // Styles cho Dịch vụ
  serviceScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
    marginBottom: -35,
  },
  serviceCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginRight: 10,
    width: 200,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 100,
  },
  serviceContent: {
    padding: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  serviceTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
  },
  // Styles cho Loại xe
  vehicleScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
    marginBottom: -35,
  },
  vehicleCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    marginRight: 10,
    width: 200,
    overflow: 'hidden',
  },
  vehicleImage: {
    width: '100%',
    height: 100,
  },
  vehicleContent: {
    padding: 10,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  // Styles cho Bộ lọc
  filterContainer: {
    padding: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: -35,
    marginTop: -20,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    width: '90%',
    
  },
  filterIcon: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  // Styles cho Bảng giá
  priceContainer: {
    paddingVertical: 10,
  },
  priceCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  vehicleType: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  priceAmount: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  // Các styles khác
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '110%',
  },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  iconSpacing: {
    marginRight: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },
});