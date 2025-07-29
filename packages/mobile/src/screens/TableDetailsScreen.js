import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { useFocusEffect } from '@react-navigation/native';

const TableDetailsScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/table/${tableId}`,
      );
      const { order: orderInfo, items: orderItems } = response.data;
      if (orderInfo) {
        const formattedItems = orderItems.map(item => ({
          id: item.OrderItemID,
          name: item.DishName,
          quantity: item.Quantity,
          price: parseInt(item.Price),
          status: item.Status,
        }));
        setOrder({ ...orderInfo, items: formattedItems });
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error(`Lỗi khi tải chi tiết bàn ${tableId}:`, error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu của bàn.');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [fetchOrderDetails]),
  );

  const handleNavigateToPayment = () => {
    if (!order || order.items.length === 0) {
      Alert.alert('Thông báo', 'Bàn này không có gì để thanh toán.');
      return;
    }
    navigation.navigate('Payment', {
      order: order,
      tableName: tableName,
      user: user,
    });
  };

  const handleMarkAsServed = async orderItemId => {
    try {
      await axios.patch(`${API_BASE_URL}/api/order-items/${orderItemId}/serve`);
      fetchOrderDetails();
    } catch (error) {
      console.error(`Lỗi khi cập nhật món ăn ${orderItemId}:`, error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái món ăn.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>
          {item.name} (x{item.quantity})
        </Text>
        <Text style={styles.itemStatus}>Trạng thái: {item.status}</Text>
      </View>
      <View style={styles.itemActions}>
        <Text style={styles.itemPrice}>{item.price * item.quantity} VND</Text>
        {item.status === 'đã hoàn thành' && (
          <TouchableOpacity
            style={styles.serveButton}
            onPress={() => handleMarkAsServed(item.id)}
          >
            <Text style={styles.serveButtonText}>Phục vụ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.tableName}>{tableName}</Text>

      {order && order.items.length > 0 ? (
        <FlatList
          data={order.items}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          refreshing={loading}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bàn trống, hãy đặt món!</Text>
        </View>
      )}

      {order && (
        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Tổng cộng: {parseInt(order.TotalAmount)} VND
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() =>
            navigation.navigate('Menu', { tableId, tableName, user })
          }
        >
          <Text style={styles.buttonText}>Đặt món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleNavigateToPayment}
        >
          <Text style={styles.buttonText}>Thanh toán</Text>
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
  tableName: {
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemStatus: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serveButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 8,
  },
  serveButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
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
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  orderButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  checkoutButton: {
    backgroundColor: '#28A745',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
});

export default TableDetailsScreen;
