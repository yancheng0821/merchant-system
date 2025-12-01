import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { getApiBaseUrl } from '../config/environment';

/**
 * 推送通知服务
 * 处理 iOS/Android 原生推送通知的注册、接收和处理
 */
class PushNotificationService {
  private initialized = false;

  /**
   * 初始化推送通知
   * 应在用户登录后调用
   */
  async initialize(): Promise<void> {
    // 仅在原生平台（iOS/Android）运行
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    if (this.initialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      // 请求权限
      const permStatus = await PushNotifications.requestPermissions();

      if (permStatus.receive === 'granted') {
        // 注册推送
        await PushNotifications.register();
        this.setupListeners();
        this.initialized = true;
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * 设置推送通知监听器
   */
  private setupListeners(): void {
    // 注册成功，获取设备 Token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      await this.saveTokenToServer(token.value);
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

      const response = await fetch(`${apiBaseUrl}/api/notification/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('Device token saved to server');
    } catch (error) {
      console.error('Failed to save device token:', error);
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
}

// 导出单例
export const pushNotificationService = new PushNotificationService();
