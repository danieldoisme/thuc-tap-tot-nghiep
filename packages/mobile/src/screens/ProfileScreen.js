import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const ProfileScreen = ({ route, navigation }) => {
  const { user: initialUser } = route.params;
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/user/${initialUser.userId}`,
        );
        setUserInfo(response.data);
      } catch (error) {
        console.error('Lỗi khi tải thông tin nhân viên:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin nhân viên.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [initialUser.userId]);

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        <Text style={styles.title}>Thông tin Nhân viên</Text>
        {userInfo ? (
          <View style={styles.infoBox}>
            <Text style={styles.label}>Họ và Tên:</Text>
            <Text style={styles.info}>{userInfo.fullName}</Text>
            <Text style={styles.label}>Mã Nhân viên:</Text>
            <Text style={styles.info}>{userInfo.userCode}</Text>
          </View>
        ) : (
          <Text>Không có thông tin để hiển thị.</Text>
        )}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  info: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
