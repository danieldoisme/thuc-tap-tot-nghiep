import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/services/DatabaseService';
import { syncStaticData } from './src/services/SyncService';

const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        await syncStaticData();
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

  return <AppNavigator />;
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
