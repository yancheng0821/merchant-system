import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  alpha,
  CircularProgress,
  Divider,
  IconButton,
  Button,
  Drawer,
  List,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Popover,
  Snackbar,
  Alert,
  MenuItem,
  Backdrop,
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Check as CheckIcon,
  NoteAdd as NoteAddIcon,
  ModeEdit as ModeEditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, endOfWeek, parseISO } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import AppointmentDialog from './components/AppointmentDialog';
import AppointmentCard from './components/AppointmentCard';
import StaffInfoCard from './components/StaffInfoCard';
import PaymentDialog, { ServicePayment } from './components/PaymentDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { resourceApi, serviceApi, getFullImageUrl, api, appointmentApi } from '../../../services/api';
import type { Resource, Service as ApiService, Customer } from '../../../services/api';
import { getMerchantNow, getMerchantTimezone } from '../../../utils/timezoneUtils';

interface ResourceShift {
  id: number;
  tenantId: number;
  resourceId: number;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  allowOnlineBooking: boolean;
  maxAppointments?: number;
  notes?: string;
  createdBy?: number;
}

interface AppointmentService {
  serviceId: number;
  serviceName: string;
  price: number;
  duration?: number;
}

interface Appointment {
  id: number;
  resourceId: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerCountryCode?: string;
  customerEmail?: string;
  serviceId?: number; // 第一个服务ID（向后兼容）
  serviceIds?: number[]; // 所有服务ID数组（多服务支持）
  serviceName: string; // 服务名称（多个服务用逗号分隔）
  serviceDetails?: string;
  services?: AppointmentService[]; // 服务详情数组（包含价格）
  startTime: string;
  endTime: string;
  date: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  price: number;
  notes?: string;
  isNewPatient?: boolean;
  paid?: boolean;
  paidTime?: string;
  paymentMethod?: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  color: string;
  icon: string;
  staffIds: number[];
}

interface ShiftCalendarViewProps {
  shifts: ResourceShift[];
  weekStart: Date;
  onEditShift: (shift: ResourceShift) => void;
  onDeleteShift: (shiftId: number) => void;
  onAddShift: () => void;
  loading: boolean;
}

// 预约布局信息
interface AppointmentLayout extends Appointment {
  column: number;
  totalColumns: number;
}

// 系统主题颜色 - 与 Resource Management 一致
const themeColor = '#3B82F6';

// Jane App 配色方案 - 原始配色
const janeColors = {
  primary: '#5EBFB3',
  green: '#7BC68C',
  lightGreen: '#A8D5BA',
  blue: '#7FC3D8',
  lightBlue: '#B3E0EC',
  yellow: '#F5D76E',
  orange: '#FFB84D',
  pink: '#E8A4C0',
  purple: '#B7A4D5',
  gray: '#C5CDD1',
};

// 状态颜色
const statusColors = {
  CONFIRMED: janeColors.green,
  CHECKED_IN: '#FF9800', // 橙色 - 已签到
  COMPLETED: janeColors.lightGreen,
  CANCELLED: janeColors.gray,
  NO_SHOW: janeColors.gray,
};

// 模拟员工数据 - 按字母顺序排序，使用 Jane App 原始配色
// Mock data has been removed - all data now comes from API

// 生成时间槽 - 从早上10点到晚上10点
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// 每小时的像素高度 - 设置为200px，适合30分钟起步的服务
const HOUR_HEIGHT = 200;

// 计算预约位置 - 基于10点开始
const calculatePosition = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = (startHour - 10) * 60 + startMinute;
  const endMinutes = (endHour - 10) * 60 + endMinute;

  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;

  return { top, height };
};

// 检查两个预约是否重叠
const isOverlapping = (apt1: Appointment, apt2: Appointment): boolean => {
  const start1 = apt1.startTime;
  const end1 = apt1.endTime;
  const start2 = apt2.startTime;
  const end2 = apt2.endTime;

  return start1 < end2 && start2 < end1;
};

