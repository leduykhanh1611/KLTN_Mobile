import { Image, StyleSheet, Platform, Alert, View, ActivityIndicator, Text, ScrollView } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Picker } from '@react-native-picker/picker';

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
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        Alert.alert('Lỗi', 'Không thể tải thông tin khuyến mãi');
        return;
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

  useEffect(() => {
    filterData();
  }, [vehicleTypeFilter, serviceFilter]);

  useEffect(() => {
    fetchCustomerData(); // Gọi lần đầu tiên ngay lập tức
    fetchAllService();
    fetchAllVehicleTypes();
    fetchPriceData();
    fetchPromotionData();
    const intervalId = setInterval(() => {
      fetchCustomerData();
      fetchAllService();
      fetchAllVehicleTypes();
      fetchPromotionData();
    }, 15000);

    // Dọn dẹp interval khi component bị hủy
    return () => clearInterval(intervalId);
  }, []);
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
      {/* Promotions Section */}
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="gift" color="#FF6347" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Chương trình khuyến mãi</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotionScroll}>
          {promotionData && promotionData.map((promotion) => {
            const remainingDays = calculateRemainingDays(promotion.end_date);
            return (
              <View key={promotion._id} style={styles.promotionCard}>
                <Text style={styles.promotionDescription}>{promotion.description}</Text>
                <View style={styles.remainingDaysBadge}>
                  <Text style={styles.remainingDaysText}>Còn {remainingDays} ngày </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </ThemedView>
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
      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="pricetags" color="#FFA500" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Bảng giá hiện hành</ThemedText>
        </View>
      </ThemedView>
      <ThemedView style={styles.filterContainer}>
        <ThemedText type="subtitle">Loại xe:</ThemedText>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vehicleTypeFilter}
            onValueChange={(value) => setVehicleTypeFilter(value)}
            style={styles.picker}
          >
            <Picker.Item label="All" value="" />
            {[...new Set(priceData.map(item => item.vehicle_type))].map(type => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <ThemedText type="subtitle">Tên dịch vụ:</ThemedText>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={serviceFilter}
            onValueChange={(value) => setServiceFilter(value)}
            style={styles.picker}
          >
            <Picker.Item label="All" value="" />
            {[...new Set(priceData.map(item => item.service))].map(service => (
              <Picker.Item key={service} label={service} value={service} />
            ))}
          </Picker>
        </View>
      </ThemedView>
      
      <ThemedView style={styles.priceContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filteredData.map(price => (
            <View key={price.priceline_id} style={styles.priceCard}>
              <Text style={styles.serviceName}>Dịch vụ: {price.service}</Text>
              <Text style={styles.vehicleType}>Loại xe: {price.vehicle_type}</Text>
              <Text style={styles.priceAmount}>Giá: {formatPrice(price.price)} VND</Text>
              <Text style={styles.serviceTime}>Thời gian: {price.time_required} phút</Text>
            </View>
          ))}
        </ScrollView>
      </ThemedView>
      {/* <Button onPress={getToken}>Get token</Button> */}
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
  priceScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  priceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  vehicleType: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  priceAmount: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  promotionScroll: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  promotionCard: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
    marginTop: 8,
  },
  remainingDaysText: {
    fontSize: 12,
    color: '#fff',

  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    padding: 10,
    alignItems: 'center', // Center-align content horizontally
    width: '100%',
  },
  pickerContainer: {
    width: '90%', // Adjust width for alignment within the filter container
    marginVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  picker: {
    height: 50,
    width: '100%', // Set width to fill the container
    bottom: 82, // Align picker to the bottom of the container
  },
  priceCard: { padding: 10, marginHorizontal: 5, backgroundColor: '#f9f9f9', borderRadius: 8, width: 200 },
  serviceName: { fontWeight: 'bold' },
  vehicleType: { color: '#333' },
  priceAmount: { color: '#888' },
  serviceTime: { color: '#888' },
});
