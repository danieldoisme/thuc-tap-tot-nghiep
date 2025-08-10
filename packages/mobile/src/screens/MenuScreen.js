import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import Icon from '@react-native-vector-icons/ionicons';
import DishItem from '../components/DishItem';
import { databaseService } from '../services/DatabaseService';
import { useCart } from '../context/CartContext';
import { useNetwork } from '../context/NetworkContext';

const MenuScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;
  const { cart, setCart } = useCart();
  const { isConnected } = useNetwork();

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [allDishes, setAllDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      title: tableName,
      headerStyle: { backgroundColor: '#F9790E' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Cart', {
              tableId: tableId,
              tableName: tableName,
              user: user,
            })
          }
          style={styles.cartIconContainer}
        >
          <Icon name="bag-handle-outline" size={28} color="#fff" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, tableName, cart, tableId, user]);

  const processMenuData = menuData => {
    const desiredOrder = ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống'];
    const sortedMenuData = [...menuData].sort((a, b) => {
      const indexA = desiredOrder.indexOf(a.CategoryName);
      const indexB = desiredOrder.indexOf(b.CategoryName);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.CategoryName.localeCompare(b.CategoryName);
    });

    const apiCategories = sortedMenuData.map(cat => ({
      id: cat.CategoryID,
      name: cat.CategoryName,
    }));

    const allDishesFromApi = sortedMenuData.flatMap(category =>
      category.dishes.map(dish => ({
        ...dish,
        id: dish.DishID,
        name: dish.DishName,
        price: parseInt(dish.Price),
        image:
          dish.LocalImageURL ||
          (dish.ImageURL ? `${API_BASE_URL}/${dish.ImageURL}` : null),
        categoryId: category.CategoryID,
      })),
    );
    return { apiCategories, allDishesFromApi };
  };

  const fetchMenu = useCallback(async () => {
    try {
      console.log('Loading menu from local DB...');
      const [categoriesResult] = await databaseService.executeSql(
        'SELECT * FROM categories;',
      );
      const [dishesResult] = await databaseService.executeSql(
        'SELECT * FROM dishes;',
      );

      const localCategories = [];
      for (let i = 0; i < categoriesResult.rows.length; i++) {
        localCategories.push(categoriesResult.rows.item(i));
      }

      const localDishes = [];
      for (let i = 0; i < dishesResult.rows.length; i++) {
        localDishes.push(dishesResult.rows.item(i));
      }

      const localMenuData = localCategories.map(category => ({
        ...category,
        dishes: localDishes.filter(
          dish => dish.CategoryID === category.CategoryID,
        ),
      }));

      const { apiCategories, allDishesFromApi } =
        processMenuData(localMenuData);
      setCategories([{ id: 0, name: 'Tất cả' }, ...apiCategories]);
      setAllDishes(allDishesFromApi);
    } catch (error) {
      console.error('Failed to load menu from local DB:', error);
    } finally {
      setLoading(false);
    }

    // If online, fetch from network and merge
    if (!isConnected) {
      console.log('Device is offline. Using local menu data.');
      return;
    }

    try {
      console.log('Fetching menu from network...');
      const response = await axios.get(`${API_BASE_URL}/api/menu`);
      const networkMenuData = response.data;

      const { apiCategories, allDishesFromApi } =
        processMenuData(networkMenuData);
      setCategories([{ id: 0, name: 'Tất cả' }, ...apiCategories]);
      setAllDishes(allDishesFromApi);

      console.log('Menu displayed with network data.');
    } catch (error) {
      console.error('Lỗi khi lấy thực đơn từ API, dùng dữ liệu cục bộ.', error);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const getFilteredDishes = () => {
    if (selectedCategoryId === 0) return allDishes;
    return allDishes.filter(dish => dish.categoryId === selectedCategoryId);
  };

  const handleAddToCart = dish => {
    setSelectedDish(dish);
    setQuantity(1);
    setNotes('');
    setModalVisible(true);
  };

  const confirmAddToCart = () => {
    if (!selectedDish) return;
    setCart(currentCart => {
      const existingItemIndex = currentCart.findIndex(
        item => item.id === selectedDish.id && item.notes === notes,
      );
      if (existingItemIndex > -1) {
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        return [...currentCart, { ...selectedDish, quantity, notes }];
      }
    });
    setModalVisible(false);
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

  const renderDishItem = ({ item }) => (
    <DishItem item={item} onAddToCart={handleAddToCart} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#F9790E" />
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
        renderItem={renderDishItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContentContainer}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.modalView}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Số lượng</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <Icon name="remove-outline" size={24} color="#888" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(q => q + 1)}
                    >
                      <Icon name="add-outline" size={24} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Ghi chú"
                  placeholderTextColor="#aaa"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmAddToCart}
                >
                  <Text style={styles.confirmButtonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconContainer: {
    marginRight: 15,
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#F9790E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  categoryItemSelected: {
    borderBottomColor: '#F9790E',
  },
  categoryText: {
    fontSize: 16,
    color: '#888',
  },
  categoryTextSelected: {
    color: '#F9790E',
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    paddingTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#F9790E',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default MenuScreen;
