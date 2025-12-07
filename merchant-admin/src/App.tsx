import React, { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Container,
  IconButton,
  Chip,
  Tooltip,
  Button,
  Avatar,
  Collapse,
  ListItemButton,
  alpha,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme as useMuiTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Lock as LockIcon,
  NotificationsOutlined as NotificationsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { BrowserRouter as Router, useLocation, useNavigate, useSearchParams, Routes, Route } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { TaxProvider } from './contexts/TaxContext';
import { SessionProvider } from './contexts/SessionContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { FeatureProvider } from './contexts/FeatureContext';
import { useTheme } from './contexts/ThemeContext';
import { useWebSocket } from './contexts/WebSocketContext';
import { LoginPage, UserProfile } from './components';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import {
  Dashboard,
  ServiceManagement,
  PaymentManagement,
  CustomerManagement,
  MembershipTiers,
  AppointmentManagement,
  Analytics,
  CostManagement,
  Settings,
  ResourceManagement
} from './modules';
import NotificationManagement from './modules/notifications/NotificationManagement';
import MarketingManagement from './modules/marketing/MarketingManagement';
import ScheduleManagement from './modules/schedule/components/ShiftManagement';
import { RBACManagement } from './modules/rbac';
import { TenantActivation } from './modules/admin';
import { PublicBooking } from './modules/public-booking';
import LegalPage from './components/public/LegalPage';
import PublicPricing from './components/public/PublicPricing';
import Pricing from './modules/settings/Pricing';
import SubscriptionExpiredPage from './pages/SubscriptionExpiredPage';
import NotificationCenter from './pages/NotificationCenter';
import { generateNavigationConfig, MerchantConfig, MenuItemType } from './utils/navigationConfig';
import { initializeConfigPreloader } from './utils/configPreloader';
import { getFullImageUrl, subscriptionApi, TenantSubscription, parsePlanFeatures, PlanFeatures, businessNotificationApi } from './services/api';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import NotificationBar from './components/common/NotificationBar';
import PullToRefresh from './components/common/PullToRefresh';
import { filterMenusWithSubscription } from './utils/menuFilter';
import { usePermission } from './hooks/usePermission';
import { useFeature } from './contexts/FeatureContext';
import { canAccessRoute, ROUTE_PERMISSIONS } from './utils/routePermissions';
import { Capacitor } from '@capacitor/core';
import { pushNotificationService } from './services/pushNotification';

const drawerWidth = 260;
// 检测是否是 Android 原生平台
const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
const mobileDrawerWidth = 220; // 移动端收窄，减少屏幕占用

// 默认功能配置（当没有订阅或加载失败时使用）
const DEFAULT_PLAN_FEATURES: PlanFeatures = {
  limits: { maxStaff: 1, maxAppointmentsPerMonth: 100, maxEmailsPerMonth: 300, maxSmsPerMonth: 0 },
  modules: {
    dashboard: true, appointments: true, schedule: true, customers: true,
    orders: true, products: true, resources: true, settings: true,
    notifications: true, marketing: false, analytics: false, costs: false, rbac: true,
  },
  features: {
    appLogin: false, onlineBooking: false, notificationTemplateEdit: false,
    customerImport: false, smsNotification: false, auditLog: false,
    removeBranding: false, futureFeatures: false,
  },
};

const MainAppContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, loading, subscriptionExpired } = useAuth();
  const { isDrawerOpen, setDrawerOpen } = useNavigation();
  const { getMenuColor } = useTheme();
  const { userPermissions, isSuperAdmin } = usePermission();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { unreadNotificationCount, setUnreadNotificationCount, lastMessage } = useWebSocket();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);

  // 用于跟踪权限是否已经初始化过
  const permissionsInitialized = React.useRef(false);
  
  // 从URL路径获取初始选中项
  const getInitialSelectedItem = () => {
    // 首先检查URL路径
    const path = location.pathname.slice(1) || 'dashboard';
    
    // 检查localStorage中的导航意图（兼容旧逻辑）
    const navigateTo = localStorage.getItem('navigateTo');
    if (navigateTo) {
      localStorage.removeItem('navigateTo');
      return navigateTo;
    }
    
    return path;
  };
  
  const [selectedItem, setSelectedItem] = useState(getInitialSelectedItem());
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ customers: true });
  // const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  // 标记权限已初始化
  // 只要用户登录了，权限就应该已经加载（即使是空权限）
  useEffect(() => {
    if (user && user.permissions !== undefined) {
      permissionsInitialized.current = true;
    }
  }, [user]);

  // 从 API 获取未读通知数
  const fetchUnreadCount = React.useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      const count = await businessNotificationApi.getUnreadCount(user.tenantId);
      setUnreadNotificationCount(count);
      console.log('[App] Fetched unread notification count:', count);
    } catch (error) {
      console.error('[App] Failed to fetch unread count:', error);
    }
  }, [user?.tenantId, setUnreadNotificationCount]);

  // 用户登录后获取未读数
  useEffect(() => {
    if (user?.tenantId) {
      fetchUnreadCount();
    }
  }, [user?.tenantId, fetchUnreadCount]);

  // 监听 WebSocket 消息，重新获取未读数
  const lastMessageRef = React.useRef<typeof lastMessage>(null);
  useEffect(() => {
    if (lastMessage && lastMessage !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage;
      if (lastMessage.type === 'NEW_APPOINTMENT' ||
          lastMessage.type === 'APPOINTMENT_CANCELLED' ||
          lastMessage.type === 'SYSTEM_NOTIFICATION' ||
          lastMessage.type === 'NOTIFICATION_UPDATE') {
        console.log('[App] WebSocket notification received, refreshing unread count');
        fetchUnreadCount();
      }
    }
  }, [lastMessage, fetchUnreadCount]);

  // 监听原生推送通知事件（来自 pushNotificationService 和原生层）
  useEffect(() => {
    const handlePushNotification = () => {
      console.log('[App] Push notification received, refreshing unread count');
      fetchUnreadCount();
    };

    // Android/iOS: 监听原生层发送的推送通知接收事件
    const handlePushNotificationReceived = () => {
      console.log('[App] Native push notification received, refreshing unread count');
      // 延迟 500ms 再刷新，确保后端数据库已提交
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    // Android: 监听App恢复事件
    const handleAppResumed = () => {
      console.log('[App] Android app resumed, refreshing unread count');
      fetchUnreadCount();
    };

    // Android: 监听通知点击事件
    const handlePushNotificationTapped = () => {
      console.log('[App] Push notification tapped, refreshing unread count');
      fetchUnreadCount();
    };

    window.addEventListener('pushNotification', handlePushNotification);
    window.addEventListener('pushNotificationReceived', handlePushNotificationReceived);
    window.addEventListener('appResumed', handleAppResumed);
    window.addEventListener('pushNotificationTapped', handlePushNotificationTapped);

    return () => {
      window.removeEventListener('pushNotification', handlePushNotification);
      window.removeEventListener('pushNotificationReceived', handlePushNotificationReceived);
      window.removeEventListener('appResumed', handleAppResumed);
      window.removeEventListener('pushNotificationTapped', handlePushNotificationTapped);
    };
  }, [fetchUnreadCount]);

  // 监听 App 从后台恢复，刷新未读通知数并检查推送权限
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && user?.tenantId) {
        console.log('[App] App resumed from background, refreshing unread count');
        fetchUnreadCount();
        // 检查推送权限并重新注册（处理用户在设置中重新开启权限的情况）
        pushNotificationService.checkAndReregister();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [user?.tenantId, fetchUnreadCount]);

  // 同步 App Icon Badge 与未读通知数
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      if (unreadNotificationCount > 0) {
        pushNotificationService.setBadgeCount(unreadNotificationCount);
      } else {
        pushNotificationService.clearBadge();
      }
    }
  }, [unreadNotificationCount]);

  // 检查并显示注册成功消息
  useEffect(() => {
    if (user) {
      const showRegistrationSuccess = localStorage.getItem('showRegistrationSuccess');
      if (showRegistrationSuccess === 'true') {
        // 清除标记
        localStorage.removeItem('showRegistrationSuccess');
        // 显示成功消息（使用 MUI Alert 样式）
        enqueueSnackbar(t('auth.registrationSuccess', 'Registration successful! Welcome to the system!'), {
          variant: 'success',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          content: (key, message) => (
            <Alert
              severity="success"
              onClose={() => closeSnackbar(key)}
              sx={{
                width: '100%',
                minWidth: '400px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {message}
            </Alert>
          ),
        });
      }
    }
  }, [user, enqueueSnackbar, closeSnackbar, t]);

  // 监听URL变化并同步selectedItem
  useEffect(() => {
    // 如果用户未登录，不进行任何路由处理
    if (!user) {
      return;
    }

    const path = location.pathname.slice(1) || 'dashboard';

    // 跳过特殊路径的权限检查（登录页、公开页面等）
    // 这些路径在登录流程中可能会短暂出现，不应触发权限拦截
    const skipPermissionCheckPaths = ['login', 'pricing', 'reset-password', ''];
    if (skipPermissionCheckPaths.includes(path)) {
      // 如果用户已登录但还在登录页，等待 window.location.href 跳转
      // 不要设置 selectedItem，避免干扰登录后的跳转
      console.log(`[App] Skipping permission check for path: ${path}`);
      return;
    }

    // 只有在权限数据已加载时才进行权限检查
    // 避免在刷新页面时，权限未加载导致误判
    if (permissionsInitialized.current) {
      // 通用权限检查：检查用户是否有权限访问当前路由
      const hasAccess = canAccessRoute(
        path,
        userPermissions.permissionCodes,
        userPermissions.isSuperAdmin
      );

      if (!hasAccess) {
        console.log(`Access denied: route "${path}" requires permissions, staying on current page`);
        // 保持在当前页面，不进行路由跳转
        // 使用 navigate(-1) 会返回到上一个页面
        navigate(-1);
        return;
      }
    }

    setSelectedItem(path);

    // 特殊处理Stripe回调
    if (path === 'settings' && searchParams.get('tab') === 'payment') {
      // 确保Settings组件接收到正确的tab参数
      setSelectedItem('settings');
    }
  }, [location, searchParams, userPermissions, navigate, user]);

  // 当selectedItem变化时，更新URL（但不触发导航如果已经在正确的路径）
  useEffect(() => {
    if (selectedItem) {
      const currentPath = location.pathname.slice(1) || 'dashboard';
      // 只有当 selectedItem 不是从 URL 同步来的时候才导航
      // 这避免了循环：URL变化 -> setSelectedItem -> 这里导航 -> URL变化...
      if (selectedItem !== currentPath) {
        navigate(`/${selectedItem}`, { replace: false });
      }
    }
  }, [selectedItem]);

  // 获取商户配置和初始化预加载器
  useEffect(() => {
    const fetchMerchantConfig = async () => {
      try {
        // 添加短暂延迟，确保token已完全设置
        // 这样可以避免在登录后立即调用API时出现401错误
        await new Promise(resolve => setTimeout(resolve, 100));

        // 初始化配置预加载器
        initializeConfigPreloader();

        // 模拟API调用 - 实际应该从后端获取
        const mockConfig: MerchantConfig = {
          merchantId: user?.tenantId || 1,
          resourceTypes: ['STAFF', 'ROOM'] // 这里应该从后端获取
        };
        // setMerchantConfig(mockConfig);

        // 根据商户配置生成导航菜单
        const dynamicMenuItems = generateNavigationConfig(mockConfig);

        // 只有当权限已初始化、订阅已加载、且功能配置已获取时才进行过滤
        // 如果未加载完成，不设置菜单（避免闪烁）
        if (permissionsInitialized.current && subscriptionLoaded && planFeatures !== null) {
          console.log('Filtering menus with permissions:', {
            permissionCount: userPermissions.permissionCodes.length,
            roleCount: userPermissions.roles.length,
            isSuperAdmin: userPermissions.isSuperAdmin,
            roles: userPermissions.roles,
            samplePermissions: userPermissions.permissionCodes.slice(0, 5)
          });

          console.log('Dynamic menu items before filter:', dynamicMenuItems.map(m => ({ id: m.id, permission: m.permission })));

          const userRoleCodes = userPermissions.roles.map(role => role.roleCode);
          const filteredMenuItems = filterMenusWithSubscription(
            dynamicMenuItems,
            userPermissions.permissionCodes,
            userRoleCodes as any,
            userPermissions.isSuperAdmin,
            planFeatures
          );

          console.log('Filtered menu items:', filteredMenuItems.length, filteredMenuItems);
          setMenuItems(filteredMenuItems);
        } else {
          console.log('Waiting for permissions or subscription to load...');
        }
      } catch (error) {
        console.error('Failed to fetch merchant config:', error);
        // 使用默认配置
        const defaultMenuItems = generateNavigationConfig();

        // 只有当权限已初始化、订阅已加载、且功能配置已获取时才进行过滤
        if (permissionsInitialized.current && subscriptionLoaded && planFeatures !== null) {
          const userRoleCodes = userPermissions.roles.map(role => role.roleCode);
          const filteredMenuItems = filterMenusWithSubscription(
            defaultMenuItems,
            userPermissions.permissionCodes,
            userRoleCodes as any,
            userPermissions.isSuperAdmin,
            planFeatures
          );
          setMenuItems(filteredMenuItems);
        }
      }
    };

    if (user) {
      fetchMerchantConfig();
    }
  }, [user, userPermissions, planFeatures, subscriptionLoaded]);

  // 获取订阅信息
  const fetchSubscription = async () => {
    if (user && user.tenantId) {
      try {
        const response = await subscriptionApi.getActiveSubscription(user.tenantId);
        if (response.success && response.data) {
          setSubscription(response.data);
          // 解析 features JSON
          const features = parsePlanFeatures(response.data.plan?.features);
          setPlanFeatures(features || DEFAULT_PLAN_FEATURES);
        } else {
          // API 返回失败，使用默认配置
          setPlanFeatures(DEFAULT_PLAN_FEATURES);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        // 加载失败，使用默认配置
        setPlanFeatures(DEFAULT_PLAN_FEATURES);
      } finally {
        setSubscriptionLoaded(true);
      }
    } else {
      // 没有用户，使用默认配置
      setPlanFeatures(DEFAULT_PLAN_FEATURES);
      setSubscriptionLoaded(true);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // 监听订阅变更事件
  useEffect(() => {
    const handleSubscriptionChanged = () => {
      fetchSubscription();
    };

    window.addEventListener('subscription-changed', handleSubscriptionChanged);
    return () => {
      window.removeEventListener('subscription-changed', handleSubscriptionChanged);
    };
  }, [user]);


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const navigateToProfile = () => {
    setSelectedItem('profile');
  };

  const handleMenuToggle = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleMenuClick = (menuId: string) => {
    const menuItem = menuItems.find(item => item.id === menuId);
    if (menuItem?.children && menuItem.children.length > 0) {
      handleMenuToggle(menuId);
    } else {
      setSelectedItem(menuId);
      // 移动端点击菜单后自动关闭抽屉
      if (mobileOpen) {
        setMobileOpen(false);
      }
    }
  };

  // 移动端子菜单点击处理
  const handleChildMenuClick = (childId: string) => {
    setSelectedItem(childId);
    // 移动端点击菜单后自动关闭抽屉
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题区域 */}
      <Box
        sx={{
          py: 2.5,
          px: 2.5,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="/va.png"
            alt="VA"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
            }}
          />

          {/* System Name */}
          <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <Typography
              variant="body1"
              component="div"
              sx={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#1a1a1a',
                lineHeight: 1.3,
              }}
            >
              {t('nav.title')}
            </Typography>

            {/* Subscription Plan Badge */}
            {subscription && subscription.plan && (
              <Tooltip
                title={
                  subscription.status === 'TRIAL'
                    ? `${t('subscription.trialEndsOn')} ${subscription.trialEndDate}`
                    : t(`subscription.status.${subscription.status.toLowerCase()}`)
                }
                arrow
                placement="right"
              >
                <Chip
                  label={
                    i18n.language === 'zh-CN'
                      ? subscription.plan.planNameZh
                      : subscription.plan.planCode
                  }
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 18,
                    right: -15,
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    bgcolor: subscription.status === 'TRIAL'
                      ? '#3B82F6'
                      : subscription.status === 'ACTIVE'
                      ? '#10B981'
                      : subscription.status === 'PAST_DUE'
                      ? '#F59E0B'
                      : '#6B7280',
                    color: 'white',
                    '& .MuiChip-label': {
                      px: 0.75,
                      py: 0,
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* 简约菜单列表 */}
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {menuItems
          .filter(item => !(isMobile && item.id === 'schedule')) // 移动端隐藏排班模块
          .map((item) => (
          <React.Fragment key={item.id}>
            <ListItemButton
              selected={selectedItem === item.id}
              onClick={() => handleMenuClick(item.id)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1,
                px: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(getMenuColor(item.color), 0.06),
                },
                '&.Mui-selected': {
                  bgcolor: alpha(getMenuColor(item.color), 0.08),
                  '&:hover': {
                    bgcolor: alpha(getMenuColor(item.color), 0.12),
                  },
                  '& .MuiListItemIcon-root': {
                    color: getMenuColor(item.color),
                  },
                  '& .MuiListItemText-primary': {
                    color: getMenuColor(item.color),
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: item.locked ? '#bbb' : (selectedItem === item.id ? getMenuColor(item.color) : '#888'),
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem',
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.textKey)}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: selectedItem === item.id ? 600 : 500,
                  color: item.locked ? '#999' : (selectedItem === item.id ? getMenuColor(item.color) : '#333'),
                }}
              />
              {item.locked && (
                <LockIcon sx={{ fontSize: 14, color: '#bbb', mr: 0.5 }} />
              )}
              {item.children && (expandedMenus[item.id] ? <ExpandLess sx={{ fontSize: 18, color: '#999' }} /> : <ExpandMore sx={{ fontSize: 18, color: '#999' }} />)}
            </ListItemButton>

            {item.children && (
              <Collapse in={expandedMenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.id}
                      sx={{
                        py: 0.75,
                        pl: 6,
                        pr: 1.5,
                        borderRadius: 1.5,
                        mx: 0.5,
                        mb: 0.25,
                        '&:hover': {
                          bgcolor: alpha(getMenuColor(child.color), 0.06),
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(getMenuColor(child.color), 0.08),
                        },
                      }}
                      selected={selectedItem === child.id}
                      onClick={() => handleChildMenuClick(child.id)}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: child.locked ? '#bbb' : 'inherit', '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}>
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={t(child.textKey)}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: selectedItem === child.id ? 600 : 400,
                          color: child.locked ? '#999' : 'inherit',
                        }}
                      />
                      {child.locked && (
                        <LockIcon sx={{ fontSize: 12, color: '#bbb' }} />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>

      {/* 底部区域 */}
      <Box sx={{ px: 1.5, py: 2, mt: 'auto' }}>
        {/* 隐藏菜单按钮 - 仅在桌面端显示 */}
        {!isMobile && (
          <Button
            fullWidth
            startIcon={<ChevronLeftIcon sx={{ fontSize: 18 }} />}
            onClick={() => setDrawerOpen(false)}
            sx={{
              justifyContent: 'flex-start',
              color: '#888',
              textTransform: 'none',
              borderRadius: 1.5,
              py: 1,
              px: 1.5,
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
                color: '#333',
              },
            }}
          >
            {t('nav.hideMenu', 'Hide Menu')}
          </Button>
        )}

        {/* 公司信息 */}
        <Box sx={{ mt: isMobile ? 0 : 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.6875rem', color: '#bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            Powered by
            <Box component="img" src="/s-logo.png" alt="Swiftmind" sx={{ width: 12, height: 12, objectFit: 'contain', opacity: 0.7 }} />
            <span style={{ color: '#999', fontWeight: 500 }}>Swiftmind</span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // 显示加载状态
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // 订阅过期检查
  // - PAST_DUE: 付款失败，只能通过 SubscriptionExpiredPage 跳转 Stripe Customer Portal 更新支付方式
  //             不能访问 plans 页面（避免重复订阅）
  // - 其他过期状态 (EXPIRED, CANCELLED): 可以访问 plans 页面续费
  // 注意：使用 location.pathname 而不是 selectedItem，因为 selectedItem 可能还没更新
  const currentPath = location.pathname.slice(1) || 'dashboard';
  if (user && subscriptionExpired) {
    const isPastDue = user.subscriptionStatus === 'PAST_DUE';

    if (isPastDue) {
      // PAST_DUE: 所有页面都显示过期页面，用户只能通过"更新支付方式"按钮去 Stripe Portal
      return <SubscriptionExpiredPage />;
    } else {
      // EXPIRED/CANCELLED: 允许访问 plans 页面进行续费
      if (currentPath !== 'plans') {
        return <SubscriptionExpiredPage />;
      }
    }
  }

  return user ? (
        <FeatureProvider>
        <TaxProvider>
          <SessionProvider>
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc' }}>
          <CssBaseline />

          {/* 简约 AppBar */}
          <AppBar
            position="fixed"
            sx={{
              width: { sm: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
              ml: { sm: isDrawerOpen ? `${drawerWidth}px` : 0 },
              bgcolor: '#fff',
              boxShadow: 'none',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              transition: 'width 0.3s ease, margin 0.3s ease',
              // Safe Area 支持 - Android用margin避免覆盖状态栏
              marginTop: isAndroidNative ? '36px' : 0,
              paddingTop: isAndroidNative ? 0 : 'env(safe-area-inset-top)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 56 } }}>
              {/* 左侧：菜单按钮 + 通知栏 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                {/* 移动端菜单按钮 */}
                <IconButton
                  onClick={handleDrawerToggle}
                  sx={{
                    display: { sm: 'none' },
                    color: '#666',
                    ml: 0.5,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <MenuIcon sx={{ fontSize: 22 }} />
                </IconButton>

                {/* 桌面端显示导航栏按钮（仅在导航栏隐藏时显示） */}
                {!isDrawerOpen && (
                  <IconButton
                    edge="start"
                    onClick={() => setDrawerOpen(true)}
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      color: '#666',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    <MenuIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                )}

                {/* 通知栏 */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, minWidth: 0, alignItems: 'center' }}>
                  <NotificationBar />
                </Box>
              </Box>

              {/* 右侧：通知、语言切换、用户信息 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* 移动端通知中心入口 */}
                <IconButton
                  onClick={() => {
                    setSelectedItem('notification-center');
                    setUnreadNotificationCount(0); // 清除未读数
                  }}
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    color: '#666',
                    width: 36,
                    height: 36,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Badge
                    badgeContent={unreadNotificationCount}
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                      },
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>

                {/* 语言切换 */}
                <LanguageSwitcher variant="default" size="medium" />

                {/* 用户信息区域 - 点击进入资料页 */}
                <Box
                  onClick={navigateToProfile}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.5,
                    px: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Avatar
                    src={getFullImageUrl(user?.avatar)}
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.875rem',
                      bgcolor: '#e5e7eb',
                      color: '#666',
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography
                    sx={{
                      color: '#333',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    {user?.realName || user?.username}
                  </Typography>
                </Box>

                {/* 退出按钮 - 移动端隐藏，在 UserProfile 中显示 */}
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: '#999',
                    width: 32,
                    height: 32,
                    display: { xs: 'none', sm: 'flex' },
                    '&:hover': {
                      color: '#666',
                      bgcolor: 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>


          {/* 现代化侧边栏 */}
          <Box
            component="nav"
            sx={{ width: { sm: isDrawerOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
          >
            {/* 移动端临时抽屉 - 始终存在，不受 isDrawerOpen 控制 */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: mobileDrawerWidth,
                  background: '#ffffff',
                  boxShadow: '0 0 20px rgba(0,0,0,0.15)',
                  // Safe Area 支持 - Android用margin避免覆盖状态栏
                  marginTop: isAndroidNative ? '36px' : 0,
                  paddingTop: isAndroidNative ? 0 : 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                },
              }}
            >
              {drawer}
            </Drawer>

            {/* 桌面端固定抽屉 - 受 isDrawerOpen 控制 */}
            {isDrawerOpen && (
              <Drawer
                variant="permanent"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  '& .MuiDrawer-paper': {
                    boxSizing: 'border-box',
                    width: drawerWidth,
                    background: '#ffffff',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    borderRight: 'none',
                  },
                }}
                open
              >
                {drawer}
              </Drawer>
            )}
          </Box>

          {/* 现代化内容区域 */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 1, sm: 2, md: 3 },
              // Safe Area 支持 - 顶部留出状态栏空间
              pt: { xs: isAndroidNative ? 'calc(8px + 36px)' : 'calc(8px + env(safe-area-inset-top))', sm: 2, md: 3 },
              width: { sm: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
              minHeight: '100vh',
              background: '#f8fafc',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            }}
          >
            <Toolbar sx={{ mb: isAndroidNative ? 2 : 0 }} />

              <PullToRefresh
                onRefresh={async () => {
                  console.log('[App] Pull to refresh - refreshing data');
                  // 刷新未读通知数
                  fetchUnreadCount();
                  // 触发自定义事件，让当前页面刷新数据
                  window.dispatchEvent(new CustomEvent('pullToRefresh'));
                  // 等待一小段时间让页面处理刷新
                  await new Promise(resolve => setTimeout(resolve, 800));
                }}
              >
                <Container maxWidth={false} sx={{ px: { xs: 0, sm: 2, md: 3 }, pt: { xs: isAndroidNative ? 1.5 : 0 }, overflowX: 'hidden' }}>
                  {selectedItem === 'dashboard' && <Dashboard onNavigate={setSelectedItem} />}
                  {selectedItem === 'products' && <ServiceManagement />}
                  {selectedItem === 'orders' && <PaymentManagement onNavigate={setSelectedItem} />}
                  {selectedItem === 'customers' && <CustomerManagement />}
                  {selectedItem === 'appointments' && <AppointmentManagement />}
                  {selectedItem === 'resources' && <ResourceManagement />}
                  {selectedItem === 'schedule' && <ScheduleManagement />}
                  {selectedItem === 'notifications' && <NotificationManagement />}
                  {selectedItem === 'marketing' && <MarketingManagement />}
                  {selectedItem === 'analytics' && <Analytics />}
                  {selectedItem === 'costs' && <CostManagement />}
                  {selectedItem === 'settings' && <Settings initialTab={searchParams.get('tab') || undefined} />}
                  {selectedItem === 'rbac' && <RBACManagement />}
                  {selectedItem === 'tenant-activation' && <TenantActivation />}
                  {selectedItem === 'profile' && <UserProfile />}
                  {selectedItem === 'plans' && <Pricing />}
                  {selectedItem === 'notification-center' && <NotificationCenter />}
                </Container>
              </PullToRefresh>

          </Box>
        </Box>
          </SessionProvider>
        </TaxProvider>
        </FeatureProvider>
      ) : (
        // 公开页面路由（未登录状态）
        location.pathname === '/reset-password' ? (
          <ResetPasswordPage />
        ) : (
          <LoginPage />
        )
      );
};

// 公开预约页面包装器 - 不需要认证
const PublicBookingWrapper: React.FC = () => {
  return <PublicBooking />;
};

const MainApp: React.FC = () => {
  // 隐藏启动画面
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* 公开预约页面 - 不需要登录 */}
        <Route path="/booking/:slug" element={<PublicBookingWrapper />} />
        {/* 公开法律页面 - 不需要登录 */}
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/support" element={<LegalPage type="support" />} />
        <Route path="/delete-account" element={<LegalPage type="delete-account" />} />
        {/* 公开定价页面 - 不需要登录 */}
        <Route path="/pricing" element={<PublicPricing />} />
        {/* 订阅过期页面 */}
        <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
        {/* 其他所有路由走主应用 */}
        <Route path="*" element={
          <NavigationProvider>
            <MainAppContent />
          </NavigationProvider>
        } />
      </Routes>
    </Router>
  );
};

export default MainApp; 