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
import { getFullImageUrl } from './services/api';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import NotificationBar from './components/common/NotificationBar';
import { filterMenus } from './utils/menuFilter';
import { usePermission } from './hooks/usePermission';
import { canAccessRoute, ROUTE_PERMISSIONS } from './utils/routePermissions';

const drawerWidth = 260;

const MainAppContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, loading } = useAuth();
  const { isDrawerOpen, setDrawerOpen } = useNavigation();
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
      {/* 现代化标题区域 */}
      <Box
        sx={{
          p: 3,
          background: '#ffffff',
          borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Modern Minimalist Logo */}
          <Box
            sx={{
              position: 'relative',
              width: 'auto',
              height: 'auto',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.8rem',
                fontWeight: 700,
                fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-2px',
                  left: '0',
                  right: '0',
                  height: '3px',
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                  borderRadius: '2px',
                  opacity: 0.6,
                }
              }}
            >
              VA
            </Typography>
          </Box>

          {/* System Name */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#1e293b',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('nav.title')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                display: 'block',
                letterSpacing: '0.03em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              Merchant System
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 现代化菜单列表 */}
      <List sx={{ flex: 1, p: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItemButton
              selected={selectedItem === item.id}
              onClick={() => handleMenuClick(item.id)}
              sx={{
                borderRadius: 2,
                mb: 1,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: `0 4px 15px ${alpha(item.color || '#6366F1', 0.3)}`,
                },
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${alpha(item.color || '#6366F1', 0.1)}, ${alpha(item.color || '#6366F1', 0.05)})`,
                  borderLeft: `4px solid ${item.color || '#6366F1'}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(item.color || '#6366F1', 0.15)}, ${alpha(item.color || '#6366F1', 0.08)})`,
                  },
                  '& .MuiListItemIcon-root': {
                    color: item.color || '#6366F1',
                  },
                  '& .MuiListItemText-primary': {
                    color: item.color || '#6366F1',
                    fontWeight: 600,
                  },
                },
                '&::before': selectedItem === item.id ? {
                  content: '""',
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: '60%',
                  background: item.color || '#6366F1',
                  borderRadius: '2px 0 0 2px',
                } : {},
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 44,
                  color: selectedItem === item.id ? (item.color || '#6366F1') : 'text.secondary',
                  transition: 'color 0.3s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(item.textKey)}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: selectedItem === item.id ? 600 : 500,
                }}
              />
              {item.children && (expandedMenus[item.id] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>

            {item.children && (
              <Collapse in={expandedMenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.id}
                      sx={{
                        pl: 4,
                        borderRadius: 2,
                        ml: 1,
                        mr: 1,
                        mb: 0.5,
                        '&:hover': {
                          background: alpha(child.color || '#6366F1', 0.08),
                        },
                      }}
                      selected={selectedItem === child.id}
                      onClick={() => setSelectedItem(child.id)}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText primary={t(child.textKey)} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>

      {/* 公司标识和隐藏导航栏按钮 */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        {/* 公司信息 */}
        <Box
          sx={{
            mb: 2,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.disabled',
              fontSize: '0.65rem',
              mb: 0.5,
            }}
          >
            Powered by
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.3px',
            }}
          >
            SwiftmindSystems
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.disabled',
              fontSize: '0.6rem',
              mt: 0.5,
            }}
          >
            © {new Date().getFullYear()}
          </Typography>
        </Box>

        <Button
          fullWidth
          startIcon={<ChevronLeftIcon />}
          onClick={() => setDrawerOpen(false)}
          sx={{
            justifyContent: 'flex-start',
            color: 'text.secondary',
            textTransform: 'none',
            borderRadius: 2,
            py: 1.5,
            px: 2,
            fontWeight: 500,
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: alpha('#667eea', 0.08),
              color: '#667eea',
              transform: 'translateX(-4px)',
              '& .MuiSvgIcon-root': {
                transform: 'translateX(-4px)',
              }
            },
          }}
        >
          {t('nav.hideMenu', 'Hide Menu')}
        </Button>
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
            <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
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