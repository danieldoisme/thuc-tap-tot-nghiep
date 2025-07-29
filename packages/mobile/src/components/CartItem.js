import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from '@react-native-vector-icons/ionicons';

const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => {
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        onPress={() => onRemove(item.id)}
        style={styles.deleteBox}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Icon name="trash-outline" size={30} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.container}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require('../assets/default-dish.png')
          }
          style={styles.image}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>
            {item.price.toLocaleString('vi-VN')} VNĐ
          </Text>
          {item.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              Ghi chú: {item.notes}
            </Text>
          ) : null}
        </View>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onDecrease(item.id)}
          >
            <Icon name="remove" size={20} color="#F9790E" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onIncrease(item.id)}
          >
            <Icon name="add" size={20} color="#F9790E" />
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  deleteBox: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 10,
    borderRadius: 15,
    right: 20,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  notes: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9790E',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F9790E',
    borderStyle: 'dashed',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

export default CartItem;
