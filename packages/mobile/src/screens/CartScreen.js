import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

const CartScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;
  const { cart: items, setCart, clearCart } = useCart();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: tableName,
      headerStyle: { backgroundColor: '#F9790E' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    });
  }, [navigation, tableName]);

  const handleIncrease = itemId => {
    setCart(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const handleDecrease = itemId => {
    setCart(currentItems =>
      currentItems
        .map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item,
        )
        .filter(item => item.quantity > 0),
    );
  };

  const handleRemove = itemId => {
    setCart(currentItems => currentItems.filter(item => item.id !== itemId));
  };

  const { totalQuantity, totalPrice } = useMemo(() => {
    return items.reduce(
      (totals, item) => {
        totals.totalQuantity += item.quantity;
        totals.totalPrice += item.price * item.quantity;
        return totals;
      },
      { totalQuantity: 0, totalPrice: 0 },
    );
  }, [items]);

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống!');
      return;
    }
    setIsLoading(true);
    const orderData = {
      tableId: tableId,
      userId: user.userId,
      items: items.map(item => ({
        id: parseInt(item.id, 10),
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
          onPress: () => {
            clearCart();
            navigation.pop(2);
          },
        },
      ]);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể gửi đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <CartItem
      item={item}
      onIncrease={handleIncrease}
      onDecrease={handleDecrease}
      onRemove={handleRemove}
    />
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Giỏ hàng</Text>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={{ paddingBottom: 200 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
            </View>
          }
        />
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Tóm tắt</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số lượng</Text>
            <Text style={styles.summaryValue}>{totalQuantity}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền</Text>
            <Text style={styles.summaryValue}>
              {totalPrice.toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.disabledButton]}
            onPress={handleConfirmOrder}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Gửi bếp</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
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
    fontWeight: 'bold',
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#F9790E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#fabd81',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen;
