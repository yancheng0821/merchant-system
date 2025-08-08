import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// 导入屏幕组件
import CartScreen from '../screens/Cart/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

// 导入类型
import type {CartStackParamList} from './types';

const Stack = createStackNavigator<CartStackParamList>();

/**
 * 购物车堆栈导航
 */
const CartStack: React.FC = () => {
  const {t} = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        },
        headerTintColor: '#1e293b',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="CartMain"
        component={CartScreen}
        options={{
          title: t('navigation.cart'),
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: t('cart.checkout'),
        }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{
          title: '订单详情',
        }}
      />
    </Stack.Navigator>
  );
};

export default CartStack;