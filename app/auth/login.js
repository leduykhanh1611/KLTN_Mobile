import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://host-rose-sigma.vercel.app/api/auth/loginAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        if (data.user.role !== 'customer') {
          Alert.alert('Đăng nhập thất bại', 'Tài khoản không phải là khách hàng');
        } else {
          // Lưu token vào AsyncStorage
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('id', data.user.id);
          // Điều hướng đến trang chính sau khi đăng nhập thành công
          router.push('(tabs)');
        }
      } else {
        Alert.alert('Đăng nhập thất bại', data.msg);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi trong quá trình đăng nhập');
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
            Đăng nhập
          </ThemedText>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{ marginBottom: 15, borderBottomWidth: 1, padding: 10 }}
          />
          
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={24}
                color="grey"
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1D3D47" style={{ marginVertical: 20 }} />
          ) : (
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              labelStyle={styles.buttonLabel}
            >
              Đăng Nhập
            </Button>
          )}

          <Button
            mode="text"
            onPress={() => router.push('/auth/register')}
            style={styles.registerButton}
            labelStyle={styles.textButtonLabel}
          >
            Chưa có tài khoản? Đăng Ký
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#1D3D47',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  registerButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButtonLabel: {
    color: '#1D3D47',
    fontSize: 14,
  },
});
