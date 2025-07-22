import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ORDERS } from '../data/mockData';
import OrderItem from '../components/OrderItem';

const TableDetailsScreen = ({ route, navigation }) => {
  const { tableId } = route.params;
  const orderDetails = ORDERS[tableId] || [];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orderDetails}
        renderItem={({ item }) => <OrderItem item={item} />}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có món nào được gọi.</Text>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.buttonText}>+ Thêm món</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.paymentButton]}
          onPress={() =>
            navigation.navigate('Payment', {
              tableId: tableId,
              tableName: route.params.tableName,
            })
          }
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
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  footer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9F1C',
    marginRight: 10,
  },
  paymentButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TableDetailsScreen;
