import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// 导入屏幕组件
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import OrderHistoryScreen from '../screens/Profile/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import HelpScreen from '../screens/Profile/HelpScreen';
import AboutScreen from '../screens/Profile/AboutScreen';

// 导入类型
import type {ProfileStackParamList} from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

/**
 * 个人中心堆栈导航
 */
const ProfileStack: React.FC = () => {
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
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile'),
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: t('profile.editProfile'),
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('profile.settings'),
        }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: t('profile.orders'),
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
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: t('profile.changePassword'),
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: t('profile.notifications'),
        }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: t('profile.help'),
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: t('profile.about'),
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;