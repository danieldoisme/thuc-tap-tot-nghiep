import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const PaymentScreen = ({ route, navigation }) => {
  const { order, tableName } = route.params;
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/checkout`, {
        orderId: order.OrderID,
      });
      Alert.alert('Thành công', 'Thanh toán hóa đơn thành công!', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      setLoading(false);
      console.error('Lỗi khi thanh toán:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi thanh toán.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>
        {item.name} (x{item.quantity})
      </Text>
      <Text style={styles.itemPrice}>
        {(item.price * item.quantity).toLocaleString('vi-VN')} VND
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hóa đơn {tableName}</Text>
      <FlatList
        data={order.items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        style={styles.list}
      />
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tiền hàng</Text>
          <Text style={styles.summaryValue}>
            {parseInt(order.SubTotal).toLocaleString('vi-VN')} VND
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>VAT (8%)</Text>
          <Text style={styles.summaryValue}>
            {parseInt(order.VAT_Amount).toLocaleString('vi-VN')} VND
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.summaryLabel, styles.totalLabel]}>
            Tổng cộng
          </Text>
          <Text style={[styles.summaryValue, styles.totalValue]}>
            {parseInt(order.TotalAmount).toLocaleString('vi-VN')} VND
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.buttonDisabled]}
        onPress={handleConfirmPayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Đang xử lý...' : 'Xác nhận Thanh toán'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  itemName: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
  },
  summaryContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 20,
    alignItems: 'center',
    margin: 10,
    borderRadius: 5,
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

export default PaymentScreen;
