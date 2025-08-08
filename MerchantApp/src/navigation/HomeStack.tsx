import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// 导入屏幕组件
import HomeScreen from '../screens/Home/HomeScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import MerchantDetailScreen from '../screens/MerchantDetailScreen';
import SearchScreen from '../screens/SearchScreen';

// 导入类型
import type {HomeStackParamList} from './types';

const Stack = createStackNavigator<HomeStackParamList>();

/**
 * 首页堆栈导航
 */
const HomeStack: React.FC = () => {
  const {t} = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366F1',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          headerShown: false, // 首页不显示头部（自定义头部）
        }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={({route}) => ({
          title: t('services.title'),
          headerShown: true,
        })}
      />
      <Stack.Screen
        name="MerchantDetail"
        component={MerchantDetailScreen}
        options={({route}) => ({
          title: '商户详情',
          headerShown: true,
        })}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t('common.search'),
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;