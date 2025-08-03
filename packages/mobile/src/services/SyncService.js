import axios from 'axios';
import { getDBConnection } from './DatabaseService';
import { API_BASE_URL } from '../apiConfig';

export const syncStaticData = async () => {
  console.log('Bắt đầu đồng bộ dữ liệu tĩnh...');
  try {
    const db = await getDBConnection();
    const response = await axios.get(`${API_BASE_URL}/api/menu`);
    const menu = response.data;

    await db.transaction(async tx => {
      await tx.executeSql('DELETE FROM dishes');
      await tx.executeSql('DELETE FROM categories');

      for (const category of menu) {
        await tx.executeSql('INSERT INTO categories (id, name) VALUES (?, ?)', [
          category.id,
          category.name,
        ]);
        for (const dish of category.dishes) {
          await tx.executeSql(
            'INSERT INTO dishes (id, name, price, image, category_id) VALUES (?, ?, ?, ?, ?)',
            [dish.id, dish.name, dish.price, dish.image, category.id],
          );
        }
      }
    });

    console.log('Đồng bộ thực đơn thành công!');
  } catch (error) {
    console.error('Lỗi khi đồng bộ dữ liệu tĩnh:', error);
  }
};
