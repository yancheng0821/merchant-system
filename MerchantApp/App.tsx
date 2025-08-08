import React, {useEffect} from 'react';
import {StatusBar, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';
// import {StripeProvider} from '@stripe/stripe-react-native';

// 导入国际化
import './src/i18n';

// 导入导航
import {RootNavigator} from './src/navigation';

// 导入服务初始化
// import {initializeStripe, initializeFCM} from './src/services';

// 导入主题配置
import {theme} from './src/theme/theme';

/**
 * 主应用组件
 * 
 * 功能包括：
 * - 手势处理根容器
 * - 安全区域提供者
 * - Material Design 主题提供者
 * - Stripe 支付提供者
 * - 路由导航
 * - 服务初始化（FCM推送、Stripe支付）
 */
const App: React.FC = () => {
  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Merchant App...');

        // // 初始化 Stripe 支付服务
        // const stripeInitialized = await initializeStripe();
        // if (stripeInitialized) {
        //   console.log('💳 Stripe payment service ready');
        // }

        // // 初始化 FCM 推送服务
        // const fcmInitialized = await initializeFCM();
        // if (fcmInitialized) {
        //   console.log('🔔 FCM notification service ready');
        // }

        console.log('✅ App initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          {/* <StripeProvider
            publishableKey="pk_test_your_stripe_key_here" // 替换为你的 Stripe 公钥
            urlScheme="MerchantApp" // 用于处理支付回调
            merchantIdentifier="merchant.com.yourcompany.merchantapp" // iOS Apple Pay
          > */}
            {/* 状态栏配置 */}
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
              backgroundColor="#6366F1"
              translucent={false}
            />
            
            {/* 主导航 */}
            <RootNavigator />
          {/* </StripeProvider> */}
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;