import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CartItem = ({ item, onRemove }) => {
  const formatCurrency = amount => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>
          {item.name} (x{item.quantity})
        </Text>
        <Text style={styles.notes}>{item.notes || 'Không có ghi chú'}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <Text style={styles.price}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Xoá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContainer: {
    flex: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 14,
    color: 'gray',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsContainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 15,
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: '#e74c3c',
    fontSize: 14,
  },
});

export default CartItem;
