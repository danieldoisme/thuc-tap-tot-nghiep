import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL, socket } from '../apiConfig';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import { useCart } from '../context/CartContext';
import { useNetwork } from '../context/NetworkContext';
import { databaseService } from '../services/DatabaseService';

const TableDetailsScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;
  const { clearCart } = useCart();
  const { isConnected } = useNetwork();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      clearCart();
    }, [clearCart]),
  );

  useEffect(() => {
    navigation.setOptions({
      title: tableName,
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
  }, [navigation, tableName]);

  const formatOrderItems = items => {
    const formatted = items.map(item => ({
      id: item.OrderItemID,
      name: item.DishName,
      quantity: item.Quantity,
      price: parseInt(item.Price),
      status: item.Status,
      notes: item.Notes,
      imageUrl:
        item.LocalImageURL ||
        (item.ImageURL ? `${API_BASE_URL}/${item.ImageURL}` : null),
    }));

    const statusPriority = {
      'đã hoàn thành': 1,
      'đang chế biến': 2,
      'đã phục vụ': 3,
    };
    formatted.sort(
      (a, b) =>
        (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99),
    );
    return formatted;
  };

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    // Load from local DB first
    try {
      const [orderResult] = await databaseService.executeSql(
        "SELECT * FROM orders WHERE TableID = ? AND Status = 'chờ thanh toán' ORDER BY OrderTime DESC LIMIT 1;",
        [tableId],
      );

      if (orderResult.rows.length > 0) {
        const localOrder = orderResult.rows.item(0);
        const clientOrderId = localOrder.ClientOrderID;

        const [itemsResult] = await databaseService.executeSql(
          `SELECT oi.*, d.DishName, d.ImageURL, d.LocalImageURL 
           FROM order_items oi 
           JOIN dishes d ON oi.DishID = d.DishID 
           WHERE oi.ClientOrderID = ?;`,
          [clientOrderId],
        );

        const localItems = [];
        for (let i = 0; i < itemsResult.rows.length; i++) {
          localItems.push(itemsResult.rows.item(i));
        }

        setOrder({ ...localOrder, items: formatOrderItems(localItems) });
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết bàn ăn từ dữ liệu cục bộ:', error);
    } finally {
      setLoading(false);
    }

    // If online, fetch from network
    if (!isConnected) {
      console.log('Device is offline. Using local order details.');
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/table/${tableId}`,
      );
      const { order: orderInfo, items: orderItems } = response.data;
      if (orderInfo) {
        setOrder({ ...orderInfo, items: formatOrderItems(orderItems) });

        await databaseService.syncOrderDetails(orderInfo, orderItems);
      } else {
        setOrder(null);
        await databaseService.executeSql(
          "DELETE FROM orders WHERE TableID = ? AND Status = 'chờ thanh toán'",
          [tableId],
        );
      }
    } catch (error) {
      console.error(`Lỗi khi tải chi tiết bàn ${tableId}:`, error);
    }
  }, [tableId, isConnected]);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [fetchOrderDetails]),
  );

  useEffect(() => {
    const handleOrderStatusUpdate = () => {
      console.log(
        'Nhận được cập nhật trạng thái món ăn, tải lại chi tiết bàn...',
      );
      fetchOrderDetails();
    };

    socket.on('order_status_updated', handleOrderStatusUpdate);

    return () => {
      socket.off('order_status_updated', handleOrderStatusUpdate);
    };
  }, [fetchOrderDetails]);

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

  const getStatusStyle = status => {
    switch (status) {
      case 'đã hoàn thành':
        return { color: '#fd9827' };
      case 'đang chế biến':
        return { color: '#888' };
      case 'đã phục vụ':
        return { color: '#28a745' };
      default:
        return { color: '#888' };
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        item.status === 'đã hoàn thành' && handleMarkAsServed(item.id)
      }
      disabled={item.status !== 'đã hoàn thành'}
    >
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require('../assets/default-dish.png')
        }
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.itemQuantity}>Số lượng {item.quantity}</Text>
          <Text style={[styles.itemStatus, getStatusStyle(item.status)]}>
            {' | '}● {item.status}
          </Text>
        </View>
        {item.notes && (
          <Text style={styles.itemNotes}>Ghi chú: {item.notes}</Text>
        )}
      </View>
      {item.status === 'đã hoàn thành' && (
        <View style={styles.checkmarkContainer}>
          <Icon name="checkmark-circle" size={24} color="#fd9827" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fd9827" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chi tiết bàn</Text>

      {order && order.items.length > 0 ? (
        <FlatList
          data={order.items}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={fetchOrderDetails}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Bàn trống, hãy đặt món!</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('Menu', {
              tableId,
              tableName,
              user,
            })
          }
        >
          <Text style={styles.buttonText}>Thêm món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
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
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  itemNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  checkmarkContainer: {
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    backgroundColor: '#fd9827',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
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
