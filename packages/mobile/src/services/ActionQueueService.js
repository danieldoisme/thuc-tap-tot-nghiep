import { getDBConnection } from './DatabaseService';
import { API_BASE_URL } from '../apiConfig';
import axios from 'axios';

// Thêm một tác vụ đặt hàng vào hàng đợi
export const addOrderToActionQueue = async orderData => {
  const db = await getDBConnection();
  const payload = JSON.stringify(orderData);
  const query = `
    INSERT INTO action_queue (endpoint, method, payload, created_at)
    VALUES (?, ?, ?, ?);
  `;
  await db.executeSql(query, [
    `${API_BASE_URL}/api/orders`,
    'POST',
    payload,
    new Date().toISOString(),
  ]);
  console.log('Đã thêm tác vụ đặt hàng vào hàng đợi.');
};

// Xử lý các tác vụ trong hàng đợi
export const processActionQueue = async () => {
  const db = await getDBConnection();
  const [results] = await db.executeSql(
    'SELECT * FROM action_queue ORDER BY id ASC;',
  );
  const actions = [];
  for (let i = 0; i < results.rows.length; i++) {
    actions.push(results.rows.item(i));
  }

  if (actions.length === 0) {
    console.log('Hàng đợi trống, không có gì để xử lý.');
    return;
  }

  console.log(`Đang xử lý ${actions.length} tác vụ trong hàng đợi...`);

  for (const action of actions) {
    try {
      const payload = JSON.parse(action.payload);
      // Thực hiện gọi API
      await axios({
        method: action.method,
        url: action.endpoint,
        data: payload,
      });

      // Nếu thành công, xóa tác vụ khỏi hàng đợi
      await db.executeSql('DELETE FROM action_queue WHERE id = ?;', [
        action.id,
      ]);
      console.log(`Tác vụ #${action.id} đã xử lý thành công.`);
    } catch (error) {
      console.error(`Lỗi khi xử lý tác vụ #${action.id}:`, error);
      // Tăng số lần thử lại
      await db.executeSql(
        'UPDATE action_queue SET attempts = attempts + 1 WHERE id = ?;',
        [action.id],
      );
    }
  }
};
