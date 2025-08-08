import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useTranslation} from 'react-i18next';

// 导入屏幕组件
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import VerifyResetScreen from '../screens/Auth/VerifyResetScreen';

// 导入类型
import type {AuthStackParamList} from './types';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * 认证相关的堆栈导航
 * 包含登录、注册、忘记密码等页面
 */
const AuthStack: React.FC = () => {
  const {t} = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // 隐藏默认头部
        gestureEnabled: true, // 启用手势返回
        animationTypeForReplace: 'push', // 替换动画类型
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: t('auth.login'),
          // 首次进入时不显示返回按钮
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: t('auth.register'),
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: t('auth.forgotPassword'),
          headerShown: true,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="VerifyReset"
        component={VerifyResetScreen}
        options={{
          title: '重置密码',
          headerShown: true,
          headerBackTitleVisible: false,
          // 验证重置密码页面不允许返回
          gestureEnabled: false,
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;