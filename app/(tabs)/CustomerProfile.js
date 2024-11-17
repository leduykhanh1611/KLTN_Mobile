import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Dimensions, TouchableWithoutFeedback } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { ThemedView } from '@/components/ThemedView';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function CustomerProfile() {
  const [customerData, setCustomerData] = useState(null);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type_id: '',
    license_plate: '',
    manufacturer: '',
    model: '',
    year: '',
    color: '',
  });
  const rankColors = {
    Đồng: '#CD7F32',
    Bạc: '#C0C0C0',
    Vàng: '#FFD700',
  };
  // Lấy thông tin khách hàng từ api
  const fetchCustomerData = async () => {
    const token = await AsyncStorage.getItem('token');
    const id = await AsyncStorage.getItem('id');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/mobile/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Lỗi lấy thông tin khách hàng');
      const data = await response.json();
      await AsyncStorage.setItem('idCus', data.customer._id);
      setCustomerData(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Lỗi lấy thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };
  // lấy tất cả loại xe từ api
  const fetchVehicleTypes = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/vehicle-types', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch vehicle types');
      const data = await response.json();
      setVehicleTypes(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load vehicle types');
    }
  };
  // thực hiện thêm xe
  const handleAddVehicle = () => {
    setNewVehicle({
      vehicle_type_id: '',
      license_plate: '',
      manufacturer: '',
      model: '',
      year: '',
      color: '',
    });
    setModalVisible(true);
    setIsUpdating(false);
    fetchVehicleTypes();
  };
  // call api cập nhật hoặc thêm xe
  const submitVehicle = async () => {
    const token = await AsyncStorage.getItem('token');
    const customerId = await AsyncStorage.getItem('idCus');
    const url = isUpdating
      ? `https://host-rose-sigma.vercel.app/api/vehicles/${customerId}/vehicles/${selectedVehicleId}`
      : `https://host-rose-sigma.vercel.app/api/vehicles/${customerId}/vehicles`;

    try {
      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVehicle),
      });

      if (response.ok) {
        Alert.alert('Thành công', isUpdating ? 'Cập nhật thông tin xe thành công' : 'Thêm xe mới thành công');
        setModalVisible(false);
        fetchCustomerData(); // Refresh to include the new or updated vehicle
      } else {
        throw new Error(isUpdating ? 'Lỗi khi cập nhật thông tin xe' : 'Lỗi khi thêm xe mới');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', isUpdating ? 'Lỗi cập nhật thông tin xe' : 'Lỗi khi thêm xe mới');
    }
  };

  useEffect(() => {
    fetchCustomerData();
    // const intervalId = setInterval(() => {
    //   fetchCustomerData();
    // }, 15000);
    // // Dọn dẹp interval khi component bị hủy
    // return () => clearInterval(intervalId);
  }, []);
  // cập nhật thông tin khách hàng
  const handleUpdateCustomer = async () => {
    const token = await AsyncStorage.getItem('token');
    const idCus = await AsyncStorage.getItem('idCus');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/${idCus}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerData.customer.name,
          phone_number: customerData.customer.phone_number,
          address: customerData.customer.address,
        }),
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
  // xóa xe
  const deleteVehicle = async (vehicleId) => {
    const token = await AsyncStorage.getItem('token');
    const customerId = await AsyncStorage.getItem('idCus');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/vehicles/${customerId}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        Alert.alert('Thành công', 'Xóa xe thành công');
        fetchCustomerData(); // Refresh list after deletion
      } else {
        throw new Error('Xóa xe thất bại');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Lỗi xóa xe');
    }
  };
  // xác nhận xóa xe
  const confirmDeleteVehicle = (vehicleId) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có muốn xóa thông tin xe này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deleteVehicle(vehicleId) },
      ]
    );
  };
  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/auth/login');
  };
  if (loading || !customerData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D3D47" />
      </View>
    );
  }
  // Format ngày thành dd/mm/yyyy
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month starts from 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  // Chỉnh sửa thông tin xe
  const handleEditVehicle = (vehicle) => {
    setNewVehicle({
      vehicle_type_id: vehicle.vehicle_type_id._id,
      license_plate: vehicle.license_plate,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
    });
    setSelectedVehicleId(vehicle._id);
    setModalVisible(true);
    setIsUpdating(true);
    fetchVehicleTypes();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.profileImageContainer,
              { borderColor: rankColors[customerData.customer.customer_rank_id.rank_name] || '#CD7F32' },
            ]}
          >
            <TabBarIcon name="person" color="#fff" size={40} />
          </View>
          <Text style={styles.nameText}>{customerData.customer.name}</Text>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Thông tin cá nhân</ThemedText>

        {editingCustomer ? (
          <View>
            <TextInput
              placeholder="Tên"
              value={customerData.customer.name}
              onChangeText={(text) => setCustomerData({ ...customerData, customer: { ...customerData.customer, name: text } })}
              style={styles.input}
            />
            <TextInput
              placeholder="Số điện thoại"
              value={customerData.customer.phone_number}
              onChangeText={(text) => setCustomerData({ ...customerData, customer: { ...customerData.customer, phone_number: text } })}
              style={styles.input}
            />
            <TextInput
              placeholder="Địa chỉ"
              value={customerData.customer.address}
              onChangeText={(text) => setCustomerData({ ...customerData, customer: { ...customerData.customer, address: text } })}
              style={styles.input}
            />
            <Text style={styles.infoText}>Email: {customerData.customer.email}</Text>
            <Button mode="contained" onPress={handleUpdateCustomer} style={styles.saveButton}>
              Lưu
            </Button>
          </View>
        ) : (
          <View>
            <ThemedText type="title" style={styles.infoText}>Điện thoại: {customerData.customer.phone_number}</ThemedText>
            <ThemedText type="title" style={styles.infoText}>Địa chỉ: {customerData.customer.address}</ThemedText>
            <ThemedText type="title" style={styles.infoText}>Email: {customerData.customer.email}</ThemedText>
            <ThemedText type="title" style={styles.infoText}>Mức chi tiêu: {customerData.customer.total_spending}VND</ThemedText>
            <ThemedText type="title" style={styles.infoText}>Ngày tạo: {formatDate(customerData.customer.created_at)}</ThemedText>
            <Button mode="contained" onPress={() => setEditingCustomer(true)} style={styles.editButton}>
              Chỉnh sửa
            </Button>
          </View>
        )}
      </ScrollView>

      <ThemedView style={styles.titleContainer}>
        <View style={styles.service}>
          <TabBarIcon name="car" color="#2196F3" size={24} style={styles.iconSpacing} />
          <ThemedText type="subtitle" style={styles.titleText}>Xe của tôi</ThemedText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
          {customerData.vehicles && customerData.vehicles.map((vehicle) => (
            <View key={vehicle._id} style={styles.vehicleCard}>
              <View style={styles.vehicleInfoContainer}>
                <Text style={styles.vehicleName}>Loại xe: {vehicle.vehicle_type_id?.vehicle_type_name}</Text>
                <Text style={styles.vehicleDescription}>Biển số: {vehicle.license_plate}</Text>
                <Text style={styles.vehicleDescription}>Màu xe: {vehicle.color}</Text>
                <Text style={styles.vehicleDescription}>Hãng xe: {vehicle.manufacturer}</Text>
                <Text style={styles.vehicleDescription}>Năm sản xuất: {vehicle.year}</Text>
              </View>

              {/* Buttons Container */}
              <View style={styles.actionButtonContainer}>
                <TouchableOpacity onPress={() => confirmDeleteVehicle(vehicle._id)} style={styles.deleteButton}>
                  <TabBarIcon name="trash" color="#FF6347" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditVehicle(vehicle)} style={styles.updateButton}>
                  <TabBarIcon name="create" color="#FFA500" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Vehicle Button */}
          <TouchableOpacity style={styles.addVehicleCard} onPress={handleAddVehicle}>
            <TabBarIcon name="add-circle" color="#4CAF50" size={24} />
            <Text style={styles.addVehicleText}>Thêm xe mới</Text>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
      <Button mode="contained" onPress={() => handleLogout()} style={styles.logout}>
        Đăng xuất
      </Button>
      {/* Add or Update Vehicle Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>{isUpdating ? 'Cập nhật xe' : 'Thêm xe mới'}</ThemedText>
            <Picker
              selectedValue={newVehicle.vehicle_type_id}
              onValueChange={(value) => setNewVehicle({ ...newVehicle, vehicle_type_id: value })}
            >
              {vehicleTypes.map((type) => (
                <Picker.Item key={type._id} label={type.vehicle_type_name} value={type._id} />
              ))}
            </Picker>
            <TextInput
              placeholder="Biển số xe"
              value={newVehicle.license_plate}
              placeholderTextColor={'#666'}
              style={styles.input}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, license_plate: text })}
              editable={!isUpdating} // Không cho phép chỉnh sửa nếu là cập nhật
            />
            <TextInput
              placeholder="Hãng xe"
              value={newVehicle.manufacturer}
              placeholderTextColor={'#666'}
              style={styles.input}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, manufacturer: text })}
            />
            <TextInput
              placeholder="Mẫu xe"
              value={newVehicle.model}
              placeholderTextColor={'#666'}
              style={styles.input}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, model: text })}
            />
            <TextInput
              placeholder="Năm sản xuất"
              value={newVehicle.year ? newVehicle.year.toString() : ''}
              placeholderTextColor={'#666'}
              style={styles.input}
              keyboardType="numeric"
              onChangeText={(text) => setNewVehicle({ ...newVehicle, year: parseInt(text) })}
            />
            <TextInput
              placeholder="Màu sắc"
              value={newVehicle.color}
              placeholderTextColor={'#666'}
              style={styles.input}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, color: text })}
            />
            <Button mode="contained" onPress={submitVehicle} style={styles.saveButton}>{isUpdating ? 'Cập nhật' : 'Lưu'}</Button>
            <Button onPress={() => setModalVisible(false)} style={styles.cancelButton}>Hủy</Button>
          </ScrollView>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </ParallaxScrollView>
  );
}
const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    top: 40,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3, // Border width for rank color
    marginBottom: 10,
  },
  nameText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 10,
  },
  container: {
    padding: 20,
    backgroundColor: '#1D3D47',
    borderRadius: 18,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 10,
  },

  saveButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    marginTop: 10,
  },
  addVehicleCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
  },
  addVehicleText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  vehicleCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 200,
    flexDirection: 'row', // Horizontal layout for main card
    alignItems: 'center',
    flex: 1,
  },
  actionButtonContainer: {
    flexDirection: 'column', // Stack buttons vertically
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    left: 20,
    bottom: 85,
    flex: 0.5,
  },
  vehicleInfoContainer: {
    flex: 1,
    flexWrap: 'nowrap', // Prevents line wrapping for text
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    marginBottom: 10
  },
  updateButton: {
    position: 'absolute',
    top: 10,
    right: 40,
    marginRight: 10
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'column',
    // justifyContent: 'space-between', // Align buttons to the right
    marginTop: 10,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    top: 80,
    borderRadius: 8,
    width: width * 0.8,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4CAF50',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 8,
    width: '100%',
  },
  logout: {
    marginTop: 20,
    backgroundColor: '#FF6347',
  },
});
