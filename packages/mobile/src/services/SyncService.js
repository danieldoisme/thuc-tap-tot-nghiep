import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { getDBConnection, saveTables, saveMenu } from './DatabaseService';

// Đồng bộ dữ liệu tĩnh (bàn, thực đơn) từ server về thiết bị
export const syncStaticData = async () => {
  try {
    console.log('Bắt đầu đồng bộ dữ liệu tĩnh...');
    const db = await getDBConnection();

    // Đồng bộ danh sách bàn
    const tablesResponse = await axios.get(`${API_BASE_URL}/api/tables`);
    await saveTables(db, tablesResponse.data);
    console.log('Đồng bộ danh sách bàn thành công.');

    // Đồng bộ thực đơn
    const menuResponse = await axios.get(`${API_BASE_URL}/api/menu`);
    await saveMenu(db, menuResponse.data);
    console.log('Đồng bộ thực đơn thành công.');

    console.log('Đồng bộ dữ liệu tĩnh hoàn tất.');
  } catch (error) {
    console.error('Lỗi trong quá trình đồng bộ dữ liệu tĩnh:', error);
    throw error;
  }
};
