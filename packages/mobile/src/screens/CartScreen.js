import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CartItem from '../components/CartItem';

const CartScreen = ({ route, navigation }) => {
  const [cartItems, setCartItems] = useState(route.params.cartItems || []);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleRemoveItem = itemId => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleConfirmOrder = () => {
    // Trong ứng dụng thực tế:
    // 1. Gửi `cartItems` lên server.
    // 2. Server xử lý và trả về kết quả.
    // 3. Cập nhật trạng thái chung của ứng dụng (qua Context/Redux).

    // Mô phỏng:
    Alert.alert('Xác nhận thành công', 'Yêu cầu đặt món đã được gửi đến bếp.', [
      { text: 'OK', onPress: () => navigation.pop(2) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={({ item }) => (
          <CartItem item={item} onRemove={handleRemoveItem} />
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Tổng cộng:</Text>
          <Text style={styles.totalPrice}>{formatCurrency(totalPrice)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            cartItems.length === 0 && styles.disabledButton,
          ]}
          onPress={handleConfirmOrder}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.confirmButtonText}>Xác nhận đặt món</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9F1C',
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
});

export default CartScreen;
