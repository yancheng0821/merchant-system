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
  Store as StoreIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { CurrencyUtils } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../config/environment';
import { dashboardApi, appointmentApi, notificationApi, staffApi, resourceApi, merchantConfigApi, shiftApi, staffAttendanceApi, getFullImageUrl } from '../../services/api';
import { getMerchantNow, utcToMerchantTime } from '../../utils/timezoneUtils';

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
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const { themeMode } = useAppTheme();

  // Theme-aware colors
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#6366F1';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#4F46E5';

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

  // 根据当前语言获取通知标题和内容
  const getLocalizedText = (notification: any) => {
    const isZh = i18n.language === 'zh' || i18n.language === 'zh-CN';
    return {
      title: isZh
        ? (notification.titleZh || notification.title)
        : (notification.titleEn || notification.title),
      content: isZh
        ? (notification.contentZh || notification.content)
        : (notification.contentEn || notification.content),
    };
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

      const response = await fetch(`${API_BASE_URL}/api/business/notifications/dashboard?tenantId=${user.tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      
      const { notifications: businessNotifications, unreadCount } = data || { notifications: [], unreadCount: 0 };

      // 过滤掉系统维度的通知，只显示业务通知
      const filteredNotifications = businessNotifications.filter(
        (notification: any) => notification.notificationType !== 'SYSTEM_NOTIFICATION'
      );

      if (filteredNotifications.length > 0) {
        // 找出新通知
        const newNotifications = lastNotificationTime
          ? filteredNotifications.filter((notification: any) => new Date(notification.createdAt) > lastNotificationTime)
          : [];

        if (newNotifications.length > 0) {
          // 更新未读计数
          setUnreadNotificationCount(unreadCount);

          // 显示浏览器通知（只显示最新的一条）
          const latestNotification = newNotifications[0];
          const localizedLatest = getLocalizedText(latestNotification);
          let notificationTitle = t('dashboard.newNotifications');
          let notificationBody = latestNotification.recipient || localizedLatest.content?.substring(0, 100);

          if (latestNotification.templateCode?.includes('appointment_created')) {
            notificationTitle = t('dashboard.newAppointmentAlert');
          } else if (latestNotification.templateCode?.includes('reminder')) {
            notificationTitle = t('dashboard.upcomingAppointmentAlert');
          }

          showBrowserNotification(notificationTitle, notificationBody);
        }

        // 更新通知列表和最后通知时间 - 限制最多50条
        setNotifications(filteredNotifications.slice(0, 50));
        if (filteredNotifications.length > 0) {
          setLastNotificationTime(new Date(filteredNotifications[0].createdAt));
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
      const [stats, salesTrend, serviceCategories, topServices, appointments, notificationLogs, staffList, roomList, staffAvailabilities] = await Promise.all([
        dashboardApi.getDashboardStats(user.tenantId, days),
        dashboardApi.getSalesTrend(user.tenantId, days),
        dashboardApi.getServiceCategoryStats(user.tenantId, days),
        dashboardApi.getTopServices(user.tenantId, days, 5),
        // 获取今日预约数据（排除已取消的）
        appointmentApi.getAllAppointments(user.tenantId).then((allAppointments: any[]) => {
          // 使用商户时区的日期
          const now = getMerchantNow();
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
        fetch(`${API_BASE_URL}/api/business/notifications/dashboard?tenantId=${user.tenantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }).then(res => res.json())
          .then((data: any) => {
            // 过滤掉系统维度的通知，只保留业务通知
            const allNotifications = data?.notifications || [];
            return allNotifications.filter((n: any) => n.notificationType !== 'SYSTEM_NOTIFICATION');
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
          : Promise.resolve([]),
        // 稍后再获取员工可用性，此处返回空
        Promise.resolve([])
      ]);

      // 获取员工的可用性配置（工作时间）
      let staffAvailabilitiesMap: Map<number, any[]> = new Map();
      if ((resourceType === 'STAFF' || resourceType === 'BOTH') && staffList && staffList.length > 0) {
        try {
          const availabilitiesPromises = staffList.map((staff: any) =>
            resourceApi.getResourceAvailability(staff.id)
              .then((availabilities: any) => ({
                resourceId: staff.id,
                availabilities: availabilities || []
              }))
              .catch(() => ({
                resourceId: staff.id,
                availabilities: []
              }))
          );
          const availabilitiesResults = await Promise.all(availabilitiesPromises);
          availabilitiesResults.forEach((result: any) => {
            staffAvailabilitiesMap.set(result.resourceId, result.availabilities);
          });
        } catch (error) {
          console.error('Failed to fetch staff availabilities:', error);
        }
      }

      // 获取今天的员工签到签退记录
      let staffAttendanceMap: Map<number, any> = new Map();
      if ((resourceType === 'STAFF' || resourceType === 'BOTH') && staffList && staffList.length > 0) {
        try {
          const now = getMerchantNow();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;

          const attendancePromises = staffList.map((staff: any) =>
            staffAttendanceApi.getByResourceAndDate(staff.id, today)
              .then((attendance: any) => ({
                resourceId: staff.id,
                attendance: attendance || null
              }))
              .catch(() => ({
                resourceId: staff.id,
                attendance: null
              }))
          );
          const attendanceResults = await Promise.all(attendancePromises);
          attendanceResults.forEach((result: any) => {
            if (result.attendance) {
              staffAttendanceMap.set(result.resourceId, result.attendance);
            }
          });
        } catch (error) {
          console.error('Failed to fetch staff attendance:', error);
        }
      }

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
        const now = getMerchantNow();
        // 使用商户时区的日期
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm
        // 获取今天是星期几（0=Sunday, 1=Monday, ..., 6=Saturday）
        // 转换为 1-7 格式（1=Monday, ..., 7=Sunday）
        const dayOfWeekJS = now.getDay(); // 0-6
        const dayOfWeek = dayOfWeekJS === 0 ? 7 : dayOfWeekJS; // 转换为1-7

        const staffWithStatus = staffList.map((staff: any) => {
          // 根据员工的当前预约情况判断状态

          // 查找当前正在进行的预约
          const currentAppointments = appointments.filter((apt: any) => {
            // 排除已取消、未出现和已完成的预约
            if (apt.status === 'CANCELLED' || apt.status === 'CANCELED' || apt.status === 'NO_SHOW' || apt.status === 'COMPLETED') return false;
            if (apt.appointmentDate !== today) return false;
            const aptTime = apt.appointmentTime;
            const duration = apt.duration || 60; // 默认60分钟
            const aptEndTime = new Date(`${today} ${aptTime}`);
            aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
            const aptEndTimeStr = aptEndTime.toTimeString().slice(0, 5);

            // 检查是否有员工分配 - 使用resourceId作为员工ID
            let hasStaff = apt.appointmentServices?.some((svc: any) =>
              svc.staffId === staff.id || svc.resourceId === staff.id
            ) || apt.staffId === staff.id || apt.resourceId === staff.id;

            // 也检查appointmentResources数组
            if (!hasStaff && apt.appointmentResources && apt.appointmentResources.length > 0) {
              hasStaff = apt.appointmentResources.some((res: any) =>
                res.resourceId === staff.id && res.resourceType === 'STAFF'
              );
            }

            const isInTimeRange = aptTime <= currentTime && aptEndTimeStr > currentTime;

            return hasStaff && isInTimeRange;
          });
          
          let status = 'offline';
          let currentService = null;
          let endTime = null;

          // 检查员工是否在工作时间内
          let isWithinWorkingHours = false;

          // 优先检查签到签退记录
          const attendance = staffAttendanceMap.get(staff.id);
          if (attendance && attendance.checkInTime && attendance.checkOutTime) {
            // 有签到签退记录，使用实际工作时间
            const checkInTime = attendance.checkInTime.slice(0, 5); // HH:mm
            const checkOutTime = attendance.checkOutTime.slice(0, 5); // HH:mm
            isWithinWorkingHours = currentTime >= checkInTime && currentTime < checkOutTime;
          } else {
            // 没有签到签退记录，使用原始排班时间
            const staffAvailabilities = staffAvailabilitiesMap.get(staff.id) || [];
            const todayAvailabilities = staffAvailabilities.filter((avail: any) =>
              avail.dayOfWeek === dayOfWeek && avail.isAvailable
            );

            if (todayAvailabilities.length > 0) {
              // 检查当前时间是否在任意一个工作时间段内
              isWithinWorkingHours = todayAvailabilities.some((avail: any) => {
                const startTime = avail.startTime.slice(0, 5); // HH:mm
                const endTime = avail.endTime.slice(0, 5); // HH:mm
                return currentTime >= startTime && currentTime < endTime;
              });
            }
          }

          // 资源对象的status字段
          if (staff.status === 'ACTIVE') {
            if (!isWithinWorkingHours) {
              // 不在工作时间内，显示offline
              status = 'offline';
            } else if (currentAppointments.length > 0) {
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
        setStaffStatusList(staffWithStatus); // 显示所有员工
      } else {
      }
      
      // 处理房间状态数据（仅在资源类型包含房间时）
      if ((resourceType === 'ROOM' || resourceType === 'BOTH') && roomList && roomList.length > 0) {
        const roomWithStatus = roomList.map((room: any) => {
          // 根据房间的当前预约情况判断状态
          const now = getMerchantNow();
          // 使用商户时区的日期
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          const currentTime = now.toTimeString().slice(0, 5); // HH:mm
          
          // 查找当前正在进行的预约
          const currentAppointments = appointments.filter((apt: any) => {
            // 排除已取消、未出现和已完成的预约
            if (apt.status === 'CANCELLED' || apt.status === 'CANCELED' || apt.status === 'NO_SHOW' || apt.status === 'COMPLETED') return false;
            if (apt.appointmentDate !== today) return false;
            const aptTime = apt.appointmentTime;
            const duration = apt.duration || 60; // 默认60分钟
            const aptEndTime = new Date(`${today} ${aptTime}`);
            aptEndTime.setMinutes(aptEndTime.getMinutes() + duration);
            const aptEndTimeStr = aptEndTime.toTimeString().slice(0, 5);

            // 检查是否使用这个房间
            let hasRoom = apt.roomId === room.id || apt.resourceId === room.id;

            // 也检查appointmentResources数组
            if (!hasRoom && apt.appointmentResources && apt.appointmentResources.length > 0) {
              hasRoom = apt.appointmentResources.some((res: any) =>
                res.resourceId === room.id && res.resourceType === 'ROOM'
              );
            }

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
        setResourceStatusList(roomWithStatus); // 显示所有房间
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

  // 自动滚动到当前时间附近的预约
  useEffect(() => {
    if (timelineRef.current && todayAppointments.length > 0) {
      // 延迟执行以确保DOM已渲染
      setTimeout(() => {
        if (timelineRef.current) {
          const now = getMerchantNow();
          const currentTimeStr = now.toTimeString().slice(0, 5); // HH:mm format

          // 找到当前时间附近的预约索引
          let targetIndex = 0;
          for (let i = 0; i < todayAppointments.length; i++) {
            const appointmentTimeStr = todayAppointments[i].appointmentTime.slice(0, 5);
            if (appointmentTimeStr > currentTimeStr) {
              // Found first future appointment, scroll to previous one or this one
              targetIndex = Math.max(0, i - 1);
              break;
            }
            targetIndex = i;
          }
          
          // 计算滚动位置 (每个预约大约150px高度，包括margin)
          const appointmentHeight = 150;
          const scrollPosition = Math.max(0, targetIndex * appointmentHeight - 100);
          
          // 滚动到目标位置
          timelineRef.current.scrollTop = scrollPosition;
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
      color: isMonochrome ? '#1a1a1a' : '#10B981',
      gradient: GRADIENTS[2],
    },
    {
      title: t('dashboard.totalOrders'),
      value: totalOrders.toLocaleString(),
      change: dashboardStats?.orderGrowth || 0,
      icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />,
      color: isMonochrome ? '#1a1a1a' : '#6366F1',
      gradient: GRADIENTS[0],
    },
    {
      title: t('dashboard.totalCustomers'),
      value: (dashboardStats?.totalCustomers || 0).toLocaleString(),
      change: dashboardStats?.customerGrowth || 0,
      icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
      color: isMonochrome ? '#1a1a1a' : '#F59E0B',
      gradient: GRADIENTS[3],
    },
    {
      title: t('dashboard.avgOrderValue'),
      value: CurrencyUtils.formatAmountWithCommas(Math.round(avgOrderValue)),
      change: dashboardStats?.appointmentGrowth || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      color: isMonochrome ? '#1a1a1a' : '#EC4899',
      gradient: GRADIENTS[1],
    },
  ];

  // 自定义简约Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            py: 1,
            px: 1.5,
            bgcolor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: entry.color }} />
              <Typography variant="caption" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                {entry.name}: {entry.value.toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 600,
              color: THEME_COLOR,
              mb: 0.5,
            }}
          >
            {t('nav.dashboard')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#888' }}>
            {t('dashboard.subtitle')}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            sx={{
              borderRadius: 1.5,
              fontSize: '0.8125rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0,0,0,0.12)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: THEME_COLOR,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: THEME_COLOR,
              },
            }}
          >
            <MenuItem value="7days" sx={{ fontSize: '0.8125rem' }}>{t('dashboard.last7Days')}</MenuItem>
            <MenuItem value="30days" sx={{ fontSize: '0.8125rem' }}>{t('dashboard.last30Days')}</MenuItem>
            <MenuItem value="6months" sx={{ fontSize: '0.8125rem' }}>{t('dashboard.last6Months')}</MenuItem>
            <MenuItem value="1year" sx={{ fontSize: '0.8125rem' }}>{t('dashboard.last1Year')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 简约统计卡片 */}
      <Grid container spacing={2.5} mb={4}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                borderRadius: 2.5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                bgcolor: '#fff',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={2.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: alpha(metric.color, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: metric.color,
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(metric.icon, { sx: { fontSize: 22 } })}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                        {metric.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: metric.change >= 0 ? alpha('#10B981', 0.08) : alpha('#EF4444', 0.08),
                          color: metric.change >= 0 ? '#059669' : '#DC2626',
                          fontWeight: 500,
                          fontSize: '0.65rem',
                        }}
                      >
                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      className="numeric"
                      sx={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '1.25rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 实时通知提醒和快捷操作 */}
      <Grid container spacing={2.5} mb={3}>
        {/* 实时通知提醒 */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#EF4444',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                    }}
                  >
                    {t('dashboard.notifications')}
                  </Typography>
                  {unreadNotificationCount > 0 && (
                    <Box
                      sx={{
                        ml: 1,
                        minWidth: 20,
                        height: 20,
                        px: 0.5,
                        borderRadius: 1,
                        bgcolor: isMonochrome ? '#1a1a1a' : '#EF4444',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {unreadNotificationCount}
                    </Box>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" sx={{ color: '#999', mr: 1 }}>
                    {notifications.length} {t('dashboard.total')}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={fetchNewNotifications}
                    title={t('dashboard.refresh')}
                    sx={{
                      color: '#999',
                      '&:hover': { color: '#666' },
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={markNotificationsAsRead}
                    sx={{ color: '#999', '&:hover': { color: '#666' } }}
                  >
                    {isNotificationExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
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
                  // 获取多语言文本
                  const localizedText = getLocalizedText(notification);

                  // 根据通知类型设置图标和颜色
                  let icon, color, title;

                  // 使用业务通知类型 - 极简模式使用灰度色
                  if (notification.notificationType === 'NEW_APPOINTMENT') {
                    color = isMonochrome ? '#1a1a1a' : '#10B981';
                    icon = <AddCircleIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.newAppointmentAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_REMINDER') {
                    color = isMonochrome ? '#666' : '#F59E0B';
                    icon = <ScheduleIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.upcomingAppointmentAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_CANCELLED') {
                    color = isMonochrome ? '#888' : '#EF4444';
                    icon = <WarningIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.appointmentCancelledAlert');
                  } else if (notification.notificationType === 'APPOINTMENT_CONFIRMED') {
                    color = isMonochrome ? '#1a1a1a' : '#10B981';
                    icon = <CheckCircleIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.appointmentConfirmedAlert');
                  } else if (notification.notificationType === 'PENDING_CONFIRMATION') {
                    color = isMonochrome ? '#666' : '#F59E0B';
                    icon = <ScheduleIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.pendingConfirmation');
                  } else if (notification.level === 'ERROR') {
                    color = isMonochrome ? '#888' : '#EF4444';
                    icon = <WarningIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.error');
                  } else if (notification.level === 'WARNING') {
                    color = isMonochrome ? '#666' : '#F59E0B';
                    icon = <WarningIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.warning');
                  } else if (notification.level === 'SUCCESS') {
                    color = isMonochrome ? '#1a1a1a' : '#10B981';
                    icon = <CheckCircleIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.success');
                  } else {
                    color = isMonochrome ? '#1a1a1a' : '#6366F1';
                    icon = <InfoIcon sx={{ fontSize: 18, color }} />;
                    title = localizedText.title || t('dashboard.notification');
                  }
                  
                  // 计算时间差 - 使用UTC时间转换为商户本地时间
                  const createdTime = utcToMerchantTime(notification.createdAt);
                  const now = getMerchantNow();
                  const diffMinutes = createdTime ? Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60)) : 0;
                  let timeAgo = '';

                  // 处理负数时间差（时区问题或未来时间）
                  if (diffMinutes < 0) {
                    timeAgo = t('dashboard.justNow');
                  } else if (diffMinutes < 1) {
                    timeAgo = t('dashboard.justNow');
                  } else if (diffMinutes < 60) {
                    timeAgo = `${diffMinutes} ${t('dashboard.minutesAgo')}`;
                  } else if (diffMinutes < 1440) {
                    timeAgo = `${Math.floor(diffMinutes / 60)} ${t('dashboard.hoursAgo')}`;
                  } else {
                    timeAgo = `${Math.floor(diffMinutes / 1440)} ${t('dashboard.daysAgo')}`;
                  }
                  
                  return (
                    <Box
                      key={index}
                      sx={{
                        py: 1.5,
                        borderBottom: index < notifications.slice(0, isNotificationExpanded ? 50 : 3).length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.02)',
                        }
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1.5}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: alpha(color, 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </Box>
                        <Box flex={1} sx={{ minWidth: 0 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                              {title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999', flexShrink: 0 }}>
                              {timeAgo}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 0.25 }}>
                            {localizedText.content || t('dashboard.notificationContent')}
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: THEME_COLOR,
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.quickActions')}
                </Typography>
              </Box>

              {/* 快捷操作按钮 */}
              <Grid container spacing={1.5}>
                {[
                  {
                    icon: <CalendarTodayIcon />,
                    label: t('dashboard.viewSchedule'),
                    color: isMonochrome ? '#1a1a1a' : '#3B82F6',
                    onClick: () => onNavigate?.('schedule')
                  },
                  {
                    icon: <PersonPinIcon />,
                    label: t('dashboard.addCustomer'),
                    color: isMonochrome ? '#1a1a1a' : '#EC4899',
                    onClick: () => onNavigate?.('customers')
                  },
                  {
                    icon: <StoreIcon />,
                    label: t('dashboard.manageServices'),
                    color: isMonochrome ? '#1a1a1a' : '#06B6D4',
                    onClick: () => onNavigate?.('products')
                  },
                  {
                    icon: <BadgeIcon />,
                    label: t('dashboard.manageStaff'),
                    color: isMonochrome ? '#1a1a1a' : '#3B82F6',
                    onClick: () => onNavigate?.('resources')
                  },
                ].map((action, index) => (
                  <Grid item xs={6} key={index}>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={action.onClick}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        flexDirection: 'column',
                        bgcolor: alpha(action.color, 0.06),
                        color: action.color,
                        '&:hover': {
                          bgcolor: alpha(action.color, 0.12),
                        },
                      }}
                    >
                      {React.cloneElement(action.icon, {
                        sx: { fontSize: 24, mb: 0.5, color: action.color }
                      })}
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
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

      {/* 图表区域 */}
      <Grid container spacing={2.5} mt={0.5}>
        {/* 销售趋势折线图 */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" mb={2.5}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: THEME_COLOR,
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.salesTrend')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#999' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#999' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '12px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                    name={t('dashboard.sales')}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#10B981"
                    strokeWidth={2}
                    name={t('dashboard.orders')}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 1.5 }}
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={2.5}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: isMonochrome ? '#1a1a1a' : '#EC4899',
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.serviceCategories')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, t('dashboard.percentage')]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" mb={2.5}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: isMonochrome ? '#1a1a1a' : '#F59E0B',
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.visitorTraffic')}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#999' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#999' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#F59E0B"
                    strokeWidth={2}
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.5, height: '100%' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                    }}
                  >
                    {t('dashboard.topServices')}
                  </Typography>
                </Box>
                <Chip
                  label={`Top ${topServicesData.length}`}
                  size="small"
                  sx={{
                    bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#8B5CF6', 0.1),
                    color: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                    fontWeight: 600,
                  }}
                />
              </Box>
              
              {/* 改用列表展示，更清晰 */}
              <Box sx={{ mt: 1 }}>
                {topServicesData.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                      {t('dashboard.noData')}
                    </Typography>
                  </Box>
                ) : (
                  topServicesData.map((service, index) => {
                    const maxSales = Math.max(...topServicesData.map(s => s.sales));
                    const percentage = maxSales > 0 ? (service.sales / maxSales) * 100 : 0;

                    return (
                      <Box
                        key={index}
                        sx={{
                          py: 1.5,
                          borderBottom: index < topServicesData.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: '#999',
                                width: 20,
                              }}
                            >
                              {index + 1}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: '#1a1a1a',
                              }}
                            >
                              {service.name}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: '#1a1a1a',
                              }}
                            >
                              {CurrencyUtils.formatAmountWithCommas(service.sales)}
                            </Typography>
                            {service.growth !== 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: service.growth > 0 ? '#10B981' : '#EF4444',
                                  fontWeight: 500,
                                }}
                              >
                                {service.growth > 0 ? '+' : ''}{service.growth}%
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* 进度条 */}
                        <Box sx={{ ml: 4 }}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              bgcolor: 'rgba(0,0,0,0.04)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${percentage}%`,
                                height: '100%',
                                bgcolor: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                                borderRadius: 2,
                                transition: 'width 0.5s ease',
                              }}
                            />
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#14B8A6',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                    }}
                  >
                    {t('dashboard.resourceStatus')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {(merchantResourceType === 'STAFF' || merchantResourceType === 'BOTH') && staffStatusList.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {t('dashboard.totalStaff')}: {staffStatusList.length}
                    </Typography>
                  )}
                  {(merchantResourceType === 'ROOM' || merchantResourceType === 'BOTH') && resourceStatusList.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {t('dashboard.totalRooms')}: {resourceStatusList.length}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 资源状态网格 */}
              <Grid container spacing={1.5}>
                {/* 合并员工和房间列表 */}
                {([...staffStatusList, ...resourceStatusList].length > 0 ?
                  [...staffStatusList, ...resourceStatusList] : [
                  { name: t('dashboard.noResourceData'), avatar: '', status: 'offline', currentService: null, endTime: null, type: 'staff' },
                ]).map((resource, index) => {
                  const statusConfig = {
                    busy: { color: '#F59E0B', label: t('dashboard.busy'), icon: '🟡' },
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
                          py: 1.5,
                          px: 2,
                          borderBottom: '1px solid rgba(0,0,0,0.06)',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.02)',
                          },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            src={getFullImageUrl(resource.avatar)}
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: '#f5f5f5',
                              color: '#666',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                            }}
                          >
                            {resource.type === 'room' ? <RoomIcon sx={{ fontSize: 18 }} /> : (resource.name?.[0] || '?')}
                          </Avatar>
                          <Box flex={1} sx={{ minWidth: 0 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                {resource.name}
                              </Typography>
                              {resource.type === 'room' && (
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                  ({t('dashboard.room')})
                                </Typography>
                              )}
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusConfig.color }} />
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                {statusConfig.label}
                              </Typography>
                              {resource.currentService && (
                                <>
                                  <Typography variant="caption" sx={{ color: '#999' }}>•</Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#666',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {resource.currentService}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Box>
                          {resource.endTime && (
                            <Typography variant="caption" sx={{ color: '#999', flexShrink: 0 }}>
                              {resource.endTime}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* 状态统计 */}
              <Box display="flex" justifyContent="center" gap={4} mt={2} pt={2} sx={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {t('dashboard.available')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'available').length}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {t('dashboard.busy')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'busy').length}
                  </Typography>
                </Box>
                {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'maintenance').length > 0 && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {t('dashboard.maintenance')}: {[...staffStatusList, ...resourceStatusList].filter(s => s.status === 'maintenance').length}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6B7280' }} />
                  <Typography variant="caption" sx={{ color: '#666' }}>
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
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.todayAppointments')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="baseline" gap={2} mb={1}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  {dashboardStats?.totalAppointments || 0}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: dashboardStats?.appointmentGrowth >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: 500
                  }}
                >
                  {dashboardStats?.appointmentGrowth >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats?.appointmentGrowth || 0)}%
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#999' }}>
                {t('dashboard.appointmentsTrend')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 运营状态实时监控 */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: isMonochrome ? '#1a1a1a' : '#EC4899',
                    borderRadius: 0.5,
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  {t('dashboard.operationStatus')}
                </Typography>
              </Box>

              {/* 运营状态指标 */}
              <Box display="flex" alignItems="baseline" gap={4}>
                <Box display="flex" alignItems="baseline" gap={1}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: isMonochrome ? '#1a1a1a' : '#10B981' }}>
                    {dashboardStats?.completedAppointments || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {t('dashboard.completedToday')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="baseline" gap={1}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: isMonochrome ? '#666' : '#3B82F6' }}>
                    {dashboardStats?.pendingAppointments || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    {t('dashboard.pending')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* 今日预约时间轴 */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
              mt: 1,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      bgcolor: isMonochrome ? '#1a1a1a' : '#06B6D4',
                      borderRadius: 0.5,
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                    }}
                  >
                    {t('dashboard.todayTimeline')}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {getMerchantNow().toLocaleDateString()}
                </Typography>
              </Box>
              
              {/* 时间轴 */}
              <Box
                ref={timelineRef}
                sx={{
                  position: 'relative',
                  pl: 3,
                  maxHeight: 500,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': {
                    width: 4,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 2,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    borderRadius: 2,
                  },
                }}
              >
                {/* 时间节点容器 - 包含垂直线和所有时间节点 */}
                {todayAppointments.length > 0 ? (
                  <Box sx={{
                    position: 'relative',
                    paddingLeft: '32px',
                  }}>
                    {/* 时间节点内容 */}
                    {(() => {
                      const now = getMerchantNow();
                      const currentTimeStr = now.toTimeString().slice(0, 5);

                      // 排序预约列表
                      const sortedAppointments = todayAppointments.sort((a, b) =>
                        a.appointmentTime.localeCompare(b.appointmentTime)
                      );

                      // 创建包含预约和当前时间指示器的元素列表
                      const elements: React.ReactNode[] = [];
                      let currentTimeInserted = false;

                      sortedAppointments.forEach((appointment, index) => {
                        const appointmentTimeStr = appointment.appointmentTime.slice(0, 5);

                        // 在适当位置插入当前时间指示器
                        if (!currentTimeInserted && appointmentTimeStr > currentTimeStr) {
                          elements.push(
                          <Box key="current-time" sx={{ position: 'relative', mb: 2 }}>
                            {/* 垂直线段 */}
                            <Box sx={{
                              position: 'absolute',
                              left: -28,
                              top: -16,
                              bottom: -16,
                              width: 2,
                              backgroundColor: 'rgba(0,0,0,0.08)',
                              borderRadius: 1,
                              zIndex: 0,
                            }} />
                            {/* 当前时间的点 */}
                            <Box sx={{
                              position: 'absolute',
                              left: -32,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: isMonochrome ? '#1a1a1a' : '#06B6D4',
                              border: '2px solid white',
                              boxShadow: isMonochrome ? '0 0 0 2px rgba(26, 26, 26, 0.2)' : '0 0 0 2px rgba(6, 182, 212, 0.2)',
                              zIndex: 2,
                            }} />

                            {/* 当前时间标记 */}
                            <Box sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#06B6D4', 0.08),
                            }}>
                              <Typography variant="caption" sx={{ color: isMonochrome ? '#1a1a1a' : '#06B6D4', fontWeight: 600 }}>
                                {t('dashboard.currentTime')}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isMonochrome ? '#1a1a1a' : '#06B6D4', fontWeight: 600 }}>
                                {currentTimeStr}
                              </Typography>
                            </Box>
                          </Box>
                          );
                          currentTimeInserted = true;
                        }
                        
                        // 渲染预约 - 状态完全基于预约的实际状态，不基于时间
                        const isCompleted = appointment.status === 'COMPLETED';
                        const isCurrent = appointment.status === 'CHECKED_IN' || appointment.status === 'IN_PROGRESS';
                        const isCancelled = appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW';
                        const isPending = appointment.status === 'CONFIRMED' || appointment.status === 'PENDING';
                        
                        elements.push(
                        <React.Fragment key={appointment.id}>
                          <Box sx={{ position: 'relative', mb: 2 }}>
                            {/* 垂直线段 */}
                            {(index === 0 || index < sortedAppointments.length - 1) && (
                              <Box sx={{
                                position: 'absolute',
                                left: -28,
                                top: index === 0 ? -16 : 5,
                                bottom: -16,
                                width: 2,
                                backgroundColor: 'rgba(0,0,0,0.08)',
                                borderRadius: 1,
                                zIndex: 0,
                              }} />
                            )}
                            {/* 时间点 */}
                            <Box sx={{
                              position: 'absolute',
                              left: -32,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: isMonochrome
                                ? (isCompleted ? '#1a1a1a' : isCurrent ? '#666' : isCancelled ? '#999' : '#444')
                                : (isCompleted ? '#10B981' : isCurrent ? '#F59E0B' : isCancelled ? '#EF4444' : '#3B82F6'),
                              zIndex: 1,
                            }} />

                            {/* 预约信息 */}
                            <Box sx={{
                              py: 1.5,
                              borderBottom: '1px solid rgba(0,0,0,0.06)',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.02)',
                              },
                            }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                    {appointment.appointmentTime}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.65rem',
                                    fontWeight: 500,
                                    bgcolor: isMonochrome
                                      ? (isCompleted ? 'rgba(26, 26, 26, 0.1)' : isCurrent ? 'rgba(102, 102, 102, 0.1)' : isCancelled ? 'rgba(153, 153, 153, 0.1)' : 'rgba(68, 68, 68, 0.1)')
                                      : (isCompleted ? alpha('#10B981', 0.1) : isCurrent ? alpha('#F59E0B', 0.1) : isCancelled ? alpha('#EF4444', 0.1) : alpha('#3B82F6', 0.1)),
                                    color: isMonochrome
                                      ? (isCompleted ? '#1a1a1a' : isCurrent ? '#666' : isCancelled ? '#999' : '#444')
                                      : (isCompleted ? '#10B981' : isCurrent ? '#F59E0B' : isCancelled ? '#EF4444' : '#3B82F6'),
                                  }}
                                >
                                  {isCompleted ? t('dashboard.completed') :
                                   isCurrent ? t('dashboard.inProgress') :
                                   isCancelled ? (appointment.status === 'NO_SHOW' ? t('dashboard.noShow') : t('dashboard.cancelled')) :
                                   t('dashboard.pending')}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#1a1a1a', display: 'block' }}>
                                {/* 尝试多种方式获取服务名称 */}
                                {appointment.services?.map((s: any) => s.serviceName).join(', ') ||
                                 appointment.appointmentServices?.map((s: any) => s.serviceName).join(', ') ||
                                 appointment.serviceName ||
                                 '服务'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999' }}>
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
                        </React.Fragment>
                        );
                      });
                      
                      // 如果当前时间在所有预约之后，在末尾添加当前时间指示器
                      if (!currentTimeInserted) {
                        elements.push(
                        <Box key="current-time" sx={{ position: 'relative', mb: 2 }}>
                          {/* 垂直线段 */}
                          {sortedAppointments.length > 0 && (
                            <Box sx={{
                              position: 'absolute',
                              left: -28,
                              top: -16,
                              height: 16,
                              width: 2,
                              backgroundColor: 'rgba(0,0,0,0.08)',
                              borderRadius: 1,
                              zIndex: 0,
                            }} />
                          )}
                          {/* 当前时间的点 */}
                          <Box sx={{
                            position: 'absolute',
                            left: -32,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: isMonochrome ? '#1a1a1a' : '#06B6D4',
                            border: '2px solid white',
                            boxShadow: isMonochrome ? '0 0 0 2px rgba(26, 26, 26, 0.2)' : '0 0 0 2px rgba(6, 182, 212, 0.2)',
                            zIndex: 2,
                          }} />

                          {/* 当前时间标记 */}
                          <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5,
                            px: 1,
                            borderRadius: 1,
                            bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#06B6D4', 0.08),
                          }}>
                            <Typography variant="caption" sx={{ color: isMonochrome ? '#1a1a1a' : '#06B6D4', fontWeight: 600 }}>
                              {t('dashboard.currentTime')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isMonochrome ? '#1a1a1a' : '#06B6D4', fontWeight: 600 }}>
                              {currentTimeStr}
                            </Typography>
                          </Box>
                        </Box>
                        );
                      }
                      
                      return elements;
                    })()}
                  </Box>
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