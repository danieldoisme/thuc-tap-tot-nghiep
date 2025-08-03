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
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNetInfo } from '@react-native-community/netinfo';
import axios from 'axios';

import { useCart } from '../context/CartContext';
import { API_BASE_URL, socket } from '../apiConfig';

const TableDetailsScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;
  const { clearCart } = useCart();
  const netInfo = useNetInfo();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Xóa giỏ hàng mỗi khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      clearCart();
    }, [clearCart]),
  );

  // Thiết lập header
  useEffect(() => {
    navigation.setOptions({ title: tableName });
  }, [navigation, tableName]);

  // Hàm lấy chi tiết đơn hàng
  const fetchOrderDetails = useCallback(async () => {
    // Nếu offline, không làm gì cả và hiển thị giao diện bàn trống
    if (netInfo.isConnected === false) {
      setOrder(null);
      setLoading(false);
      console.log('Đang ở chế độ offline, không tải chi tiết đơn hàng.');
      return;
    }

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
          notes: item.Notes,
          imageUrl: item.ImageURL ? `${API_BASE_URL}/${item.ImageURL}` : null,
        }));

        // Sắp xếp món ăn theo trạng thái
        const statusPriority = {
          'đã hoàn thành': 1,
          'đang chế biến': 2,
          'đã phục vụ': 3,
        };
        formattedItems.sort((a, b) => {
          const priorityA = statusPriority[a.status] || 4;
          const priorityB = statusPriority[b.status] || 4;
          return priorityA - priorityB;
        });

        setOrder({ ...orderInfo, items: formattedItems });
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải được chi tiết đơn hàng.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [tableId, netInfo.isConnected]);

  // Lấy dữ liệu khi màn hình được focus hoặc khi có mạng trở lại
  useFocusEffect(
    useCallback(() => {
      fetchOrderDetails();
    }, [fetchOrderDetails]),
  );

  // Lắng nghe sự kiện từ socket
  useEffect(() => {
    const handleUpdate = () => {
      fetchOrderDetails();
    };
    socket.on('order_updated', handleUpdate);
    socket.on('order_status_updated', handleUpdate);

    return () => {
      socket.off('order_updated', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
    };
  }, [fetchOrderDetails]);

  // Các hàm xử lý giao diện...
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
    <View style={styles.itemContainer}>
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
          <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
          <Text style={[styles.itemStatus, getStatusStyle(item.status)]}>
            {' | '}● {item.status}
          </Text>
        </View>
        {item.notes && (
          <Text style={styles.itemNotes}>Ghi chú: {item.notes}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F9790E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {order ? (
        // Giao diện khi có đơn hàng
        <>
          <FlatList
            data={order.items}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            ListHeaderComponent={
              <Text style={styles.listHeader}>Các món đã gọi</Text>
            }
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('Menu', { tableId, tableName, user })
              }
            >
              <Icon name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Thêm món</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('Payment', { order, tableName })
              }
            >
              <Icon name="cash-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Giao diện khi bàn trống hoặc offline
        <View style={[styles.container, styles.centered]}>
          <Icon name="restaurant-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Bàn này hiện đang trống</Text>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() =>
              navigation.navigate('Menu', { tableId, tableName, user })
            }
          >
            <Text style={styles.orderButtonText}>Tạo đơn hàng mới</Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: 20,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 15,
    color: '#666',
  },
  itemStatus: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#F9790E',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  orderButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TableDetailsScreen;
