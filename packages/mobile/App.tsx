import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { databaseService } from './src/services/DatabaseService';

const App = () => {
  useEffect(() => {
    // Runs once when the app component mounts
    const initializeApp = async () => {
      try {
        await databaseService.initDB();
      } catch (error) {
        console.error('Failed to initialize the database', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <CartProvider>
      <AppNavigator />
    </CartProvider>
  );
};

export default App;