// 全新的布局算法 - 基于 Google Calendar 的方法
const calculateAppointmentLayout = (appointments: Appointment[]): AppointmentLayout[] => {
  if (appointments.length === 0) return [];

  // 按开始时间排序，如果开始时间相同则按结束时间排序
  const sorted = [...appointments].sort((a, b) => {
    const timeCompare = a.startTime.localeCompare(b.startTime);
    if (timeCompare !== 0) return timeCompare;
    return a.endTime.localeCompare(b.endTime);
  });

  // 创建布局结果数组
  const layouts: AppointmentLayout[] = sorted.map(apt => ({
    ...apt,
    column: 0,
    totalColumns: 1,
  }));

  // 为每个预约找到合适的列
  for (let i = 0; i < layouts.length; i++) {
    const current = layouts[i];

    // 找出所有与当前预约重叠的之前的预约
    const overlappingBefore = layouts.slice(0, i).filter(other =>
      isOverlapping(current, other)
    );

    // 收集已被占用的列
    const usedColumns = new Set(overlappingBefore.map(apt => apt.column));

    // 找到第一个可用的列
    let columnIndex = 0;
    while (usedColumns.has(columnIndex)) {
      columnIndex++;
    }

    current.column = columnIndex;
  }

  // 将预约分组 - 找出所有互相重叠的预约组
  const groups: number[][] = [];

  for (let i = 0; i < layouts.length; i++) {
    // 找出与当前预约重叠的所有预约（包括自己）
    const overlapping = new Set<number>();
    overlapping.add(i);

    for (let j = 0; j < layouts.length; j++) {
      if (i !== j && isOverlapping(layouts[i], layouts[j])) {
        overlapping.add(j);
      }
    }

    // 检查是否可以合并到现有组
    let merged = false;
    for (const group of groups) {
      if (group.some(idx => overlapping.has(idx))) {
        // 合并到现有组
        overlapping.forEach(idx => {
          if (!group.includes(idx)) {
            group.push(idx);
          }
        });
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push(Array.from(overlapping));
    }
  }

  // 为每个组设置正确的 totalColumns
  for (const group of groups) {
    const maxColumn = Math.max(...group.map(idx => layouts[idx].column));
    const totalColumns = maxColumn + 1;

    group.forEach(idx => {
      layouts[idx].totalColumns = totalColumns;
    });
  }

  return layouts;
};

const ShiftCalendarView: React.FC<ShiftCalendarViewProps> = ({
  shifts,
  weekStart,
  onEditShift,
  onDeleteShift,
  onAddShift,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const locale = i18n.language === 'zh' ? zhCNLocale : enUSLocale;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(getMerchantNow());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLElement | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [appointmentDialogData, setAppointmentDialogData] = useState<{
    date: Date;
    startTime: string;
    endTime: string;
    resourceId: number;
    resourceName?: string;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'warning',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const calendarContainerRef = React.useRef<HTMLDivElement>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  // 真实数据状态
  const [realStaff, setRealStaff] = useState<Resource[]>([]);
  const [realServices, setRealServices] = useState<ApiService[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [resourceServices, setResourceServices] = useState<Record<number, number[]>>({});
  const [resourceAvailabilities, setResourceAvailabilities] = useState<Record<number, any[]>>({});
  const [availabilitiesLoading, setAvailabilitiesLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [resourceServicesLoading, setResourceServicesLoading] = useState(true);

  // 加载真实数据
  useEffect(() => {
    const loadData = async () => {
      if (!user?.tenantId) return;

      try {
        setDataLoading(true);

        // 并行加载员工和服务数据
        const [staffData, servicesData] = await Promise.all([
          resourceApi.getResourcesByType(user.tenantId, 'STAFF'),
          serviceApi.getServices(user.tenantId.toString())
        ]);

        setRealStaff(staffData || []);
        setRealServices(servicesData || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
          severity: 'error',
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  // 加载所有员工的服务专长（用于服务过滤）
  useEffect(() => {
    const loadAllResourceServices = async () => {
      if (realStaff.length === 0) {
        setResourceServicesLoading(false);
        return;
      }

      try {
        setResourceServicesLoading(true);
        const servicesMap: Record<number, number[]> = {};

        // 为所有员工加载其服务专长
        await Promise.all(
          realStaff.map(async (resource) => {
            try {
              const expertise = await resourceApi.getResourceServices(resource.id);
              servicesMap[resource.id] = expertise.map((e: any) => e.serviceId);
            } catch (error) {
              console.error(`Failed to load services for resource ${resource.id}:`, error);
              servicesMap[resource.id] = [];
            }
          })
        );

        setResourceServices(servicesMap);
      } catch (error) {
        console.error('Failed to load resource services:', error);
      } finally {
        setResourceServicesLoading(false);
      }
    };

    loadAllResourceServices();
  }, [realStaff]);

  // 加载所有员工的可用性数据
  useEffect(() => {
    const loadResourceAvailabilities = async () => {
      if (realStaff.length === 0) {
        setAvailabilitiesLoading(false);
        return;
      }

      try {
        setAvailabilitiesLoading(true);
        const availabilitiesMap: Record<number, any[]> = {};

        // 为所有员工加载其每周可用性数据
        await Promise.all(
          realStaff.map(async (resource) => {
            try {
              const availabilities = await resourceApi.getResourceAvailability(resource.id);
              availabilitiesMap[resource.id] = availabilities || [];
            } catch (error) {
              console.error(`Failed to load availability for resource ${resource.id}:`, error);
              availabilitiesMap[resource.id] = [];
            }
          })
        );

        setResourceAvailabilities(availabilitiesMap);
      } catch (error) {
        console.error('Failed to load resource availabilities:', error);
      } finally {
        setAvailabilitiesLoading(false);
      }
    };

    loadResourceAvailabilities();
  }, [realStaff]); // 只在员工列表变化时加载

  // 加载预约数据
  const loadAppointments = React.useCallback(async () => {
    if (!user?.tenantId) {
      setAppointmentsLoading(false);
      return;
    }

    try {
      setAppointmentsLoading(true);
      const appointmentsData = await api.getAllAppointments(user.tenantId);

      // Transform API data to local Appointment format
      const transformedAppointments: Appointment[] = appointmentsData.map((apt: any) => {
        // 处理多服务：将所有服务名称用逗号分隔
        const serviceNames = apt.appointmentServices && apt.appointmentServices.length > 0
          ? apt.appointmentServices.map((svc: any) =>
              svc.serviceName || svc.service?.name || 'Unknown Service'
            ).join(', ')
          : 'Unknown Service';

        // 获取所有服务ID（用于支付时筛选套餐）
        const serviceIds = apt.appointmentServices?.map((svc: any) => svc.serviceId) || [];

        // 获取服务详情数组（包含价格）
        const services: AppointmentService[] = apt.appointmentServices?.map((svc: any) => ({
          serviceId: svc.serviceId,
          serviceName: svc.serviceName || svc.service?.name || 'Unknown Service',
          price: svc.price || 0,
          duration: svc.duration || svc.service?.duration,
        })) || [];

        return {
          id: apt.id,
          resourceId: apt.appointmentResources?.[0]?.resourceId || 0,
          customerId: apt.customerId,
          customerName: `${apt.customer?.firstName || ''} ${apt.customer?.lastName || ''}`.trim(),
          customerPhone: apt.customer?.phone,
          customerCountryCode: apt.customer?.countryCode,
          customerEmail: apt.customer?.email,
          serviceId: apt.appointmentServices?.[0]?.serviceId, // 保留第一个服务ID用于向后兼容
          serviceIds: serviceIds, // 所有服务ID数组
          serviceName: serviceNames, // 所有服务名称（逗号分隔）
          serviceDetails: apt.appointmentServices?.[0]?.service?.description,
          services: services, // 服务详情数组
          startTime: apt.appointmentTime,
          endTime: calculateEndTime(apt.appointmentTime, apt.duration),
          date: apt.appointmentDate,
          status: apt.status,
          price: apt.totalAmount,
          notes: apt.notes,
          paid: apt.status === 'COMPLETED', // Set paid based on status
        };
      });

      setAllAppointments(transformedAppointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [user?.tenantId]);

  // Helper function to calculate end time
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
  };

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // 计算整个日历的数据是否已全部加载完成
  const isCalendarDataReady = useMemo(() => {
    return !dataLoading &&
           !availabilitiesLoading &&
           !appointmentsLoading &&
           !resourceServicesLoading;
  }, [dataLoading, availabilitiesLoading, appointmentsLoading, resourceServicesLoading]);

  const currentDates = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate];
    } else {
      const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({
        start: weekStartDate,
        end: endOfWeek(weekStartDate, { weekStartsOn: 1 }),
      });
    }
  }, [currentDate, viewMode]);

  // 所有员工列表（用于左侧边栏）- 不经过搜索过滤
  const allStaffList = useMemo(() => {
    // 如果还在加载，返回空数组
    if (dataLoading) {
      return [];
    }

    // 如果没有真实数据，也返回空数组而不是 mock 数据
    if (realStaff.length === 0) {
      return [];
    }

    // 使用真实数据，转换为显示格式
    return realStaff.filter(r => r.status === 'ACTIVE').map((resource, index) => ({
      id: resource.id,
      name: resource.name,
      role: resource.position || resource.description || t('resources.staff'),
      avatar: getFullImageUrl(resource.avatar),
      color: janeColors[Object.keys(janeColors)[index % Object.keys(janeColors).length] as keyof typeof janeColors]
    }));
  }, [realStaff, dataLoading, t]);

  // 转换真实员工数据为显示格式（用于日历显示区域）
  const displayedStaff = useMemo(() => {
    let staff = allStaffList;

    // 如果有搜索查询,过滤出有匹配客户的技师
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      // 找出所有匹配搜索条件的预约（排除已取消的）
      const matchingAppointments = allAppointments.filter(apt =>
        apt.date === dateStr &&
        apt.status !== 'CANCELLED' &&
        apt.customerName.toLowerCase().includes(query)
      );

      // 获取这些预约对应的技师ID
      const staffIdsWithMatches = new Set(matchingAppointments.map(apt => apt.resourceId));

      // 只显示有匹配客户预约的技师
      staff = staff.filter(s => staffIdsWithMatches.has(s.id));
    }

    // 如果选择了服务，过滤出提供该服务的技师
    if (selectedServiceId && resourceServices) {
      const staffIdsWithService = Object.entries(resourceServices)
        .filter(([_, serviceIds]) => serviceIds.includes(selectedServiceId))
        .map(([resourceId, _]) => Number(resourceId));

      staff = staff.filter(s => staffIdsWithService.includes(s.id));
    }

    if (selectedStaffIds.length > 0) {
      staff = staff.filter(s => selectedStaffIds.includes(s.id));
    }
    return staff;
  }, [searchQuery, selectedStaffIds, selectedServiceId, resourceServices, currentDate, allAppointments, allStaffList]);

  // 转换真实服务数据为显示格式
  const availableServices = useMemo(() => {
    // 如果还在加载，返回空数组
    if (dataLoading) {
      return [];
    }

    // 如果没有真实数据，返回空数组而不是 mock 数据
    if (realServices.length === 0) {
      return [];
    }

    // 使用真实数据 - 转换为 Service 格式
    const services = realServices.map((apiService, index): Service => {
      // 为每个服务分配颜色（循环使用 janeColors）
      const colorKeys = Object.keys(janeColors);
      const color = janeColors[colorKeys[index % colorKeys.length] as keyof typeof janeColors];

      // 根据服务名称生成简短图标
      const icon = apiService.name.substring(0, 2).toUpperCase();

      return {
        id: apiService.id,
        name: apiService.name,
        duration: apiService.duration,
        price: apiService.price,
        color: color,
        icon: icon,
        staffIds: [] // 不再使用这个字段
      };
    });

    // 如果没有选择员工，显示所有服务
    if (selectedStaffIds.length === 0) {
      return services;
    }

    // 如果选择了员工，只显示选中员工的服务专长
    // 收集所有选中员工的服务ID
    const selectedResourceServiceIds = new Set<number>();
    selectedStaffIds.forEach(resourceId => {
      const serviceIds = resourceServices[resourceId] || [];
      serviceIds.forEach(serviceId => selectedResourceServiceIds.add(serviceId));
    });

    // 只返回选中员工有专长的服务
    return services.filter(service => selectedResourceServiceIds.has(service.id));
  }, [selectedStaffIds, realServices, dataLoading, resourceServices]);

  const getStaffAppointments = (staffId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let appointments = allAppointments.filter(a =>
      a.resourceId === staffId &&
      a.date === dateStr &&
      a.status !== 'CANCELLED'
    );

    // 如果有搜索查询,只显示匹配客户名字的预约
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      appointments = appointments.filter(a =>
        a.customerName.toLowerCase().includes(query)
      );
    }

    return appointments;
  };

  const toggleStaffSelection = (staffId: number) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(getMerchantNow());
  };

  // 检查是否是过去的时间 - 精确到分钟（基于商户时区）
  const isPastTime = (date: Date, timeStr: string): boolean => {
    // 使用商户时区的当前时间，而不是浏览器本地时间
    const now = getMerchantNow();
    const [hours, minutes] = timeStr.split(':').map(Number);

    // 检查日期是否是今天（基于商户时区）
    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

    // 如果不是今天，直接判断日期是否在过去
    if (!isToday) {
      return date < now;
    }

    // 如果是今天，比较当前时间和时间槽的结束时间
    // 只有当整个小时时间段都过去了，才标记为不可用
    const slotEndTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours + 1, 0, 0, 0);

    // 添加5分钟缓冲，避免拒绝正在创建的预约
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return slotEndTime < fiveMinutesAgo;
  };

  // 检查员工在指定时间是否可用
  const isResourceAvailable = (resourceId: number, date: Date, timeStr: string): boolean => {
    // 如果可用性数据还在加载中，默认返回true（避免显示斜纹）
    if (availabilitiesLoading) {
      return true;
    }

    // 如果 resourceAvailabilities 是空对象（没有任何员工的可用性数据），
    // 但有员工数据存在，说明数据还在加载中，返回true避免显示斜纹
    const hasAnyAvailabilityData = Object.keys(resourceAvailabilities).length > 0;
    if (!hasAnyAvailabilityData && realStaff.length > 0) {
      return true;
    }

    const availabilities = resourceAvailabilities[resourceId];
    if (!availabilities || availabilities.length === 0) {
      // 如果没有设置可用性，默认为不可用（必须先设置员工可用性才能添加预约）
      return false;
    }

    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // 转换为后端格式 (1=Monday, ..., 7=Sunday)
    const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const checkTimeMinutes = hours * 60 + minutes;

    // 获取当天的所有可用性记录（支持多个时间段）
    const dayAvailabilities = availabilities.filter(
      (avail: any) => avail.dayOfWeek === backendDayOfWeek
    );

    if (!dayAvailabilities || dayAvailabilities.length === 0) {
      // 如果当天没有可用性记录，默认不可用
      return false;
    }

    // 检查时间是否在任何一个可用时间段内
    return dayAvailabilities.some((dayAvailability: any) => {
      const [startHours, startMinutes] = dayAvailability.startTime.split(':').map(Number);
      const [endHours, endMinutes] = dayAvailability.endTime.split(':').map(Number);
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;

      return (
        dayAvailability.isAvailable &&
        checkTimeMinutes >= startTimeMinutes &&
        checkTimeMinutes < endTimeMinutes
      );
    });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotesValue(appointment.notes || '');
    setEditingNotes(false);
    setDrawerOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    // 检查更新权限
    if (!hasPermission('schedule:update')) {
      setSnackbar({
        open: true,
        message: t('permissions.noUpdatePermission', 'You do not have permission to update appointments'),
        severity: 'warning',
      });
      return;
    }

    // 打开编辑对话框，预填充预约数据
    setAppointmentDialogData({
      date: new Date(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      resourceId: appointment.resourceId,
      resourceName: allStaffList.find(s => s.id === appointment.resourceId)?.name,
    });
    setSelectedAppointment(appointment);
    setAppointmentDialogOpen(true);
  };

  const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
    setDatePickerAnchor(event.currentTarget);
  };

  const handleDatePickerClose = () => {
    setDatePickerAnchor(null);
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setCurrentDate(newDate);
    }
    setDatePickerAnchor(null);
  };

  // 智能计算时间槽的开始和结束时间
  const calculateTimeSlot = (event: React.MouseEvent<HTMLElement>, hourIndex: number, staffId: number, date: Date) => {
    // 用户点击的小时块对应的整点时间（从10:00开始）
    const clickedHourStart = hourIndex * 60; // 转换为分钟数

    // 获取该员工当天的所有预约,并按开始时间排序
    const dateStr = format(date, 'yyyy-MM-dd');
    const appointments = allAppointments
      .filter(a => a.resourceId === staffId && a.date === dateStr && a.status !== 'CANCELLED')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 将时间字符串转换为分钟数
    const timeToMinutes = (timeStr: string) => {
      const [hour, minute] = timeStr.split(':').map(Number);
      return (hour - 10) * 60 + minute;
    };

    // 将分钟数转换为时间字符串
    const minutesToTime = (minutes: number) => {
      const hour = Math.floor(minutes / 60) + 10;
      const minute = minutes % 60;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    };

    // 最小预约时长(分钟)
    const MIN_DURATION = 30;
    // 默认预约时长(分钟)
    const DEFAULT_DURATION = 60;

    // 检查点击的时间段内是否有预约占用
    // 如果点击的小时开始时间被占用,则从预约结束时间开始
    let occupyingAppointment: Appointment | null = null;

    // 找出所有预约,按时间顺序
    let previousAppointment: Appointment | null = null;
    let nextAppointment: Appointment | null = null;

    for (const apt of appointments) {
      const aptStartMinutes = timeToMinutes(apt.startTime);
      const aptEndMinutes = timeToMinutes(apt.endTime);

      // 检查预约是否占用了点击小时的开始时间点
      // 如果预约的开始时间 <= 点击小时开始 且 结束时间 > 点击小时开始
      if (aptStartMinutes <= clickedHourStart && aptEndMinutes > clickedHourStart) {
        occupyingAppointment = apt;
      }

      // 找在点击小时开始之前结束的所有预约中,结束时间最晚的
      if (aptEndMinutes <= clickedHourStart) {
        if (!previousAppointment || aptEndMinutes > timeToMinutes(previousAppointment.endTime)) {
          previousAppointment = apt;
        }
      }

      // 找在点击小时开始之后开始的所有预约中,开始时间最早的
      if (aptStartMinutes > clickedHourStart) {
        if (!nextAppointment || aptStartMinutes < timeToMinutes(nextAppointment.startTime)) {
          nextAppointment = apt;
        }
      }
    }

    // 如果有预约占用了点击的时间点,则将其作为previous appointment
    if (occupyingAppointment) {
      previousAppointment = occupyingAppointment;
    }

    let startMinutes: number;
    let endMinutes: number;

    // 计算最早可用开始时间
    if (previousAppointment) {
      const prevEndMinutes = timeToMinutes(previousAppointment.endTime);

      // 开始时间取前一个预约结束时间和点击小时开始时间的较大值（无缓冲时间）
      startMinutes = Math.max(prevEndMinutes, clickedHourStart);
    } else {
      // 没有前面的预约，从点击的整点开始
      startMinutes = clickedHourStart;
    }

    // 计算结束时间
    if (nextAppointment) {
      const nextStartMinutes = timeToMinutes(nextAppointment.startTime);

      // 可用时间到下一个预约开始为止
      const availableMinutes = nextStartMinutes - startMinutes;

      if (availableMinutes < MIN_DURATION) {
        // 时间不足30分钟,返回 null 表示无法添加预约
        return null;
      }

      // 如果可用时间不足1小时,则占满整个时间槽
      if (availableMinutes < DEFAULT_DURATION) {
        // 直接使用所有可用时间
        endMinutes = nextStartMinutes;
      } else {
        // 有足够空间,默认1小时
        endMinutes = startMinutes + DEFAULT_DURATION;
      }
    } else {
      // 没有后面的预约,默认1小时,但不超过22:00
      endMinutes = Math.min(startMinutes + DEFAULT_DURATION, 12 * 60); // 12小时 = 22:00

      // 检查是否有足够时间
      const availableMinutes = endMinutes - startMinutes;
      if (availableMinutes < MIN_DURATION) {
        return null;
      }
    }

    const startTime = minutesToTime(startMinutes);
    const endTime = minutesToTime(endMinutes);

    return { startTime, endTime };
  };

  const handleTimeSlotClick = (event: React.MouseEvent<HTMLElement>, staffId: number, date: Date, timeIndex: number) => {
    // 检查创建权限
    if (!hasPermission('schedule:create')) {
      setSnackbar({
        open: true,
        message: t('permissions.noCreatePermission', 'You do not have permission to create appointments'),
        severity: 'warning',
      });
      return;
    }

    const staff = allStaffList.find(s => s.id === staffId);
    const timeSlot = calculateTimeSlot(event, timeIndex, staffId, date);

    // 如果时间槽为 null,说明时间不足30分钟
    if (!timeSlot) {
      setSnackbar({
        open: true,
        message: t('appointments.insufficientTime', 'This time slot is too short to add a new appointment. A minimum of 30 minutes is required.'),
        severity: 'warning',
      });
      return;
    }

    const { startTime, endTime } = timeSlot;
    console.log('Time slot calculated:', { startTime, endTime, timeIndex });

    // 检查是否是过去的时间
    if (isPastTime(date, startTime)) {
      setSnackbar({
        open: true,
        message: t('appointments.pastTimeNotAllowed', 'Cannot create appointments in the past'),
        severity: 'warning',
      });
      return;
    }

    // 检查员工在该时间段是否可用
    if (!isResourceAvailable(staffId, date, startTime)) {
      setSnackbar({
        open: true,
        message: t('appointments.staffNotAllowed', 'Staff is not available at this time'),
        severity: 'warning',
      });
      return;
    }

    // 清除选中的预约，确保是新建模式
    setSelectedAppointment(null);

    setAppointmentDialogData({
      date: date,
      startTime,
      endTime,
      resourceId: staffId,
      resourceName: staff?.name,
    });
    setAppointmentDialogOpen(true);
  };

  const handleAppointmentSave = async (appointmentData: any) => {
    console.log('Save appointment:', appointmentData);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenantId;

      if (!tenantId) {
        console.error('No tenantId found');
        setSnackbar({ open: true, message: t('common.error', 'Error occurred'), severity: 'error' });
        return;
      }

      let customerId = appointmentData.customerId;

      // If no customer was selected, create a new customer
      if (!customerId) {
        const newCustomer: Partial<Customer> = {
          tenantId: tenantId,
          firstName: appointmentData.customerFirstName,
          lastName: appointmentData.customerLastName,
          phone: appointmentData.customerPhone || '',
          countryCode: appointmentData.customerCountryCode || '+1-CA',
          email: appointmentData.customerEmail,
        };

        const createdCustomer = await api.createCustomer(newCustomer as Customer);
        customerId = createdCustomer.id;
        console.log('Created new customer:', createdCustomer);
      }

      // Calculate duration in minutes
      const [startHours, startMinutes] = appointmentData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = appointmentData.endTime.split(':').map(Number);
      const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

      // Prepare appointment data with services (支持多服务)
      // 处理日期：如果是字符串则用parseISO解析，否则直接使用
      const dateToFormat = typeof appointmentData.date === 'string'
        ? parseISO(appointmentData.date)
        : appointmentData.date;

      const appointment = {
        tenantId: tenantId,
        customerId: customerId,
        appointmentDate: format(dateToFormat, 'yyyy-MM-dd'),  // 格式化日期为字符串，避免时区问题
        appointmentTime: appointmentData.startTime,
        duration: duration,
        totalAmount: appointmentData.price,
        status: 'CONFIRMED' as const,
        notes: appointmentData.notes,
        selectedResources: [
          {
            id: appointmentData.resourceId,
            type: 'STAFF' as const,
          }
        ],
        services: appointmentData.services && appointmentData.services.length > 0
          ? appointmentData.services.map((service: { id: number; name: string; duration: number; price: number }) => ({
              serviceId: service.id,
              serviceName: service.name,
              duration: service.duration,
              price: service.price,
            }))
          : [],
      };

      // 编辑模式 vs 创建模式
      if (selectedAppointment) {
        // 编辑现有预约
        await appointmentApi.updateAppointment(selectedAppointment.id, appointment);
        console.log('Updated appointment:', selectedAppointment.id);

        setSnackbar({
          open: true,
          message: t('appointments.updateSuccess', 'Appointment updated successfully'),
          severity: 'success'
        });
      } else {
        // 创建新预约
        const createdAppointment = await api.createAppointment(appointment);
        console.log('Created appointment:', createdAppointment);

        setSnackbar({
          open: true,
          message: t('appointments.createSuccess', 'Appointment created successfully'),
          severity: 'success'
        });
      }

      // Refresh appointments list
      loadAppointments();

      setAppointmentDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Failed to save appointment:', error);

      // Extract error message from backend response
      let errorMessage = selectedAppointment
        ? t('appointments.updateFailed', 'Failed to update appointment')
        : t('appointments.createFailed', 'Failed to create appointment');

      if (error.responseData?.message) {
        // Use backend error message if available
        errorMessage = error.responseData.message;
      } else if (error.message) {
        // Use error message from the error object
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // 处理预约签到
  const handleCheckIn = async (appointmentId: number) => {
    // 检查更新权限
    if (!hasPermission('schedule:update')) {
      setSnackbar({
        open: true,
        message: t('permissions.noUpdatePermission', 'You do not have permission to update appointments'),
        severity: 'warning',
      });
      return;
    }

    try {
      // Update appointment status to CHECKED_IN
      await api.updateAppointmentStatus(appointmentId, 'CHECKED_IN');

      // Update local state
      setAllAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: 'CHECKED_IN' as const }
            : apt
        )
      );

      // Update selected appointment
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: 'CHECKED_IN' as const,
        });
      }

      // Show success message
      setSnackbar({
        open: true,
        message: t('appointments.checkedInSuccess', 'Customer checked in successfully!'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to check in appointment:', error);

      let errorMessage = t('appointments.checkedInFailed', 'Failed to check in customer');
      if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // 打开支付对话框
  const handleOpenPaymentDialog = () => {
    setPaymentDialogOpen(true);
  };

  // 处理支付（支持多服务多套餐）
  const handlePayment = async (
    paymentMethod: string,
    customerPackageId?: number,
    verificationCodeId?: number,
    servicePayments?: ServicePayment[],
    taxInfo?: {
      taxRate: number;
      taxAmount: number;
      tipAmount: number;
      tipPercentage: number;
      subtotal: number;
      totalAmount: number;
    }
  ) => {
    if (!selectedAppointment || !user?.tenantId) return;

    // 检查结账权限
    if (!hasPermission('schedule:checkout')) {
      setSnackbar({
        open: true,
        message: t('permissions.noCheckoutPermission', 'You do not have permission to process checkout'),
        severity: 'warning',
      });
      return;
    }

    try {
      // 多服务场景
      if (servicePayments && servicePayments.length > 0) {
        // 为每个服务创建单独的支付记录
        // 使用前端传递的 paymentMethod（已经在 PaymentDialog 中正确判断）
        const updatedAppointment = await appointmentApi.processAppointmentPayment(
          selectedAppointment.id,
          {
            paymentMethod, // 使用从 PaymentDialog 传递过来的正确支付方式
            servicePayments, // 传递服务支付数组
            tenantId: user.tenantId,
            taxInfo, // 传递税率和小费信息
          }
        );
      } else {
        // 单服务场景
        const updatedAppointment = await appointmentApi.processAppointmentPayment(
          selectedAppointment.id,
          {
            paymentMethod,
            customerPackageId,
            verificationCodeId,
            tenantId: user.tenantId,
            taxInfo, // 传递税率和小费信息
          }
        );
      }

      // Update local state
      setAllAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === selectedAppointment.id
            ? {
                ...apt,
                paid: true,
                paidTime: new Date().toISOString(),
                paymentMethod,
                status: 'COMPLETED' as const,
              }
            : apt
        )
      );

      // Update selected appointment
      setSelectedAppointment({
        ...selectedAppointment,
        paid: true,
        paidTime: new Date().toISOString(),
        paymentMethod,
        status: 'COMPLETED' as const,
      });

      // Show success message
      setSnackbar({
        open: true,
        message: t('appointments.paymentSuccess', 'Payment completed successfully!'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to process payment:', error);

      let errorMessage = t('appointments.paymentFailed', 'Failed to process payment');
      if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // 保存Notes
  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    // 检查编辑笔记权限
    if (!hasPermission('schedule:edit_notes')) {
      setSnackbar({
        open: true,
        message: t('permissions.noEditNotesPermission', 'You do not have permission to edit notes'),
        severity: 'warning',
      });
      return;
    }

    try {
      const updatedAppointment = await appointmentApi.updateAppointment(selectedAppointment.id, {
        ...selectedAppointment,
        notes: notesValue,
      });

      // 更新本地状态
      setAllAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, notes: notesValue }
            : apt
        )
      );

      setSelectedAppointment({ ...selectedAppointment, notes: notesValue });
      setEditingNotes(false);

      setSnackbar({
        open: true,
        message: t('appointments.notesSaved', 'Notes saved successfully'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save notes:', error);
      setSnackbar({
        open: true,
        message: t('appointments.notesError', 'Failed to save notes'),
        severity: 'error',
      });
    }
  };

  // 处理取消预约
  const handleCancelAppointment = async (appointmentId: number) => {
    // 检查取消权限
    if (!hasPermission('schedule:cancel')) {
      setSnackbar({
        open: true,
        message: t('permissions.noCancelPermission', 'You do not have permission to cancel appointments'),
        severity: 'warning',
      });
      return;
    }

    try {
      // Call API to update appointment status to CANCELLED
      await api.updateAppointmentStatus(appointmentId, 'CANCELLED');

      // Update local state
      setAllAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: 'CANCELLED' as const }
            : apt
        )
      );

      // Update selected appointment if it's the one being cancelled
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: 'CANCELLED' as const,
        });
      }

      setSnackbar({
        open: true,
        message: t('appointments.cancelSuccess', 'Appointment cancelled successfully'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error);

      let errorMessage = t('appointments.cancelFailed', 'Failed to cancel appointment');
      if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  // 浏览器原生全屏功能
  const toggleFullscreen = async () => {
    if (!calendarContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // 进入全屏
        if (calendarContainerRef.current.requestFullscreen) {
          await calendarContainerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      setSnackbar({
        open: true,
        message: t('calendar.fullscreenError', 'Failed to toggle fullscreen mode'),
        severity: 'error',
      });
    }
  };


  // 监听全屏变化
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Box
      ref={calendarContainerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 80px)',
        bgcolor: '#f1f3f5',
        position: 'relative', // 确保作为抽屉的定位容器
        overflow: 'hidden', // 防止内容溢出
      }}
    >
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
        {/* 左侧边栏 - 始终显示 */}
        <Paper
            elevation={0}
            sx={{
              width: { xs: 200, sm: 220, md: 240, lg: 260 },
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #fafbfc 0%, #f8f9fa 100%)',
              boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
            }}
          >
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('appointments.customerSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: themeColor }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  border: '2px solid transparent',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    borderColor: alpha(themeColor, 0.2),
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    borderColor: alpha(themeColor, 0.3),
                    boxShadow: `0 0 0 3px ${alpha(themeColor, 0.1)}`,
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ py: 1, px: 1 }}>
            <Button
              fullWidth
              size="small"
              sx={{
                justifyContent: 'flex-start',
                color: selectedStaffIds.length === 0 ? themeColor : 'text.primary',
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                px: 2,
                py: 1.25,
                bgcolor: selectedStaffIds.length === 0 ? alpha(themeColor, 0.12) : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(themeColor, 0.08),
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }
              }}
              onClick={() => setSelectedStaffIds([])}
            >
              {t('appointments.allStaff')}
            </Button>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4 }}>
                <CircularProgress size={40} sx={{ color: themeColor }} />
              </Box>
            ) : allStaffList.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('schedule.noStaff', 'No staff available')}
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0, px: 1 }}>
                {allStaffList.map((staff) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                return (
                  <ListItemButton
                    key={staff.id}
                    selected={isSelected}
                    onClick={() => toggleStaffSelection(staff.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      mb: 0.5,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      bgcolor: isSelected ? alpha(themeColor, 0.12) : 'transparent',
                      '&:hover': {
                        bgcolor: alpha(themeColor, 0.08),
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(themeColor, 0.12),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={staff.avatar}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: staff.color || '#5fa67a', // 使用员工颜色或默认绿色
                          color: 'white',
                          fontWeight: 600,
                          fontSize: 16,
                          border: isSelected ? `2px solid ${themeColor}` : `2px solid ${alpha(staff.color || '#5fa67a', 0.2)}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={isSelected ? themeColor : 'text.primary'}
                        >
                          {staff.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" fontSize={10}>
                          {staff.role}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
              </List>
            )}
          </Box>

          {/* 服务列表 - 始终显示所有服务 */}
          <Divider />
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {selectedStaffIds.length > 0 ? t('appointments.availableServices') : t('appointments.allServicesLabel')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', pb: 2, px: 1 }}>
            {availableServices.map((service) => (
              <Box
                key={service.id}
                onClick={() => setSelectedServiceId(selectedServiceId === service.id ? null : service.id)}
                sx={{
                  mb: 1,
                  p: 1.5,
                  bgcolor: selectedServiceId === service.id ? alpha(service.color, 0.25) : alpha(service.color, 0.12),
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  border: selectedServiceId === service.id ? `2px solid ${service.color}` : '2px solid transparent',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: alpha(service.color, 0.2),
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: `0 4px 12px ${alpha(service.color, 0.25)}`,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: service.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${alpha(service.color, 0.4)}`,
                  }}
                >
                  {service.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" fontWeight={600} display="block" fontSize={11}>
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={10}>
                    {service.duration} min · ${service.price}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 主内容区域 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderBottom: '2px solid',
              borderColor: 'divider',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              zIndex: 10,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton
                  onClick={handlePrevious}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.05),
                      borderColor: themeColor,
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Box
                  onClick={handleDateClick}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'white',
                    transition: 'all 0.2s ease',
                    minWidth: 280,
                    justifyContent: 'center',
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.03),
                    }
                  }}
                >
                  <CalendarIcon sx={{ color: themeColor, fontSize: 20 }} />
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {format(currentDate, 'MMMM do, yyyy', { locale })}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleNext}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.05),
                      borderColor: themeColor,
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                {/* Segmented Control for Day/Week */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    bgcolor: '#f1f5f9',
                    borderRadius: 2,
                    p: 0.5,
                    gap: 0.5,
                  }}
                >
                  {(['day', 'week'] as const).map((mode) => (
                    <Button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      sx={{
                        minWidth: 70,
                        px: 2.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color: viewMode === mode ? 'white' : '#64748b',
                        bgcolor: viewMode === mode ? '#3b82f6' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: viewMode === mode ? '#2563eb' : alpha(themeColor, 0.1),
                          color: viewMode === mode ? 'white' : themeColor,
                        },
                        boxShadow: 'none',
                      }}
                    >
                      {t(`appointments.view${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                    </Button>
                  ))}
                </Box>

                {/* Today Button */}
                <Button
                  size="medium"
                  startIcon={<TodayIcon />}
                  onClick={handleToday}
                  variant="contained"
                  sx={{
                    bgcolor: '#3b82f6',
                    color: 'white',
                    px: 3,
                    py: 0.75,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#2563eb',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {t('common.today')}
                </Button>

                {/* Fullscreen Button */}
                <IconButton
                  onClick={toggleFullscreen}
                  size="medium"
                  sx={{
                    bgcolor: 'white',
                    border: '2px solid',
                    borderColor: 'divider',
                    color: themeColor,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(themeColor, 0.05),
                      borderColor: themeColor,
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fafbfc', position: 'relative' }}>
            {/* 简洁的日历加载状态 */}
            {!isCalendarDataReady && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                }}
              >
                <CircularProgress
                  size={40}
                  thickness={3}
                  sx={{
                    color: themeColor,
                  }}
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', minHeight: '100%', minWidth: 'fit-content' }}>
              <Box
                sx={{
                  width: 70,
                  flexShrink: 0,
                  bgcolor: 'white',
                  position: 'sticky',
                  left: 0,
                  zIndex: 15, // 提高 z-index 确保时间轴始终在最上层
                  borderRight: '1px solid',
                  borderColor: alpha('#e5e7eb', 0.8),
                }}
              >
                <Box
                  sx={{
                    height: 80,
                    bgcolor: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20, // 最高层级，确保角落块始终可见
                    borderBottom: '1px solid',
                    borderColor: alpha('#e5e7eb', 0.8),
                  }}
                />
                {timeSlots.map((time, index) => {
                  const hour = parseInt(time.split(':')[0]);
                  const isPM = hour >= 12;
                  const displayHour = hour > 12 ? hour - 12 : hour;
                  const period = isPM ? 'PM' : 'AM';

                  return (
                    <Box
                      key={index}
                      sx={{
                        height: HOUR_HEIGHT,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        pt: 1.5,
                        borderBottom: '1px solid',
                        borderColor: alpha('#f3f4f6', 0.5),
                        bgcolor: 'white',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: HOUR_HEIGHT / 2,
                          right: 0,
                          left: 20,
                          borderBottom: '1px solid',
                          borderColor: alpha('#e5e7eb', 0.3),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          textAlign: 'right',
                          pr: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          {displayHour}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            lineHeight: 1,
                            mt: 0.5,
                            letterSpacing: '0.5px',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#64748b',
                          }}
                        >
                          {period}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              {viewMode === 'day' && (
                <Box sx={{ display: 'flex', flex: 1, gap: 0.5 }}>
                  {displayedStaff.map((staff, index) => {
                    const appointments = getStaffAppointments(staff.id, currentDate);
                    const appointmentCount = appointments.filter(a => a.status !== 'CANCELLED').length;
                    const appointmentLayouts = calculateAppointmentLayout(appointments);

                    return (
                      <Box
                        key={staff.id}
                        sx={{
                          flex: 1,
                          minWidth: 280,
                          maxWidth: 400,
                          background: `linear-gradient(180deg, ${alpha(staff.color, 0.02)} 0%, ${alpha(staff.color, 0.01)} 50%, white 100%)`,
                          borderRadius: 1,
                        }}
                      >
                        <StaffInfoCard
                          staff={staff}
                          appointmentCount={appointmentCount}
                          isSelected={selectedStaffIds.includes(staff.id)}
                          onClick={() => toggleStaffSelection(staff.id)}
                          utilization={(() => {
                            // 计算该员工当天的实际工作时间和已预约时间
                            const dateStr = format(currentDate, 'yyyy-MM-dd');

                            // 获取当前日期是星期几 (1-7, 1为周一)
                            const dayOfWeek = currentDate.getDay();
                            // JavaScript 的 getDay() 返回 0-6 (0为周日), 需要转换为 1-7 (1为周一)
                            const isoWeekDay = dayOfWeek === 0 ? 7 : dayOfWeek;

                            // 根据星期几筛选可用性
                            const staffAvailabilities = (resourceAvailabilities[staff.id] || []).filter(
                              availability => availability.dayOfWeek === isoWeekDay && availability.isAvailable
                            );

                            if (staffAvailabilities.length === 0) {
                              return 0;
                            }

                            // 计算总工作时间（分钟）
                            let totalWorkMinutes = 0;
                            staffAvailabilities.forEach(availability => {
                              // 时间格式可能是 "HH:mm:ss" 或 "HH:mm"
                              const startTime = availability.startTime;
                              const endTime = availability.endTime;

                              const [startHour, startMin] = startTime.split(':').map(Number);
                              const [endHour, endMin] = endTime.split(':').map(Number);
                              const workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                              totalWorkMinutes += workMinutes;
                            });

                            if (totalWorkMinutes === 0) return 0;

                            // 计算已预约时间（分钟）- 需要考虑时间重叠的情况
                            // 排除已取消和未到场的预约
                            const staffAppointments = allAppointments.filter(
                              apt => apt.resourceId === staff.id && apt.date === dateStr && apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW'
                            );

                            // 将预约转换为时间段（分钟）
                            const timeSlots = staffAppointments.map(apt => {
                              const [startHour, startMin] = apt.startTime.split(':').map(Number);
                              const [endHour, endMin] = apt.endTime.split(':').map(Number);
                              return {
                                start: startHour * 60 + startMin,
                                end: endHour * 60 + endMin
                              };
                            });

                            // 合并重叠的时间段
                            if (timeSlots.length === 0) {
                              return 0;
                            }

                            // 按开始时间排序
                            timeSlots.sort((a, b) => a.start - b.start);

                            // 合并重叠的时间段
                            const mergedSlots = [];
                            let currentSlot = { ...timeSlots[0] };

                            for (let i = 1; i < timeSlots.length; i++) {
                              const slot = timeSlots[i];
                              if (slot.start <= currentSlot.end) {
                                // 有重叠，合并
                                currentSlot.end = Math.max(currentSlot.end, slot.end);
                              } else {
                                // 没有重叠，保存当前时间段，开始新的时间段
                                mergedSlots.push(currentSlot);
                                currentSlot = { ...slot };
                              }
                            }
                            mergedSlots.push(currentSlot);

                            // 计算合并后的总时长
                            let bookedMinutes = 0;
                            mergedSlots.forEach(slot => {
                              bookedMinutes += slot.end - slot.start;
                            });

                            return Math.min(Math.round((bookedMinutes / totalWorkMinutes) * 100), 100);
                          })()}
                          rating={4.5 + Math.random() * 0.5} // 示例评分，实际应从后端获取
                        />

                        <Box sx={{
                          position: 'relative',
                          height: HOUR_HEIGHT * timeSlots.length,
                          overflow: 'hidden', // 限制内容不超出容器
                          '& > div': {
                            // 确保子元素在容器内
                            contain: 'layout',
                          }
                        }}>
                          {timeSlots.map((_, timeIndex) => {
                            const timeStr = timeSlots[timeIndex];
                            const isUnavailable = !isResourceAvailable(staff.id, currentDate, timeStr);
                            const isPast = isPastTime(currentDate, timeStr);

                            return (
                              <Box
                                key={timeIndex}
                                onClick={(e) => {
                                  if (!isPast && !isUnavailable) {
                                    handleTimeSlotClick(e, staff.id, currentDate, timeIndex);
                                  }
                                }}
                                sx={{
                                  height: HOUR_HEIGHT,
                                  borderBottom: '1px solid',
                                  borderColor: '#F3F4F6',
                                  bgcolor: isUnavailable ? undefined : '#FFFFFF',
                                  backgroundImage: isUnavailable
                                    ? 'repeating-linear-gradient(-45deg, #fafbfc 0px, #fafbfc 10px, #e8eaed 10px, #e8eaed 20px)'
                                    : undefined,
                                  cursor: isPast || isUnavailable ? 'not-allowed' : 'pointer',
                                  position: 'relative',
                                  transition: 'background-color 0.15s ease',
                                  '&:hover': {
                                    bgcolor: isPast || isUnavailable
                                      ? undefined
                                      : alpha(themeColor, 0.02),
                                  },
                                  // 移除中间的虚线，让界面更简洁
                                }}
                              />
                            );
                          })}

                          {appointmentLayouts.map((layout) => {
                            const { top, height } = calculatePosition(layout.startTime, layout.endTime);

                            // 改进的布局算法：更好的卡片间距
                            const hasOverlap = layout.totalColumns > 1;
                            const cardWidth = hasOverlap ? `${100 / layout.totalColumns}%` : '100%';
                            const leftPosition = hasOverlap ? `${(100 / layout.totalColumns) * layout.column}%` : '0';

                            // 添加更大的间隙，让卡片之间有明显的分隔
                            const HORIZONTAL_GAP = 3; // 水平间隙
                            const VERTICAL_GAP = 3; // 垂直间隙

                            return (
                              <Box
                                key={layout.id}
                                sx={{
                                  position: 'absolute',
                                  top: `${top + VERTICAL_GAP}px`,
                                  left: hasOverlap ? leftPosition : `${HORIZONTAL_GAP}px`,
                                  width: hasOverlap ? `calc(${cardWidth} - ${HORIZONTAL_GAP * 2}px)` : `calc(100% - ${HORIZONTAL_GAP * 2}px)`,
                                  height: `${Math.max(height - VERTICAL_GAP * 2, 30)}px`,
                                  px: hasOverlap ? `${HORIZONTAL_GAP / 2}px` : 0,
                                  // 限制卡片的 z-index 层级
                                  zIndex: layout.column || 1,
                                  // 防止内容溢出
                                  overflow: 'visible',
                                  // 限制变换原点，让卡片从中心缩放
                                  transformOrigin: 'center center',
                                }}
                              >
                                <AppointmentCard
                                  appointment={{
                                    id: layout.id,
                                    startTime: layout.startTime,
                                    endTime: layout.endTime,
                                    customerName: layout.customerName,
                                    serviceName: layout.serviceName,
                                    price: layout.price,
                                    paid: layout.paid,
                                    status: layout.status,
                                    resourceName: staff.name,
                                    notes: layout.notes,
                                  }}
                                  onClick={() => handleAppointmentClick(layout)}
                                  onEdit={hasPermission('schedule:update') ? (e) => {
                                    e.stopPropagation();
                                    handleEditAppointment(layout);
                                  } : undefined}
                                  variant="day"
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {viewMode === 'week' && (
                <Box sx={{ display: 'flex', flex: 1 }}>
                  {currentDates.map((date, dateIndex) => {
                    const isToday = format(date, 'yyyy-MM-dd') === format(getMerchantNow(), 'yyyy-MM-dd');

                    // 收集这一天所有员工的预约
                    const dayAppointments: Appointment[] = [];
                    displayedStaff.forEach((staff) => {
                      const appointments = getStaffAppointments(staff.id, date);
                      dayAppointments.push(...appointments);
                    });

                    // 应用布局算法避免重叠
                    const appointmentLayouts = calculateAppointmentLayout(dayAppointments);

                    return (
                      <Box
                        key={dateIndex}
                        sx={{
                          flex: 1,
                          minWidth: 200,
                          borderRight: dateIndex < currentDates.length - 1 ? '1px solid #dee2e6' : 'none',
                        }}
                      >
                        <Box
                          sx={{
                            height: 80,
                            p: 2,
                            borderBottom: '1px solid #dee2e6',
                            bgcolor: isToday ? alpha(themeColor, 0.1) : 'white',
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontSize={10}>
                            {format(date, 'EEE', { locale })}
                          </Typography>
                          <Typography variant="h5" fontWeight={600}>
                            {format(date, 'd')}
                          </Typography>
                        </Box>

                        <Box sx={{
                          position: 'relative',
                          height: HOUR_HEIGHT * timeSlots.length,
                          overflow: 'hidden', // 限制内容不超出容器
                          '& > div': {
                            // 确保子元素在容器内
                            contain: 'layout',
                          }
                        }}>
                          {timeSlots.map((_, timeIndex) => (
                            <Box
                              key={timeIndex}
                              onClick={(e) => {
                                // Week 视图中没有单独的 staff，使用第一个显示的 staff
                                if (displayedStaff.length > 0) {
                                  handleTimeSlotClick(e, displayedStaff[0].id, date, timeIndex);
                                }
                              }}
                              sx={{
                                height: HOUR_HEIGHT,
                                borderBottom: '1px solid #dee2e6',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(themeColor, 0.02),
                                }
                              }}
                            />
                          ))}

                          {appointmentLayouts.map((layout) => {
                            const { top, height } = calculatePosition(layout.startTime, layout.endTime);

                            // 改进的布局算法：更好的卡片间距
                            const hasOverlap = layout.totalColumns > 1;
                            const cardWidth = hasOverlap ? `${90 / layout.totalColumns}%` : '90%';
                            const leftPosition = hasOverlap ? `${(90 / layout.totalColumns) * layout.column + 5}%` : '5%';

                            // 添加更大的间隙
                            const VERTICAL_GAP = 3;

                            return (
                              <Box
                                key={layout.id}
                                sx={{
                                  position: 'absolute',
                                  top: `${top + VERTICAL_GAP}px`,
                                  left: leftPosition,
                                  width: cardWidth,
                                  height: `${Math.max(height - VERTICAL_GAP * 2, 25)}px`,
                                }}
                              >
                                <AppointmentCard
                                  appointment={{
                                    id: layout.id,
                                    startTime: layout.startTime,
                                    endTime: layout.endTime,
                                    customerName: layout.customerName,
                                    serviceName: layout.serviceName,
                                    price: layout.price,
                                    paid: layout.paid,
                                    status: layout.status,
                                    notes: layout.notes,
                                  }}
                                  onClick={() => handleAppointmentClick(layout)}
                                  onEdit={hasPermission('schedule:update') ? (e) => {
                                    e.stopPropagation();
                                    handleEditAppointment(layout);
                                  } : undefined}
                                  variant="week"
                                  compact={true}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Box>

        </Box>
      </Box>

      {/* 日期选择器弹出框 */}
      <Popover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        onClose={handleDatePickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={currentDate}
            onChange={handleDateChange}
            slotProps={{
              actionBar: {
                actions: []
              }
            }}
          />
        </LocalizationProvider>
      </Popover>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        container={isFullscreen ? calendarContainerRef.current : document.body}
        PaperProps={{
          sx: {
            width: 400,
            zIndex: isFullscreen ? 9999 : 1300,
            position: isFullscreen ? 'fixed' : 'absolute',
            borderLeft: '1px solid #e2e8f0',
          },
        }}
        sx={{
          zIndex: isFullscreen ? 9999 : 1300,
        }}
        ModalProps={{
          container: isFullscreen ? calendarContainerRef.current : document.body,
          style: { position: isFullscreen ? 'absolute' : 'fixed' },
        }}
      >
        {selectedAppointment && (() => {
          // 获取状态配置 - 与卡片保持一致
          const getStatusConfig = () => {
            if (selectedAppointment.status === 'COMPLETED' || selectedAppointment.paid) {
              return {
                color: '#4CAF50',
                bgColor: alpha('#4CAF50', 0.08),
                borderColor: alpha('#4CAF50', 0.2),
              };
            }
            if (selectedAppointment.status === 'CHECKED_IN') {
              return {
                color: '#FF9800',
                bgColor: alpha('#FF9800', 0.08),
                borderColor: alpha('#FF9800', 0.2),
              };
            }
            return {
              color: '#1976D2',
              bgColor: alpha('#1976D2', 0.08),
              borderColor: alpha('#1976D2', 0.2),
            };
          };

          const statusConfig = getStatusConfig();

          return (
            <Box>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: statusConfig.bgColor,
                  borderBottom: `2px solid ${statusConfig.borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 4,
                      height: 28,
                      bgcolor: statusConfig.color,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="h6" fontWeight={600} sx={{ color: '#0f172a', fontSize: '1.125rem' }}>
                    {t('appointments.appointment')}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: '#64748b',
                    bgcolor: '#ffffff',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    '&:hover': {
                      bgcolor: alpha(statusConfig.color, 0.15),
                      color: statusConfig.color,
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('appointments.customer').toUpperCase()}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedAppointment.customerName}
                  </Typography>

                  {/* 签到状态或按钮 */}
                  {selectedAppointment.status === 'COMPLETED' ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={t('appointments.completed', 'Completed')}
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: alpha('#4CAF50', 0.1),
                        color: '#4CAF50',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        border: 'none',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: '#4CAF50',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  ) : selectedAppointment.status === 'CHECKED_IN' ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={t('appointments.checkedIn')}
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: alpha('#FF9800', 0.1),
                        color: '#FF9800',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        border: 'none',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: '#FF9800',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label={t('appointments.checkIn')}
                      size="small"
                      onClick={() => handleCheckIn(selectedAppointment.id)}
                      disabled={selectedAppointment.status === 'CANCELLED' || selectedAppointment.status === 'NO_SHOW' || !hasPermission('schedule:update')}
                      sx={{
                        height: 24,
                        bgcolor: 'transparent',
                        border: `1px solid #1976D2`,
                        color: '#1976D2',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: '#1976D2',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                        '&:hover': {
                          bgcolor: alpha('#1976D2', 0.08),
                        },
                        '&.Mui-disabled': {
                          borderColor: '#cbd5e1',
                          color: '#94a3b8',
                          '& .MuiChip-icon': {
                            color: '#94a3b8',
                          },
                        },
                      }}
                    />
                  )}
                </Box>
                {selectedAppointment.customerPhone && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{selectedAppointment.customerPhone}</Typography>
                  </Box>
                )}
                {selectedAppointment.customerEmail && (
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{selectedAppointment.customerEmail}</Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('appointments.bookingInfo')}
                </Typography>

                {/* Date & Time */}
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: `1px solid #e2e8f0`
                  }}
                >
                  <Box display="flex" alignItems="center" gap={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EventIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', color: '#0f172a' }}>
                        {format(new Date(selectedAppointment.date + 'T00:00:00'), 'PP', { locale })}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem', color: '#0f172a' }}>
                        {selectedAppointment.startTime.substring(0, 5)} - {selectedAppointment.endTime.substring(0, 5)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Services */}
                <Box mt={2}>
                  {selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                    // 多服务场景：显示每个服务及其价格
                    <>
                      {selectedAppointment.services.map((service, index) => (
                        <Box
                          key={service.serviceId}
                          display="flex"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          gap={1}
                          mb={1}
                          sx={{
                            pb: 1,
                            borderBottom: `1px solid ${alpha('#E5E7EB', 0.5)}`,
                          }}
                        >
                          <Box display="flex" alignItems="flex-start" gap={1} flex={1}>
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                bgcolor: '#10B981',
                                mt: 0.75,
                                flexShrink: 0,
                              }}
                            />
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                {service.serviceName}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              color: '#10B981',
                              flexShrink: 0,
                              ml: 2,
                              fontSize: '0.875rem',
                            }}
                          >
                            ${service.price.toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                      {/* Staff信息显示在所有服务下方 */}
                      <Box mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {t('appointments.staff')}: <span style={{ fontWeight: 500 }}>{allStaffList.find(s => s.id === selectedAppointment.resourceId)?.name}</span>
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    // 单服务场景或无服务详情：显示服务名称
                    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: '#10B981',
                          mt: 0.75
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, whiteSpace: 'pre-line', fontSize: '0.875rem' }}>
                          {selectedAppointment.serviceName.replace(/, /g, '\n')}
                        </Typography>
                        {selectedAppointment.serviceDetails && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8125rem' }}>
                            {selectedAppointment.serviceDetails}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                          {t('appointments.staff')}: <span style={{ fontWeight: 500 }}>{allStaffList.find(s => s.id === selectedAppointment.resourceId)?.name}</span>
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

              <Divider />

              <Box sx={{ my: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('appointments.pricing')}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={1.5}>
                  <Typography variant="body2" fontWeight={600}>
                    {t('appointments.total')}
                  </Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ color: '#10B981', fontSize: '1.125rem' }}>
                    ${selectedAppointment.price}
                  </Typography>
                </Box>
              </Box>

              {/* 备注 */}
              <Divider />
              <Box sx={{ my: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('appointments.notes', 'Notes')}
                  </Typography>
                  {/* 只有非COMPLETED状态才能编辑Notes */}
                  {selectedAppointment.status !== 'COMPLETED' && !selectedAppointment.paid && hasPermission('schedule:edit_notes') && (
                    !editingNotes ? (
                      <IconButton
                        size="small"
                        onClick={() => setEditingNotes(true)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: '#64748b',
                          bgcolor: '#f8fafc',
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: alpha('#1976D2', 0.1),
                            color: '#1976D2',
                          },
                        }}
                      >
                        {selectedAppointment.notes ? <ModeEditIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    ) : (
                    <Box display="flex" gap={0.75}>
                      <IconButton
                        size="small"
                        onClick={handleSaveNotes}
                        sx={{
                          width: 28,
                          height: 28,
                          color: '#10B981',
                          bgcolor: alpha('#10B981', 0.1),
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: alpha('#10B981', 0.2),
                          },
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(selectedAppointment.notes || '');
                        }}
                        sx={{
                          width: 28,
                          height: 28,
                          color: '#ef4444',
                          bgcolor: alpha('#ef4444', 0.1),
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: alpha('#ef4444', 0.2),
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                    )
                  )}
                </Box>
                {editingNotes ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder={t('appointments.addNotes', 'Add notes here...')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f8fafc',
                        borderRadius: 1.5,
                        fontSize: '0.875rem',
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#cbd5e1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976D2',
                          borderWidth: '1.5px',
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: selectedAppointment.notes ? 'text.secondary' : 'text.disabled',
                      fontStyle: selectedAppointment.notes ? 'normal' : 'italic',
                      whiteSpace: 'pre-wrap',
                      bgcolor: '#f8fafc',
                      p: 2,
                      borderRadius: 1.5,
                      border: '1px solid #e2e8f0',
                      minHeight: 60,
                      fontSize: '0.875rem',
                    }}
                  >
                    {selectedAppointment.notes || t('appointments.noNotes', 'No notes added')}
                  </Typography>
                )}
              </Box>

              {/* 支付区域 */}
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1.5} display="block">
                  {t('appointments.payment')}
                </Typography>

                {selectedAppointment.status === 'COMPLETED' || selectedAppointment.paid ? (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${t('appointments.paid')} ${selectedAppointment.paidTime ? format(new Date(selectedAppointment.paidTime), 'p', { locale }) : ''}`}
                    sx={{
                      width: '100%',
                      height: 44,
                      bgcolor: alpha('#10B981', 0.1),
                      color: '#10B981',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      borderRadius: 1.5,
                      border: 'none',
                      '& .MuiChip-icon': {
                        fontSize: 20,
                        color: '#10B981',
                      },
                      '& .MuiChip-label': {
                        px: 2,
                      },
                    }}
                  />
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    size="medium"
                    onClick={handleOpenPaymentDialog}
                    disabled={selectedAppointment.status !== 'CHECKED_IN' || !hasPermission('schedule:checkout')}
                    sx={{
                      height: 44,
                      bgcolor: '#10B981',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1.5,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#059669',
                        boxShadow: 'none',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#e2e8f0',
                        color: '#94a3b8',
                      },
                    }}
                  >
                    {t('appointments.takePayment')}
                  </Button>
                )}
              </Box>

              {/* 取消预约按钮 */}
              {selectedAppointment.status === 'CONFIRMED' && hasPermission('schedule:cancel') && (
                <Box mt={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="medium"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    sx={{
                      height: 44,
                      borderColor: '#e2e8f0',
                      color: '#ef4444',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1.5,
                      borderWidth: '1px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderWidth: '1px',
                        borderColor: '#ef4444',
                        bgcolor: alpha('#EF4444', 0.04),
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {t('appointments.cancel', 'Cancel Appointment')}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
          );
        })()}
      </Drawer>

      {/* 预约对话框 */}
      {appointmentDialogData && (
        <AppointmentDialog
          open={appointmentDialogOpen}
          onClose={() => setAppointmentDialogOpen(false)}
          onExited={() => setSelectedAppointment(null)}
          onSave={handleAppointmentSave}
          date={appointmentDialogData.date}
          startTime={appointmentDialogData.startTime}
          endTime={appointmentDialogData.endTime}
          resourceId={appointmentDialogData.resourceId}
          resourceName={appointmentDialogData.resourceName}
          services={availableServices.filter(service => {
            // 获取该员工的服务专长列表
            const resourceServiceIds = resourceServices[appointmentDialogData.resourceId] || [];
            // 只显示该员工擅长的服务
            return resourceServiceIds.includes(service.id);
          })}
          resourceAvailability={resourceAvailabilities[appointmentDialogData.resourceId] || []}
          existingAppointments={allAppointments.filter(apt =>
            apt.resourceId === appointmentDialogData.resourceId &&
            apt.date === format(appointmentDialogData.date, 'yyyy-MM-dd') &&
            apt.status !== 'CANCELLED' && // 排除已取消的预约
            apt.id !== selectedAppointment?.id // 编辑时排除当前预约
          )}
          editMode={!!selectedAppointment}
          existingAppointment={selectedAppointment ? {
            id: selectedAppointment.id,
            customerId: selectedAppointment.customerId,
            customerName: selectedAppointment.customerName,
            date: selectedAppointment.date,
            serviceIds: selectedAppointment.serviceIds,
            notes: selectedAppointment.notes,
          } : undefined}
          container={isFullscreen ? calendarContainerRef.current : undefined}
        />
      )}

      {/* 支付对话框 */}
      {selectedAppointment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSuccess={handlePayment}
          appointmentId={selectedAppointment.id}
          customerId={selectedAppointment.customerId}
          serviceId={selectedAppointment.serviceId}
          services={selectedAppointment.serviceIds && selectedAppointment.serviceIds.length > 1
            ? selectedAppointment.serviceIds.map((id, index) => ({
                id,
                name: selectedAppointment.serviceName.split(', ')[index] || 'Service',
                price: selectedAppointment.price / (selectedAppointment.serviceIds?.length || 1), // 平均分配价格
              }))
            : undefined
          }
          amount={selectedAppointment.price}
          serviceName={selectedAppointment.serviceName}
          container={isFullscreen ? calendarContainerRef.current : undefined}
        />
      )}

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShiftCalendarView;
