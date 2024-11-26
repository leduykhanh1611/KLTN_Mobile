import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Linking, Modal, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

export default function AppointmentScreen() {
  const [customerData, setCustomerData] = useState(null);
  const [appointments, setAppointments] = useState([]); // All appointments
  const [loading, setLoading] = useState(true);
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

  const fetchInvoiceDetails = async (invoiceId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch(`https://host-rose-sigma.vercel.app/api/payments/invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.invoice) {
        setInvoiceDetails(result.invoice);
        console.log(result.invoice);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  useEffect(() => {
    fetchCustomerData();
    fetchAppointments();
    const intervalId = setInterval(() => {
      fetchAppointments();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const renderTimeline = (slot, services) => {
    if (!slot) return null;

    const startTime = moment(slot.slot_datetime);
    const currentTime = moment();
    let stages = [{ label: 'Tiếp nhận', time: startTime, isDone: true }]; // Giai đoạn đầu tiên luôn là 'Done'
    let lastTime = startTime;

    if (Array.isArray(services)) {
        services.forEach((service) => {
            const serviceName = service.name;
            const timeRequired = Number(service.time_required);
            let serviceTime;

            if (service.is_done && service.time_completed) {
                // Nếu dịch vụ đã hoàn thành, sử dụng time_completed
                serviceTime = moment(service.time_completed);
            } else {
                // Nếu chưa hoàn thành, tính toán dựa trên thời gian trước đó
                serviceTime = lastTime.clone().add(timeRequired, 'minutes');
            }

            stages.push({ label: serviceName, time: serviceTime, isDone: service.is_done });
            lastTime = serviceTime; // Cập nhật lastTime cho dịch vụ tiếp theo
        });
    }

    stages.push({ label: 'Hoàn thành', time: lastTime, isDone: false });

    return (
        <View style={styles.timelineContainer}>
            {stages.map((stage, index) => (
                <View key={index} style={styles.timelineStage}>
                    <Text style={[
                        styles.timelineText,
                        (stage.isDone || currentTime.isAfter(stage.time)) && styles.timelineTextActive,
                    ]}>
                        {stage.label}: {stage.time.format('HH:mm')}
                    </Text>
                    {index < stages.length - 1 && (
                        <View style={[
                            styles.timelineLine,
                            (stage.isDone || currentTime.isAfter(stage.time)) && styles.timelineLineActive,
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );
};


  const renderAppointment = ({ item }) => {
    // Determine the status label
    let statusLabel = '';
    switch(item.status) {
      case 'waiting':
        statusLabel = 'Đang xử lý';
        break;
      case 'completed':
        statusLabel = 'Hoàn thành';
        break;
      case 'cancelled':
        statusLabel = 'Đã hủy';
        break;
      default:
        statusLabel = item.status;
    }

    return (
      <View style={styles.appointmentCard}>
        <Text style={styles.title}>Mã lịch hẹn/Code: {item._id}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
        <Text style={styles.infoLabel}>Thông tin xe:</Text>
        <Text style={styles.info}>- {item.vehicle_id.manufacturer} {item.vehicle_id.model} ({item.vehicle_id.license_plate})</Text>
        <Text style={styles.info}>Ngày giờ hẹn: {formatDate(item.appointment_datetime)}</Text>
        <Text style={styles.info}>Trạng thái thanh toán: {item.invoice ? (item.invoice.status === 'paid' ? 'Hoàn thành' : item.invoice.status === 'back' ? 'Đã hoàn trả': 'Chờ thanh toán') : 'Chưa thanh toán'}</Text>

        {/* Include the timeline for appointments that are in progress */}
        {item.status === 'waiting' && item.slot_id && renderTimeline(item.slot_id, item.services)}

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

        {item.invoice && (item.invoice.status === 'pending')&& (
          <TouchableOpacity onPress={() => handleCreatePaymentLink(item.invoice._id)} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>Không có dữ liệu</Text>}
      />

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
                  <Text style={styles.invoiceTitle}>HÓA ĐƠN DỊCH VỤ</Text>
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
                    <Text style={styles.detailLabel}>Thời gian:</Text>
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
                {invoiceDetails.status === 'pending' && (
                  <TouchableOpacity onPress={() => handleCreatePaymentLink(invoiceDetails._id)} style={styles.payButton}>
                    <Text style={styles.payButtonText}>Thanh toán</Text>
                  </TouchableOpacity>
                )}

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
});
