import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { databaseService } from './DatabaseService';
import { API_BASE_URL } from '../apiConfig';

class SyncService {
  isSyncing = false;
  isSyncUpRunning = false;

  constructor() {
    // Listen for network connection changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Connection is back online. Starting sync up...');
        this.syncUp();
      }
    });
  }

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

  async syncUp() {
    if (this.isSyncUpRunning) {
      console.log('syncUp is already running.');
      return;
    }
    this.isSyncUpRunning = true;

    try {
      const [pendingActions] = await databaseService.executeSql(
        "SELECT * FROM action_queue WHERE Status = 'pending';",
      );

      if (pendingActions.rows.length === 0) {
        console.log('No pending actions to sync.');
        return;
      }

      console.log(
        `Found ${pendingActions.rows.length} pending actions to sync.`,
      );

      for (let i = 0; i < pendingActions.rows.length; i++) {
        const action = pendingActions.rows.item(i);
        const payload = JSON.parse(action.Payload);

        try {
          if (action.ActionType === 'CREATE_ORDER') {
            // The server expects a different structure, let's adapt it
            const apiPayload = {
              tableId: payload.tableId,
              userId: payload.userId,
              items: payload.items,
              totalAmount: payload.totalAmount,
            };
            const response = await axios.post(
              `${API_BASE_URL}/api/orders`,
              apiPayload,
            );
            const { orderId, updatedTableStatus } = response.data;

            // Update local data with server response
            await databaseService.updateLocalOrderAfterSync(
              payload.clientOrderId,
              orderId,
            );
            await databaseService.updateTableStatus(
              payload.tableId,
              updatedTableStatus,
            );
          }
          // Mark action as successful
          await databaseService.executeSql(
            "UPDATE action_queue SET Status = 'success' WHERE ActionID = ?;",
            [action.ActionID],
          );
          console.log(`ActionID ${action.ActionID} synced successfully.`);
        } catch (error) {
          console.error(`Failed to sync ActionID ${action.ActionID}:`, error);
          await databaseService.executeSql(
            "UPDATE action_queue SET Status = 'failed' WHERE ActionID = ?;",
            [action.ActionID],
          );
        }
      }
    } catch (error) {
      console.error('Error during syncUp process:', error);
    } finally {
      this.isSyncUpRunning = false;
    }
  }
}

export const syncService = new SyncService();
