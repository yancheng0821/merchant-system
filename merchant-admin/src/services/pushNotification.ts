import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { getApiBaseUrl } from '../config/environment';

/**
 * 推送通知服务
 * 处理 iOS/Android 原生推送通知的注册、接收和处理
 */
const FCM_TOKEN_STORAGE_KEY = 'fcm_device_token';

class PushNotificationService {
  private initialized = false;

  /**
   * 初始化推送通知
   * 应在用户登录后调用
   */
  async initialize(): Promise<void> {
    console.log('[PushNotification] initialize() called, platform:', Capacitor.getPlatform());

    // 仅在原生平台（iOS/Android）运行
    if (!Capacitor.isNativePlatform()) {
      console.log('[PushNotification] Not native platform, skipping');
      return;
    }

    if (this.initialized) {
      console.log('[PushNotification] Already initialized, skipping');
      return;
    }

    try {
      // 先检查权限状态
      console.log('[PushNotification] Checking permissions...');
      const permStatus = await PushNotifications.checkPermissions();
      console.log('[PushNotification] Permission status:', permStatus.receive);

      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        // 首次请求权限
        const newPermStatus = await PushNotifications.requestPermissions();
        if (newPermStatus.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // 设置监听器（只设置一次）
      this.setupListeners();

      // 注册推送 - 这会触发 APNs 注册
      console.log('[PushNotification] Registering with APNs...');
      await PushNotifications.register();
      this.initialized = true;
      console.log('[PushNotification] APNs registration successful');

      // 注意：iOS 的 FCM token 现在在 registration 事件回调中获取
      // 这确保了 APNs token 已经设置到 Firebase 后再获取 FCM token
    } catch (error) {
      console.error('[PushNotification] Failed to initialize:', error);
    }
  }

  /**
   * 检查权限并重新注册（用于 App 从后台恢复时）
   * 处理用户在系统设置中重新开启通知权限的情况
   */
  async checkAndReregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const permStatus = await PushNotifications.checkPermissions();
      console.log('[PushNotification] checkAndReregister - Permission status:', permStatus.receive);

      if (permStatus.receive === 'granted') {
        // 权限已开启，重新注册以确保 token 有效
        console.log('[PushNotification] Permission granted, re-registering...');
        await PushNotifications.register();

        // iOS 需要重新获取 FCM token
        if (Capacitor.getPlatform() === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.getAndSaveFCMToken();
        }
      }
    } catch (error) {
      console.error('[PushNotification] checkAndReregister failed:', error);
    }
  }

  /**
   * 获取并保存 FCM token（iOS 专用）
   * iOS 上 PushNotifications 返回的是 APNs token，需要通过 FCM 插件获取 FCM token
   */
  private async getAndSaveFCMToken(): Promise<void> {
    try {
      // 动态导入 FCM 插件，避免在 Android 上加载
      console.log('[PushNotification] Importing FCM plugin...');
      const { FCM } = await import('@capacitor-community/fcm');

      // 使用 FCM 插件获取 FCM token
      console.log('[PushNotification] Calling FCM.getToken()...');
      const result = await FCM.getToken();
      const fcmToken = result.token;
      console.log('[PushNotification] FCM.getToken() returned:', fcmToken ? fcmToken.substring(0, 30) + '...' : 'null');

      if (fcmToken) {
        // 只有当 token 变化时才保存到服务器，避免重复注册
        const savedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        console.log('[PushNotification] Saved token in localStorage:', savedToken ? savedToken.substring(0, 30) + '...' : 'null');

        if (fcmToken !== savedToken) {
          console.log('[PushNotification] Token changed, saving to server...');
          await this.saveTokenToServer(fcmToken);
          localStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
          console.log('[PushNotification] Token saved to localStorage');
        } else {
          console.log('[PushNotification] Token unchanged, skipping server save');
        }
      } else {
        console.warn('[PushNotification] No FCM token received!');
      }
    } catch (error) {
      console.error('[PushNotification] Failed to get FCM token:', error);
    }
  }

  /**
   * 设置推送通知监听器
   */
  private setupListeners(): void {
    // 注册成功，获取设备 Token
    // 注意：iOS 上这个返回的是 APNs token，不是 FCM token
    // iOS 的 FCM token 通过 getAndSaveFCMToken() 获取
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, APNs token:', token.value.substring(0, 20) + '...');

      if (Capacitor.getPlatform() === 'android') {
        // Android 直接使用这个 token
        await this.saveTokenToServer(token.value);
      } else if (Capacitor.getPlatform() === 'ios') {
        // iOS: 等待 APNs token 设置到 Firebase 后再获取 FCM token
        // 需要一个小延迟确保原生层的 Messaging.messaging().apnsToken 已设置
        console.log('[PushNotification] iOS: Waiting for APNs token to be set to Firebase...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('[PushNotification] iOS: Now getting FCM token...');
        await this.getAndSaveFCMToken();
      }
    });

    // 注册失败
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // 收到推送通知（App 在前台）
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleForegroundNotification(notification);
    });

    // 用户点击通知
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      this.handleNotificationAction(action);
    });
  }

  /**
   * 保存设备 Token 到服务器
   */
  private async saveTokenToServer(token: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform(); // 'ios' or 'android'
      const apiBaseUrl = getApiBaseUrl();
      const authToken = localStorage.getItem('token');

      console.log('[PushNotification] saveTokenToServer() - API:', `${apiBaseUrl}/api/notification/device-token`);
      console.log('[PushNotification] saveTokenToServer() - platform:', platform);
      console.log('[PushNotification] saveTokenToServer() - auth token exists:', !!authToken);

      const response = await fetch(`${apiBaseUrl}/api/notification/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token,
          platform,
          deviceInfo: {
            model: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      console.log('[PushNotification] saveTokenToServer() - response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PushNotification] saveTokenToServer() - error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log('[PushNotification] Device token saved to server successfully!');
    } catch (error) {
      console.error('[PushNotification] Failed to save device token:', error);
    }
  }

  /**
   * 处理前台通知
   */
  private handleForegroundNotification(notification: PushNotificationSchema): void {
    // 可以显示自定义的应用内通知
    // 或者使用 snackbar/toast 显示
    console.log('Foreground notification:', notification.title, notification.body);

    // 触发自定义事件，供 App 组件监听
    const event = new CustomEvent('pushNotification', { detail: notification });
    window.dispatchEvent(event);
  }

  /**
   * 处理通知点击动作
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data;

    // 根据通知类型导航到对应页面
    if (data?.type === 'appointment') {
      window.location.href = `/appointments/${data.appointmentId}`;
    } else if (data?.type === 'order') {
      window.location.href = `/orders/${data.orderId}`;
    } else if (data?.type === 'message') {
      window.location.href = '/notifications';
    }
  }

  /**
   * 注销推送（用户登出时调用）
   */
  async unregister(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await PushNotifications.removeAllListeners();
      this.initialized = false;
      console.log('Push notifications unregistered');
    } catch (error) {
      console.error('Failed to unregister push notifications:', error);
    }
  }

  /**
   * 获取当前通知权限状态
   */
  async getPermissionStatus(): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return 'unavailable';
    }

    const status = await PushNotifications.checkPermissions();
    return status.receive;
  }

  /**
   * 获取已送达的通知列表
   */
  async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }

  /**
   * 清除所有已送达的通知
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    await PushNotifications.removeAllDeliveredNotifications();
  }

  /**
   * 设置 App Icon 上的未读数角标
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 检查是否支持 badge
      const isSupported = await Badge.isSupported();
      if (!isSupported.isSupported) {
        console.log('[PushNotification] Badge not supported on this device');
        return;
      }

      // 检查权限
      const permResult = await Badge.checkPermissions();
      if (permResult.display !== 'granted') {
        const requestResult = await Badge.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log('[PushNotification] Badge permission not granted');
          return;
        }
      }

      await Badge.set({ count });
      console.log('[PushNotification] Badge count set to:', count);
    } catch (error) {
      console.error('[PushNotification] Failed to set badge count:', error);
    }
  }

  /**
   * 清除 App Icon 上的未读数角标
   */
  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 清除 badge
      await Badge.clear();
      console.log('[PushNotification] Badge cleared');

      // Android: 同时清除通知栏的通知，因为 Android 的 badge 是基于通知栏通知数量
      if (Capacitor.getPlatform() === 'android') {
        await PushNotifications.removeAllDeliveredNotifications();
        console.log('[PushNotification] Android: Cleared all delivered notifications via Capacitor');

        // 调用原生 Android 方法清除由 MyFirebaseMessagingService 显示的通知
        if ((window as any).AndroidBridge?.clearNotifications) {
          (window as any).AndroidBridge.clearNotifications();
          console.log('[PushNotification] Android: Cleared notifications via AndroidBridge');
        }
      }
    } catch (error) {
      console.error('[PushNotification] Failed to clear badge:', error);
    }
  }

  /**
   * 获取当前 App Icon 上的未读数角标
   */
  async getBadgeCount(): Promise<number> {
    if (!Capacitor.isNativePlatform()) return 0;

    try {
      const result = await Badge.get();
      return result.count;
    } catch (error) {
      console.error('[PushNotification] Failed to get badge count:', error);
      return 0;
    }
  }
}

// 导出单例
export const pushNotificationService = new PushNotificationService();
