import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

const socket = io(API_BASE_URL);

const TableIcon = ({ isOccupied }) => {
  const squareColor = isOccupied ? '#F9790E' : '#E0E0E0';
  return (
    <View style={styles.tableIconContainer}>
      <View
        style={[styles.tableIconSquare, { backgroundColor: squareColor }]}
      />
      <View
        style={[styles.tableIconSquare, { backgroundColor: squareColor }]}
      />
      <View
        style={[styles.tableIconSquare, { backgroundColor: squareColor }]}
      />
      <View
        style={[styles.tableIconSquare, { backgroundColor: squareColor }]}
      />
    </View>
  );
};

const TableListScreen = ({ navigation, route }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: 'Danh sách bàn ăn',
      headerStyle: {
        backgroundColor: '#F9790E',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 22,
      },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
    });
  }, [navigation]);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tables`);
      const formattedData = response.data.map(table => ({
        id: table.TableID.toString(),
        name: table.TableName,
        status: table.Status,
      }));
      setTables(formattedData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bàn:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTables();
    }, [fetchTables]),
  );

  useEffect(() => {
    const handleTableStatusUpdate = ({ tableId, status }) => {
      setTables(currentTables =>
        currentTables.map(table =>
          table.id === tableId.toString() ? { ...table, status } : table,
        ),
      );
    };

    socket.on('table_status_updated', handleTableStatusUpdate);

    return () => {
      socket.off('table_status_updated', handleTableStatusUpdate);
    };
  }, []);

  const renderTable = ({ item }) => {
    const isOccupied = item.status === 'có khách';
    return (
      <TouchableOpacity
        style={styles.tableItem}
        onPress={() =>
          navigation.navigate('TableDetails', {
            tableId: item.id,
            tableName: item.name,
            user: route.params.user,
          })
        }
      >
        <TableIcon isOccupied={isOccupied} />
        <Text style={styles.tableName}>{item.name}</Text>
      </TouchableOpacity>
    );
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
      <FlatList
        data={tables}
        renderItem={renderTable}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="grid-outline" size={24} color="#F9790E" />
          <Text style={[styles.footerButtonText, styles.activeText]}>Bàn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() =>
            navigation.navigate('Profile', { user: route.params.user })
          }
        >
          <Ionicons name="person-outline" size={24} color="#888" />
          <Text style={styles.footerButtonText}>Tài khoản</Text>
        </TouchableOpacity>
      </View>
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
  list: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  tableItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 30,
  },
  tableIconContainer: {
    width: 120,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginBottom: 10,
  },
  tableIconSquare: {
    width: '47%',
    height: '47%',
    borderRadius: 15,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 5,
  },
  footerButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  activeText: {
    color: '#F9790E',
    fontWeight: 'bold',
  },
});

export default TableListScreen;
