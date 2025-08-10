import axios from 'axios';
import { databaseService } from './DatabaseService';
import { API_BASE_URL } from '../apiConfig';

class SyncService {
  isSyncing = false;

  async syncInitialData() {
    if (this.isSyncing) {
      console.log('Sync already in progress.');
      return;
    }
    this.isSyncing = true;
    console.log('Starting initial data sync...');

    try {
      // Fetch all data in parallel
      const [tablesRes, menuRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tables`),
        axios.get(`${API_BASE_URL}/api/menu`),
      ]);

      const menuData = menuRes.data;

      const categories = menuData.map(({ dishes, ...category }) => category);
      const dishes = menuData.flatMap(category => category.dishes);

      // Save data to local DB
      await databaseService.syncTables(tablesRes.data);
      await databaseService.syncCategories(categories);
      await databaseService.syncDishes(dishes);

      console.log('Initial data sync completed successfully.');
    } catch (error) {
      console.error('Failed to sync initial data:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Placeholder for Phase 3
  async syncUp() {
    console.log('Checking for pending actions to sync up...');
    // This will be implemented later
  }
}

export const syncService = new SyncService();
