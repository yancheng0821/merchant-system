import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Backdrop,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PersonPin as PersonPinIcon,
  Groups as GroupsIcon,
  AddCircle as AddCircleIcon,
  CalendarToday as CalendarTodayIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  ListAlt as ListAltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Room as RoomIcon,
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { CurrencyUtils } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi, appointmentApi, notificationApi, staffApi, resourceApi, merchantConfigApi, getFullImageUrl } from '../../services/api';

// 时间范围类型
type TimeRange = '7days' | '30days' | '6months' | '1year';

// 数据类型定义
interface SalesData {
  date: string;
  sales: number;
  orders: number;
  visitors: number;
}

interface ProductCategoryData {
  name: string;
  value: number;
  color: string;
}

interface TopProductData {
  name: string;
  sales: number;
  growth: number;
}

interface MetricCardData {
  title: string;
  value: string;
  change: number;
  icon: React.ReactElement;
  color: string;
  gradient: string;
}

// 现代化颜色主题 - 使用更鲜艳和现代的颜色
const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<ProductCategoryData[]>([]);
  const [topServicesData, setTopServicesData] = useState<TopProductData[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [staffStatusList, setStaffStatusList] = useState<any[]>([]);
  const [resourceStatusList, setResourceStatusList] = useState<any[]>([]);
  const [merchantResourceType, setMerchantResourceType] = useState<'STAFF' | 'ROOM' | 'BOTH'>('STAFF');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  const handleTimeRangeChange = (event: SelectChangeEvent<TimeRange>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  // 获取天数
  const getDaysFromTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '7days': return 7;
      case '30days': return 30;
      case '6months': return 180;
      case '1year': return 365;
      default: return 30;
    }
  };

  // 请求浏览器通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // 显示浏览器通知
  const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'merchant-notification',
        requireInteraction: false,
      });
    }
  };

  // 获取新通知（用于轮询）
  const fetchNewNotifications = async () => {
    if (!user?.tenantId) return;

    try {
      // 获取业务通知
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/business/notifications/dashboard?tenantId=${user.tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      const { notifications: businessNotifications, unreadCount } = data || { notifications: [], unreadCount: 0 };

      if (businessNotifications.length > 0) {
        // 找出新通知
        const newNotifications = lastNotificationTime 
          ? businessNotifications.filter((notification: any) => new Date(notification.createdAt) > lastNotificationTime)
          : [];

        if (newNotifications.length > 0) {
          // 更新未读计数
          setUnreadNotificationCount(unreadCount);
          
          // 显示浏览器通知（只显示最新的一条）
          const latestNotification = newNotifications[0];
          let notificationTitle = t('dashboard.newNotifications');
          let notificationBody = latestNotification.recipient || latestNotification.content?.substring(0, 100);
          
          if (latestNotification.templateCode?.includes('appointment_created')) {
            notificationTitle = t('dashboard.newAppointmentAlert');
          } else if (latestNotification.templateCode?.includes('reminder')) {
            notificationTitle = t('dashboard.upcomingAppointmentAlert');
          }
          
          showBrowserNotification(notificationTitle, notificationBody);
        }

        // 更新通知列表和最后通知时间 - 限制最多50条
        setNotifications(businessNotifications.slice(0, 50));
        if (businessNotifications.length > 0) {
          setLastNotificationTime(new Date(businessNotifications[0].createdAt));
        }
      }
    } catch (error) {
      console.error('Failed to fetch new notifications:', error);
    }
  };

  // 加载 Dashboard 数据
  const loadDashboardData = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const days = getDaysFromTimeRange(timeRange);

      // 先获取商户资源类型配置
      let resourceType: 'STAFF' | 'ROOM' | 'BOTH' = 'STAFF';
      try {
        const config = await merchantConfigApi.getMerchantConfig(user.tenantId);
        
        // 尝试从多个可能的字段获取资源类型
        // merchant_settings表中的key是resource_types，值是数组如["STAFF","ROOM"]
        const resourceTypesArray = config.resource_types || 
                                  config.resourceTypes || 
                                  config.resourceType;
        
        // 处理数组格式的资源类型
        if (Array.isArray(resourceTypesArray)) {
          if (resourceTypesArray.includes('STAFF') && resourceTypesArray.includes('ROOM')) {
            resourceType = 'BOTH';
          } else if (resourceTypesArray.includes('ROOM')) {
            resourceType = 'ROOM';
          } else {
            resourceType = 'STAFF';
          }
        } else if (typeof resourceTypesArray === 'string') {
          resourceType = resourceTypesArray as 'STAFF' | 'ROOM' | 'BOTH';
        } else {
          resourceType = 'STAFF'; // 默认值
        }
        
        setMerchantResourceType(resourceType);
      } catch (error) {
        // 默认显示两者
        resourceType = 'BOTH';
        setMerchantResourceType(resourceType);
      }
      
      // 并行获取所有数据
      const [stats, salesTrend, serviceCategories, topServices, appointments, notificationLogs, staffList, roomList] = await Promise.all([
        dashboardApi.getDashboardStats(user.tenantId, days),
        dashboardApi.getSalesTrend(user.tenantId, days),
        dashboardApi.getServiceCategoryStats(user.tenantId, days),
        dashboardApi.getTopServices(user.tenantId, days, 5),
        // 获取今日预约数据（排除已取消的）
        appointmentApi.getAllAppointments(user.tenantId).then((allAppointments: any[]) => {
          // 使用本地日期而不是UTC日期
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          const todayAppointments = allAppointments.filter((appointment: any) => 
            appointment.appointmentDate === today && 
            appointment.status !== 'CANCELLED' && 
            appointment.status !== 'CANCELED'
          );
          return todayAppointments;
        }).catch((error) => {
          console.error('Failed to fetch appointments:', error);
          return [];
        }),
        // 获取最近的业务通知
        fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}/api/business/notifications/dashboard?tenantId=${user.tenantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }).then(res => res.json())
          .then((data: any) => {
            return data?.notifications || [];
          })
          .catch((error) => {
            console.error('Failed to fetch initial notifications:', error);
            return [];
          }),
        // 根据资源类型获取员工状态 - 使用资源API
        (resourceType === 'STAFF' || resourceType === 'BOTH') 
          ? resourceApi.getResourcesByType(user.tenantId, 'STAFF').then((response: any) => {
              const data = response.data || response || [];
              return data;
            }).catch((error) => {
              console.error('Failed to fetch staff resources:', error);
              return [];
            })
          : Promise.resolve([]),
        // 根据资源类型获取房间资源
        (resourceType === 'ROOM' || resourceType === 'BOTH')
          ? resourceApi.getResourcesByType(user.tenantId, 'ROOM').then((response: any) => {
              const data = response.data || response || [];
              return data;
            }).catch((error) => {
              console.error('Failed to fetch room resources:', error);
              return [];
            })
          : Promise.resolve([])
      ]);

      // 计算预约统计数据（基于过滤后的今日预约）
      const completedCount = appointments.filter((apt: any) => apt.status === 'COMPLETED').length;
      const inProgressCount = appointments.filter((apt: any) => apt.status === 'IN_PROGRESS').length;
      const pendingCount = appointments.filter((apt: any) => 
        apt.status === 'PENDING' || apt.status === 'CONFIRMED'
      ).length;
      const totalActiveAppointments = appointments.length; // 已经过滤掉取消的预约
      
      setDashboardStats({
        ...stats,
        totalAppointments: totalActiveAppointments, // 使用过滤后的总数
        completedAppointments: completedCount,
        inProgressAppointments: inProgressCount,
        pendingAppointments: pendingCount,
        utilizationRate: staffList.length > 0 
          ? Math.round((inProgressCount / staffList.length) * 100) 
          : 0
      });
      
      // 处理销售趋势数据
      if (salesTrend.success && salesTrend.data) {
        setSalesTrendData(salesTrend.data);
      }

      // 处理服务分类数据
      if (serviceCategories.success && serviceCategories.data) {
        const formattedCategories = serviceCategories.data.map((item: any, index: number) => ({
          name: item.name === 'No Data' ? t('dashboard.noData') : 
                item.name === 'Uncategorized' ? t('dashboard.uncategorized') : item.name,
          value: item.value,
          color: COLORS[index % COLORS.length]
        }));
        setCategoryData(formattedCategories);
      }

      // 处理热门服务数据
      if (topServices.success && topServices.data) {
        const formattedServices = topServices.data.map((item: any) => ({
          ...item,
          name: item.name === 'No Data' ? t('dashboard.noData') : 
                item.name === 'Unknown Service' ? t('dashboard.unknownService') : item.name
        }));
        setTopServicesData(formattedServices);
      }
      
      // 设置今日预约数据
      if (appointments.length > 0) {
      }
      setTodayAppointments(appointments);
      
      // 设置通知数据 - 限制最多50条
      setNotifications(notificationLogs.slice(0, 50));
      if (notificationLogs && notificationLogs.length > 0) {
        setLastNotificationTime(new Date(notificationLogs[0].createdAt));
      }
      
      // 处理员工状态数据（仅在资源类型包含员工时）
      if ((resourceType === 'STAFF' || resourceType === 'BOTH') && staffList && staffList.length > 0) {
        const staffWithStatus = staffList.map((staff: any) => {
          // 根据员工的当前预约情况判断状态
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const currentTime = now.toTimeString().slice(0, 5); // HH:mm
          
          // 查找当前的预约（排除已取消的）
          const currentAppointments = appointments.filter((apt: any) => {
            // 排除已取消的预约
            if (apt.status === 'CANCELLED' || apt.status === 'CANCELED') return false;
            if (apt.appointmentDate !== today) return false;
            const aptTime = apt.appointmentTime;
            const duration = apt.duration || 60; // 默认60分钟
            const aptEndTime = new Date(`${today} ${aptTime}`);
            aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
            const aptEndTimeStr = aptEndTime.toTimeString().slice(0, 5);
            
            // 检查是否有员工分配 - 使用resourceId作为员工ID
            const hasStaff = apt.appointmentServices?.some((svc: any) => 
              svc.staffId === staff.id || svc.resourceId === staff.id
            ) || apt.staffId === staff.id || apt.resourceId === staff.id;
            
            return hasStaff && aptTime <= currentTime && aptEndTimeStr > currentTime;
          });
          
          let status = 'offline';
          let currentService = null;
          let endTime = null;
          
          // 资源对象的status字段
          if (staff.status === 'ACTIVE') {
            if (currentAppointments.length > 0) {
              status = 'busy';
              const apt = currentAppointments[0];
              currentService = apt.appointmentServices?.[0]?.serviceName || apt.serviceName || t('dashboard.inService');
              const duration = apt.duration || 60;
              const aptEndTime = new Date(`${today} ${apt.appointmentTime}`);
              aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
              endTime = aptEndTime.toTimeString().slice(0, 5);
            } else {
              status = 'available';
            }
          } else if (staff.status === 'MAINTENANCE') {
            status = 'maintenance';
          }
          
          return {
            name: staff.name || staff.resourceName,
            avatar: staff.images?.[0] || staff.avatar || staff.photo,
            status,
            currentService,
            endTime,
            type: 'staff'
          };
        });
        setStaffStatusList(staffWithStatus.slice(0, 8)); // 只显示前8个员工
      } else {
      }
      
      // 处理房间状态数据（仅在资源类型包含房间时）
      if ((resourceType === 'ROOM' || resourceType === 'BOTH') && roomList && roomList.length > 0) {
        const roomWithStatus = roomList.map((room: any) => {
          // 根据房间的当前预约情况判断状态
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const currentTime = now.toTimeString().slice(0, 5); // HH:mm
          
          // 查找当前的预约（排除已取消的）
          const currentAppointments = appointments.filter((apt: any) => {
            // 排除已取消的预约
            if (apt.status === 'CANCELLED' || apt.status === 'CANCELED') return false;
            if (apt.appointmentDate !== today) return false;
            const aptTime = apt.appointmentTime;
            const duration = apt.duration || 60; // 默认60分钟
            const aptEndTime = new Date(`${today} ${aptTime}`);
            aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
            const aptEndTimeStr = aptEndTime.toTimeString().slice(0, 5);
            
            // 检查是否使用这个房间
            const hasRoom = apt.roomId === room.id || apt.resourceId === room.id;
            
            return hasRoom && aptTime <= currentTime && aptEndTimeStr > currentTime;
          });
          
          let status = 'offline';
          let currentService = null;
          let endTime = null;
          
          if (room.status === 'ACTIVE') {
            if (currentAppointments.length > 0) {
              status = 'busy';
              const apt = currentAppointments[0];
              currentService = apt.appointmentServices?.[0]?.serviceName || apt.serviceName || t('dashboard.occupied');
              const duration = apt.duration || 60;
              const aptEndTime = new Date(`${today} ${apt.appointmentTime}`);
              aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
              endTime = aptEndTime.toTimeString().slice(0, 5);
            } else {
              status = 'available';
            }
          } else if (room.status === 'MAINTENANCE') {
            status = 'maintenance';
          }
          
          return {
            name: room.name || room.resourceName,
            avatar: room.images?.[0] || room.photo,
            status,
            currentService,
            endTime,
            type: 'room',
            capacity: room.capacity,
            location: room.location
          };
        });
        setResourceStatusList(roomWithStatus.slice(0, 8)); // 只显示前8个房间
      } else {
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // 使用默认数据
      setDashboardStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        totalAppointments: 0,
        avgOrderValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0,
        customerGrowth: 0
      });
      setSalesTrendData([]);
      setCategoryData([]);
      setTopServicesData([]);
    } finally {
      setLoading(false);
    }
  };

  // 当组件挂载或时间范围改变时加载数据
  useEffect(() => {
    loadDashboardData();
    // 首次加载时也获取通知
    fetchNewNotifications();
  }, [user?.tenantId, timeRange]);

  // 请求通知权限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 设置轮询获取新通知（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNewNotifications();
    }, 30000); // 30秒轮询一次

    return () => clearInterval(interval);
  }, [user?.tenantId, lastNotificationTime]);

  // 自动滚动到当前时间
  useEffect(() => {
    if (currentTimeRef.current && timelineRef.current) {
      // 延迟执行以确保DOM已渲染
      setTimeout(() => {
        if (currentTimeRef.current && timelineRef.current) {
          const containerTop = timelineRef.current.offsetTop;
          const currentTimeTop = currentTimeRef.current.offsetTop;
          const containerHeight = timelineRef.current.clientHeight;
          
          // 滚动到当前时间位置，让它出现在容器中间
          timelineRef.current.scrollTop = currentTimeTop - containerTop - (containerHeight / 2) + 50;
        }
      }, 100);
    }
  }, [todayAppointments]);

  // 标记通知为已读
  const markNotificationsAsRead = () => {
    setUnreadNotificationCount(0);
    setIsNotificationExpanded(!isNotificationExpanded);
  };

  // 计算关键指标
  const totalSales = dashboardStats?.totalRevenue || 0;
  const totalOrders = dashboardStats?.totalOrders || 0;
  const totalVisitors = dashboardStats?.totalAppointments * 2 || 0; // 假设每个预约代表2个访客
  const avgOrderValue = dashboardStats?.avgOrderValue || 0;

  const metricsData: MetricCardData[] = [
    {
      title: t('dashboard.totalSales'),
      value: CurrencyUtils.formatAmountWithCommas(totalSales),
      change: dashboardStats?.revenueGrowth || 0,
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#10B981',
      gradient: GRADIENTS[2],
    },
    {
      title: t('dashboard.totalOrders'),
      value: totalOrders.toLocaleString(),
      change: dashboardStats?.orderGrowth || 0,
      icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />,
      color: '#6366F1',
      gradient: GRADIENTS[0],
    },
    {
      title: t('dashboard.totalCustomers'),
      value: (dashboardStats?.totalCustomers || 0).toLocaleString(),
      change: dashboardStats?.customerGrowth || 0,
      icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
      color: '#F59E0B',
      gradient: GRADIENTS[3],
    },
    {
      title: t('dashboard.avgOrderValue'),
      value: CurrencyUtils.formatAmountWithCommas(Math.round(avgOrderValue)),
      change: dashboardStats?.appointmentGrowth || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      color: '#EC4899',
      gradient: GRADIENTS[1],
    },
  ];

  // 自定义现代化Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {`${t('dashboard.date')}: ${label}`}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* 加载状态 */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #6366F1, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            {t('nav.dashboard')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboard.subtitle')}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select 
            value={timeRange} 
            onChange={handleTimeRangeChange}
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            <MenuItem value="7days">{t('dashboard.last7Days')}</MenuItem>
            <MenuItem value="30days">{t('dashboard.last30Days')}</MenuItem>
            <MenuItem value="6months">{t('dashboard.last6Months')}</MenuItem>
            <MenuItem value="1year">{t('dashboard.last1Year')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 美化的关键指标卡片 */}
      <Grid container spacing={3} mb={4}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'visible',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: metric.gradient,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: metric.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 4px 15px ${alpha(metric.color, 0.3)}`,
                    }}
                  >
                    {metric.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: metric.change >= 0 ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                      color: metric.change >= 0 ? '#10B981' : '#EF4444',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {metric.change >= 0 ? '↗' : '↘'} {Math.abs(metric.change)}%
                  </Typography>
                </Box>
                <Typography 
                  color="text.secondary" 
                  variant="body2" 
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  {metric.title}
                </Typography>
                <Typography 
                  variant="h4" 
                  component="h2" 
                  className="numeric"
                  sx={{ 
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {metric.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 实时通知提醒和快捷操作 */}
      <Grid container spacing={3} mb={3}>
        {/* 实时通知提醒 */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 24,
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      cursor: 'pointer',
                    }}
                    onClick={markNotificationsAsRead}
                  >
                    {t('dashboard.notifications')}
                  </Typography>
                  {unreadNotificationCount > 0 && (
                    <Box
                      sx={{
                        ml: 1,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: '#EF4444',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' },
                        },
                      }}
                    >
                      {unreadNotificationCount}
                    </Box>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip 
                    icon={<NotificationsIcon sx={{ fontSize: 16 }} />}
                    label={`${notifications.length} ${t('dashboard.total')}`}
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#6B7280', 0.1),
                      color: '#6B7280',
                      fontWeight: 600,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={fetchNewNotifications}
                    title={t('dashboard.refresh')}
                    sx={{ 
                      color: '#6B7280',
                      '&:hover': {
                        animation: 'spin 1s ease-in-out',
                      },
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={markNotificationsAsRead}
                    sx={{ color: '#6B7280' }}
                  >
                    {isNotificationExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              {/* 通知列表 */}
              <Box sx={{ 
                maxHeight: isNotificationExpanded ? 400 : 200, 
                overflowY: 'auto',
                transition: 'max-height 0.3s ease',
              }}>
                {notifications.length > 0 ? notifications
                  .slice(0, isNotificationExpanded ? 50 : 3)
                  .map((notification: any, index: number) => {
                  // 根据通知类型设置图标和颜色
                  let icon, color, title;
                  
                  // 使用业务通知类型
                  if (notification.notificationType === 'NEW_APPOINTMENT') {
                    icon = <AddCircleIcon sx={{ fontSize: 18, color: '#10B981' }} />;
                    color = '#10B981';
                    title = notification.title || t('dashboard.newAppointmentAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_REMINDER') {
                    icon = <ScheduleIcon sx={{ fontSize: 18, color: '#F59E0B' }} />;
                    color = '#F59E0B';
                    title = notification.title || t('dashboard.upcomingAppointmentAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_CANCELLED') {
                    icon = <WarningIcon sx={{ fontSize: 18, color: '#EF4444' }} />;
                    color = '#EF4444';
                    title = notification.title || t('dashboard.appointmentCancelledAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_CONFIRMED') {
                    icon = <CheckCircleIcon sx={{ fontSize: 18, color: '#10B981' }} />;
                    color = '#10B981';
                    title = notification.title || t('dashboard.appointmentConfirmedAlert');
                  } else if (notification.notificationType === 'PENDING_CONFIRMATION') {
                    icon = <ScheduleIcon sx={{ fontSize: 18, color: '#F59E0B' }} />;
                    color = '#F59E0B';
                    title = notification.title || t('dashboard.pendingConfirmation');
                  } else if (notification.level === 'ERROR') {
                    icon = <WarningIcon sx={{ fontSize: 18, color: '#EF4444' }} />;
                    color = '#EF4444';
                    title = notification.title || t('dashboard.error');
                  } else if (notification.level === 'WARNING') {
                    icon = <WarningIcon sx={{ fontSize: 18, color: '#F59E0B' }} />;
                    color = '#F59E0B';
                    title = notification.title || t('dashboard.warning');
                  } else if (notification.level === 'SUCCESS') {
                    icon = <CheckCircleIcon sx={{ fontSize: 18, color: '#10B981' }} />;
                    color = '#10B981';
                    title = notification.title || t('dashboard.success');
                  } else {
                    icon = <InfoIcon sx={{ fontSize: 18, color: '#6366F1' }} />;
                    color = '#6366F1';
                    title = notification.title || t('dashboard.notification');
                  }
                  
                  // 计算时间差
                  const createdTime = new Date(notification.createdAt);
                  const now = new Date();
                  const diffMinutes = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60));
                  let timeAgo = '';
                  if (diffMinutes < 60) {
                    timeAgo = `${diffMinutes}${t('dashboard.minutesAgo')}`;
                  } else if (diffMinutes < 1440) {
                    timeAgo = `${Math.floor(diffMinutes / 60)}${t('dashboard.hoursAgo')}`;
                  } else {
                    timeAgo = `${Math.floor(diffMinutes / 1440)}${t('dashboard.daysAgo')}`;
                  }
                  
                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2, 
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: alpha(color, 0.05),
                        border: `1px solid ${alpha(color, 0.2)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha(color, 0.1),
                          transform: 'translateX(4px)',
                        }
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box sx={{ mt: 0.5 }}>{icon}</Box>
                        <Box flex={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.content || t('dashboard.notificationContent')}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {timeAgo}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                }) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.noNotifications')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 快捷操作入口 */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.quickActions')}
                </Typography>
              </Box>

              {/* 快捷操作按钮 */}
              <Grid container spacing={2}>
                {[
                  { 
                    icon: <AddCircleIcon />, 
                    label: t('dashboard.createAppointment'), 
                    color: '#8B5CF6', // Purple - Appointments theme
                    onClick: () => onNavigate?.('appointments')
                  },
                  { 
                    icon: <CalendarTodayIcon />, 
                    label: t('dashboard.todaySchedule'), 
                    color: '#8B5CF6', // Purple - Appointments theme
                    onClick: () => onNavigate?.('appointments')
                  },
                  { 
                    icon: <PersonPinIcon />, 
                    label: t('dashboard.addCustomer'), 
                    color: '#EC4899', // Pink - Customers theme
                    onClick: () => onNavigate?.('customers')
                  },
                  { 
                    icon: <ListAltIcon />, 
                    label: t('dashboard.viewOrders'), 
                    color: '#10B981', // Green - Orders theme
                    onClick: () => onNavigate?.('payments')
                  },
                ].map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={action.onClick}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        flexDirection: 'column',
                        borderColor: alpha(action.color, 0.3),
                        color: action.color,
                        bgcolor: alpha(action.color, 0.05),
                        '&:hover': {
                          borderColor: action.color,
                          bgcolor: alpha(action.color, 0.1),
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      {React.cloneElement(action.icon, { 
                        sx: { fontSize: 28, mb: 1, color: action.color } 
                      })}
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {action.label}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 美化的图表区域 */}
      <Grid container spacing={3}>
        {/* 销售趋势折线图 */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.salesTrend')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    name={t('dashboard.sales')}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10B981"
                    strokeWidth={3}
                    name={t('dashboard.orders')}
                    dot={{ r: 4, strokeWidth: 2, fill: '#10B981' }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 产品分类饼状图 */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.serviceCategories')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    {categoryData.map((entry, index) => (
                      <linearGradient key={index} id={`gradient${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient${index})`}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '占比']}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 访客流量面积图 */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.visitorTraffic')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fill="url(#visitorGradient)"
                    name={t('dashboard.visitors')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 热门产品条形图 */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, height: '100%' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 24,
                      background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {t('dashboard.topServices')}
                  </Typography>
                </Box>
                <Chip 
                  label={`Top ${topServicesData.length}`} 
                  size="small"
                  sx={{ 
                    bgcolor: alpha('#8B5CF6', 0.1),
                    color: '#8B5CF6',
                    fontWeight: 600,
                  }}
                />
              </Box>
              
              {/* 改用列表展示，更清晰 */}
              <Box sx={{ mt: 2, maxHeight: 350, overflowY: 'auto' }}>
                {topServicesData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.noData')}
                    </Typography>
                  </Box>
                ) : (
                  topServicesData.map((service, index) => {
                    const maxSales = Math.max(...topServicesData.map(s => s.sales));
                    const percentage = maxSales > 0 ? (service.sales / maxSales) * 100 : 0;
                    const rankColors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];
                    
                    return (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={2}>
                            {/* 排名徽章 */}
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(rankColors[index % rankColors.length], 0.1),
                                color: rankColors[index % rankColors.length],
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              #{index + 1}
                            </Box>
                            {/* 服务名称 */}
                            <Box flex={1}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  mb: 0.5,
                                }}
                              >
                                {service.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary',
                                  }}
                                >
                                  {t('dashboard.revenue')}:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: rankColors[index % rankColors.length],
                                    fontWeight: 700,
                                  }}
                                >
                                  {CurrencyUtils.formatAmountWithCommas(service.sales)}
                                </Typography>
                                {service.growth !== 0 && (
                                  <Chip
                                    label={`${service.growth > 0 ? '↑' : '↓'} ${Math.abs(service.growth)}%`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.75rem',
                                      bgcolor: service.growth > 0 ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                                      color: service.growth > 0 ? '#10B981' : '#EF4444',
                                      fontWeight: 600,
                                      '& .MuiChip-label': {
                                        px: 1,
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                        
                        {/* 进度条 */}
                        <Box sx={{ ml: 7 }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 10,
                              bgcolor: alpha(rankColors[index % rankColors.length], 0.08),
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${rankColors[index % rankColors.length]}, ${alpha(rankColors[index % rankColors.length], 0.6)})`,
                                borderRadius: 1.5,
                                transition: 'width 0.8s ease',
                                boxShadow: `0 2px 8px ${alpha(rankColors[index % rankColors.length], 0.3)}`,
                              }}
                            />
                            {/* 百分比标签 */}
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: percentage > 70 ? 'white' : 'text.secondary',
                              }}
                            >
                              {Math.round(percentage)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 员工忙闲状态 */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 6,
                      height: 24,
                      background: 'linear-gradient(135deg, #14B8A6, #059669)',
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {t('dashboard.resourceStatus')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  {(merchantResourceType === 'STAFF' || merchantResourceType === 'BOTH') && staffStatusList.length > 0 && (
                    <Chip 
                      icon={<GroupsIcon sx={{ fontSize: 16 }} />}
                      label={`${t('dashboard.totalStaff')}: ${staffStatusList.length}`}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#6B7280', 0.1),
                        color: '#6B7280',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {(merchantResourceType === 'ROOM' || merchantResourceType === 'BOTH') && resourceStatusList.length > 0 && (
                    <Chip 
                      icon={<RoomIcon sx={{ fontSize: 16 }} />}
                      label={`${t('dashboard.totalRooms')}: ${resourceStatusList.length}`}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#6B7280', 0.1),
                        color: '#6B7280',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* 资源状态网格 */}
              <Grid container spacing={2}>
                {/* 合并员工和房间列表 */}
                {([...staffStatusList, ...resourceStatusList].length > 0 ? 
                  [...staffStatusList, ...resourceStatusList] : [
                  { name: t('dashboard.noResourceData'), avatar: '', status: 'offline', currentService: null, endTime: null, type: 'staff' },
                ]).map((resource, index) => {
                  const statusConfig = {
                    busy: { color: '#EF4444', label: t('dashboard.busy'), icon: '🔴' },
                    available: { color: '#10B981', label: t('dashboard.available'), icon: '🟢' },
                    break: { color: '#F59E0B', label: t('dashboard.onBreak'), icon: '🟡' },
                    maintenance: { color: '#F59E0B', label: t('dashboard.maintenance'), icon: '🔧' },
                    offline: { color: '#6B7280', label: t('dashboard.offline'), icon: '⚫' },
                  }[resource.status as 'busy' | 'available' | 'break' | 'maintenance' | 'offline'] || 
                  { color: '#6B7280', label: t('dashboard.offline'), icon: '⚫' };

                  return (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${alpha(statusConfig.color, 0.2)}`,
                          bgcolor: alpha(statusConfig.color, 0.05),
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha(statusConfig.color, 0.1),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px ${alpha(statusConfig.color, 0.2)}`,
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Avatar 
                            src={getFullImageUrl(resource.avatar)}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: alpha(statusConfig.color, 0.2),
                              color: statusConfig.color,
                              fontWeight: 600,
                            }}
                          >
                            {resource.type === 'room' ? <RoomIcon /> : (resource.name?.[0] || '?')}
                          </Avatar>
                          <Box flex={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {resource.name}
                              </Typography>
                              {resource.type === 'room' && (
                                <Chip
                                  label={t('dashboard.room')}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.7rem',
                                    bgcolor: alpha('#8B5CF6', 0.1),
                                    color: '#8B5CF6',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Box>
                            <Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography variant="caption">{statusConfig.icon}</Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: statusConfig.color,
                                    fontWeight: 500,
                                  }}
                                >
                                  {statusConfig.label}
                                </Typography>
                              </Box>
                              {resource.type === 'room' && resource.capacity && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Typography variant="caption" color="text.secondary">
                                    {t('dashboard.capacity')}: {resource.capacity}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                        {resource.currentService && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${alpha(statusConfig.color, 0.1)}` }}>
                            <Typography variant="caption" color="text.secondary">
                              {resource.currentService}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ color: statusConfig.color, fontWeight: 500 }}>
                              {t('dashboard.until')} {resource.endTime}
                            </Typography>
                          </Box>
                        )}
                        {resource.type === 'room' && resource.location && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              📍 {resource.location}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* 状态统计 */}
              <Box display="flex" justifyContent="center" gap={3} mt={3} pt={3} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10B981' }} />
                  <Typography variant="caption">
                    {t('dashboard.available')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'available').length}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444' }} />
                  <Typography variant="caption">
                    {t('dashboard.busy')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'busy').length}
                  </Typography>
                </Box>
                {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'maintenance').length > 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                    <Typography variant="caption">
                      {t('dashboard.maintenance')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'maintenance').length}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#6B7280' }} />
                  <Typography variant="caption">
                    {t('dashboard.offline')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'offline').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 今日预约概览 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.todayAppointments')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                  {dashboardStats?.totalAppointments || 0}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: dashboardStats?.appointmentGrowth >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: 600 
                  }}
                >
                  {dashboardStats?.appointmentGrowth >= 0 ? '↗' : '↘'} {Math.abs(dashboardStats?.appointmentGrowth || 0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard.appointmentsTrend')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 运营状态实时监控 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  sx={{
                    width: 6,
                    height: 24,
                    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Typography 
                  variant="h6"
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t('dashboard.operationStatus')}
                </Typography>
              </Box>
              
              {/* 运营状态指标 */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    background: alpha('#10B981', 0.1),
                    border: `1px solid ${alpha('#10B981', 0.2)}`
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.completedToday')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', mt: 0.5 }}>
                      {dashboardStats?.completedAppointments || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    background: alpha('#3B82F6', 0.1),
                    border: `1px solid ${alpha('#3B82F6', 0.2)}`
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.pending')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#3B82F6', mt: 0.5 }}>
                      {dashboardStats?.pendingAppointments || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        {/* 今日预约时间轴 */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              mt: 3,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.01), rgba(8, 145, 178, 0.01))',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontWeight: 700,
                        color: 'text.primary',
                        mb: 0.5,
                      }}
                    >
                      {t('dashboard.todayTimeline')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('dashboard.currentTime')}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Chip 
                    icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                    label={new Date().toLocaleDateString()} 
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#06B6D4', 0.1),
                      color: '#06B6D4',
                      fontWeight: 600,
                      px: 1,
                    }}
                  />
                </Box>
              </Box>
              
              {/* 时间轴 */}
              <Box 
                ref={timelineRef}
                sx={{ 
                  position: 'relative', 
                  pl: 4, 
                  maxHeight: 600, 
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': {
                    width: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha('#06B6D4', 0.05),
                    borderRadius: 4,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha('#06B6D4', 0.3),
                    borderRadius: 4,
                    '&:hover': {
                      backgroundColor: alpha('#06B6D4', 0.5),
                    },
                  },
                }}
              >
                {/* 垂直线 */}
                <Box sx={{
                  position: 'absolute',
                  left: 20,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: `linear-gradient(180deg, 
                    ${alpha('#06B6D4', 0.1)} 0%, 
                    ${alpha('#06B6D4', 0.3)} 50%, 
                    ${alpha('#06B6D4', 0.1)} 100%)`,
                  borderRadius: 2,
                }} />
                
                {/* 时间节点 - 显示真实预约数据 */}
                {todayAppointments.length > 0 ? (
                  todayAppointments
                    .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                    .map((appointment, index) => {
                      const now = new Date();
                      const currentTimeStr = now.toTimeString().slice(0, 5);
                      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
                      const isCompleted = appointment.status === 'COMPLETED';
                      const isCurrent = appointment.status === 'IN_PROGRESS';
                      const isPending = appointment.status === 'CONFIRMED' || appointment.status === 'PENDING';
                      const isPast = appointmentDateTime < now && !isCompleted && !isCurrent;
                      const isNearCurrent = Math.abs(appointmentDateTime.getTime() - now.getTime()) < 3600000; // 1小时内
                      
                      return (
                        <React.Fragment key={appointment.id}>
                          {/* 当前时间指示器 */}
                          {index === 0 && appointment.appointmentTime > currentTimeStr && (
                            <Box 
                              ref={currentTimeRef}
                              sx={{ 
                                position: 'relative', 
                                mb: 3,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              }}
                            >
                              <Box sx={{
                                position: 'absolute',
                                left: -30,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: '#EF4444',
                                border: '3px solid rgba(239, 68, 68, 0.3)',
                                boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.1)',
                                zIndex: 2,
                              }} />
                              <Box sx={{
                                ml: 2,
                                p: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                                border: `2px dashed ${alpha('#EF4444', 0.5)}`,
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#EF4444' }}>
                                  {t('dashboard.currentTimeNow')} - {currentTimeStr}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          
                          {/* 如果是第一个预约且时间还没到当前时间，在预约后面加指示器 */}
                          {appointment.appointmentTime <= currentTimeStr && 
                           index < todayAppointments.length - 1 && 
                           todayAppointments[index + 1].appointmentTime > currentTimeStr && (
                            <Box 
                              ref={currentTimeRef}
                              sx={{ 
                                position: 'relative', 
                                mb: 3, 
                                mt: 3,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              }}
                            >
                              <Box sx={{
                                position: 'absolute',
                                left: -30,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: '#EF4444',
                                border: '3px solid rgba(239, 68, 68, 0.3)',
                                boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.1)',
                                zIndex: 2,
                              }} />
                              <Box sx={{
                                ml: 2,
                                p: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                                border: `2px dashed ${alpha('#EF4444', 0.5)}`,
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#EF4444' }}>
                                  {t('dashboard.currentTimeNow')} - {currentTimeStr}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          
                          <Box sx={{ position: 'relative', mb: 3 }}>
                            {/* 时间点 */}
                            <Box sx={{
                              position: 'absolute',
                              left: -26,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: isCompleted ? '#10B981' : 
                                      isCurrent ? '#F59E0B' : 
                                      isPast ? '#6B7280' :
                                      '#3B82F6',
                              border: isCurrent ? '3px solid rgba(245, 158, 11, 0.3)' : 
                                     isNearCurrent ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
                              boxShadow: isNearCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                              zIndex: 1,
                            }} />
                            
                            {/* 预约信息 */}
                            <Box sx={{
                              ml: 2,
                              p: 2.5,
                              borderRadius: 2,
                              background: isCompleted ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))' : 
                                        isCurrent ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))' : 
                                        isPast ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.05), rgba(107, 114, 128, 0.02))' :
                                        'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
                              border: `1px solid ${
                                isCompleted ? alpha('#10B981', 0.2) : 
                                isCurrent ? alpha('#F59E0B', 0.3) : 
                                isPast ? alpha('#6B7280', 0.1) :
                                alpha('#3B82F6', 0.2)
                              }`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateX(4px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              },
                            }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <AccessTimeIcon sx={{ fontSize: 16, color: isCompleted ? '#10B981' : isCurrent ? '#F59E0B' : isPast ? '#6B7280' : '#3B82F6' }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                    {appointment.appointmentTime}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={
                                    appointment.status === 'COMPLETED' ? t('dashboard.completed') : 
                                    appointment.status === 'IN_PROGRESS' ? t('dashboard.inProgress') : 
                                    isPast ? t('dashboard.overdue') :
                                    t('dashboard.pending')
                                  }
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: isCompleted ? alpha('#10B981', 0.15) : 
                                            isCurrent ? alpha('#F59E0B', 0.15) : 
                                            isPast ? alpha('#6B7280', 0.15) :
                                            alpha('#3B82F6', 0.15),
                                    color: isCompleted ? '#10B981' : 
                                          isCurrent ? '#F59E0B' : 
                                          isPast ? '#6B7280' :
                                          '#3B82F6',
                                    border: 'none',
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {/* 尝试多种方式获取服务名称 */}
                              {appointment.services?.map((s: any) => s.serviceName).join(', ') || 
                               appointment.appointmentServices?.map((s: any) => s.serviceName).join(', ') ||
                               appointment.serviceName ||
                               '服务'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {/* 显示客户和资源（员工或房间） */}
                              {(() => {
                                // 初始化变量
                                let customerDisplay = t('dashboard.customer');
                                let resourceDisplay = t('dashboard.unassigned');
                                let resourceInfo: string[] = [];
                                
                                // 优先检查 appointmentResources 字段
                                if (appointment.appointmentResources && appointment.appointmentResources.length > 0) {
                                  resourceInfo = appointment.appointmentResources.map((res: any) => {
                                    const typeLabel = res.resourceType === 'STAFF' ? t('dashboard.staff') : t('dashboard.room');
                                    const name = res.resourceName || res.name || `ID:${res.resourceId}`;
                                    return `${name} (${typeLabel})`;
                                  });
                                  resourceDisplay = resourceInfo.join(', ');
                                } 
                                // 然后检查appointmentServices中的资源信息
                                else if (appointment.appointmentServices && appointment.appointmentServices.length > 0) {
                                  const service = appointment.appointmentServices[0];
                                  if (service.staffName) {
                                    resourceDisplay = service.staffName;
                                  } else if (service.resourceName) {
                                    resourceDisplay = service.resourceName;
                                  }
                                } 
                                // 最后检查其他字段
                                else if (appointment.staffName) {
                                  resourceDisplay = appointment.staffName;
                                } else if (appointment.staff?.name) {
                                  resourceDisplay = appointment.staff.name;
                                } else if (appointment.resourceName) {
                                  resourceDisplay = appointment.resourceName;
                                } else if (appointment.resource?.name) {
                                  resourceDisplay = appointment.resource.name;
                                } else if (appointment.roomName) {
                                  resourceDisplay = appointment.roomName;
                                } else if (appointment.room?.name) {
                                  resourceDisplay = appointment.room.name;
                                }
                                
                                // 获取客户名称 - 使用与AppointmentManagement相同的字段
                                if (appointment.customer) {
                                  const firstName = appointment.customer.firstName || '';
                                  const lastName = appointment.customer.lastName || '';
                                  customerDisplay = `${firstName} ${lastName}`.trim() || t('dashboard.customer');
                                } else {
                                  // 如果没有customer对象，尝试其他字段
                                  customerDisplay = appointment.customerName || t('dashboard.customer');
                                  
                                }
                                
                                // 格式化显示
                                return `${customerDisplay} - ${resourceDisplay}`;
                              })()}
                            </Typography>
                            </Box>
                          </Box>
                          {/* 如果是最后一个预约且当前时间在其之后，显示当前时间指示器 */}
                          {index === todayAppointments.length - 1 && appointment.appointmentTime < currentTimeStr && (
                            <Box 
                              ref={currentTimeRef}
                              sx={{ 
                                position: 'relative', 
                                mt: 3,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              }}
                            >
                              <Box sx={{
                                position: 'absolute',
                                left: -30,
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: '#EF4444',
                                border: '3px solid rgba(239, 68, 68, 0.3)',
                                boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.1)',
                                zIndex: 2,
                              }} />
                              <Box sx={{
                                ml: 2,
                                p: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                                border: `2px dashed ${alpha('#EF4444', 0.5)}`,
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#EF4444' }}>
                                  {t('dashboard.currentTimeNow')} - {currentTimeStr}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </React.Fragment>
                      );
                    })
                ) : (
                  // 无预约时显示提示
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.noAppointmentsToday')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 