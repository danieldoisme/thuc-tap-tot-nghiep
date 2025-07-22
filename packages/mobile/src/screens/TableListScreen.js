import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { TABLES } from '../data/mockData';

const TableListScreen = ({ navigation }) => {
  const renderTable = ({ item }) => {
    const isOccupied = item.status === 'có khách';
    return (
      <TouchableOpacity
        style={styles.tableItem}
        onPress={() =>
          navigation.navigate('TableDetails', {
            tableId: item.id,
            tableName: item.name,
          })
        }
      >
        <View
          style={[
            styles.tableIcon,
            isOccupied ? styles.occupied : styles.empty,
          ]}
        ></View>
        <Text style={styles.tableName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={TABLES}
        renderItem={renderTable}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 10,
  },
  tableItem: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableIcon: {
    width: 80,
    height: 80,
    borderRadius: 15,
    marginBottom: 10,
  },
  occupied: {
    backgroundColor: '#FF9F1C',
  },
  empty: {
    backgroundColor: '#E0E0E0',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TableListScreen;
