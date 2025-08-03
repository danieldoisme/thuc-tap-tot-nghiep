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
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import DishItem from '../components/DishItem';
import { useCart } from '../context/CartContext';
import { getDBConnection } from '../services/DatabaseService';
import { API_BASE_URL } from '../apiConfig'; // Để lấy đường dẫn ảnh

const MenuScreen = ({ route, navigation }) => {
  const { tableId, tableName, user } = route.params;
  const { cart, setCart } = useCart();

  // State cho modal thêm món
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // State cho dữ liệu
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]); // State duy nhất cho menu
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Lấy dữ liệu từ CSDL cục bộ khi màn hình được mở
  useEffect(() => {
    const fetchMenuFromLocalDB = async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();
        // Lấy danh sách các danh mục
        const [categoryResults] = await db.executeSql(
          'SELECT * FROM categories',
        );
        const categoriesFromDB = [];
        for (let i = 0; i < categoryResults.rows.length; i++) {
          categoriesFromDB.push(categoryResults.rows.item(i));
        }

        // Lấy tất cả các món ăn
        const [dishResults] = await db.executeSql('SELECT * FROM dishes');
        const dishesFromDB = [];
        for (let i = 0; i < dishResults.rows.length; i++) {
          dishesFromDB.push(dishResults.rows.item(i));
        }

        // Sắp xếp thứ tự ưu tiên cho danh mục
        const desiredOrder = ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống'];
        categoriesFromDB.sort((a, b) => {
          const indexA = desiredOrder.indexOf(a.name);
          const indexB = desiredOrder.indexOf(b.name);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        // Gộp món ăn vào từng danh mục tương ứng
        const fullMenu = categoriesFromDB.map(category => ({
          ...category,
          dishes: dishesFromDB.filter(dish => dish.category_id === category.id),
        }));

        setMenu(fullMenu);
        if (fullMenu.length > 0) {
          setSelectedCategoryId(fullMenu[0].id); // Chọn danh mục đầu tiên làm mặc định
        }
      } catch (error) {
        console.error('Lỗi lấy thực đơn từ CSDL cục bộ', error);
        Alert.alert('Lỗi', 'Không thể tải được thực đơn.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuFromLocalDB();
  }, []);

  // Cập nhật header của navigation
  useEffect(() => {
    navigation.setOptions({
      title: tableName,
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Cart', { tableId, tableName, user })
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

  // Hàm xử lý khi nhấn nút "Thêm" món ăn
  const handleOpenModal = dish => {
    setSelectedDish(dish);
    setQuantity(1);
    setNotes('');
    setModalVisible(true);
  };

  // Hàm xử lý khi xác nhận thêm món từ modal
  const handleConfirmAddToCart = () => {
    if (!selectedDish) return;

    setCart(currentCart => {
      const existingItemIndex = currentCart.findIndex(
        item => item.id === selectedDish.id && item.notes === notes,
      );

      if (existingItemIndex > -1) {
        // Nếu món đã có và ghi chú giống hệt -> tăng số lượng
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        // Nếu là món mới hoặc ghi chú khác -> thêm mới vào giỏ hàng
        const newCartItem = {
          id: selectedDish.id,
          name: selectedDish.name,
          price: selectedDish.price,
          image: selectedDish.image,
          quantity: quantity,
          notes: notes,
        };
        return [...currentCart, newCartItem];
      }
    });

    setModalVisible(false);
  };

  // Lấy danh sách món ăn đã được lọc theo danh mục đang chọn
  const getFilteredDishes = () => {
    if (!selectedCategoryId) {
      return [];
    }
    const selectedCategory = menu.find(cat => cat.id === selectedCategoryId);
    return selectedCategory ? selectedCategory.dishes : [];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#F9790E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Danh sách danh mục */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={menu}
          renderItem={({ item }) => (
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
          )}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Lưới các món ăn */}
      <FlatList
        data={getFilteredDishes()}
        renderItem={({ item }) => (
          <DishItem
            item={{
              ...item,
              image: item.image ? `${API_BASE_URL}/${item.image}` : null,
            }}
            onAddToCart={handleOpenModal}
          />
        )}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContentContainer}
      />

      {/* Modal để thêm món ăn */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDish?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close-circle" size={30} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Số lượng</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityButton}
              >
                <Icon name="remove-circle-outline" size={32} color="#F9790E" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={styles.quantityButton}
              >
                <Icon name="add-circle-outline" size={32} color="#F9790E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Ghi chú</Text>
            <TextInput
              style={styles.notesInput}
              onChangeText={setNotes}
              value={notes}
              placeholder="VD: Ít cay, không hành..."
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAddToCart}
            >
              <Text style={styles.confirmButtonText}>
                Thêm vào giỏ -{' '}
                {(selectedDish?.price * quantity).toLocaleString('vi-VN')} VNĐ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconContainer: {
    marginRight: 15,
    padding: 5,
  },
  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#F9790E',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  listContentContainer: {
    paddingHorizontal: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30, // Thêm padding cho an toàn
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
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 15,
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    padding: 10,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#F9790E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MenuScreen;
