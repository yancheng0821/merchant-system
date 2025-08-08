import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar} from 'react-native';

// 导入导航组件
import AuthStack from './AuthStack';
import BottomTabs from './BottomTabs';

// 导入其他页面组件
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import MerchantDetailScreen from '../screens/MerchantDetailScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import MapViewScreen from '../screens/MapViewScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import OrderHistoryScreen from '../screens/Profile/OrderHistoryScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import HelpScreen from '../screens/Profile/HelpScreen';
import AboutScreen from '../screens/Profile/AboutScreen';

// 导入状态管理
import {useAuthStore} from '../store';

// 导入类型
import type {RootStackParamList} from './types';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * 根导航容器
 */
const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuthStore();
  const [isAppReady, setIsAppReady] = useState(false);

  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 这里可以添加应用初始化逻辑
        // 例如：检查更新、预加载资源等
        
        // 模拟初始化时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsAppReady(true);
        
        // 启动屏已隐藏 (无需第三方库)
      } catch (error) {
        console.error('App initialization error:', error);
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // 应用未准备好时显示启动屏或加载状态
  if (!isAppReady || isLoading) {
    // 这里可以显示自定义的启动屏组件
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#6366F1" 
        translucent={false}
      />
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
          gestureEnabled: true,
        }}>
        
        {/* 根据认证状态显示不同的导航栈 */}
        {!isAuthenticated ? (
          // 未认证 - 显示认证页面
          <Stack.Screen
            name="AuthStack"
            component={AuthStack}
            options={{headerShown: false}}
          />
        ) : (
          // 已认证 - 显示主应用
          <>
            <Stack.Screen
              name="MainTabs"
              component={BottomTabs}
              options={{headerShown: false}}
            />
            
            {/* 模态页面 - 这些页面会覆盖整个屏幕 */}
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{
                title: '服务详情',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="MerchantDetail"
              component={MerchantDetailScreen}
              options={{
                title: '商户详情',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                title: '订单详情',
              }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{
                title: '结算',
              }}
            />
            <Stack.Screen
              name="MapView"
              component={MapViewScreen}
              options={{
                title: '地图',
                presentation: 'fullScreenModal',
              }}
            />
            
            {/* 设置相关页面 */}
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: '设置',
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                title: '编辑资料',
              }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{
                title: '修改密码',
              }}
            />
            <Stack.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={{
                title: '订单历史',
              }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{
                title: '搜索',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                title: '通知',
              }}
            />
            <Stack.Screen
              name="Help"
              component={HelpScreen}
              options={{
                title: '帮助',
              }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{
                title: '关于',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;