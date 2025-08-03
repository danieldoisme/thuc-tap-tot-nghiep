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

  // Bảng Orders
  const orderTableQuery = `
  CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER UNIQUE,
      temp_id TEXT UNIQUE NOT NULL,
      table_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_time TEXT NOT NULL,
      total_amount REAL,
      status TEXT DEFAULT 'chờ thanh toán',
      sync_status TEXT NOT NULL DEFAULT 'synced'
  );`;

  // Bảng Order_Items
  const orderItemTableQuery = `
  CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER UNIQUE,
      order_temp_id TEXT NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'đang chế biến'
  );`;

  // Bảng hàng đợi hành động
  const actionQueueQuery = `
  CREATE TABLE IF NOT EXISTS action_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
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
