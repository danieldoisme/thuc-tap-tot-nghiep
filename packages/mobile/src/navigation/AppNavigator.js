import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import TableListScreen from '../screens/TableListScreen';
import TableDetailsScreen from '../screens/TableDetailsScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF9F1C',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TableList"
          component={TableListScreen}
          options={{ title: 'Danh sách bàn ăn' }}
        />
        <Stack.Screen
          name="TableDetails"
          component={TableDetailsScreen}
          options={({ route }) => ({
            title: `Chi tiết ${route.params.tableName}`,
          })}
        />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ title: 'Thực đơn' }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: 'Xác nhận món đã chọn' }}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
          options={({ route }) => ({
            title: `Thanh toán ${route.params.tableName}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
