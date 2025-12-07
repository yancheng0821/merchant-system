package com.vamerchant.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * 自定义 Firebase 消息服务
 * 处理前台通知并通知 WebView 更新铃铛数字
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMessaging";
    public static final String ACTION_PUSH_NOTIFICATION = "com.vamerchant.app.PUSH_NOTIFICATION";
    private static final String CHANNEL_ID = "vamerchant_notifications";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        String title = "";
        String body = "";

        // 检查是否有通知负载
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
            Log.d(TAG, "Message notification - title: " + title + ", body: " + body);
        }

        // 检查是否有数据负载
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            // 如果通知负载为空，尝试从数据负载获取
            if (title == null || title.isEmpty()) {
                title = remoteMessage.getData().get("title");
            }
            if (body == null || body.isEmpty()) {
                body = remoteMessage.getData().get("body");
            }
        }

        // 先发送本地广播通知 MainActivity 刷新通知计数（确保铃铛数字更新）
        try {
            Intent intent = new Intent(ACTION_PUSH_NOTIFICATION);
            intent.putExtra("title", title != null ? title : "");
            intent.putExtra("body", body != null ? body : "");
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
            Log.d(TAG, "Local broadcast sent to update notification count");
        } catch (Exception e) {
            Log.e(TAG, "Failed to send broadcast: " + e.getMessage());
        }

        // 再显示通知到通知栏
        try {
            if (title != null || body != null) {
                showNotification(title != null ? title : "", body != null ? body : "");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to show notification: " + e.getMessage());
        }
    }

    /**
     * 显示通知到系统通知栏
     */
    private void showNotification(String title, String messageBody) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("from_notification", true);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_dialog_info) // 使用系统图标
                        .setContentTitle(title)
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Android 8.0+ 需要创建通知渠道
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "VA Merchant Notifications",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("预约和业务通知");
            notificationManager.createNotificationChannel(channel);
        }

        // 使用时间戳作为通知ID，确保每条通知都显示
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, notificationBuilder.build());

        Log.d(TAG, "Notification displayed: " + title);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        // Token 更新由 Capacitor PushNotifications 插件处理
    }
}
