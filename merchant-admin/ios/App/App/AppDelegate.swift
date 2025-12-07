import UIKit
import WebKit
import Capacitor
import UserNotifications
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate, UIScrollViewDelegate {

    var window: UIWindow?

    var statusBarView: UIView?
    weak var webView: WKWebView?
    var refreshControl: UIRefreshControl?
    var isRefreshing = false
    var hasTriggeredRefresh = false // 防止重复触发
    var isRefreshEnabled = false // 启动后延迟启用刷新
    let refreshTriggerOffset: CGFloat = -80 // 下拉80点触发刷新

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 初始化 Firebase
        FirebaseApp.configure()

        // 设置 Firebase Messaging 代理
        Messaging.messaging().delegate = self

        // 设置通知代理，让 App 在前台也能接收推送通知
        UNUserNotificationCenter.current().delegate = self

        // 延迟设置下拉刷新
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.setupPullToRefresh()
        }

        return true
    }

    // 设置下拉刷新
    func setupPullToRefresh() {
        if let window = self.window,
           let rootViewController = window.rootViewController {
            findAndSetupRefresh(in: rootViewController.view)
        }
    }

    func findAndSetupRefresh(in view: UIView) {
        if let wkWebView = view as? WKWebView {
            self.webView = wkWebView

            // 启用 bounce 以支持下拉刷新
            wkWebView.scrollView.bounces = true
            wkWebView.scrollView.alwaysBounceVertical = true
            wkWebView.scrollView.alwaysBounceHorizontal = false

            // 创建 UIRefreshControl
            let refreshControl = UIRefreshControl()
            refreshControl.tintColor = UIColor(red: 0.22, green: 0.56, blue: 0.96, alpha: 1.0)
            refreshControl.addTarget(self, action: #selector(handlePullToRefresh), for: .valueChanged)

            // 使用标准方式添加 refreshControl
            wkWebView.scrollView.refreshControl = refreshControl
            self.refreshControl = refreshControl

            // 设置 scrollView 代理以实现更短的触发距离
            wkWebView.scrollView.delegate = self

            print("[AppDelegate] Pull to refresh setup complete")

            // 延迟 1 秒启用刷新，避免应用启动时意外触发
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.isRefreshEnabled = true
                print("[AppDelegate] Pull to refresh enabled")
            }
            return
        }
        for subview in view.subviews {
            findAndSetupRefresh(in: subview)
        }
    }

    @objc func handlePullToRefresh() {
        // 如果已经在刷新中，跳过
        guard !isRefreshing else { return }
        isRefreshing = true

        print("[AppDelegate] Pull to refresh triggered")

        // 触发 JavaScript 事件
        webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('nativePullToRefresh'));") { _, error in
            if let error = error {
                print("[AppDelegate] Error: \(error)")
            }
        }

        // 安全机制：如果 1.5 秒后刷新还没结束，强制结束
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            if self?.isRefreshing == true {
                print("[AppDelegate] Force ending refresh after timeout")
                self?.endRefreshAnimation()
            }
        }
    }

    func endRefreshAnimation() {
        self.refreshControl?.endRefreshing()
        self.isRefreshing = false

        // 确保回到顶部
        if let scrollView = self.webView?.scrollView, scrollView.contentOffset.y < 0 {
            scrollView.setContentOffset(CGPoint(x: 0, y: 0), animated: true)
        }
    }

    // MARK: - UIScrollViewDelegate

    // 只在用户松手时检查是否需要触发刷新，不干扰滚动过程
    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        guard isRefreshEnabled else { return }

        // 用户松手时，如果已经下拉超过阈值且未在刷新中，触发刷新
        if scrollView.contentOffset.y < refreshTriggerOffset &&
           !isRefreshing &&
           !(refreshControl?.isRefreshing ?? false) {
            refreshControl?.beginRefreshing()
            handlePullToRefresh()

            // 延迟结束刷新动画
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                self.endRefreshAnimation()
            }
        } else if scrollView.contentOffset.y < 0 && !isRefreshing && !decelerate {
            // 轻滑但没达到刷新阈值，且不会继续减速时，手动回弹到顶部
            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
                scrollView.contentOffset = CGPoint(x: 0, y: 0)
            }
        }
    }

    // 减速结束后检查是否需要回弹
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        if scrollView.contentOffset.y < 0 && !isRefreshing {
            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
                scrollView.contentOffset = CGPoint(x: 0, y: 0)
            }
        }
    }

    // MARK: - Firebase Messaging Delegate

    // 当 FCM token 刷新时调用
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("[Firebase] FCM token received: \(fcmToken ?? "nil")")

        // 将 FCM token 发送给 Capacitor PushNotifications 插件
        if let token = fcmToken {
            NotificationCenter.default.post(
                name: Notification.Name("FCMTokenReceived"),
                object: nil,
                userInfo: ["token": token]
            )
        }
    }

    // MARK: - Push Notifications

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // 将 APNs token 传给 Firebase，Firebase 会将其转换为 FCM token
        Messaging.messaging().apnsToken = deviceToken
        print("[Firebase] APNs token set to Firebase Messaging")

        // 同时通知 Capacitor（保持兼容性）
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // MARK: - UNUserNotificationCenterDelegate

    // 当 App 在前台时收到推送通知
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // 通知 Capacitor 推送通知已收到
        NotificationCenter.default.post(name: Notification.Name("capacitorDidReceivePushNotification"), object: notification.request.content.userInfo)

        // 在前台也显示通知横幅、声音和角标
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    // 用户点击通知时的处理
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        // 通知 Capacitor 用户点击了推送通知
        NotificationCenter.default.post(name: Notification.Name("capacitorDidReceivePushNotificationAction"), object: response)
        completionHandler()
    }

    func setupStatusBarBackground() {
        // 移除旧的状态栏背景视图
        statusBarView?.removeFromSuperview()

        // 获取状态栏高度
        var statusBarHeight: CGFloat = 20
        if #available(iOS 13.0, *) {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
                statusBarHeight = windowScene.statusBarManager?.statusBarFrame.height ?? 44
            }
        }

        // 创建状态栏背景视图
        statusBarView = UIView(frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: statusBarHeight))
        statusBarView?.backgroundColor = UIColor.white
        statusBarView?.tag = 999

        if let keyWindow = window {
            keyWindow.addSubview(statusBarView!)
            keyWindow.bringSubviewToFront(statusBarView!)
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.

        // 设置状态栏背景
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.setupStatusBarBackground()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
