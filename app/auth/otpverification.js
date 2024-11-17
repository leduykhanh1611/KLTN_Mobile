import React, { useState } from 'react';
import { View, TextInput, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from 'react-native-paper';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function OtpVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/users/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        Alert.alert('Xác thực thành công', 'Tài khoản của bạn đã được kích hoạt.');
        router.replace('/auth/login'); // Điều hướng về trang đăng nhập sau khi kích hoạt thành công
      } else {
        Alert.alert('Xác thực thất bại', data.msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi trong quá trình xác thực');
    } finally {
      setLoading(false);
    }
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
      }>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <ThemedText type="title" style={{ textAlign: 'center', color: 'red', marginBottom: 20 }}>
            Xác thực OTP
          </ThemedText>

          <TextInput
            placeholder="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            style={styles.input}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#1D3D47" style={{ marginVertical: 20 }} />
          ) : (
            <Button mode="contained" onPress={handleVerifyOtp} style={styles.verifyButton}>
              Xác Thực
            </Button>
          )}
        </View>
      </TouchableWithoutFeedback>
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
  input: {
    marginBottom: 15,
    borderBottomWidth: 1,
    padding: 10,
  },
  verifyButton: {
    backgroundColor: '#1D3D47',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  
});
