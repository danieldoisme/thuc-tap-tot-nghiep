import { enablePromise, openDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

const DATABASE_NAME = 'tttn-mobile.db';

export const getDBConnection = async () => {
  return openDatabase({ name: DATABASE_NAME, location: 'default' });
};

export const createTables = async db => {
  // Bảng Users
  const userTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        UserID INTEGER PRIMARY KEY,
        UserCode TEXT UNIQUE NOT NULL,
        FullName TEXT
    );`;

  // Bảng Tables
  const tableTableQuery = `
    CREATE TABLE IF NOT EXISTS tables (
        TableID INTEGER PRIMARY KEY,
        TableName TEXT NOT NULL,
        Status TEXT DEFAULT 'trống'
    );`;

  // Bảng Categories
  const categoryTableQuery = `
    CREATE TABLE IF NOT EXISTS categories (
        CategoryID INTEGER PRIMARY KEY,
        CategoryName TEXT NOT NULL
    );`;

  // Bảng Dishes
  const dishTableQuery = `
    CREATE TABLE IF NOT EXISTS dishes (
        DishID INTEGER PRIMARY KEY,
        DishName TEXT NOT NULL,
        Price REAL NOT NULL,
        ImageURL TEXT,
        CategoryID INTEGER,
        FOREIGN KEY (CategoryID) REFERENCES categories(CategoryID)
    );`;

  // Bảng Orders - Thêm cột temp_id để quản lý khi offline
  const orderTableQuery = `
    CREATE TABLE IF NOT EXISTS orders (
        OrderID INTEGER,
        TableID INTEGER NOT NULL,
        UserID INTEGER NOT NULL,
        OrderTime TEXT,
        TotalAmount REAL,
        Status TEXT DEFAULT 'chờ thanh toán',
        temp_id TEXT UNIQUE,
        sync_status TEXT DEFAULT 'synced'
    );`;

  // Bảng Order_Items - Thêm cột temp_id
  const orderItemTableQuery = `
    CREATE TABLE IF NOT EXISTS order_items (
        OrderItemID INTEGER,
        OrderID INTEGER,
        DishID INTEGER NOT NULL,
        Quantity INTEGER NOT NULL,
        Price REAL NOT NULL,
        Notes TEXT,
        Status TEXT DEFAULT 'đang chế biến',
        order_temp_id TEXT,
        sync_status TEXT DEFAULT 'synced'
    );`;

  // Bảng hàng đợi hành động
  const actionQueueQuery = `
    CREATE TABLE IF NOT EXISTS action_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0
    );`;

  try {
    await db.executeSql(userTableQuery);
    await db.executeSql(tableTableQuery);
    await db.executeSql(categoryTableQuery);
    await db.executeSql(dishTableQuery);
    await db.executeSql(orderTableQuery);
    await db.executeSql(orderItemTableQuery);
    await db.executeSql(actionQueueQuery);
    console.log('Tất cả các bảng đã được tạo thành công.');
  } catch (error) {
    console.error('Lỗi khi tạo bảng:', error);
    throw error;
  }
};

export const initDB = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
  } catch (error) {
    console.error('Lỗi khi khởi tạo CSDL:', error);
    throw error;
  }
};
