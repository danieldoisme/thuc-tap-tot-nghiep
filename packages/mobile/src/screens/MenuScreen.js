import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import { DISHES, CATEGORIES } from '../data/mockData';
import DishItem from '../components/DishItem';

const MenuScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [filteredDishes, setFilteredDishes] = useState(DISHES);
  const [cart, setCart] = useState([]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedCategory === 'Tất cả') {
      setFilteredDishes(DISHES);
    } else {
      const filtered = DISHES.filter(
        dish => dish.category === selectedCategory,
      );
      setFilteredDishes(filtered);
    }
  }, [selectedCategory]);

  const handleAddToCart = dish => {
    setSelectedDish(dish);
    setQuantity(1);
    setNotes('');
    setModalVisible(true);
  };

  const confirmAddToCart = () => {
    if (selectedDish) {
      const newCartItem = { ...selectedDish, quantity, notes };
      // Tạm thời chỉ log ra để kiểm tra.
      setCart(prevCart => [...prevCart, newCartItem]);
      console.log('Added to cart:', newCartItem);
    }
    setModalVisible(false);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.name && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.name && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={filteredDishes}
        renderItem={({ item }) => (
          <DishItem item={item} onAddToCart={handleAddToCart} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart', { cartItems: cart })}
        >
          <Text style={styles.cartButtonText}>
            Xem giỏ hàng ({cart.length})
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{selectedDish?.name}</Text>

            <View style={styles.quantitySelector}>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(q => q + 1)}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Thêm ghi chú..."
              value={notes}
              onChangeText={setNotes}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Hủy"
                onPress={() => setModalVisible(false)}
                color="gray"
              />
              <View style={{ width: 10 }} />
              <Button title="Xác nhận" onPress={confirmAddToCart} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  categoriesContainer: { paddingVertical: 10, backgroundColor: '#fff' },
  categoryItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  categoryItemSelected: { backgroundColor: '#FF9F1C' },
  categoryText: { fontSize: 14, color: '#333' },
  categoryTextSelected: { color: '#fff', fontWeight: 'bold' },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
  cartButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  quantityButtonText: { fontSize: 20 },
  quantityText: { fontSize: 20, marginHorizontal: 20, fontWeight: 'bold' },
  notesInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default MenuScreen;
