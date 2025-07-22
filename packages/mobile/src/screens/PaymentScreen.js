import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { ORDERS } from '../data/mockData';

const PaymentScreen = ({ route, navigation }) => {
  const { tableId } = route.params;
  const orderItems = ORDERS[tableId] || [];

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const { subtotal, vat, total } = useMemo(() => {
    const tempPricePerDish = 25000;
    const calculatedSubtotal = orderItems.reduce(
      (sum, item) => sum + tempPricePerDish * item.quantity,
      0,
    );
    const calculatedVat = calculatedSubtotal * 0.08;
    const calculatedTotal = calculatedSubtotal + calculatedVat;
    return {
      subtotal: calculatedSubtotal,
      vat: calculatedVat,
      total: calculatedTotal,
    };
  }, [orderItems]);

  const handleConfirmPayment = () => {
    Alert.alert(
      'Thanh toán thành công',
      `Đã thanh toán hóa đơn cho ${route.params.tableName}.`,
      [{ text: 'OK', onPress: () => navigation.navigate('TableList') }],
    );
  };

  const renderBillItem = ({ item }) => (
    <View style={styles.billItem}>
      <Text style={styles.itemName}>
        {item.name} (x{item.quantity})
      </Text>
      <Text style={styles.itemPrice}>
        {formatCurrency(25000 * item.quantity)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.billContainer}>
        <Text style={styles.title}>Hoá đơn thanh toán</Text>
        <Text style={styles.tableTitle}>{route.params.tableName}</Text>

        <FlatList
          data={orderItems}
          renderItem={renderBillItem}
          keyExtractor={item => item.id}
          style={styles.billItemsList}
        />

        <View style={styles.separator} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Tổng tiền hàng</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Thuế VAT (8%)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(vat)}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>TỔNG CỘNG</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.printButton}>
          <Text style={styles.buttonText}>In hoá đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPayment}
        >
          <Text style={styles.buttonText}>Xác nhận thanh toán</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'space-between',
  },
  billContainer: {
    margin: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tableTitle: {
    textAlign: 'center',
    fontSize: 18,
    color: 'gray',
    marginBottom: 20,
  },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  billItemsList: { maxHeight: 250 },
  billItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: '500' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  summaryText: { fontSize: 16, color: '#555' },
  summaryValue: { fontSize: 16, color: '#555', fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalText: { fontSize: 20, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF9F1C' },
  footer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  printButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17a2b8',
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default PaymentScreen;
