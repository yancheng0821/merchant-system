import messaging, {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Cloud Messaging (FCM) 推送通知服务
 */

// 存储键
const FCM_TOKEN_KEY = 'fcm_token';
const NOTIFICATION_PERMISSION_KEY = 'notification_permission_granted';

/**
 * FCM 推送服务类
 */
export class FCMService {
  private static instance: FCMService;
  private fcmToken: string | null = null;
  private unsubscribeFromMessages: (() => void) | null = null;

  private constructor() {}

  /**
   * 获取 FCM 服务单例
   */
  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * 初始化 FCM 服务
   * 在应用启动时调用
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Initializing FCM service...');

      // 检查推送权限
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ Push notification permission denied');
        return false;
      }

      // 获取 FCM 令牌
      await this.getFCMToken();

      // 设置消息处理器
      this.setupMessageHandlers();

      // 处理应用启动时的通知
      await this.handleInitialNotification();

      console.log('✅ FCM service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ FCM initialization failed:', error);
      return false;
    }
  }

  /**
   * 请求推送通知权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      // 检查现有权限
      const authStatus = await messaging().requestPermission();
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Push notification permission granted');
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
        return true;
      }

      // Android 额外权限处理
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: '推送通知权限',
            message: '允许应用发送推送通知以便及时获取订单更新和促销信息',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
          return true;
        }
      }

      console.warn('⚠️ Push notification permission denied');
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
      return false;
    } catch (error) {
      console.error('❌ Request permission failed:', error);
      return false;
    }
  }

  /**
   * 获取 FCM 令牌
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // 尝试从缓存获取
      if (this.fcmToken) {
        return this.fcmToken;
      }

      // 从本地存储获取
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // 获取新令牌
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        
        // 发送令牌到服务器
        await this.sendTokenToServer(token);
        
        console.log('📱 FCM token obtained:', token.substring(0, 20) + '...');
        return token;
      }

      return null;
    } catch (error) {
      console.error('❌ Get FCM token failed:', error);
      return null;
    }
  }

  /**
   * 发送令牌到服务器
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // 这里应该调用你的后端API来保存FCM令牌
      // await httpRequest.post('/users/fcm-token', {
      //   token,
      //   platform: Platform.OS,
      //   deviceId: await DeviceInfo.getUniqueId(),
      // });

      console.log('📤 FCM token sent to server');
    } catch (error) {
      console.error('❌ Send FCM token to server failed:', error);
    }
  }

  /**
   * 设置消息处理器
   */
  private setupMessageHandlers(): void {
    // 前台消息处理
    this.unsubscribeFromMessages = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('📩 Foreground message received:', remoteMessage);
        this.handleForegroundMessage(remoteMessage);
      },
    );

    // 后台/退出状态下的消息处理
    messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('📱 Background message opened app:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // 监听令牌刷新
    messaging().onTokenRefresh(async (token: string) => {
      console.log('🔄 FCM token refreshed:', token.substring(0, 20) + '...');
      this.fcmToken = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await this.sendTokenToServer(token);
    });
  }

  /**
   * 处理前台收到的消息
   */
  private handleForegroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const {notification, data} = remoteMessage;
    
    if (notification) {
      // 显示应用内通知
      Alert.alert(
        notification.title || '新消息',
        notification.body || '',
        [
          {text: '关闭', style: 'cancel'},
          {
            text: '查看',
            onPress: () => this.handleNotificationAction(data),
          },
        ],
      );
    }
  }

  /**
   * 处理应用启动时的通知
   */
  private async handleInitialNotification(): Promise<void> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('🚀 App opened from notification:', remoteMessage);
        // 延迟处理，等待应用完全加载
        setTimeout(() => {
          this.handleNotificationOpen(remoteMessage);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Handle initial notification failed:', error);
    }
  }

  /**
   * 处理通知点击打开应用
   */
  private handleNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const {data} = remoteMessage;
    this.handleNotificationAction(data);
  }

  /**
   * 处理通知操作
   */
  private handleNotificationAction(data: any): void {
    try {
      if (!data) return;

      // 根据通知类型执行不同操作
      switch (data.type) {
        case 'order_update':
          // 跳转到订单详情页面
          console.log('📋 Navigate to order:', data.orderId);
          // navigation.navigate('OrderDetail', {orderId: data.orderId});
          break;

        case 'promotion':
          // 跳转到促销页面
          console.log('🎁 Navigate to promotion:', data.promotionId);
          // navigation.navigate('Promotion', {promotionId: data.promotionId});
          break;

        case 'appointment_reminder':
          // 跳转到预约详情
          console.log('📅 Navigate to appointment:', data.appointmentId);
          // navigation.navigate('AppointmentDetail', {appointmentId: data.appointmentId});
          break;

        default:
          console.log('🔔 Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('❌ Handle notification action failed:', error);
    }
  }

  /**
   * 订阅主题
   */
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`📢 Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      console.error(`❌ Subscribe to topic ${topic} failed:`, error);
      return false;
    }
  }

  /**
   * 取消订阅主题
   */
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`📵 Unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      console.error(`❌ Unsubscribe from topic ${topic} failed:`, error);
      return false;
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.unsubscribeFromMessages) {
      this.unsubscribeFromMessages();
      this.unsubscribeFromMessages = null;
    }
  }

  /**
   * 获取当前 FCM 令牌
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  /**
   * 检查推送权限状态
   */
  async checkPermissionStatus(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
      if (stored === 'true') return true;

      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('❌ Check permission status failed:', error);
      return false;
    }
  }
}

/**
 * 推送通知工具函数
 */
export const initializeFCM = async (): Promise<boolean> => {
  const fcmService = FCMService.getInstance();
  return await fcmService.initialize();
};

export const getFCMToken = async (): Promise<string | null> => {
  const fcmService = FCMService.getInstance();
  return await fcmService.getFCMToken();
};

export const subscribeToTopic = async (topic: string): Promise<boolean> => {
  const fcmService = FCMService.getInstance();
  return await fcmService.subscribeToTopic(topic);
};

export const unsubscribeFromTopic = async (topic: string): Promise<boolean> => {
  const fcmService = FCMService.getInstance();
  return await fcmService.unsubscribeFromTopic(topic);
};