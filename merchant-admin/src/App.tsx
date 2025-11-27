import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { BrowserRouter as Router, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { TaxProvider } from './contexts/TaxContext';
import { SessionProvider } from './contexts/SessionContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { useTheme } from './contexts/ThemeContext';
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
import ScheduleManagement from './modules/schedule/components/ShiftManagement';
import { RBACManagement } from './modules/rbac';
import { TenantActivation } from './modules/admin';
import { generateNavigationConfig, MerchantConfig, MenuItemType } from './utils/navigationConfig';
import { initializeConfigPreloader } from './utils/configPreloader';
import { getFullImageUrl, subscriptionApi, TenantSubscription } from './services/api';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import NotificationBar from './components/common/NotificationBar';
import UnpaidInvoiceAlert from './components/common/UnpaidInvoiceAlert';
import { filterMenus } from './utils/menuFilter';
import { usePermission } from './hooks/usePermission';
import { canAccessRoute, ROUTE_PERMISSIONS } from './utils/routePermissions';

const drawerWidth = 260;

const MainAppContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, loading } = useAuth();
  const { isDrawerOpen, setDrawerOpen } = useNavigation();
  const { getMenuColor } = useTheme();
  const { userPermissions, isSuperAdmin } = usePermission();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
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

  // 标记权限已初始化
  // 只要用户登录了，权限就应该已经加载（即使是空权限）
  useEffect(() => {
    if (user && user.permissions !== undefined) {
      permissionsInitialized.current = true;
    }
  }, [user]);

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

        // 只有当权限已初始化时才进行过滤
        // 如果权限未初始化，显示所有菜单（避免空白）
        if (permissionsInitialized.current) {
          console.log('Filtering menus with permissions:', {
            permissionCount: userPermissions.permissionCodes.length,
            roleCount: userPermissions.roles.length,
            isSuperAdmin: userPermissions.isSuperAdmin,
            roles: userPermissions.roles,
            samplePermissions: userPermissions.permissionCodes.slice(0, 5)
          });

          console.log('Dynamic menu items before filter:', dynamicMenuItems.map(m => ({ id: m.id, permission: m.permission })));

          const userRoleCodes = userPermissions.roles.map(role => role.roleCode);
          const filteredMenuItems = filterMenus(
            dynamicMenuItems,
            userPermissions.permissionCodes,
            userRoleCodes as any,
            userPermissions.isSuperAdmin
          );

          console.log('Filtered menu items:', filteredMenuItems.length, filteredMenuItems);
          setMenuItems(filteredMenuItems);
        } else {
          console.log('Permissions not initialized yet, showing all menus temporarily');
          // 暂时显示所有菜单，等待权限加载
          setMenuItems(dynamicMenuItems);
        }
      } catch (error) {
        console.error('Failed to fetch merchant config:', error);
        // 使用默认配置
        const defaultMenuItems = generateNavigationConfig();

        // 只有当权限已初始化时才进行过滤
        if (permissionsInitialized.current) {
          const userRoleCodes = userPermissions.roles.map(role => role.roleCode);
          const filteredMenuItems = filterMenus(
            defaultMenuItems,
            userPermissions.permissionCodes,
            userRoleCodes as any,
            userPermissions.isSuperAdmin
          );
          setMenuItems(filteredMenuItems);
        } else {
          // 暂时显示所有菜单，等待权限加载
          setMenuItems(defaultMenuItems);
        }
      }
    };

    if (user) {
      fetchMerchantConfig();
    }
  }, [user, userPermissions]);

  // 获取订阅信息
  useEffect(() => {
    const fetchSubscription = async () => {
      if (user && user.tenantId) {
        try {
          const response = await subscriptionApi.getActiveSubscription(user.tenantId);
          if (response.success && response.data) {
            setSubscription(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
        }
      }
    };

    fetchSubscription();
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
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              VA
            </Typography>
          </Box>

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
        {menuItems.map((item) => (
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
                  color: selectedItem === item.id ? getMenuColor(item.color) : '#888',
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
                  color: selectedItem === item.id ? getMenuColor(item.color) : '#333',
                }}
              />
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
                      onClick={() => setSelectedItem(child.id)}
                    >
                      <ListItemIcon sx={{ minWidth: 32, '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}>
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={t(child.textKey)}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: selectedItem === child.id ? 600 : 400,
                        }}
                      />
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
        {/* 隐藏菜单按钮 */}
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

        {/* 公司信息 */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.6875rem', color: '#bbb' }}>
            Powered by <span style={{ color: '#999', fontWeight: 500 }}>SwiftmindSystems</span>
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

  return user ? (
        <TaxProvider>
          <SessionProvider>
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc' }}>
          <CssBaseline />

          {/* 现代化 AppBar */}
          <AppBar
            position="fixed"
            sx={{
              width: { sm: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
              ml: { sm: isDrawerOpen ? `${drawerWidth}px` : 0 },
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 1px 20px rgba(0,0,0,0.08)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              transition: 'width 0.3s ease, margin 0.3s ease',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* 左侧：菜单按钮 + 通知栏 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                {/* 移动端菜单按钮 */}
                <IconButton
                  color="inherit"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ display: { sm: 'none' }, color: 'text.primary' }}
                >
                  <MenuIcon />
                </IconButton>

                {/* 桌面端显示导航栏按钮（仅在导航栏隐藏时显示） */}
                {!isDrawerOpen && (
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={() => setDrawerOpen(true)}
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      color: 'text.primary',
                      bgcolor: alpha('#3B82F6', 0.1),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha('#3B82F6', 0.2),
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                {/* 通知栏 */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, minWidth: 0 }}>
                  <NotificationBar />
                </Box>
              </Box>

              {/* 右侧：语言切换、欢迎文字、用户头像、退出按钮 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* 语言切换组件 */}
                <LanguageSwitcher variant="default" size="medium" />

                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    letterSpacing: '0.01em',
                    display: { xs: 'none', md: 'block' },
                    '& span': {
                      color: '#475569',
                      fontWeight: 600,
                      marginLeft: '4px',
                    }
                  }}
                >
                  {t('auth.welcome')}, <span>{user?.realName || user?.username}</span>
                </Typography>

                {/* 直接点击进入用户资料页 */}
                <IconButton
                  onClick={navigateToProfile}
                  sx={{
                    p: 0,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <Avatar
                    src={getFullImageUrl(user?.avatar)}
                    sx={{
                      width: 40,
                      height: 40,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>

                {/* 退出按钮 - 简洁图标风格 */}
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: '#94A3B8',
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      color: '#64748B',
                      backgroundColor: alpha('#94A3B8', 0.1),
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(148, 163, 184, 0.2)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 20 }} />
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
                  width: drawerWidth,
                  background: '#ffffff',
                  boxShadow: '0 0 20px rgba(0,0,0,0.1)',
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
              p: 3,
              width: { sm: isDrawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
              minHeight: '100vh',
              background: '#f8fafc',
              transition: 'width 0.3s ease',
            }}
          >
            <Toolbar />
            <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
              {selectedItem === 'dashboard' && <Dashboard onNavigate={setSelectedItem} />}
              {selectedItem === 'products' && <ServiceManagement />}
              {selectedItem === 'orders' && <PaymentManagement onNavigate={setSelectedItem} />}
              {selectedItem === 'customers' && <CustomerManagement />}
              {selectedItem === 'appointments' && <AppointmentManagement />}
              {selectedItem === 'resources' && <ResourceManagement />}
              {selectedItem === 'schedule' && <ScheduleManagement />}
              {selectedItem === 'notifications' && <NotificationManagement />}
              {selectedItem === 'analytics' && <Analytics />}
              {selectedItem === 'costs' && <CostManagement />}
              {selectedItem === 'settings' && <Settings initialTab={searchParams.get('tab') || undefined} />}
              {selectedItem === 'rbac' && <RBACManagement />}
              {selectedItem === 'tenant-activation' && <TenantActivation />}
              {selectedItem === 'profile' && <UserProfile />}
            </Container>

            {/* 未支付账单提醒 - 浮动在右上角 */}
            <UnpaidInvoiceAlert />
          </Box>
        </Box>
          </SessionProvider>
        </TaxProvider>
      ) : (
        // 公开页面路由（未登录状态）
        location.pathname === '/reset-password' ? (
          <ResetPasswordPage />
        ) : (
          <LoginPage />
        )
      );
};

const MainApp: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NavigationProvider>
        <MainAppContent />
      </NavigationProvider>
    </Router>
  );
};

export default MainApp; 