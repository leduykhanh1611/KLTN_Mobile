import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Alert, TouchableWithoutFeedback, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function TabTwoScreen() {
  const [loading, setLoading] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalTimeRequired, setTotalTimeRequired] = useState(0);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState(null);
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Fetch customer data to get vehicles
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
      Alert.alert('Error', 'Lỗi lấy thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };


  const handleDateTimeChange = (event, date) => {
    setDateTimePickerVisible(false);
    if (date) {
      setSelectedDateTime(date);

      // Calculate estimated completion time
      const completionTime = new Date(date.getTime() + totalTimeRequired * 60000); // Convert minutes to milliseconds
      setEstimatedCompletionTime(completionTime);

      // Format the date and time
      const formattedDateTime = formatDateTime(completionTime);
      console.log("Estimated Completion Time:", formattedDateTime); // For testing purposes
    }
  };

  // Function to format date and time as "HH:mm dd/MM/yyyy"
  const formatDateTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };
  // Fetch services based on the selected vehicle type
  const fetchServices = async () => {
    if (!selectedVehicle) {
      Alert.alert('Lỗi', 'Vui lòng chọn xe cần chăm sóc');
      return;
    }

    const vehicleTypeName = selectedVehicle.vehicle_type_id.vehicle_type_name;
    setLoading(true);
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/prices/filterprice/?vehicleTypeName=${vehicleTypeName}`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Lỗi lấy thông tin dịch vụ');
    } finally {
      setLoading(false);
      setServiceModalVisible(true);
    }
  };
  const confirmAppointment = async () => {
    if (!selectedVehicle || selectedServices.length === 0 || !selectedDateTime) {
      Alert.alert('Lỗi', 'Vui lòng hoàn thành tất cả các bước trước khi xác nhận');
      return;
    }

    const serviceIds = selectedServices.map(service => service.priceline_id);
    const appointmentData = {
      vehicle_id: selectedVehicle._id,
      service_ids: serviceIds,
      appointment_datetime: selectedDateTime.toISOString(),
    };

    setLoading(true);
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/appointments/without-slot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
        },
        body: JSON.stringify(appointmentData),
      });
      if (response.status === 408) {
        Alert.alert('Đặt lịch thất bại', 'Xe của bạn đã có lịch hẹn');
      }
      if (response.ok) {
        const responseData = await response.json();
        const appointmentId = responseData._id || responseData.appointment._id; // Adjust based on actual response structure
        setAppointmentId(appointmentId);

        // Generate invoice
        await handleGenerateInvoice(appointmentId);

        // Alert.alert('Thành công', 'Lịch hẹn của bạn đã được đặt thành công và hóa đơn đã được tạo');
      } else {
        throw new Error('Failed to confirm appointment');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Không thể đặt lịch hẹn');
    } finally {
      setLoading(false);
      setSelectedVehicle(null);
      setSelectedServices([]);
      setTotalTimeRequired(0);
      setSelectedDateTime(null);
      setEstimatedCompletionTime(null);
    }
  };

  // Handle selection of a vehicle
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleModalVisible(false);
    // bỏ những dịch vụ đã chọn khi chọn xe mới
    setSelectedServices([]);
    setTotalTimeRequired(0);

  };

  // Handle service selection
  const handleSelectService = (service) => {
    const alreadySelected = selectedServices.some(selected => selected.priceline_id === service.priceline_id);
    let updatedServices;
    if (alreadySelected) {
      updatedServices = selectedServices.filter(selected => selected.priceline_id !== service.priceline_id);
    } else {
      updatedServices = [...selectedServices, service];
    }
    setSelectedServices(updatedServices);
    calculateTotalTime(updatedServices);
  };

  // Calculate total time for selected services
  const calculateTotalTime = (services) => {
    const total = services.reduce((acc, service) => acc + service.time_required, 0);
    setTotalTimeRequired(total);
  };

  const handleGenerateInvoice = async (appointmentId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/payments/generate-invoice/${appointmentId}/employee/6707e7ecd6e37f3cfa5e4ce8`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.invoice) {
        setInvoiceDetails(result.invoice);
        setModalVisible(true);
      } else {
        Alert.alert('Lỗi', result.msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Máy chủ không phản hồi');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Hàm định dạng ngày giờ
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };
  const handleCreatePaymentLink = async (invoiceId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/payments/mobile/create-payment-link/${invoiceId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.paymentLink) {
        Linking.openURL(result.paymentLink.checkoutUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo liên kết thanh toán');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Máy chủ không phản hồi');
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Đặt lịch</Text>

        {/* Step 1: Choose Vehicle */}
        <View style={styles.stepContainer}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.stepTitle}>Chọn xe cần chăm sóc</Text>
          </View>
          <TouchableOpacity style={styles.option} onPress={() => setVehicleModalVisible(true)}>
            <TabBarIcon name="car" size={24} color="gray" />
            <Text style={styles.optionText}>
              {selectedVehicle ? `${selectedVehicle.license_plate} - ${selectedVehicle.manufacturer} - ${selectedVehicle.color}` : 'Xem tất cả xe của bạn'}
            </Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Step 2: Choose Services */}
        <View style={styles.stepContainer}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.stepTitle}>Chọn dịch vụ</Text>
          </View>
          <TouchableOpacity style={styles.option} onPress={fetchServices}>
            <TabBarIcon name="briefcase" size={24} color="gray" />
            <Text style={styles.optionText}>Xem tất cả dịch vụ hấp dẫn</Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Selected Services and Total Time */}
        {selectedServices.length > 0 && (
          <View style={styles.selectedServicesContainer}>
            <Text style={styles.selectedServicesTitle}>Dịch vụ đã chọn:</Text>
            {selectedServices.map((service) => (
              <Text key={service.priceline_id} style={styles.selectedServiceText}>
                {service.service} - {service.time_required} phút
              </Text>
            ))}
            <Text style={styles.totalTimeText}>Tổng thời gian: {totalTimeRequired} phút</Text>
          </View>
        )}
        {/* Step 3: Choose Date and Time */}
        <View style={styles.stepContainer}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.stepTitle}>Chọn ngày, giờ</Text>
          </View>
          <TouchableOpacity style={styles.option} onPress={() => {
            if (selectedServices.length === 0) {
              Alert.alert('Lỗi', 'Vui lòng chọn dịch vụ trước khi chọn ngày và giờ');
            } else {
              setDateTimePickerVisible(true);
            }
          }}>
            <MaterialIcons name="calendar-today" size={24} color="gray" />
            <Text style={styles.optionText}>
              {selectedDateTime ? selectedDateTime.toLocaleString() : 'Chọn ngày, giờ'}
            </Text>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="gray" />
          </TouchableOpacity>
          {estimatedCompletionTime && (
            <Text style={styles.completionTimeText}>
              Dự kiến hoàn thành lúc {formatDateTime(estimatedCompletionTime)}
            </Text>

          )}
        </View>

        {/* DateTimePicker Modal */}
        {dateTimePickerVisible && (
          <DateTimePicker
            value={selectedDateTime || new Date()}
            mode="datetime"
            display="default"
            onChange={handleDateTimeChange}
          />
        )}
        <TouchableOpacity
          style={[styles.confirmButton, (selectedVehicle && selectedServices.length > 0 && selectedDateTime) ? styles.confirmButtonEnabled : styles.confirmButtonDisabled]}
          onPress={confirmAppointment}
          disabled={!(selectedVehicle && selectedServices.length > 0 && selectedDateTime)}
        >
          <Text style={styles.confirmButtonText}>XÁC NHẬN LỊCH HẸN</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingOverlay} />}
        <Text style={styles.footerText}>Chăm sóc xong trả tiền, hủy lịch không sao</Text>
        <Text style={styles.footerText}>Hãy đến đúng giờ để tận hưởng dịch vụ của chúng tôi</Text>


      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal visible={vehicleModalVisible} animationType="slide" transparent={true}>

        <TouchableWithoutFeedback onPress={() => setVehicleModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn xe của bạn</Text>
              <ScrollView>
                {customerData?.vehicles?.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle._id}
                    style={styles.vehicleOption}
                    onPress={() => handleSelectVehicle(vehicle)}
                  >
                    <Text style={styles.vehicleOptionText}>{vehicle.license_plate} - {vehicle.vehicle_type_id?.vehicle_type_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setVehicleModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Service Selection Modal */}
      <Modal visible={serviceModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setServiceModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn dịch vụ</Text>
              <ScrollView>
                {services.map((service) => {
                  const isSelected = selectedServices.some(selected => selected.priceline_id === service.priceline_id);
                  return (
                    <TouchableOpacity
                      key={service.priceline_id}
                      style={styles.serviceOption}
                      onPress={() => handleSelectService(service)}
                    >
                      <View style={styles.serviceOptionContent}>
                        <Text style={styles.serviceOptionText}>Dịch vụ: {service.service}</Text>
                        <Text style={styles.serviceOptionText}>Giá: {service.price} VND</Text>
                        <Text style={styles.serviceOptionText}>Thời gian ước tính: {service.time_required} phút</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="green" style={styles.checkmarkIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity onPress={() => setServiceModalVisible(false)} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Invoice Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.invoiceModalContainer}>
          <View style={styles.invoiceModalContent}>
            {invoiceDetails ? (
              <ScrollView contentContainerStyle={styles.invoiceContainer}>
                {/* Invoice Header */}
                <View style={styles.invoiceHeader}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.invoiceLogo}
                  />
                  <Text style={styles.invoiceTitle}>CHI TIẾT</Text>
                </View>

                {/* Customer and Invoice Details */}
                <View style={styles.invoiceSection}>
                  <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tên:</Text>
                    <Text style={styles.detailValue}>{invoiceDetails.customer_id.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{invoiceDetails.customer_id.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ:</Text>
                    <Text style={styles.detailValue}>{invoiceDetails.customer_id.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailValue}>{invoiceDetails.customer_id.phone_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Thời gian đặt lịch:</Text>
                    <Text style={styles.detailValue}>{formatDate(invoiceDetails.created_at)}</Text>
                  </View>
                </View>

                {/* Services Details */}
                <View style={styles.invoiceSection}>
                  <Text style={styles.sectionTitle}>Chi Tiết Dịch Vụ</Text>
                  {invoiceDetails.details.map(detail => (
                    <View key={detail._id} style={styles.serviceRow}>
                      <Text style={styles.serviceName}>{detail.service_id.name}</Text>
                      <Text style={styles.serviceQuantity}>x{detail.quantity}</Text>
                      <Text style={styles.servicePrice}>{formatCurrency(detail.price)}</Text>
                    </View>
                  ))}
                </View>

                {/* Khuyến Mãi */}
                {invoiceDetails.promotion_header_ids.length > 0 && (
                  <View style={styles.invoiceSection}>
                    <Text style={styles.sectionTitle}>Khuyến Mãi</Text>
                    {invoiceDetails.promotion_header_ids.map(promo => (
                      <View key={promo._id} style={styles.promoRow}>
                        <Text style={styles.promoDescription}>{promo.description}</Text>
                        <Text style={styles.promoValue}>
                          -{promo.discount_type === 2 ? formatCurrency(promo.details[0].discount_value) : `${promo.details[0].discount_value}%`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tổng tiền */}
                <View style={styles.invoiceSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng tiền:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(invoiceDetails.total_amount)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Giảm giá:</Text>
                    <Text style={styles.totalValue}>-{formatCurrency(invoiceDetails.discount_amount)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.finalTotalLabel}>Thành tiền:</Text>
                    <Text style={styles.finalTotalValue}>{formatCurrency(invoiceDetails.final_amount)}</Text>
                  </View>
                </View>

                {/* Payment Button */}
                <TouchableOpacity onPress={() => handleCreatePaymentLink(invoiceDetails._id)} style={styles.payButton}>
                  <Text style={styles.payButtonText}>Thanh toán</Text>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.actionButtonText}>Đóng</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 50,
    position: 'absolute',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    maxHeight: '100%',
    maxWidth: '100%',
    minWidth: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34568B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34568B',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34568B',
    marginLeft: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: 'gray',
    marginLeft: 10,
  },
  selectedServicesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectedServicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34568B',
  },
  selectedServiceText: {
    fontSize: 14,
    color: '#333',
  },
  totalTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: '#c2c2c2',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 5,
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 10,
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
    borderRadius: 8,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  vehicleOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  vehicleOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  closeModalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  serviceOptionContent: {
    flex: 1,
  },
  checkmarkIcon: {
    marginLeft: 10,
  },
  completionTimeText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  confirmButtonEnabled: {
    backgroundColor: '#4CAF50', // Green for enabled
  },
  confirmButtonDisabled: {
    backgroundColor: '#c2c2c2', // Gray for disabled
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  invoiceModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  invoiceContainer: {
    padding: 20,
  },
  invoiceHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  invoiceLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  invoiceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  detailValue: {
    flex: 1,
  },
  serviceRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  serviceName: {
    flex: 2,
  },
  serviceQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  servicePrice: {
    flex: 1,
    textAlign: 'right',
  },
  promoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  promoDescription: {
    flex: 2,
  },
  promoValue: {
    flex: 1,
    textAlign: 'right',
    color: 'green',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  totalLabel: {
    flex: 1,
    fontWeight: 'bold',
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  finalTotalLabel: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 18,
  },
  finalTotalValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 18,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#c2c2c2',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
