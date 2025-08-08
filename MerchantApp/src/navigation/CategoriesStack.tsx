import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// 导入屏幕组件
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import CategoryDetailScreen from '../screens/Categories/CategoryDetailScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';

// 导入类型
import type {CategoriesStackParamList} from './types';

const Stack = createStackNavigator<CategoriesStackParamList>();

/**
 * 分类堆栈导航
 */
const CategoriesStack: React.FC = () => {
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
        name="CategoriesMain"
        component={CategoriesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={({route}) => ({
          title: route.params.categoryName,
        })}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{
          title: t('services.title'),
        }}
      />
    </Stack.Navigator>
  );
};

export default CategoriesStack;