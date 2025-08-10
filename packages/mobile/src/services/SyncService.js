import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
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
      const [tablesRes, menuRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/tables`),
        axios.get(`${API_BASE_URL}/api/menu`),
      ]);

      const menuData = menuRes.data;
      const categories = menuData.map(({ dishes, ...category }) => category);
      const dishesFromServer = menuData.flatMap(category => category.dishes);

      console.log('Starting image download process...');
      const imageDirectory = `${RNFS.DocumentDirectoryPath}/dish_images`;
      await RNFS.mkdir(imageDirectory);

      const dishesWithLocalImages = await Promise.all(
        dishesFromServer.map(async dish => {
          if (!dish.ImageURL) {
            return { ...dish, LocalImageURL: null };
          }

          const remoteUrl = `${API_BASE_URL}/${dish.ImageURL}`;
          const localPath = `${imageDirectory}/${dish.DishID}.jpg`;

          try {
            const downloadResult = await RNFS.downloadFile({
              fromUrl: remoteUrl,
              toFile: localPath,
            }).promise;

            if (downloadResult.statusCode === 200) {
              return { ...dish, LocalImageURL: `file://${localPath}` };
            }
          } catch (error) {
            console.warn(
              `Failed to download image for dish ${dish.DishID}:`,
              error,
            );
          }
          return { ...dish, LocalImageURL: null };
        }),
      );

      await databaseService.syncTables(tablesRes.data);
      await databaseService.syncCategories(categories);
      await databaseService.syncDishes(dishesWithLocalImages);

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

      for (let i = 0; i < pendingActions.rows.length; i++) {
        const action = pendingActions.rows.item(i);
        const payload = JSON.parse(action.Payload);

        try {
          if (action.ActionType === 'CREATE_ORDER') {
            const apiPayload = {
              clientOrderId: payload.clientOrderId,
              tableId: payload.tableId,
              userId: payload.userId,
              items: payload.items,
              totalAmount: payload.totalAmount,
              subTotal: payload.subTotal,
              vatAmount: payload.vatAmount,
            };
            const response = await axios.post(
              `${API_BASE_URL}/api/orders`,
              apiPayload,
            );
            const { orderId } = response.data;

            // Update the local order with the ServerOrderID and set SyncStatus to 'synced'
            await databaseService.executeSql(
              "UPDATE orders SET ServerOrderID = ?, SyncStatus = 'synced' WHERE ClientOrderID = ?;",
              [orderId, payload.clientOrderId],
            );
          }
          // Mark action as successful
          await databaseService.executeSql(
            "UPDATE action_queue SET Status = 'success' WHERE ActionID = ?;",
            [action.ActionID],
          );
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
