import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import io from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';

const socket = io(API_BASE_URL);

const TableListScreen = ({ navigation, route }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
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
  empty: {
    backgroundColor: '#E0E0E0',
  },
  occupied: {
    backgroundColor: '#FF9F1C',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TableListScreen;
