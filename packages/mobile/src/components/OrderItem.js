import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderItem = ({ item }) => {
  const getStatusColor = status => {
    switch (status) {
      case 'Đã hoàn thành':
        return '#28a745';
      case 'Đang chế biến':
        return '#ffc107';
      case 'Đã phục vụ':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <Text style={styles.quantity}>x{item.quantity}</Text>
        <View>
          <Text style={styles.dishName}>{item.name}</Text>
          {item.notes ? (
            <Text style={styles.notes}>Ghi chú: {item.notes}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rightColumn}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  leftColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginRight: 15,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: 'gray',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rightColumn: {},
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default OrderItem;
