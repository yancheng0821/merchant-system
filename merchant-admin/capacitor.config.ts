import type { CapacitorConfig } from '@capacitor/cli';

// 开发模式：使用 live reload
const devConfig: CapacitorConfig = {
  appId: 'com.vamerchant.app',
  appName: 'VA Merchant',
  webDir: 'build',

  // 开发服务器配置 - 启用 Live Reload
  server: {
    // 使用本机 IP，让模拟器可以访问
    url: 'http://192.168.1.154:3000',
    cleartext: true, // 允许 HTTP（非 HTTPS）
    allowNavigation: ['*.stripe.com', '*.google.com']
  },

  // iOS 配置
  ios: {
    scheme: 'VA Merchant',
    contentInset: 'automatic'
  },

  // Android 配置
  android: {
    allowMixedContent: true, // 开发时允许混合内容
    backgroundColor: '#1a1a1a'
  },

  // 插件配置
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 3000,  // 显示3秒，或直到手动隐藏
      launchAutoHide: false,  // 手动隐藏，等 Web 加载完成
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

// 生产模式：使用打包的静态文件
const prodConfig: CapacitorConfig = {
  appId: 'com.vamerchant.app',
  appName: 'VA Merchant',
  webDir: 'build',

  // 服务器配置
  server: {
    // 允许导航到外部链接（如 Stripe 支付页面）
    allowNavigation: ['*.stripe.com', '*.google.com']
  },

  // iOS 配置
  ios: {
    scheme: 'VA Merchant',
    contentInset: 'automatic'
  },

  // Android 配置
  android: {
    allowMixedContent: false,
    backgroundColor: '#1a1a1a'
  },

  // 插件配置
  plugins: {
    // 推送通知
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },

    // 启动画面
    SplashScreen: {
      launchShowDuration: 3000,  // 显示3秒，或直到手动隐藏
      launchAutoHide: false,  // 手动隐藏，等 Web 加载完成
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },

    // 键盘
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

// 切换配置：开发时用 devConfig，发布时改为 prodConfig
// const config = devConfig;
const config = prodConfig;

export default config;
