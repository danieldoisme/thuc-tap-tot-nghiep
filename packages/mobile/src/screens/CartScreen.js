import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const CartScreen = ({ route, navigation }) => {
  // Nhận tất cả dữ liệu đã được truyền tới
  const { cartItems, tableId, tableName, user } = route.params;

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleConfirmOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống!');
      return;
    }

    // Chuẩn bị dữ liệu để gửi đi theo đúng định dạng API yêu cầu
    const orderData = {
      tableId: tableId,
      userId: user.userId,
      items: cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
    };

    try {
      await axios.post(`${API_BASE_URL}/api/orders`, orderData);
      Alert.alert('Thành công', 'Đã gửi đơn hàng đến nhà bếp!', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('TableDetails', { tableId, tableName, user }),
        },
      ]);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể gửi đơn hàng. Vui lòng thử lại.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>
        {item.name} (x{item.quantity})
      </Text>
      <Text style={styles.itemPrice}>{item.price * item.quantity} VND</Text>
      {item.notes ? (
        <Text style={styles.itemNotes}>Ghi chú: {item.notes}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Xác nhận Đơn hàng cho {tableName}</Text>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
        }
      />
      <View style={styles.footer}>
        <Text style={styles.totalText}>Tổng cộng: {calculateTotal()} VND</Text>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
        >
          <Text style={styles.buttonText}>Xác nhận</Text>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  itemNotes: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 5,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 15,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default CartScreen;
