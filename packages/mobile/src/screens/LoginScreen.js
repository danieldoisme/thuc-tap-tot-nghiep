import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const LoginScreen = ({ navigation }) => {
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userCode || !password) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập đầy đủ mã nhân viên và mật khẩu.',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        userCode,
        password,
      });

      const userData = response.data.user;

      if (userData) {
        navigation.replace('TableList', { user: userData });
      } else {
        Alert.alert(
          'Đăng nhập thất bại',
          'Không nhận được thông tin người dùng từ server.',
        );
      }
    } catch (error) {
      console.error(
        'Lỗi đăng nhập:',
        error.response?.data?.message || error.message,
      );
      Alert.alert(
        'Đăng nhập thất bại',
        'Mã nhân viên hoặc mật khẩu không đúng.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Mã nhân viên"
        placeholderTextColor="#A9A9A9"
        value={userCode}
        onChangeText={setUserCode}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#A9A9A9"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 60,
    color: '#F9790E',
    paddingHorizontal: 10,
  },
  input: {
    height: 60,
    backgroundColor: '#FFF4E0',
    borderRadius: 30,
    paddingHorizontal: 25,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#F9790E',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
