import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Linking, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SegmentedButtons } from 'react-native-paper';
import moment from 'moment';

export default function AppointmentScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [appointments, setAppointments] = useState([]); // All appointments
  const [waitingAppointments, setWaitingAppointments] = useState([]); // Waiting appointments
  const [filteredAppointments, setFilteredAppointments] = useState([]); // Filtered appointments based on view
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState(null);

  const fetchCustomerData = async () => {
    const token = await AsyncStorage.getItem('token');
    const id = await AsyncStorage.getItem('id');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/users/mobile/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const data = await response.json();
      await AsyncStorage.setItem('idCus', data.customer._id);
      setCustomerData(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch customer data');
    } finally {
      setLoading(false);
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
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitingAppointments = async () => {
    const idCus = await AsyncStorage.getItem('idCus');
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/appointments/mobile/appointment/customer/watting/${idCus}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setWaitingAppointments(data);
    } catch (error) {
      Alert.alert('Lỗi', 'Lỗi lấy lịch hẹn đang xử lý');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/payments/invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.invoice) {
        setInvoiceDetails(result.invoice);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Unable to fetch invoice details');
      }
    } catch (error) {
      Alert.alert('Error', 'Server not responding');
    }
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
        Alert.alert('Thành công', 'Tạo thanh toán thành công');
        fetchAppointments();
      } else {
        Alert.alert('Lỗi', result.msg);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Máy chủ không phản hồi');
    }
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
      Alert.alert('Lỗi', 'Máy chủ không phản hồi');
    }
  };

  const filterAppointments = (mode) => {
    setViewMode(mode);
    if (mode === 'waiting') {
      setFilteredAppointments(waitingAppointments);
    } else {
      setFilteredAppointments(appointments);
    }
  };

  const renderTimeline = (slot, services) => {
    if (!slot) return null;
  
    const startTime = moment(slot.slot_datetime);
    const currentTime = moment();
    let stages = [{ label: 'Tiếp nhận', time: startTime }];
    let lastTime = startTime;
  
    if (Array.isArray(services)) { 
      services.forEach((service) => {
        const serviceTime = lastTime.clone().add(service.time_required, 'minutes');
        stages.push({ label: service.name, time: serviceTime });
        lastTime = serviceTime;
      });
    }
  
    stages.push({ label: 'Hoàn thành', time: lastTime });
  
    return (
      <View style={styles.timelineContainer}>
        {stages.map((stage, index) => (
          <View key={index} style={styles.timelineStage}>
            <Text style={[
              styles.timelineText,
              currentTime.isAfter(stage.time) && styles.timelineTextActive,
            ]}>
              {stage.label}: {stage.time.format('HH:mm')}
            </Text>
            {index < stages.length - 1 && (
              <View style={[
                styles.timelineLine,
                currentTime.isAfter(stage.time) && styles.timelineLineActive,
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  useEffect(() => {
    fetchCustomerData();
    fetchAppointments();
    fetchWaitingAppointments();
    const intervalId = setInterval(() => {
      fetchAppointments();
      fetchWaitingAppointments();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments();
      fetchWaitingAppointments();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  const renderWaitingAppointment = ({ item }) => {
    const renderTimeline = (slot, services) => {
      if (!slot) return null;
      
      const startTime = moment(slot.slot_datetime);
      const currentTime = moment();
      let stages = [{ label: 'Tiếp nhận', time: startTime }];
      let lastTime = startTime;
  
      if (Array.isArray(services)) {
        services.forEach((service) => {
          const serviceTime = lastTime.clone().add(service.time_required, 'minutes');
          stages.push({ label: service.name, time: serviceTime });
          lastTime = serviceTime;
        });
      }
  
      stages.push({ label: 'Hoàn thành', time: lastTime });
  
      return (
        <View style={styles.timelineContainer}>
          {stages.map((stage, index) => (
            <View key={index} style={styles.timelineStage}>
              <Text style={[
                styles.timelineText,
                currentTime.isAfter(stage.time) && styles.timelineTextActive,
              ]}>
                {stage.label}: {stage.time.format('HH:mm')}
              </Text>
              {index < stages.length - 1 && (
                <View style={[
                  styles.timelineLine,
                  currentTime.isAfter(stage.time) && styles.timelineLineActive,
                ]} />
              )}
            </View>
          ))}
          
        </View>

      );
    };
  
    return (
      <View style={styles.appointmentCard}>
        <Text style={styles.title}>Mã lịch hẹn/Code: {item._id}</Text>
        <Text style={styles.status}>{item.slot_id == null && item.status === 'waiting' ? 'Chờ xe' : 'Đang thực hiện'}</Text>
        <Text style={styles.infoLabel}>Thông tin xe:</Text>
        <Text style={styles.info}>- {item.vehicle_id.manufacturer} {item.vehicle_id.model} ({item.vehicle_id.license_plate})</Text>
        <Text style={styles.info}>Ngày giờ hẹn: {new Date(item.appointment_datetime).toLocaleString()}</Text>
        <Text style={styles.info}>Trạng thái hóa đơn: {item.invoice ? (item.invoice.status === 'paid' ? 'Hoàn thành' : 'Chờ thanh toán') : 'Chờ thanh toán'}</Text>
  
        {/* Render the timeline only if slot is not null */}
        {item.slot_id && renderTimeline(item.slot_id, item.services)}
  
        {item.invoice && (
          <TouchableOpacity onPress={() => fetchInvoiceDetails(item.invoice._id)} style={styles.viewInvoiceButton}>
            <Text style={styles.actionButtonText}>Xem hóa đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAppointment = ({ item }) => (

    <View style={styles.appointmentCard}>
      <Text style={styles.title}>Mã lịch hẹn/Code: {item._id}</Text>
      <Text style={styles.status}> { item.status === 'waiting' ? 'Đang xử lý' : item.status === 'completed' ? 'Hoàn thành' : item.status === 'completed' ? 'Đã hủy' :'Đã trả' }</Text>
      <Text style={styles.infoLabel}>Thông tin xe:</Text>
      <Text style={styles.info}>- {item.vehicle_id.manufacturer} {item.vehicle_id.model} ({item.vehicle_id.license_plate})</Text>
      <Text style={styles.info}>Ngày giờ hẹn: {new Date(item.appointment_datetime).toLocaleString()}</Text>
      <Text style={styles.info}>Trạng thái thanh toán: {item.invoice ? (item.invoice.status === 'paid' ? 'Hoàn thành' : 'Chờ thanh toán') : 'Chờ thanh toán'}</Text>

      {/* Only render the timeline in "Chờ Xe" view */}
      {viewMode === 'waiting' && item.slot_id && renderTimeline(item.slot_id, item.services)}

      {item.invoice && (
        <TouchableOpacity onPress={() => fetchInvoiceDetails(item.invoice._id)} style={styles.viewInvoiceButton}>
          <Text style={styles.actionButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
      )}

      {!item.invoice && (
        <TouchableOpacity onPress={() => handleGenerateInvoice(item._id)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Tạo thanh toán</Text>
        </TouchableOpacity>
        
      )}
      
      {item.invoice && item.invoice.status !== 'paid' && (
        <TouchableOpacity onPress={() => handleCreatePaymentLink(item.invoice._id)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={viewMode}
        onValueChange={filterAppointments}
        buttons={[
          { value: 'all', label: 'Lịch Sử' },
          { value: 'waiting', label: 'Đang xử lý' },
        ]}
        style={styles.segmentedButtons}
      />
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item._id}
        renderItem={viewMode === 'all' ? renderAppointment : renderWaitingAppointment}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu</Text>}
      />

      {/* Modal for Invoice Details */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {invoiceDetails ? (
              <ScrollView>
                <Text style={styles.modalTitle}>CHI TIẾT</Text>
                <Text style={styles.modalText}>Tên khách hàng: {invoiceDetails.customer_id.name}</Text>
                <Text style={styles.modalText}>Email: {invoiceDetails.customer_id.email}</Text>
                <Text style={styles.modalText}>Địa chỉ: {invoiceDetails.customer_id.address}</Text>
                <Text style={styles.modalText}>Số điện thoại: {invoiceDetails.customer_id.phone_number}</Text>
                <Text style={styles.modalText}>Nhân viên xử lý: {invoiceDetails.employee_id.name}</Text>
                <Text style={styles.modalText}>Thời gian: {new Date(invoiceDetails.created_at).toLocaleString()}</Text>

                <Text style={styles.sectionTitle}>Chi tiết dịch vụ:</Text>
                {invoiceDetails.details.map(detail => (
                  <Text key={detail._id} style={styles.modalText}>- {detail.service_id.name}: {detail.price} VND x {detail.quantity}</Text>
                ))}

                <Text style={styles.sectionTitle}>Khuyến mãi:</Text>
                {invoiceDetails.promotion_header_ids.map(promo => (
                  <Text key={promo._id} style={styles.modalText}>- {promo.description} ({promo.discount_type === 2 ? 'Trực tiếp' : 'Phần trăm'}): {promo.details[0].discount_value}{promo.discount_type === 2 ? 'VND' : '%'}</Text>
                ))}

                <Text style={styles.modalText}>Tổng tiền: {invoiceDetails.total_amount} VND</Text>
                <Text style={styles.modalText}>Giảm giá: {invoiceDetails.discount_amount} VND</Text>
                <Text style={styles.modalText}>Thành tiền: {invoiceDetails.final_amount} VND</Text>
                
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  listContainer: {
    paddingTop: 16,
  },
  appointmentCard: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  info: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  viewInvoiceButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  timelineContainer: {
    marginVertical: 10,
  },
  timelineStage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timelineText: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  timelineTextActive: {
    color: '#4CAF50',
  },
  timelineLine: {
    height: 2,
    flex: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  timelineLineActive: {
    backgroundColor: '#4CAF50',
  },
});
