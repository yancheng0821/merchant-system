import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Collapse,
  ListItemButton,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  CalendarToday as AppointmentsIcon,
  BarChart as AnalyticsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Language as LanguageIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage, UserProfile } from './components';
import { 
  Dashboard, 
  ServiceManagement, 
  OrderManagement, 
  CustomerManagement,
  AppointmentManagement, 
  Analytics, 
  Settings 
} from './modules';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const drawerWidth = 260;

interface MenuItemType {
  textKey: string;
  icon: React.ReactElement;
  id: string;
  children?: MenuItemType[];
  color?: string;
}

const menuItems: MenuItemType[] = [
  { textKey: 'nav.dashboard', icon: <DashboardIcon />, id: 'dashboard', color: '#6366F1' },
  { textKey: 'nav.products', icon: <StoreIcon />, id: 'products', color: '#EC4899' },
  { textKey: 'nav.orders', icon: <OrdersIcon />, id: 'orders', color: '#10B981' },
  { textKey: 'nav.customers', icon: <CustomersIcon />, id: 'customers', color: '#F59E0B' },
  { textKey: 'nav.appointments', icon: <AppointmentsIcon />, id: 'appointments', color: '#8B5CF6' },
  { textKey: 'nav.analytics', icon: <AnalyticsIcon />, id: 'analytics', color: '#EF4444' },
  { textKey: 'nav.settings', icon: <SettingsIcon />, id: 'settings', color: '#6366F1' },
];

const MainApp: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  
  // 处理头像URL，将相对路径转换为完整URL
  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${API_BASE_URL}${avatarPath}`;
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('dashboard');
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ customers: true });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchor(null);
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    handleLanguageClose();
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const navigateToProfile = () => {
    setSelectedItem('profile');
    handleUserMenuClose();
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '20px 20px',
          }
        }}
      >
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            fontWeight: 700,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {t('nav.title')}
        </Typography>

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
    </Box>
  );

  return (
    <Router>
      {user ? (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc' }}>
          <CssBaseline />
          
          {/* 现代化 AppBar */}
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 1px 20px rgba(0,0,0,0.08)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* 语言切换按钮 */}
                <Button
                  onClick={handleLanguageClick}
                  startIcon={<LanguageIcon />}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    background: alpha('#6366F1', 0.1),
                    color: '#6366F1',
                    border: `1px solid ${alpha('#6366F1', 0.2)}`,
                    '&:hover': {
                      background: alpha('#6366F1', 0.15),
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {i18n.language === 'zh-CN' ? t('common.chinese') : t('common.english')}
                </Button>

                {/* 用户头像和菜单 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.primary',
                      fontWeight: 500,
                      display: { xs: 'none', md: 'block' }
                    }}
                  >
                    {t('auth.welcome')}, {user?.username}
                  </Typography>
                  <IconButton 
                    onClick={handleUserMenuClick}
                    sx={{
                      p: 0,
                      ml: 1,
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <Avatar 
                      src={getAvatarUrl(user?.avatar)} 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          {/* 语言菜单 */}
          <Menu
            anchorEl={languageAnchor}
            open={Boolean(languageAnchor)}
            onClose={handleLanguageClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)',
                mt: 1,
              }
            }}
          >
            <MenuItem 
              onClick={() => handleLanguageChange('zh-CN')}
              sx={{
                minWidth: 120,
                '&:hover': {
                  background: alpha('#6366F1', 0.08),
                }
              }}
            >
              {t('common.chinese')}
            </MenuItem>
            <MenuItem 
              onClick={() => handleLanguageChange('en-US')}
              sx={{
                '&:hover': {
                  background: alpha('#6366F1', 0.08),
                }
              }}
            >
              {t('common.english')}
            </MenuItem>
          </Menu>

          {/* 用户菜单 */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)',
                mt: 1,
              }
            }}
          >
            <MenuItem 
              onClick={navigateToProfile}
              sx={{
                minWidth: 150,
                '&:hover': {
                  background: alpha('#6366F1', 0.08),
                }
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" sx={{ color: '#6366F1' }} />
              </ListItemIcon>
              {t('nav.userProfile')}
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                '&:hover': {
                  background: alpha('#EF4444', 0.08),
                }
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} />
              </ListItemIcon>
              <Typography sx={{ color: '#EF4444' }}>
                {t('nav.logout')}
              </Typography>
            </MenuItem>
          </Menu>

          {/* 现代化侧边栏 */}
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          >
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
          </Box>

          {/* 现代化内容区域 */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              minHeight: '100vh',
              background: '#f8fafc',
            }}
          >
            <Toolbar />
            <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
              {selectedItem === 'dashboard' && <Dashboard />}
              {selectedItem === 'products' && <ServiceManagement />}
              {selectedItem === 'orders' && <OrderManagement />}
              {selectedItem === 'customers' && <CustomerManagement />}
              {selectedItem === 'appointments' && <AppointmentManagement />}
              {selectedItem === 'analytics' && <Analytics />}
              {selectedItem === 'settings' && <Settings />}
              {selectedItem === 'profile' && <UserProfile />}
            </Container>
          </Box>
        </Box>
      ) : (
        <LoginPage />
      )}
    </Router>
  );
};

export default MainApp; 