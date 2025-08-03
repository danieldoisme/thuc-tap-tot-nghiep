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

// Hàm lưu danh sách bàn vào CSDL cục bộ
export const saveTables = async (db, tables) => {
  const insertQuery = `
    INSERT OR REPLACE INTO tables (TableID, TableName, Status) VALUES (?, ?, ?);
  `;
  return db.transaction(tx => {
    tx.executeSql('DELETE FROM tables;');
    tables.forEach(table => {
      tx.executeSql(insertQuery, [
        table.TableID,
        table.TableName,
        table.Status,
      ]);
    });
  });
};

// Hàm lưu thực đơn (danh mục và món ăn) vào CSDL cục bộ
export const saveMenu = async (db, menu) => {
  const insertCategoryQuery = `
    INSERT OR REPLACE INTO categories (CategoryID, CategoryName) VALUES (?, ?);
  `;
  const insertDishQuery = `
    INSERT OR REPLACE INTO dishes (DishID, DishName, Price, ImageURL, CategoryID) VALUES (?, ?, ?, ?, ?);
  `;

  return db.transaction(tx => {
    // Xóa dữ liệu cũ
    tx.executeSql('DELETE FROM dishes;');
    tx.executeSql('DELETE FROM categories;');

    // Chèn dữ liệu mới
    menu.forEach(category => {
      tx.executeSql(insertCategoryQuery, [
        category.CategoryID,
        category.CategoryName,
      ]);
      category.dishes.forEach(dish => {
        tx.executeSql(insertDishQuery, [
          dish.DishID,
          dish.DishName,
          dish.Price,
          dish.ImageURL,
          category.CategoryID,
        ]);
      });
    });
  });
};

// Hàm lấy danh sách tất cả các bàn từ CSDL cục bộ
export const getLocalTables = async db => {
  try {
    const tables = [];
    const results = await db.executeSql('SELECT * FROM tables;');
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        tables.push(result.rows.item(i));
      }
    });
    return tables;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bàn từ CSDL cục bộ:', error);
    throw error;
  }
};

// Hàm lấy thực đơn từ CSDL cục bộ
export const getLocalMenu = async db => {
  try {
    const menu = [];
    const categories = [];
    // Lấy tất cả danh mục
    const catResults = await db.executeSql('SELECT * FROM categories;');
    catResults.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        categories.push(result.rows.item(i));
      }
    });

    // Lấy tất cả món ăn
    const dishes = [];
    const dishResults = await db.executeSql('SELECT * FROM dishes;');
    dishResults.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        dishes.push(result.rows.item(i));
      }
    });

    // Ghép món ăn vào danh mục tương ứng
    categories.forEach(category => {
      menu.push({
        ...category,
        dishes: dishes.filter(d => d.CategoryID === category.CategoryID),
      });
    });

    return menu;
  } catch (error) {
    console.error('Lỗi khi lấy thực đơn từ CSDL cục bộ:', error);
    throw error;
  }
};
