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
  ActivityIndicator,
} from 'react-native';
import DishItem from '../components/DishItem';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const MenuScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;

  const [cart, setCart] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [allDishes, setAllDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/menu`);
        const menuData = response.data;

        const apiCategories = menuData.map(cat => ({
          id: cat.CategoryID,
          name: cat.CategoryName,
        }));
        setCategories([{ id: 0, name: 'Tất cả' }, ...apiCategories]);

        let allDishesFromApi = [];
        menuData.forEach(category => {
          const dishes = category.dishes.map(dish => ({
            id: dish.DishID.toString(),
            name: dish.DishName,
            price: parseInt(dish.Price),
            image: `${API_BASE_URL}${dish.ImageURL}`,
            description: dish.Description,
            categoryId: category.CategoryID,
          }));
          allDishesFromApi = [...allDishesFromApi, ...dishes];
        });
        setAllDishes(allDishesFromApi);
      } catch (error) {
        console.error('Lỗi khi tải thực đơn:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const getFilteredDishes = () => {
    if (selectedCategoryId === 0) {
      return allDishes;
    }
    return allDishes.filter(dish => dish.categoryId === selectedCategoryId);
  };

  const handleAddToCart = dish => {
    setSelectedDish(dish);
    setQuantity(1);
    setNotes('');
    setModalVisible(true);
  };

  const confirmAddToCart = () => {
    if (selectedDish) {
      const newCartItem = { ...selectedDish, quantity, notes };
      setCart(prevCart => [...prevCart, newCartItem]);
      console.log('Đã thêm vào giỏ:', newCartItem);
      setModalVisible(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategoryId(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategoryId === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={getFilteredDishes()}
        renderItem={({ item }) => (
          <DishItem item={item} onAddToCart={handleAddToCart} />
        )}
        keyExtractor={item => item.id}
      />

      <TouchableOpacity
        style={styles.cartButton}
        onPress={() =>
          navigation.navigate('Cart', {
            cartItems: cart,
            tableId: tableId,
            tableName: tableName,
            user: user,
          })
        }
      >
        <Text style={styles.cartButtonText}>Xem giỏ hàng ({cart.length})</Text>
      </TouchableOpacity>

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
              <Button
                title="-"
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
              />
              <TextInput
                style={styles.quantityInput}
                value={String(quantity)}
                onChangeText={text => setQuantity(Number(text) || 1)}
                keyboardType="numeric"
              />
              <Button title="+" onPress={() => setQuantity(q => q + 1)} />
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="Thêm ghi chú..."
              value={notes}
              onChangeText={setNotes}
            />
            <Button title="Thêm vào giỏ hàng" onPress={confirmAddToCart} />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 10 }}
            >
              <Text>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  categoriesContainer: { paddingVertical: 10, backgroundColor: 'white' },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
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
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: 50,
    textAlign: 'center',
    marginHorizontal: 10,
    borderRadius: 5,
    paddingVertical: 5,
  },
  notesInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    minHeight: 60,
  },
});

export default MenuScreen;
