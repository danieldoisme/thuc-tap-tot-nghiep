import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/services/DatabaseService';
import { syncStaticData } from './src/services/SyncService';
import { processActionQueue } from './src/services/ActionQueueService';

const AppContent = () => {
  const netInfo = useNetInfo();

  useEffect(() => {
    // Khi có kết nối mạng và không phải lần đầu tiên kiểm tra
    if (netInfo.isConnected === true) {
      console.log('Có kết nối mạng, đang xử lý hàng đợi...');
      processActionQueue();
    }
  }, [netInfo.isConnected]);

  return <AppNavigator />;
};

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        // Chỉ đồng bộ dữ liệu tĩnh khi có mạng
        const state = await NetInfo.fetch();
        if (state.isConnected) {
          await syncStaticData();
        }
      } catch (e) {
        console.error('Lỗi khởi tạo ứng dụng:', e);
        setError('Không thể khởi tạo dữ liệu. Vui lòng thử lại.');
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F9790E" />
        <Text style={styles.loadingText}>Đang chuẩn bị dữ liệu...</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return <AppContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: 'red',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});

export default App;
