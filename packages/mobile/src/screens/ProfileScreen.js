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
import Ionicons from '@react-native-vector-icons/ionicons';

const ProfileScreen = ({ route, navigation }) => {
  const { user: initialUser } = route.params;
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: 'Tài khoản',
      headerStyle: {
        backgroundColor: '#F9790E',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 22,
      },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!initialUser?.userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
        setLoading(false);
        return;
      }
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
        <ActivityIndicator size="large" color="#F9790E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        <View>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={100} color="#F9790E" />
          </View>
          {userInfo ? (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Họ và Tên:</Text>
                <Text style={styles.info}>{userInfo.fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Mã Nhân viên:</Text>
                <Text style={styles.info}>{userInfo.userCode}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>
              Không có thông tin để hiển thị.
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  label: {
    fontSize: 16,
    color: '#888',
  },
  info: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#F9790E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
});

export default ProfileScreen;
