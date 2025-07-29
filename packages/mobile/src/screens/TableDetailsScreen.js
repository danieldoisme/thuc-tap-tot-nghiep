import React, { useState, useEffect } from 'react';
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

const TableDetailsScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
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
    };

    // Thêm listener để tự động tải lại dữ liệu khi người dùng quay lại màn hình này
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrderDetails();
    });

    // Cleanup listener khi màn hình bị unmount
    return unsubscribe;
  }, [navigation, tableId]);

  const handleCheckout = async () => {
    if (!order) {
      Alert.alert('Thông báo', 'Bàn này không có gì để thanh toán.');
      return;
    }

    Alert.alert(
      'Xác nhận thanh toán',
      `Bạn có chắc chắn muốn thanh toán cho ${tableName}?`,
      [
        { text: 'Hủy' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await axios.post(`${API_BASE_URL}/api/checkout`, {
                orderId: order.OrderID,
              });
              Alert.alert('Thành công', 'Thanh toán hóa đơn thành công!');
              navigation.goBack();
            } catch (error) {
              console.error('Lỗi khi thanh toán:', error);
              Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi thanh toán.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>
        {item.name} (x{item.quantity})
      </Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemStatus}>{item.status}</Text>
        <Text style={styles.itemPrice}>{item.price * item.quantity} VND</Text>
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
            navigation.navigate('Menu', {
              tableId: tableId,
              tableName: tableName,
              user: user,
            })
          }
        >
          <Text style={styles.buttonText}>Đặt món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
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
  itemName: {
    fontSize: 16,
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemStatus: {
    fontSize: 14,
    color: '#888',
  },
  itemPrice: {
    fontSize: 16,
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
