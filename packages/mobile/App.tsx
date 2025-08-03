import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/services/DatabaseService';
import { syncStaticData } from './src/services/SyncService';
import { CartProvider } from './src/context/CartContext';

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();

        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          await syncStaticData();
        } else {
          console.log('Không có mạng, sử dụng dữ liệu offline.');
        }
      } catch (e: any) {
        console.error('Lỗi nghiêm trọng khi khởi tạo ứng dụng:', e);
        setError('Không thể khởi tạo được ứng dụng.');
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Đang khởi tạo dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <CartProvider>
      <AppNavigator />
    </CartProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
