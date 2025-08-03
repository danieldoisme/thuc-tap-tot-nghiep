import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    navigation.setOptions({
      title: 'Thanh toán',
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

  const handlePrintBill = () => {
    Alert.alert('Thành công', 'Đã gửi yêu cầu in hoá đơn thành công!');
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemRow}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          {parseInt(item.price).toLocaleString('vi-VN')} VNĐ
        </Text>
      </View>
      <View style={styles.itemRow}>
        <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
        <Text style={styles.itemTotalPrice}>
          {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.billContainer}>
        <Text style={styles.title}>{tableName}</Text>
        <FlatList
          data={order.items}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        <View style={styles.dashedSeparator} />
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền</Text>
            <Text style={styles.summaryValue}>
              {parseInt(order.SubTotal).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế VAT</Text>
            <Text style={styles.summaryValue}>8%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.totalLabel]}>
              Thanh toán
            </Text>
            <Text style={[styles.summaryValue, styles.totalValue]}>
              {parseInt(order.TotalAmount).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.printButton} onPress={handlePrintBill}>
          <Text style={styles.printButtonText}>In hoá đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleConfirmPayment}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9790E',
    justifyContent: 'space-between',
  },
  billContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flexGrow: 0,
  },
  itemContainer: {
    paddingVertical: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 16,
    color: '#666',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  dashedSeparator: {
    height: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F9790E',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  summaryContainer: {
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 18,
    color: '#333',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '500',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  printButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  printButtonText: {
    color: '#F9790E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#F9790E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#fde4ce',
  },
});

export default PaymentScreen;
