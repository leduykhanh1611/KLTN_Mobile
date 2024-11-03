import React, { useState } from 'react';
import { View, TextInput, Text, TouchableWithoutFeedback, Keyboard, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';

export default function RegisterScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Trạng thái cho các thông báo lỗi
  const [errors, setErrors] = useState({
    name: '',
    password: '',
    email: '',
    address: '',
    phoneNumber: '',
  });

  const validateInputs = () => {
    let valid = true;
    let newErrors = {
      name: '',
      password: '',
      email: '',
      address: '',
      phoneNumber: '',
    };

    // Kiểm tra các trường không được để trống
    if (!name) {
      newErrors.name = 'Vui lòng nhập họ và tên';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      valid = false;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Vui lòng nhập email';
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Email không hợp lệ';
      valid = false;
    }

    if (!address) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
      valid = false;
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
      valid = false;
    } else if (phoneNumber.length < 10) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name,
          password,
          email,
          name,
          address,
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (response.status === 201) {
        router.push({
          pathname: '/auth/otpverification',
          params: { email },
        });
      } else {
        Alert.alert('Đăng ký thất bại', data.msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi trong quá trình đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      }>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <ThemedText type="title" style={{ textAlign: 'center', color: 'red', marginBottom: 20 }}>
            Đăng ký
          </ThemedText>

          <TextInput placeholder="Họ và tên" value={name} onChangeText={setName} style={styles.input} />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <TextInput placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <TextInput placeholder="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" style={styles.input} />
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}

          <TextInput placeholder="Địa chỉ" value={address} onChangeText={setAddress} style={styles.input} />
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
          
          {loading ? (
            <ActivityIndicator size="large" color="#1D3D47" style={{ marginVertical: 20 }} />
          ) : (
            <Button mode="contained" onPress={handleRegister} style={styles.registerButton}>
              Đăng Ký
            </Button>
          )}

          <Button
            mode="text"
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
            labelStyle={styles.textButtonLabel}
          >
            Đã có tài khoản? Đăng Nhập
          </Button>
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
    marginBottom: 5,
    borderBottomWidth: 1,
    padding: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: '#1D3D47',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  loginButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  textButtonLabel: {
    color: '#1D3D47',
    fontSize: 14,
  },
});
