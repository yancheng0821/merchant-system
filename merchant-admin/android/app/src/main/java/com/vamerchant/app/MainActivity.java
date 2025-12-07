package com.vamerchant.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    private BroadcastReceiver pushNotificationReceiver;
    private SwipeRefreshLayout swipeRefreshLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 注册推送通知广播接收器
        registerPushNotificationReceiver();

        // 检查是否从通知启动
        handleIntent(getIntent());

        // 延迟设置下拉刷新和 JavaScript 接口
        getWindow().getDecorView().post(() -> {
            setupSwipeRefresh();
            setupJavaScriptInterface();
        });
    }

    /**
     * 设置 JavaScript 接口，让前端可以调用原生方法
     */
    private void setupJavaScriptInterface() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new Object() {
                    @android.webkit.JavascriptInterface
                    public void clearNotifications() {
                        Log.d(TAG, "clearNotifications called from JavaScript");
                        runOnUiThread(() -> clearAllNotifications());
                    }
                }, "AndroidBridge");
                Log.d(TAG, "JavaScript interface setup complete");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to setup JavaScript interface: " + e.getMessage());
        }
    }

    /**
     * 设置下拉刷新
     */
    private void setupSwipeRefresh() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) {
                Log.e(TAG, "WebView is null, cannot setup SwipeRefresh");
                return;
            }

            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent == null) {
                Log.e(TAG, "WebView parent is null");
                return;
            }

            // 创建 SwipeRefreshLayout
            swipeRefreshLayout = new SwipeRefreshLayout(this);
            swipeRefreshLayout.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));

            // 设置刷新指示器颜色
            swipeRefreshLayout.setColorSchemeColors(
                    Color.parseColor("#3B82F6"), // 蓝色
                    Color.parseColor("#10B981"), // 绿色
                    Color.parseColor("#F59E0B")  // 橙色
            );

            // 设置背景色
            swipeRefreshLayout.setProgressBackgroundColorSchemeColor(Color.WHITE);

            // 设置进度条偏移，使其显示在 AppBar 下方
            // AppBar 高度 56dp + 状态栏高度 36dp = 92dp
            float density = getResources().getDisplayMetrics().density;
            int appBarHeight = (int) (56 * density);
            int statusBarHeight = (int) (36 * density);
            int topOffset = appBarHeight + statusBarHeight;
            // 起始位置和结束位置，结束位置设置小一点让下拉更容易触发
            swipeRefreshLayout.setProgressViewOffset(false, topOffset, topOffset + (int) (40 * density));
            // 设置下拉触发刷新的距离阈值（更短的距离就能触发）
            swipeRefreshLayout.setDistanceToTriggerSync((int) (80 * density));

            // 从父视图中移除 WebView
            int index = parent.indexOfChild(webView);
            parent.removeView(webView);

            // 将 WebView 添加到 SwipeRefreshLayout
            swipeRefreshLayout.addView(webView, new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));

            // 将 SwipeRefreshLayout 添加到原父视图
            parent.addView(swipeRefreshLayout, index);

            // 设置刷新监听器
            swipeRefreshLayout.setOnRefreshListener(() -> {
                Log.d(TAG, "Pull to refresh triggered");
                notifyWebView("nativePullToRefresh");

                // 0.6秒后自动结束刷新（更短的显示时间）
                swipeRefreshLayout.postDelayed(() -> {
                    if (swipeRefreshLayout.isRefreshing()) {
                        swipeRefreshLayout.setRefreshing(false);
                    }
                }, 600);
            });

            // 监听 WebView 滚动位置，只在顶部时允许下拉刷新
            webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                swipeRefreshLayout.setEnabled(scrollY == 0);
            });

            Log.d(TAG, "SwipeRefreshLayout setup complete");
        } catch (Exception e) {
            Log.e(TAG, "Failed to setup SwipeRefresh: " + e.getMessage());
        }
    }

    /**
     * 结束刷新动画（供前端调用）
     */
    public void endRefreshing() {
        if (swipeRefreshLayout != null) {
            runOnUiThread(() -> swipeRefreshLayout.setRefreshing(false));
        }
    }

    /**
     * 清除所有通知和 App Icon Badge
     */
    public void clearAllNotifications() {
        NotificationManager notificationManager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancelAll();
            Log.d(TAG, "All notifications cleared");
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "App resumed, notifying WebView to refresh notifications");

        // 通知WebView刷新通知计数
        notifyWebView("appResumed");
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // 注销广播接收器
        if (pushNotificationReceiver != null) {
            LocalBroadcastManager.getInstance(this).unregisterReceiver(pushNotificationReceiver);
        }
    }

    /**
     * 注册推送通知广播接收器
     * 用于接收来自 MyFirebaseMessagingService 的通知
     */
    private void registerPushNotificationReceiver() {
        pushNotificationReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.d(TAG, "Push notification broadcast received");
                // 通知 WebView 刷新通知计数
                notifyWebView("pushNotificationReceived");
            }
        };

        IntentFilter filter = new IntentFilter(MyFirebaseMessagingService.ACTION_PUSH_NOTIFICATION);
        LocalBroadcastManager.getInstance(this).registerReceiver(pushNotificationReceiver, filter);
        Log.d(TAG, "Push notification receiver registered");
    }

    /**
     * 通知 WebView 触发自定义事件
     */
    private void notifyWebView(String eventName) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() -> {
                String js = "window.dispatchEvent(new CustomEvent('" + eventName + "'));";
                getBridge().getWebView().evaluateJavascript(js, null);
                Log.d(TAG, "Dispatched event to WebView: " + eventName);
            });
        }
    }

    private void handleIntent(Intent intent) {
        if (intent != null && intent.getExtras() != null) {
            Log.d(TAG, "Intent received with extras: " + intent.getExtras().toString());

            // 如果是从通知点击进入，通知WebView
            if (intent.hasExtra("google.message_id")) {
                Log.d(TAG, "Launched from push notification");
                notifyWebView("pushNotificationTapped");
            }
        }
    }
}
