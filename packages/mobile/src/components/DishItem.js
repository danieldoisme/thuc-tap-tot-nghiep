import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const DishItem = ({ item, onAddToCart }) => {
  return (
    <View style={styles.dishItemContainer}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : require('../assets/default-dish.png')
        }
        style={styles.dishImage}
      />
      <Text style={styles.dishName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.dishPrice}>
        {item.price.toLocaleString('vi-VN')} VNĐ
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAddToCart(item)}
      >
        <Text style={styles.addButtonText}>Thêm món</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dishItemContainer: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dishImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dishPrice: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  addButton: {
    backgroundColor: '#F9790E',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DishItem;
