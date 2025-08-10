import React, { createContext, useState, useContext, useCallback } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const placeOrder = async (tableId, user) => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm món vào giỏ hàng.');
      return false;
    }

    const clientOrderId = `order-${Date.now()}`;
    const orderTime = new Date().toISOString();
    const userId = user.UserID;

    const subTotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const vatPercentage = 0.08; // 8%
    const vatAmount = subTotal * vatPercentage;
    const totalAmount = subTotal + vatAmount;

    const orderPayload = {
      clientOrderId,
      tableId,
      userId,
      orderTime,
      subTotal,
      vatAmount,
      totalAmount,
      status: 'chờ thanh toán',
      syncStatus: 'pending_create',
      items: cart.map(item => ({
        dishId: item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || '',
        status: 'đang chế biến',
      })),
    };

    try {
      const db = await databaseService.open();
      await db.transaction(tx => {
        // Insert the full order details
        tx.executeSql(
          `INSERT INTO orders (ClientOrderID, TableID, UserID, OrderTime, SubTotal, VAT_Percentage, VAT_Amount, TotalAmount, Status, SyncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            clientOrderId,
            tableId,
            userId,
            orderTime,
            subTotal,
            vatPercentage,
            vatAmount,
            totalAmount,
            'chờ thanh toán',
            'pending_create',
          ],
        );

        // Insert the full order item details
        orderPayload.items.forEach(item => {
          tx.executeSql(
            `INSERT INTO order_items (ClientOrderID, DishID, Quantity, Price, Notes, Status)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [
              clientOrderId,
              item.dishId,
              item.quantity,
              item.price,
              item.notes,
              item.status,
            ],
          );
        });

        // 3. Add to the action queue
        tx.executeSql(
          `INSERT INTO action_queue (ActionType, Payload) VALUES (?, ?);`,
          ['CREATE_ORDER', JSON.stringify(orderPayload)],
        );
      });

      Alert.alert('Thành công', 'Đã lưu đơn hàng. Sẽ gửi đến bếp khi có mạng.');
      clearCart();
      return true;
    } catch (error) {
      console.error('Failed to save order locally:', error);
      Alert.alert('Lỗi', 'Không thể lưu đơn hàng. Vui lòng thử lại.');
      return false;
    }
  };

  const value = { cart, setCart, clearCart, placeOrder };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
