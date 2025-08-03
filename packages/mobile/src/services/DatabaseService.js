import { enablePromise, openDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

const DATABASE_NAME = 'restaurant.db';

let db;

export const getDBConnection = async () => {
  if (db) {
    return db;
  }
  db = await openDatabase({ name: DATABASE_NAME, location: 'default' });
  return db;
};

export const createTables = async db => {
  const tablesQuery = `
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        category_id INTEGER,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    );
    CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL
    );
  `;
  const queries = tablesQuery.split(';').filter(q => q.trim() !== '');
  for (const query of queries) {
    await db.executeSql(query);
  }
};

export const initDB = async () => {
  const db = await getDBConnection();
  await createTables(db);
  console.log('Cơ sở dữ liệu đã khởi tạo thành công!');
};
