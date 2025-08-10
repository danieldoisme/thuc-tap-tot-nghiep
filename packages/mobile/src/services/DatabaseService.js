import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DATABASE_NAME = 'tttn.db';

class DatabaseService {
  db = null;

  // Open the database connection
  async open() {
    if (this.db) {
      return this.db;
    }
    this.db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });
    return this.db;
  }

  // Method to execute SQL queries
  async executeSql(sql, params = []) {
    const db = await this.open();
    return db.executeSql(sql, params);
  }

  // Initialize the database
  async initDB() {
    const db = await this.open();
    await db.transaction(tx => {
      console.log('Initializing database tables...');

      // Users Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          UserID INTEGER PRIMARY KEY, 
          UserCode TEXT UNIQUE, 
          FullName TEXT
        );
      `);

      // Tables Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS tables (
          TableID INTEGER PRIMARY KEY, 
          TableName TEXT NOT NULL, 
          Status TEXT DEFAULT 'trống'
        );
      `);

      // Categories Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS categories (
          CategoryID INTEGER PRIMARY KEY, 
          CategoryName TEXT NOT NULL
        );
      `);

      // Dishes Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS dishes (
          DishID INTEGER PRIMARY KEY, 
          DishName TEXT NOT NULL, 
          Price REAL NOT NULL, 
          ImageURL TEXT, 
          LocalImageURL TEXT,
          CategoryID INTEGER
        );
      `);

      // Orders Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS orders (
          ClientOrderID TEXT PRIMARY KEY,
          ServerOrderID INTEGER,
          TableID INTEGER,
          UserID INTEGER,
          OrderTime TEXT,
          SubTotal REAL,
          VAT_Percentage REAL,
          VAT_Amount REAL,
          TotalAmount REAL,
          Status TEXT, -- Business status ('chờ thanh toán', etc.)
          SyncStatus TEXT -- Sync status ('synced', 'pending_create')
        );
      `);

      // Order Items Table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS order_items (
          OrderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
          ClientOrderID TEXT,
          ServerOrderItemID INTEGER,
          DishID INTEGER,
          Quantity INTEGER NOT NULL,
          Price REAL NOT NULL,
          Notes TEXT,
          Status TEXT
        );
      `);

      // The critical queue for offline actions
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS action_queue (
          ActionID INTEGER PRIMARY KEY AUTOINCREMENT,
          ActionType TEXT NOT NULL,
          Payload TEXT NOT NULL,
          Status TEXT DEFAULT 'pending',
          CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    });
    console.log('Database initialized successfully.');
  }

  // --- SYNC METHODS ---

  async syncTables(tables = []) {
    if (tables.length === 0) return;
    const db = await this.open();
    await db.transaction(tx => {
      tables.forEach(table => {
        tx.executeSql(
          'INSERT OR REPLACE INTO tables (TableID, TableName, Status) VALUES (?, ?, ?);',
          [table.TableID, table.TableName, table.Status],
        );
      });
    });
    console.log(`Synced ${tables.length} tables.`);
  }

  async syncCategories(categories = []) {
    if (categories.length === 0) return;
    const db = await this.open();
    await db.transaction(tx => {
      categories.forEach(category => {
        tx.executeSql(
          'INSERT OR REPLACE INTO categories (CategoryID, CategoryName) VALUES (?, ?);',
          [category.CategoryID, category.CategoryName],
        );
      });
    });
    console.log(`Synced ${categories.length} categories.`);
  }

  async syncDishes(dishes = []) {
    if (dishes.length === 0) return;
    const db = await this.open();
    await db.transaction(tx => {
      dishes.forEach(dish => {
        tx.executeSql(
          'INSERT OR REPLACE INTO dishes (DishID, DishName, Price, ImageURL, LocalImageURL, CategoryID) VALUES (?, ?, ?, ?, ?, ?);',
          [
            dish.DishID,
            dish.DishName,
            dish.Price,
            dish.ImageURL,
            dish.LocalImageURL,
            dish.CategoryID,
          ],
        );
      });
    });
    console.log(`Synced ${dishes.length} dishes.`);
  }

  // --- HELPER METHODS ---

  async updateTableStatus(tableId, status) {
    await this.executeSql('UPDATE tables SET Status = ? WHERE TableID = ?;', [
      status,
      tableId,
    ]);
    console.log(`Updated status for TableID ${tableId} to ${status}`);
  }

  async updateLocalOrderAfterSync(clientOrderId, serverOrderId, status) {
    await this.executeSql(
      'UPDATE orders SET ServerOrderID = ?, Status = ? WHERE ClientOrderID = ?;',
      [serverOrderId, status, clientOrderId],
    );
    console.log(
      `Synced local order ${clientOrderId} with ServerOrderID ${serverOrderId} and Status ${status}`,
    );
  }

  async syncOrderDetails(order, items) {
    if (!order || !items) return;

    const db = await this.open();
    await db.transaction(tx => {
      const clientOrderId =
        order.ClientOrderID || `client-online-${order.OrderID}`;

      tx.executeSql(
        `INSERT OR REPLACE INTO orders (ServerOrderID, ClientOrderID, TableID, UserID, OrderTime, SubTotal, VAT_Percentage, VAT_Amount, TotalAmount, Status, SyncStatus) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          order.OrderID,
          clientOrderId,
          order.TableID,
          order.UserID,
          order.OrderTime,
          order.SubTotal,
          order.VAT_Percentage,
          order.VAT_Amount,
          order.TotalAmount,
          order.Status,
          'synced',
        ],
      );

      // Delete old items for this order
      tx.executeSql('DELETE FROM order_items WHERE ClientOrderID = ?;', [
        clientOrderId,
      ]);

      // Insert the fresh list of items with their individual statuses
      items.forEach(item => {
        tx.executeSql(
          `INSERT INTO order_items (ClientOrderID, ServerOrderItemID, DishID, Quantity, Price, Notes, Status) 
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            clientOrderId,
            item.OrderItemID,
            item.DishID,
            item.Quantity,
            item.Price,
            item.Notes,
            item.Status,
          ],
        );
      });
    });
    console.log(
      `Successfully synced details for OrderID ${order.OrderID} to local DB.`,
    );
  }
}

export const databaseService = new DatabaseService();
