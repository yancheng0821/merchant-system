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
  Portal,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from '@mui/x-date-pickers/locales';
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
  ViewAgenda as ViewAgendaIcon,
  ViewCompact as ViewCompactIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AccessTime as AccessTimeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Check as CheckIcon,
  NoteAdd as NoteAddIcon,
  ModeEdit as ModeEditIcon,
  // Membership tier icons
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarRate as StarRateIcon,
  Grade as GradeIcon,
  Stars as StarsIcon,
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  CardGiftcard as GiftIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  CardMembership as MembershipIcon,
  TrendingUp as TrendingUpIcon,
  Loyalty as LoyaltyIcon,
  Redeem as RedeemIcon,
  Favorite as HeartIcon,
  AutoAwesome as SparkleIcon,
  Whatshot as FireIcon,
  Celebration as CelebrationIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, eachDayOfInterval, endOfWeek, parseISO } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import AppointmentDialog from './components/AppointmentDialog';
import AppointmentCard from './components/AppointmentCard';
import StaffInfoCard from './components/StaffInfoCard';
import PaymentDialog, { ServicePayment } from './components/PaymentDialog';
import AdjustAvailabilityDialog from './components/AdjustAvailabilityDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '../../../contexts/NavigationContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { usePermission } from '../../../hooks/usePermission';
import { resourceApi, serviceApi, getFullImageUrl, api, appointmentApi, staffAttendanceApi } from '../../../services/api';
import type { Resource, Service as ApiService, Customer, StaffAttendance } from '../../../services/api';
import { getMerchantNow, getMerchantTimezone, getCurrencySymbol } from '../../../utils/timezoneUtils';

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
  customerMembershipTier?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  serviceId?: number; // 第一个服务ID（向后兼容）
  serviceIds?: number[]; // 所有服务ID数组（多服务支持）
  serviceName: string; // 服务名称（多个服务用逗号分隔）
  serviceDetails?: string;
  services?: AppointmentService[]; // 服务详情数组（包含价格）
  startTime: string;
  endTime: string;
  date: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'CANCELED' | 'NO_SHOW';
  price: number;
  notes?: string;
  isNewPatient?: boolean;
  paid?: boolean;
  paidTime?: string;
  paymentMethod?: string;
  bookingSource?: 'ADMIN' | 'ONLINE' | 'GOOGLE' | string; // 预约来源
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

// 员工头像专用颜色数组（不包含灰色，避免误导）
const staffAvatarColors = [
  '#5EBFB3', // primary
  '#7BC68C', // green
  '#A8D5BA', // lightGreen
  '#7FC3D8', // blue
  '#B3E0EC', // lightBlue
  '#F5D76E', // yellow
  '#FFB84D', // orange
  '#E8A4C0', // pink
  '#B7A4D5', // purple
];

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

// 生成时间槽 - 从早上10点到午夜12点
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 24; hour++) {
    const displayHour = hour === 24 ? '00' : hour.toString().padStart(2, '0');
    slots.push(`${displayHour}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// 每小时的像素高度 - 设置为200px，适合30分钟起步的服务
const HOUR_HEIGHT = 200;
const HOUR_HEIGHT_COMPACT = 80; // 紧凑模式下的每小时高度

// 计算预约位置 - 基于10点开始
const calculatePosition = (startTime: string, endTime: string, hourHeight: number = HOUR_HEIGHT) => {
  let [startHour, startMinute] = startTime.split(':').map(Number);
  let [endHour, endMinute] = endTime.split(':').map(Number);

  // 处理午夜情况：00:00 表示24:00（一天的结束）
  if (startHour === 0) startHour = 24;
  if (endHour === 0) endHour = 24;

  const startMinutes = (startHour - 10) * 60 + startMinute;
  const endMinutes = (endHour - 10) * 60 + endMinute;

  const top = (startMinutes / 60) * hourHeight;
  const height = ((endMinutes - startMinutes) / 60) * hourHeight;

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

// 可拖拽的员工列组件
interface SortableStaffColumnProps {
  staff: any;
  children: (dragHandleProps: {
    attributes: any;
    mergedListeners: any;
    isDragging: boolean;
    isLongPressing: boolean;
  }) => React.ReactNode;
  minWidth: number;
  maxWidth: number;
}

const SortableStaffColumn: React.FC<SortableStaffColumnProps> = ({ staff, children, minWidth, maxWidth }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staff.id });

  // 长按状态检测
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  // 合并后的事件处理器 - 同时触发长按检测和dnd-kit的事件
  const mergedListeners = React.useMemo(() => {
    const onPointerDown = (e: React.PointerEvent) => {
      // 开始长按计时 - 400ms后显示视觉反馈
      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
      }, 400);
      // 调用dnd-kit的原始事件处理器
      if (listeners?.onPointerDown) {
        (listeners.onPointerDown as any)(e);
      }
    };

    const onPointerUp = (e: React.PointerEvent) => {
      clearLongPressTimer();
      if (listeners?.onPointerUp) {
        (listeners.onPointerUp as any)(e);
      }
    };

    const onPointerCancel = (e: React.PointerEvent) => {
      clearLongPressTimer();
      if (listeners?.onPointerCancel) {
        (listeners.onPointerCancel as any)(e);
      }
    };

    return {
      ...listeners,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave: clearLongPressTimer,
    };
  }, [listeners, clearLongPressTimer]);

  // 当拖拽结束时也要清除状态
  React.useEffect(() => {
    if (!isDragging) {
      clearLongPressTimer();
    }
  }, [isDragging, clearLongPressTimer]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        flex: 1,
        minWidth,
        maxWidth,
      }}
    >
      {children({ attributes, mergedListeners, isDragging, isLongPressing })}
    </Box>
  );
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
  const { hasPermission, userPermissions } = usePermission();
  const { isDrawerOpen, setDrawerOpen } = useNavigation();
  const { themeMode } = useTheme();
  const { newAppointment, clearNewAppointment, cancelledAppointment, clearCancelledAppointment, isConnected } = useWebSocket();
  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#3B82F6';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#2563eb';

  // 获取会员等级图标
  const getTierIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <StarIcon />;
      case 'starhalf': return <StarHalfIcon />;
      case 'starrate': return <StarRateIcon />;
      case 'grade': return <GradeIcon />;
      case 'stars': return <StarsIcon />;
      case 'trophy': return <TrophyIcon />;
      case 'medal': return <MedalIcon />;
      case 'gift': return <GiftIcon />;
      case 'diamond': return <DiamondIcon />;
      case 'premium': return <PremiumIcon />;
      case 'verified': return <VerifiedIcon />;
      case 'membership': return <MembershipIcon />;
      case 'trendingup': return <TrendingUpIcon />;
      case 'loyalty': return <LoyaltyIcon />;
      case 'redeem': return <RedeemIcon />;
      case 'heart': return <HeartIcon />;
      case 'sparkle': return <SparkleIcon />;
      case 'fire': return <FireIcon />;
      case 'celebration': return <CelebrationIcon />;
      default: return <StarIcon />;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(getMerchantNow());
  // 从localStorage读取视图类型，默认为'day'
  const [viewMode, setViewMode] = useState<'day' | 'week'>(() => {
    const saved = localStorage.getItem('scheduleViewMode');
    return (saved === 'week' ? 'week' : 'day');
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
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
  const [adjustAvailabilityDialogOpen, setAdjustAvailabilityDialogOpen] = useState(false);
  const [adjustAvailabilityData, setAdjustAvailabilityData] = useState<{
    staffId: number;
    staffName: string;
    scheduledStart: string;
    scheduledEnd: string;
    scheduledTimeSlots?: string[]; // 原始排班的所有时间槽，如 ["09:00-12:00", "14:00-20:00"]
    actualStart?: string;
    actualEnd?: string;
  } | null>(null);
  // 存储员工签到签退时间（只影响当天）- key: resourceId_date, value: {startTime: checkIn, endTime: checkOut}
  const [temporaryAvailabilities, setTemporaryAvailabilities] = useState<Record<string, {
    startTime: string;
    endTime: string;
    timePeriods?: Array<{ start: string; end: string }>;
  }>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>({
    open: false,
    message: '',
    severity: 'warning',
    duration: 4000,
  });
  // 从localStorage读取视图模式，默认为false
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('scheduleViewCompactMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const calendarContainerRef = React.useRef<HTMLDivElement>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);

  // 待确认预约通知面板状态
  const [pendingPanelExpanded, setPendingPanelExpanded] = useState(false);

  // 真实数据状态
  const [realStaff, setRealStaff] = useState<Resource[]>([]);
  const [realServices, setRealServices] = useState<ApiService[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [resourceServices, setResourceServices] = useState<Record<number, number[]>>({});
  const [resourceAvailabilities, setResourceAvailabilities] = useState<Record<number, any[]>>({});
  const [availabilitiesLoading, setAvailabilitiesLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [resourceServicesLoading, setResourceServicesLoading] = useState(true);

  // 员工列拖拽排序状态
  const [staffOrder, setStaffOrder] = useState<number[]>([]);

  // 拖拽传感器配置
  // 使用MouseSensor而不是PointerSensor，因为PointerSensor会捕获触摸事件，绕过TouchSensor的延迟
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // 鼠标移动8px后才激活拖拽，避免误触
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500, // 触摸设备需要长按0.5秒才能激活拖拽
        tolerance: 5, // 长按期间允许的移动容差
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 初始化时根据compact模式设置drawer状态
  useEffect(() => {
    if (isCompactMode) {
      setDrawerOpen(false);
    }
  }, []); // 只在组件挂载时执行一次

  // 从 localStorage 加载员工排序
  useEffect(() => {
    if (!user?.tenantId) return;

    const storageKey = `staffOrder_${user.tenantId}`;
    const savedOrder = localStorage.getItem(storageKey);

    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setStaffOrder(parsed);
      } catch (error) {
        console.error('Failed to parse staff order from localStorage:', error);
      }
    }
  }, [user?.tenantId]);

  // 保存员工排序到 localStorage
  const saveStaffOrder = (order: number[]) => {
    if (!user?.tenantId) return;

    const storageKey = `staffOrder_${user.tenantId}`;
    localStorage.setItem(storageKey, JSON.stringify(order));
    setStaffOrder(order);
  };

  // 加载真实数据 - 使用批量API优化性能
  useEffect(() => {
    const loadData = async () => {
      if (!user?.tenantId) return;

      try {
        setDataLoading(true);
        setResourceServicesLoading(true);
        setAvailabilitiesLoading(true);

        // 并行加载员工批量数据和服务数据
        const [batchData, servicesData] = await Promise.all([
          resourceApi.getBatchDetails(user.tenantId, 'STAFF'),
          serviceApi.getServices(user.tenantId.toString())
        ]);

        // 设置员工数据
        setRealStaff(batchData.resources || []);
        setRealServices(servicesData || []);

        // 设置资源服务映射
        setResourceServices(batchData.resourceServices || {});

        // 设置资源可用性映射
        setResourceAvailabilities(batchData.resourceAvailabilities || {});
      } catch (error) {
        console.error('Failed to load data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
          severity: 'error',
        });
      } finally {
        setDataLoading(false);
        setResourceServicesLoading(false);
        setAvailabilitiesLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  // 加载预约数据
  const loadAppointments = React.useCallback(async (silent: boolean = false) => {
    if (!user?.tenantId) {
      if (!silent) setAppointmentsLoading(false);
      return;
    }

    try {
      // 静默模式不显示加载状态，避免界面闪烁
      if (!silent) setAppointmentsLoading(true);
      const appointmentsData = await api.getAllAppointments(user.tenantId);

      // Transform API data to local Appointment format using the helper function
      const transformedAppointments: Appointment[] = appointmentsData.map(transformAppointment);

      setAllAppointments(transformedAppointments);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      if (!silent) setAppointmentsLoading(false);
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

  // Helper function to transform a single appointment from API format to local format
  const transformAppointment = (apt: any): Appointment => {
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
      customerMembershipTier: apt.customer?.membershipTier ? {
        id: apt.customer.membershipTier.id,
        name: apt.customer.membershipTier.name,
        color: apt.customer.membershipTier.color,
        icon: apt.customer.membershipTier.icon,
      } : undefined,
      serviceId: apt.appointmentServices?.[0]?.serviceId,
      serviceIds: serviceIds,
      serviceName: serviceNames,
      serviceDetails: apt.appointmentServices?.[0]?.service?.description,
      services: services,
      startTime: apt.appointmentTime,
      endTime: calculateEndTime(apt.appointmentTime, apt.duration),
      date: apt.appointmentDate,
      status: apt.status,
      price: apt.totalAmount,
      notes: apt.notes,
      paid: apt.status === 'COMPLETED',
      bookingSource: apt.bookingSource,
    };
  };

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // WebSocket 实时通知：收到新的在线预约时自动刷新
  useEffect(() => {
    if (newAppointment) {
      // 显示通知（WebSocket 消息需要更长的显示时间）
      setSnackbar({
        open: true,
        message: t('schedule.newOnlineAppointment', {
          customerName: newAppointment.customerName,
          date: newAppointment.date,
          time: newAppointment.time?.substring(0, 5),
          defaultValue: `New online booking: ${newAppointment.customerName} on ${newAppointment.date} at ${newAppointment.time?.substring(0, 5)}`
        }),
        severity: 'info',
        duration: 8000,
      });

      // 静默刷新预约列表，不显示 loading 状态，避免界面闪烁
      loadAppointments(true);

      // 清除通知状态
      clearNewAppointment();
    }
  }, [newAppointment, loadAppointments, clearNewAppointment, t]);

  // WebSocket 实时通知：收到预约取消通知时更新界面
  useEffect(() => {
    if (cancelledAppointment) {
      // 显示通知（WebSocket 消息需要更长的显示时间）
      setSnackbar({
        open: true,
        message: t('schedule.appointmentCancelled', {
          customerName: cancelledAppointment.customerName,
          date: cancelledAppointment.date,
          time: cancelledAppointment.time?.substring(0, 5),
          defaultValue: `Appointment cancelled: ${cancelledAppointment.customerName} on ${cancelledAppointment.date} at ${cancelledAppointment.time?.substring(0, 5)}`
        }),
        severity: 'warning',
        duration: 8000,
      });

      // 从本地状态中移除被取消的预约，无需重新加载
      setAllAppointments(prevAppointments =>
        prevAppointments.filter(apt => apt.id !== cancelledAppointment.appointmentId)
      );

      // 清除通知状态
      clearCancelledAppointment();
    }
  }, [cancelledAppointment, clearCancelledAppointment, t]);

  // 加载当天的签到签退记录
  useEffect(() => {
    const loadAttendanceRecords = async () => {
      if (!user?.tenantId) return;

      try {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const records = await staffAttendanceApi.getByTenantAndDate(user.tenantId, dateStr);

        // 转换为temporaryAvailabilities格式
        const attendanceMap: Record<string, {
          startTime: string;
          endTime: string;
          timePeriods?: Array<{ start: string; end: string }>;
        }> = {};
        records.forEach((record) => {
          const key = `${record.resourceId}_${dateStr}`;
          attendanceMap[key] = {
            startTime: record.checkInTime.substring(0, 5), // HH:mm
            endTime: record.checkOutTime.substring(0, 5), // HH:mm
            timePeriods: record.timePeriods, // 保留调整后的时间段
          };
        });

        setTemporaryAvailabilities(attendanceMap);
      } catch (error) {
        console.error('Failed to load attendance records:', error);
      }
    };

    loadAttendanceRecords();
  }, [currentDate, user?.tenantId]);

  // 动态计算每小时高度（根据紧凑模式）
  const hourHeight = isCompactMode ? HOUR_HEIGHT_COMPACT : HOUR_HEIGHT;

  // 动态计算员工列宽度（根据紧凑模式）
  const staffColumnWidth = isCompactMode ? { min: 120, max: 150 } : { min: 280, max: 400 };

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
      color: staffAvatarColors[index % staffAvatarColors.length]
    }));
  }, [realStaff, dataLoading, t]);

  // 转换真实员工数据为显示格式（用于日历显示区域）
  // 返回所有员工及其可用状态，而不是直接过滤
  const displayedStaffWithAvailability = useMemo(() => {
    return allStaffList.map(staff => {
      let isAvailable = true;

      // 如果有搜索查询，检查该技师是否有匹配客户的预约
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // 找出该技师的所有匹配搜索条件的预约（排除已取消的）
        const hasMatchingAppointment = allAppointments.some(apt =>
          apt.resourceId === staff.id &&
          apt.date === dateStr &&
          apt.status !== 'CANCELLED' &&
          apt.customerName.toLowerCase().includes(query)
        );

        if (!hasMatchingAppointment) {
          isAvailable = false;
        }
      }

      // 如果选择了服务，检查该技师是否提供该服务
      if (selectedServiceId && resourceServices && isAvailable) {
        const staffServiceIds = resourceServices[staff.id] || [];
        if (!staffServiceIds.includes(selectedServiceId)) {
          isAvailable = false;
        }
      }

      // 如果选择了特定员工，检查当前员工是否在选择列表中
      if (selectedStaffIds.length > 0 && isAvailable) {
        if (!selectedStaffIds.includes(staff.id)) {
          isAvailable = false;
        }
      }

      return {
        ...staff,
        isAvailable
      };
    });
  }, [searchQuery, selectedStaffIds, selectedServiceId, resourceServices, currentDate, allAppointments, allStaffList]);

  // 为了兼容现有代码，保留displayedStaff（只返回可用的员工）
  const displayedStaff = useMemo(() => {
    return displayedStaffWithAvailability.filter(s => s.isAvailable);
  }, [displayedStaffWithAvailability]);

  // 应用拖拽排序后的员工列表
  const sortedStaffWithAvailability = useMemo(() => {
    // 如果没有自定义排序，返回原始顺序
    if (staffOrder.length === 0) {
      return displayedStaffWithAvailability;
    }

    // 创建一个按 staffOrder 排序的员工列表
    const staffMap = new Map(displayedStaffWithAvailability.map(s => [s.id, s]));
    const sorted: typeof displayedStaffWithAvailability = [];

    // 首先添加已排序的员工
    staffOrder.forEach(id => {
      const staff = staffMap.get(id);
      if (staff) {
        sorted.push(staff);
        staffMap.delete(id);
      }
    });

    // 然后添加新员工（不在排序列表中的）
    staffMap.forEach(staff => {
      sorted.push(staff);
    });

    return sorted;
  }, [displayedStaffWithAvailability, staffOrder]);

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

  // 待确认的预约列表
  const pendingConfirmationAppointments = useMemo(() => {
    return allAppointments.filter(apt => apt.status === 'PENDING_CONFIRMATION');
  }, [allAppointments]);

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

  // 检查是否是过去的时间 - 按小时判断（基于商户时区）
  const isPastTime = (date: Date, timeStr: string): boolean => {
    // 使用商户时区的当前时间
    const now = getMerchantNow();
    const [slotHour] = timeStr.split(':').map(Number);

    // 检查日期是否是今天（基于商户时区）
    const todayStr = format(now, 'yyyy-MM-dd');
    const dateStr = format(date, 'yyyy-MM-dd');

    // 如果日期在今天之前，肯定是过去的
    if (dateStr < todayStr) {
      return true;
    }

    // 如果日期在今天之后，肯定不是过去的
    if (dateStr > todayStr) {
      return false;
    }

    // 如果是今天，使用 format 获取正确的商户时区小时数
    const nowHour = parseInt(format(now, 'H'), 10);

    // 只要当前小时 > 时间槽小时，该槽就是过去的
    // 例如：现在是12:30，则11点槽是过去的，12点槽不是
    return slotHour < nowHour;
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

    let [hours, minutes] = timeStr.split(':').map(Number);
    // 处理午夜情况
    if (hours === 0) hours = 24;
    const timeSlotStartMinutes = hours * 60 + minutes;
    const timeSlotEndMinutes = timeSlotStartMinutes + 60; // 时间槽代表一个小时的时段

    // 优先检查临时签到签退时间调整
    const dateStr = format(date, 'yyyy-MM-dd');
    const tempKey = `${resourceId}_${dateStr}`;
    if (temporaryAvailabilities[tempKey]) {
      const tempAvail = temporaryAvailabilities[tempKey];

      // 如果有 timePeriods，检查时间槽是否在任一时间段内
      if (tempAvail.timePeriods && tempAvail.timePeriods.length > 0) {
        return tempAvail.timePeriods.some(period => {
          const [startHours, startMinutes] = period.start.split(':').map(Number);
          const [endHours, endMinutes] = period.end.split(':').map(Number);
          const periodStartMinutes = startHours * 60 + startMinutes;
          const periodEndMinutes = endHours * 60 + endMinutes;

          // 时间槽与这个时间段有重叠即可用
          return timeSlotEndMinutes > periodStartMinutes && timeSlotStartMinutes < periodEndMinutes;
        });
      }

      // 否则使用简单的 startTime-endTime 判断
      let [startHours, startMinutes] = tempAvail.startTime.split(':').map(Number);
      let [endHours, endMinutes] = tempAvail.endTime.split(':').map(Number);
      // 处理午夜情况
      if (startHours === 0) startHours = 24;
      if (endHours === 0) endHours = 24;
      const staffStartMinutes = startHours * 60 + startMinutes;
      const staffEndMinutes = endHours * 60 + endMinutes;

      // 时间槽与员工工作时间有重叠即可用
      return timeSlotEndMinutes > staffStartMinutes && timeSlotStartMinutes < staffEndMinutes;
    }

    // 如果没有临时调整，使用原始排班时间
    const availabilities = resourceAvailabilities[resourceId];
    if (!availabilities || availabilities.length === 0) {
      // 如果没有设置可用性，默认为不可用（必须先设置员工可用性才能添加预约）
      return false;
    }

    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // 转换为后端格式 (1=Monday, ..., 7=Sunday)
    const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    // 获取当天的所有可用性记录（支持多个时间段）
    const dayAvailabilities = availabilities.filter(
      (avail: any) => avail.dayOfWeek === backendDayOfWeek
    );

    if (!dayAvailabilities || dayAvailabilities.length === 0) {
      // 如果当天没有可用性记录，默认不可用
      return false;
    }

    // 检查时间槽是否与任何一个可用时间段有重叠
    return dayAvailabilities.some((dayAvailability: any) => {
      let [startHours, startMinutes] = dayAvailability.startTime.split(':').map(Number);
      let [endHours, endMinutes] = dayAvailability.endTime.split(':').map(Number);
      // 处理午夜情况
      if (startHours === 0) startHours = 24;
      if (endHours === 0) endHours = 24;
      const staffStartMinutes = startHours * 60 + startMinutes;
      const staffEndMinutes = endHours * 60 + endMinutes;

      return (
        dayAvailability.isAvailable &&
        timeSlotEndMinutes > staffStartMinutes &&
        timeSlotStartMinutes < staffEndMinutes
      );
    });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotesValue(appointment.notes || '');
    setEditingNotes(false);
    setDetailsDrawerOpen(true);
  };

  // 获取员工的工作时间范围（优先使用签到签退时间，否则使用排班时间）
  const getStaffAvailabilityTime = (staffId: number, date: Date): string | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const tempKey = `${staffId}_${dateStr}`;

    // 如果有签到签退记录，使用签到签退时间
    if (temporaryAvailabilities[tempKey]) {
      const attendance = temporaryAvailabilities[tempKey];

      // 优先使用 timePeriods（保留休息时间的多时间段）
      if (attendance.timePeriods && attendance.timePeriods.length > 0) {
        return attendance.timePeriods.map(period => `${period.start}-${period.end}`).join(', ');
      }

      // 否则使用简单的 startTime-endTime
      const start = attendance.startTime.substring(0, 5);
      const end = attendance.endTime.substring(0, 5);
      return `${start}-${end}`;
    }

    // 否则使用原始排班时间
    const dayOfWeek = date.getDay();
    const isoWeekDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    const availabilities = (resourceAvailabilities[staffId] || []).filter(
      (availability: any) => availability.dayOfWeek === isoWeekDay && availability.isAvailable
    );

    if (availabilities.length === 0) {
      return null;
    }

    // 按开始时间排序所有可用时间段
    const sortedAvailabilities = availabilities
      .map((availability: any) => ({
        start: availability.startTime.substring(0, 5),
        end: availability.endTime.substring(0, 5),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));

    // 合并连续或重叠的时间段
    const mergedSlots: { start: string; end: string }[] = [];
    sortedAvailabilities.forEach((slot) => {
      if (mergedSlots.length === 0) {
        mergedSlots.push(slot);
      } else {
        const lastSlot = mergedSlots[mergedSlots.length - 1];
        // 如果当前时间段与上一个时间段连续或重叠，合并它们
        if (slot.start <= lastSlot.end) {
          lastSlot.end = slot.end > lastSlot.end ? slot.end : lastSlot.end;
        } else {
          mergedSlots.push(slot);
        }
      }
    });

    // 格式化为字符串，多个时间段用逗号分隔
    return mergedSlots.map(slot => `${slot.start}-${slot.end}`).join(', ');
  };

  // 打开员工签到签退对话框
  const handleOpenAdjustAvailability = (staffId: number, staffName: string) => {
    // 检查权限 - 没有权限时静默返回，不显示提示
    if (!hasPermission('schedule:adjust_attendance')) {
      return;
    }

    const availability = getStaffAvailabilityTime(staffId, currentDate);
    if (!availability) {
      setSnackbar({
        open: true,
        message: t('schedule.noScheduledTime'),
        severity: 'warning',
      });
      return;
    }

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const tempKey = `${staffId}_${dateStr}`;
    const tempAvailability = temporaryAvailabilities[tempKey];

    // 始终从 resource_availability 表读取原始排班时间（不是调整后的时间）
    const dayOfWeek = currentDate.getDay();
    const isoWeekDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    const availabilities = (resourceAvailabilities[staffId] || []).filter(
      (av: any) => av.dayOfWeek === isoWeekDay && av.isAvailable
    );

    let scheduledStart = '09:00';
    let scheduledEnd = '18:00';
    let scheduledTimeSlots: string[] = [];

    if (availabilities.length > 0) {
      // 对时间槽进行排序（按开始时间）
      const sortedAvailabilities = [...availabilities].sort((a: any, b: any) => {
        return a.startTime.localeCompare(b.startTime);
      });

      // 获取所有时间槽的文本表示（用于显示原始排班）
      scheduledTimeSlots = sortedAvailabilities.map((av: any) => {
        return `${av.startTime.substring(0, 5)}-${av.endTime.substring(0, 5)}`;
      });

      // 获取最早开始时间和最晚结束时间（用于默认签到签退时间）
      let earliestStart = '23:59';
      let latestEnd = '00:00';
      sortedAvailabilities.forEach((av: any) => {
        if (av.startTime < earliestStart) earliestStart = av.startTime;
        if (av.endTime > latestEnd) latestEnd = av.endTime;
      });
      scheduledStart = earliestStart.substring(0, 5);
      scheduledEnd = latestEnd.substring(0, 5);
    }

    // 计算实际签到签退时间（如果有调整）
    let actualStart: string | undefined;
    let actualEnd: string | undefined;

    if (tempAvailability) {
      // 如果有 timePeriods，从中计算边界时间
      if (tempAvailability.timePeriods && tempAvailability.timePeriods.length > 0) {
        let earliestStart = '23:59';
        let latestEnd = '00:00';
        tempAvailability.timePeriods.forEach(period => {
          if (period.start < earliestStart) earliestStart = period.start;
          if (period.end > latestEnd) latestEnd = period.end;
        });
        actualStart = earliestStart;
        actualEnd = latestEnd;
      } else {
        // 否则使用 checkInTime 和 checkOutTime
        actualStart = tempAvailability.startTime;
        actualEnd = tempAvailability.endTime;
      }
    }

    setAdjustAvailabilityData({
      staffId,
      staffName,
      scheduledStart,
      scheduledEnd,
      scheduledTimeSlots, // 始终是原始排班的时间槽
      actualStart,
      actualEnd,
    });
    setAdjustAvailabilityDialogOpen(true);
  };

  // 保存员工签到签退时间
  const handleSaveAvailabilityAdjustment = async (startTime: string, endTime: string) => {
    if (!adjustAvailabilityData || !user?.tenantId) return;

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const tempKey = `${adjustAvailabilityData.staffId}_${dateStr}`;

    try {
      // 如果签到签退时间与原始排班相同，删除记录（使用原始排班）
      if (
        startTime === adjustAvailabilityData.scheduledStart &&
        endTime === adjustAvailabilityData.scheduledEnd
      ) {
        // 删除后端记录
        await staffAttendanceApi.delete(adjustAvailabilityData.staffId, dateStr);

        // 更新本地状态
        setTemporaryAvailabilities(prev => {
          const newTemp = { ...prev };
          delete newTemp[tempKey];
          return newTemp;
        });
      } else {
        // 计算调整后的时间段（保留休息时间）
        let timePeriods: Array<{ start: string; end: string }> | undefined;

        // 如果有时间槽信息，创建调整后的时间段
        if (adjustAvailabilityData.scheduledTimeSlots && adjustAvailabilityData.scheduledTimeSlots.length > 0) {
          timePeriods = adjustAvailabilityData.scheduledTimeSlots.map((slot, index) => {
            const [slotStart, slotEnd] = slot.split('-');
            const isFirst = index === 0;
            const isLast = index === adjustAvailabilityData.scheduledTimeSlots!.length - 1;

            // 单个时间槽：同时使用新的签到和签退时间
            if (isFirst && isLast) {
              return { start: startTime, end: endTime };
            }
            // 第一个时间槽（但不是最后一个）：使用新的签到时间
            else if (isFirst) {
              return { start: startTime, end: slotEnd };
            }
            // 最后一个时间槽（但不是第一个）：使用新的签退时间
            else if (isLast) {
              return { start: slotStart, end: endTime };
            }
            // 中间的时间槽：保持不变
            else {
              return { start: slotStart, end: slotEnd };
            }
          });
        } else {
          // 如果没有时间槽信息，创建单个时间段
          timePeriods = [{ start: startTime, end: endTime }];
        }

        // 保存签到签退时间到后端
        const attendance: StaffAttendance = {
          tenantId: user.tenantId,
          resourceId: adjustAvailabilityData.staffId,
          attendanceDate: dateStr,
          checkInTime: `${startTime}:00`,
          checkOutTime: `${endTime}:00`,
          timePeriods, // 添加时间段数组
          createdBy: user.id,
        };

        await staffAttendanceApi.saveOrUpdate(attendance);

        // 更新本地状态
        setTemporaryAvailabilities(prev => ({
          ...prev,
          [tempKey]: { startTime, endTime, timePeriods },
        }));
      }

      setSnackbar({
        open: true,
        message: t('schedule.checkInOutSaved'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      setSnackbar({
        open: true,
        message: t('schedule.checkInOutSaveFailed'),
        severity: 'error',
      });
      throw error; // 抛出错误让对话框处理
    }
  };

  // 处理员工列拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedStaffWithAvailability.findIndex(s => s.id === active.id);
    const newIndex = sortedStaffWithAvailability.findIndex(s => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 使用 arrayMove 重新排序
    const reorderedStaff = arrayMove(sortedStaffWithAvailability, oldIndex, newIndex);
    const newOrder = reorderedStaff.map(s => s.id);

    // 保存新的排序
    saveStaffOrder(newOrder);
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
      .filter(a => a.resourceId === staffId && a.date === dateStr && a.status !== 'CANCELLED' && a.status !== 'CANCELED')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 将时间字符串转换为分钟数
    const timeToMinutes = (timeStr: string) => {
      let [hour, minute] = timeStr.split(':').map(Number);
      // 处理午夜情况：00:00 表示24:00（一天的结束）
      if (hour === 0) {
        hour = 24;
      }
      return (hour - 10) * 60 + minute;
    };

    // 将分钟数转换为时间字符串
    const minutesToTime = (minutes: number) => {
      let hour = Math.floor(minutes / 60) + 10;
      const minute = minutes % 60;
      // 处理午夜情况：24:00 -> 00:00
      if (hour === 24) {
        hour = 0;
      }
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    };

    // 获取员工的实际工作时间（考虑签到签退）
    const tempKey = `${staffId}_${dateStr}`;
    let staffStartMinutes: number | null = null;
    let staffEndMinutes: number | null = null;

    if (temporaryAvailabilities[tempKey]) {
      // 有临时调整，使用签到签退时间
      const tempAvail = temporaryAvailabilities[tempKey];

      // 如果有 timePeriods，计算所有时间段的整体边界
      if (tempAvail.timePeriods && tempAvail.timePeriods.length > 0) {
        const starts = tempAvail.timePeriods.map(period => {
          let [h, m] = period.start.split(':').map(Number);
          if (h === 0) h = 24;
          return (h - 10) * 60 + m;
        });
        const ends = tempAvail.timePeriods.map(period => {
          let [h, m] = period.end.split(':').map(Number);
          if (h === 0) h = 24;
          return (h - 10) * 60 + m;
        });
        staffStartMinutes = Math.min(...starts);
        staffEndMinutes = Math.max(...ends);
      } else {
        // 否则使用简单的 startTime-endTime
        let [startHours, startMin] = tempAvail.startTime.split(':').map(Number);
        let [endHours, endMin] = tempAvail.endTime.split(':').map(Number);
        // 处理午夜情况
        if (startHours === 0) startHours = 24;
        if (endHours === 0) endHours = 24;
        staffStartMinutes = (startHours - 10) * 60 + startMin;
        staffEndMinutes = (endHours - 10) * 60 + endMin;
      }
    } else {
      // 使用原始排班时间
      const dayOfWeek = date.getDay();
      const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      const availabilities = resourceAvailabilities[staffId];
      if (availabilities && availabilities.length > 0) {
        const dayAvailabilities = availabilities.filter(
          (avail: any) => avail.dayOfWeek === backendDayOfWeek && avail.isAvailable
        );
        if (dayAvailabilities.length > 0) {
          // 取最早开始和最晚结束时间
          const starts = dayAvailabilities.map((avail: any) => {
            let [h, m] = avail.startTime.split(':').map(Number);
            // 处理午夜情况
            if (h === 0) h = 24;
            return (h - 10) * 60 + m;
          });
          const ends = dayAvailabilities.map((avail: any) => {
            let [h, m] = avail.endTime.split(':').map(Number);
            // 处理午夜情况
            if (h === 0) h = 24;
            return (h - 10) * 60 + m;
          });
          staffStartMinutes = Math.min(...starts);
          staffEndMinutes = Math.max(...ends);
        }
      }
    }

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

    // 确保开始时间不早于员工签到时间
    if (staffStartMinutes !== null) {
      startMinutes = Math.max(startMinutes, staffStartMinutes);
    }

    // 计算结束时间
    if (nextAppointment) {
      const nextStartMinutes = timeToMinutes(nextAppointment.startTime);

      // 可用时间到下一个预约开始为止，但不能超过员工签退时间
      let maxEndMinutes = nextStartMinutes;
      if (staffEndMinutes !== null) {
        maxEndMinutes = Math.min(maxEndMinutes, staffEndMinutes);
      }

      const availableMinutes = maxEndMinutes - startMinutes;

      if (availableMinutes < MIN_DURATION) {
        // 时间不足30分钟,返回 null 表示无法添加预约
        return null;
      }

      // 如果可用时间不足1小时,则占满整个时间槽
      if (availableMinutes < DEFAULT_DURATION) {
        // 直接使用所有可用时间
        endMinutes = maxEndMinutes;
      } else {
        // 有足够空间,默认1小时
        endMinutes = startMinutes + DEFAULT_DURATION;
      }
    } else {
      // 没有后面的预约,默认1小时,但不超过00:00(午夜)和员工签退时间
      let maxEndMinutes = 14 * 60; // 14小时 = 24:00 (00:00)
      if (staffEndMinutes !== null) {
        maxEndMinutes = Math.min(maxEndMinutes, staffEndMinutes);
      }
      endMinutes = Math.min(startMinutes + DEFAULT_DURATION, maxEndMinutes);

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
        const updatedAppointment = await appointmentApi.updateAppointment(selectedAppointment.id, appointment);
        console.log('Updated appointment:', selectedAppointment.id);

        // 局部更新：替换数组中的预约对象
        setAllAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === selectedAppointment.id
              ? transformAppointment(updatedAppointment)
              : apt
          )
        );

        setSnackbar({
          open: true,
          message: t('appointments.updateSuccess', 'Appointment updated successfully'),
          severity: 'success'
        });
      } else {
        // 创建新预约
        const createdAppointment = await api.createAppointment(appointment);
        console.log('Created appointment:', createdAppointment);

        // 局部更新：将新预约添加到数组
        setAllAppointments(prevAppointments => [
          ...prevAppointments,
          transformAppointment(createdAppointment)
        ]);

        setSnackbar({
          open: true,
          message: t('appointments.createSuccess', 'Appointment created successfully'),
          severity: 'success'
        });
      }

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

  // 处理待确认预约的确认操作
  const handleConfirmAppointment = async (appointmentId: number) => {
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
      // Update appointment status to CONFIRMED (会触发发送确认通知给客户)
      await api.updateAppointmentStatus(appointmentId, 'CONFIRMED');

      // Update local state
      setAllAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: 'CONFIRMED' as const }
            : apt
        )
      );

      // Update selected appointment
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: 'CONFIRMED' as const,
        });
      }

      // Show success message
      setSnackbar({
        open: true,
        message: t('appointments.confirmSuccess', 'Appointment confirmed successfully'),
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      setSnackbar({
        open: true,
        message: t('appointments.confirmFailed', 'Failed to confirm appointment'),
        severity: 'error',
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
      tipPaymentMethod?: string;
    },
    notes?: string,
    giftCardAmount?: number,
    giftCardNumber?: string,
    additionalPaymentMethod?: string,
    additionalPaymentAmount?: number,
    paymentMode?: 'single' | 'unified' | 'mixed'
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
            notes, // 传递notes
            giftCardAmount,
            giftCardNumber,
            additionalPaymentMethod,
            additionalPaymentAmount,
            paymentMode, // 传递支付模式
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
            notes, // 传递notes
            giftCardAmount,
            giftCardNumber,
            additionalPaymentMethod,
            additionalPaymentAmount,
            paymentMode: 'single', // 单服务支付模式
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

      // Show success message (dialog will be closed by PaymentDialog component)
      // Add delay to ensure dialog close animation completes
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: t('appointments.paymentSuccess', 'Payment completed successfully!'),
          severity: 'success',
        });
      }, 300);
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
        height: isCompactMode ? '100vh' : 'calc(100vh - 80px)',
        bgcolor: '#f1f3f5',
        position: isCompactMode ? 'fixed' : 'relative',
        top: isCompactMode ? 0 : 'auto',
        left: isCompactMode ? 0 : 'auto',
        right: isCompactMode ? 0 : 'auto',
        bottom: isCompactMode ? 0 : 'auto',
        zIndex: isCompactMode ? 1300 : 'auto', // 高于AppBar的zIndex (1100)
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
        {/* 左侧边栏 - 始终显示 */}
        {/* 简约左侧边栏 */}
        <Paper
            elevation={0}
            sx={{
              width: isCompactMode ? 160 : { xs: 200, sm: 220, md: 240, lg: 260 },
              flexShrink: 0,
              borderRight: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fff',
              transition: 'width 0.3s ease',
            }}
          >
          <Box sx={{ p: isCompactMode ? 1 : 2, transition: 'padding 0.3s ease' }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('appointments.customerSearch')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: isCompactMode ? 16 : 18, color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: '#fafafa',
                  fontSize: isCompactMode ? '0.75rem' : '0.8125rem',
                  '& input': {
                    padding: isCompactMode ? '6px 8px' : '8px 12px',
                  },
                  '& fieldset': {
                    borderColor: 'rgba(0,0,0,0.08)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0,0,0,0.15)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: THEME_COLOR,
                    borderWidth: '1px',
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ py: isCompactMode ? 0.25 : 0.5, px: 0.5, transition: 'padding 0.3s ease' }}>
            <Button
              fullWidth
              size="small"
              sx={{
                justifyContent: 'flex-start',
                color: selectedStaffIds.length === 0 ? THEME_COLOR : '#333',
                textTransform: 'none',
                borderRadius: 1.5,
                fontWeight: selectedStaffIds.length === 0 ? 600 : 500,
                fontSize: isCompactMode ? '0.75rem' : '0.8125rem',
                px: isCompactMode ? 1 : 1.5,
                py: isCompactMode ? 0.5 : 0.75,
                bgcolor: selectedStaffIds.length === 0 ? alpha(THEME_COLOR, 0.08) : 'transparent',
                transition: 'background 0.15s ease',
                '&:hover': {
                  bgcolor: selectedStaffIds.length === 0 ? alpha(THEME_COLOR, 0.1) : 'rgba(0,0,0,0.04)',
                }
              }}
              onClick={() => setSelectedStaffIds([])}
            >
              {t('appointments.allStaff')}
            </Button>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, overflowY: 'auto', py: isCompactMode ? 0.5 : 1, transition: 'padding 0.3s ease' }}>
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4 }}>
                <CircularProgress size={40} sx={{ color: THEME_COLOR }} />
              </Box>
            ) : allStaffList.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('schedule.noStaff', 'No staff available')}
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0, px: 0.5 }}>
                {allStaffList.map((staff) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                // 在monochrome模式下使用深灰色头像
                const staffAvatarColor = isMonochrome ? '#2a2a2a' : (staff.color || '#5fa67a');
                return (
                  <ListItemButton
                    key={staff.id}
                    selected={isSelected}
                    onClick={() => toggleStaffSelection(staff.id)}
                    sx={{
                      py: isCompactMode ? 0.5 : 1,
                      px: isCompactMode ? 1 : 1.5,
                      mb: 0.25,
                      borderRadius: 1.5,
                      transition: 'background 0.15s ease',
                      bgcolor: isSelected ? alpha(THEME_COLOR, 0.08) : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? alpha(THEME_COLOR, 0.1) : 'rgba(0,0,0,0.04)',
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(THEME_COLOR, 0.08),
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: isCompactMode ? 32 : 44 }}>
                      <Avatar
                        src={staff.avatar || undefined}
                        sx={{
                          width: isCompactMode ? 24 : 32,
                          height: isCompactMode ? 24 : 32,
                          bgcolor: staffAvatarColor,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: isCompactMode ? 10 : 12,
                        }}
                        imgProps={{
                          onError: (e: any) => {
                            e.target.style.display = 'none';
                          }
                        }}
                      >
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={isSelected ? 600 : 500}
                          color={isSelected ? THEME_COLOR : '#333'}
                          sx={{ fontSize: isCompactMode ? 11 : 13 }}
                        >
                          {staff.name}
                        </Typography>
                      }
                      secondary={!isCompactMode && (
                        <Typography variant="caption" color="text.secondary" fontSize={10}>
                          {staff.role}
                        </Typography>
                      )}
                    />
                  </ListItemButton>
                );
              })}
              </List>
            )}
          </Box>

          {/* 服务列表 - 始终显示所有服务 */}
          <Divider />
          <Box sx={{ p: isCompactMode ? 1 : 2, pb: isCompactMode ? 0.5 : 1, transition: 'padding 0.3s ease' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: isCompactMode ? '0.7rem' : '0.75rem' }}>
              {selectedStaffIds.length > 0 ? t('appointments.availableServices') : t('appointments.allServicesLabel')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', pb: isCompactMode ? 1 : 2, px: 0.5, transition: 'padding 0.3s ease' }}>
            {availableServices.map((service) => {
              // 在monochrome模式下使用深灰色
              const displayColor = isMonochrome ? '#2a2a2a' : service.color;
              const isSelected = selectedServiceId === service.id;
              return (
              <Box
                key={service.id}
                onClick={() => setSelectedServiceId(isSelected ? null : service.id)}
                sx={{
                  mb: 0.25,
                  py: isCompactMode ? 0.5 : 0.75,
                  px: isCompactMode ? 1 : 1.5,
                  bgcolor: isSelected ? alpha(displayColor, 0.08) : 'transparent',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCompactMode ? 0.75 : 1,
                  transition: 'background 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? alpha(displayColor, 0.1) : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: isCompactMode ? 24 : 28,
                    height: isCompactMode ? 24 : 28,
                    borderRadius: 1,
                    bgcolor: displayColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: isCompactMode ? 10 : 11,
                    flexShrink: 0,
                  }}
                >
                  {service.icon}
                </Box>
                <Box flex={1} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={isSelected ? 600 : 500}
                    color={isSelected ? displayColor : '#333'}
                    sx={{
                      fontSize: isCompactMode ? 11 : 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {service.name}
                  </Typography>
                  {!isCompactMode && (
                    <Typography variant="caption" color="#888" fontSize={10}>
                      {service.duration} min · {getCurrencySymbol()}{service.price}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
            })}
          </Box>
        </Paper>

        {/* 主内容区域 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 简化的日期导航栏 */}
          <Paper
            elevation={0}
            sx={{
              py: isCompactMode ? 0.75 : 1.25,
              px: isCompactMode ? 1 : 2,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              bgcolor: 'white',
              zIndex: 10,
              transition: 'padding 0.3s ease',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1.5}>
                <IconButton
                  onClick={handlePrevious}
                  size="small"
                  sx={{
                    width: isCompactMode ? 28 : 32,
                    height: isCompactMode ? 28 : 32,
                    color: '#666',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.04)',
                      color: THEME_COLOR,
                    },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: isCompactMode ? 18 : 20 }} />
                </IconButton>
                <Box
                  onClick={handleDateClick}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    transition: 'background 0.15s ease',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.04)',
                    }
                  }}
                >
                  <CalendarIcon sx={{ color: THEME_COLOR, fontSize: isCompactMode ? 16 : 18 }} />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="#1a1a1a"
                    sx={{ fontSize: isCompactMode ? 13 : 14 }}
                  >
                    {format(currentDate, 'MMMM do, yyyy', { locale })}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleNext}
                  size="small"
                  sx={{
                    width: isCompactMode ? 28 : 32,
                    height: isCompactMode ? 28 : 32,
                    color: '#666',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.04)',
                      color: THEME_COLOR,
                    },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: isCompactMode ? 18 : 20 }} />
                </IconButton>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                {/* Compact Mode Toggle */}
                <IconButton
                  onClick={() => {
                    const newCompactMode = !isCompactMode;
                    setIsCompactMode(newCompactMode);
                    localStorage.setItem('scheduleViewCompactMode', JSON.stringify(newCompactMode));
                    setDrawerOpen(!newCompactMode);
                  }}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isCompactMode ? THEME_COLOR : 'transparent',
                    color: isCompactMode ? 'white' : '#666',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isCompactMode ? THEME_COLOR_DARK : 'rgba(0,0,0,0.04)',
                      color: isCompactMode ? 'white' : THEME_COLOR,
                    },
                  }}
                  title={isCompactMode ? t('calendar.exitCompactView', 'Exit Compact View') : t('calendar.compactView', 'Compact View')}
                >
                  {isCompactMode ? <ViewAgendaIcon sx={{ fontSize: 18 }} /> : <ViewCompactIcon sx={{ fontSize: 18 }} />}
                </IconButton>

                {/* Fullscreen Toggle */}
                <IconButton
                  onClick={toggleFullscreen}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isFullscreen ? THEME_COLOR : 'transparent',
                    color: isFullscreen ? 'white' : '#666',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isFullscreen ? THEME_COLOR_DARK : 'rgba(0,0,0,0.04)',
                      color: isFullscreen ? 'white' : THEME_COLOR,
                    },
                  }}
                  title={isFullscreen ? t('calendar.exitFullscreen', 'Exit Fullscreen') : t('calendar.fullscreen', 'Fullscreen')}
                >
                  {isFullscreen ? <FullscreenExitIcon sx={{ fontSize: 18 }} /> : <FullscreenIcon sx={{ fontSize: 18 }} />}
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
                    color: THEME_COLOR,
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
                    height: isCompactMode ? 50 : 80,
                    bgcolor: 'white',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20, // 最高层级，确保角落块始终可见
                    borderBottom: '1px solid',
                    borderColor: alpha('#e5e7eb', 0.8),
                    transition: 'height 0.3s ease',
                  }}
                />
                {timeSlots.map((time, index) => {
                  const hour = parseInt(time.split(':')[0]);
                  const isPM = hour >= 12;
                  // 处理午夜和中午的显示：0点显示为12 AM，12点显示为12 PM
                  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
                  const period = isPM ? t('common.pm', 'PM') : t('common.am', 'AM');

                  return (
                    <Box
                      key={index}
                      sx={{
                        height: hourHeight,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        pt: isCompactMode ? 0.5 : 1.5,
                        borderBottom: '1px solid',
                        borderColor: alpha('#f3f4f6', 0.5),
                        bgcolor: 'white',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: hourHeight / 2,
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
                          pr: isCompactMode ? 0.75 : 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: isCompactMode ? '0.625rem' : '0.875rem',
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
                            mt: isCompactMode ? 0.25 : 0.5,
                            letterSpacing: '0.5px',
                            fontSize: isCompactMode ? '0.5rem' : '0.6875rem',
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedStaffWithAvailability.map(s => s.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <Box sx={{ display: 'flex', flex: 1, gap: 0.5 }}>
                      {sortedStaffWithAvailability.map((staff, index) => {
                        const appointments = getStaffAppointments(staff.id, currentDate);
                        const appointmentCount = appointments.filter(a => a.status !== 'CANCELLED').length;
                        const appointmentLayouts = calculateAppointmentLayout(appointments);

                        return (
                          <SortableStaffColumn
                            key={staff.id}
                            staff={staff}
                            minWidth={staffColumnWidth.min}
                            maxWidth={staffColumnWidth.max}
                          >
                            {({ attributes, mergedListeners, isDragging, isLongPressing }) => (
                            <Box
                              sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                // monochrome模式下使用灰色渐变
                                background: isMonochrome
                                  ? `linear-gradient(180deg, rgba(90, 90, 90, 0.03) 0%, rgba(90, 90, 90, 0.015) 50%, white 100%)`
                                  : `linear-gradient(180deg, ${alpha(staff.color, 0.02)} 0%, ${alpha(staff.color, 0.01)} 50%, white 100%)`,
                                borderRadius: 1,
                                opacity: staff.isAvailable ? 1 : 0.5,
                                transition: 'opacity 0.3s ease',
                              }}
                            >
                        {/* 不可用时的覆盖层 - 阻止所有交互 */}
                        {!staff.isAvailable && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 100,
                              cursor: 'not-allowed',
                              bgcolor: 'rgba(249, 250, 251, 0.15)',
                            }}
                          />
                        )}
                        {/* 拖拽包裹层 - 长按1秒激活拖拽，短按触发onClick */}
                        <Box
                          {...attributes}
                          {...mergedListeners}
                          sx={{
                            touchAction: 'none', // 只在员工卡片区域禁用触摸滚动
                            cursor: (isDragging || isLongPressing) ? 'grabbing' : 'default',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                            borderRadius: 1,
                            position: 'relative',
                            // 长按或拖拽时 - 变虚+浮动
                            ...((isLongPressing || isDragging) && {
                              opacity: 0.6,
                              transform: 'scale(1.03) translateY(-4px)',
                              boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                              zIndex: 1000,
                            }),
                          }}
                        >
                        <StaffInfoCard
                          staff={staff}
                          appointmentCount={appointmentCount}
                          isSelected={selectedStaffIds.includes(staff.id)}
                          onClick={() => handleOpenAdjustAvailability(staff.id, staff.name)}
                          isUnavailable={!staff.isAvailable}
                          availabilityTime={getStaffAvailabilityTime(staff.id, currentDate) || undefined}
                          onAdjustAvailability={() => handleOpenAdjustAvailability(staff.id, staff.name)}
                          hasTemporaryAdjustment={(() => {
                            const dateStr = format(currentDate, 'yyyy-MM-dd');
                            const tempKey = `${staff.id}_${dateStr}`;
                            return !!temporaryAvailabilities[tempKey];
                          })()}
                          isWithinWorkingHours={(() => {
                            // 检查当前时间是否在工作时间内
                            const now = getMerchantNow();
                            const currentTime = now.toTimeString().slice(0, 5); // HH:mm

                            // 获取当前日期是星期几
                            const dayOfWeek = currentDate.getDay();
                            const isoWeekDay = dayOfWeek === 0 ? 7 : dayOfWeek;

                            // 获取今天的可用性
                            const todayAvailabilities = (resourceAvailabilities[staff.id] || []).filter(
                              (availability: any) => availability.dayOfWeek === isoWeekDay && availability.isAvailable
                            );

                            // 如果有临时调整，使用临时调整的时间
                            const dateStr = format(currentDate, 'yyyy-MM-dd');
                            const tempKey = `${staff.id}_${dateStr}`;
                            const tempAvailability = temporaryAvailabilities[tempKey];

                            if (tempAvailability) {
                              // 如果有 timePeriods，检查当前时间是否在任一时间段内
                              if (tempAvailability.timePeriods && tempAvailability.timePeriods.length > 0) {
                                return tempAvailability.timePeriods.some(period => {
                                  return currentTime >= period.start && currentTime < period.end;
                                });
                              }

                              // 否则使用简单的 startTime-endTime 判断
                              return currentTime >= tempAvailability.startTime && currentTime < tempAvailability.endTime;
                            }

                            // 使用原始排班时间判断
                            if (todayAvailabilities.length > 0) {
                              return todayAvailabilities.some((avail: any) => {
                                const startTime = avail.startTime.slice(0, 5);
                                const endTime = avail.endTime.slice(0, 5);
                                return currentTime >= startTime && currentTime < endTime;
                              });
                            }

                            return false;
                          })()}
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
                          compact={isCompactMode}
                        />
                        </Box>

                        <Box sx={{
                          position: 'relative',
                          height: hourHeight * timeSlots.length,
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
                                  height: hourHeight,
                                  borderBottom: '1px solid',
                                  borderColor: '#F3F4F6',
                                  // 不可用时使用和已过去时间一样的灰色背景，保持一致性
                                  bgcolor: (isPast || isUnavailable)
                                    ? 'rgba(243, 244, 246, 0.6)'
                                    : '#FFFFFF',
                                  // 斜纹样式备份 - 如需恢复可取消注释
                                  // backgroundImage: isUnavailable
                                  //   ? isCompactMode
                                  //     ? 'repeating-linear-gradient(-45deg, #fafbfc 0px, #fafbfc 4px, #e8eaed 4px, #e8eaed 8px)'
                                  //     : 'repeating-linear-gradient(-45deg, #fafbfc 0px, #fafbfc 10px, #e8eaed 10px, #e8eaed 20px)'
                                  //   : undefined,
                                  cursor: isPast || isUnavailable ? 'not-allowed' : 'pointer',
                                  pointerEvents: isPast ? 'none' : 'auto',
                                  position: 'relative',
                                  transition: 'background-color 0.15s ease',
                                  '&:hover': {
                                    bgcolor: isPast || isUnavailable
                                      ? undefined
                                      : alpha(THEME_COLOR, 0.02),
                                  },
                                  // 移除中间的虚线，让界面更简洁
                                }}
                              />
                            );
                          })}

                          {appointmentLayouts.map((layout) => {
                            const { top, height } = calculatePosition(layout.startTime, layout.endTime, hourHeight);

                            // 改进的布局算法：更好的卡片间距
                            const hasOverlap = layout.totalColumns > 1;
                            const cardWidth = hasOverlap ? `${100 / layout.totalColumns}%` : '100%';
                            const leftPosition = hasOverlap ? `${(100 / layout.totalColumns) * layout.column}%` : '0';

                            // 卡片间隙 - 缩放模式下间隙更小
                            const HORIZONTAL_GAP = isCompactMode ? 2 : 3; // 水平间隙
                            const VERTICAL_GAP = isCompactMode ? 1 : 3; // 垂直间隙

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
                                    bookingSource: layout.bookingSource,
                                  }}
                                  onClick={() => handleAppointmentClick(layout)}
                                  onEdit={hasPermission('schedule:update') ? (e) => {
                                    e.stopPropagation();
                                    handleEditAppointment(layout);
                                  } : undefined}
                                  variant="day"
                                  compact={isCompactMode}
                                  cardHeight={Math.max(height - VERTICAL_GAP * 2, 30)}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                            </Box>
                            )}
                          </SortableStaffColumn>
                        );
                      })}
                    </Box>
                  </SortableContext>
                </DndContext>
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
                            height: isCompactMode ? 50 : 80,
                            p: isCompactMode ? 1 : 2,
                            borderBottom: '1px solid #dee2e6',
                            bgcolor: isToday ? alpha(THEME_COLOR, 0.1) : 'white',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontSize={isCompactMode ? 9 : 10}>
                            {format(date, 'EEE', { locale })}
                          </Typography>
                          <Typography variant={isCompactMode ? 'h6' : 'h5'} fontWeight={600}>
                            {format(date, 'd')}
                          </Typography>
                        </Box>

                        <Box sx={{
                          position: 'relative',
                          height: hourHeight * timeSlots.length,
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
                                height: hourHeight,
                                borderBottom: '1px solid #dee2e6',
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(THEME_COLOR, 0.02),
                                }
                              }}
                            />
                          ))}

                          {appointmentLayouts.map((layout) => {
                            const { top, height } = calculatePosition(layout.startTime, layout.endTime, hourHeight);

                            // 改进的布局算法：更好的卡片间距
                            const hasOverlap = layout.totalColumns > 1;
                            const cardWidth = hasOverlap ? `${90 / layout.totalColumns}%` : '90%';
                            const leftPosition = hasOverlap ? `${(90 / layout.totalColumns) * layout.column + 5}%` : '5%';

                            // 添加更大的间隙 - 缩放模式下间隙更小
                            const VERTICAL_GAP = isCompactMode ? 1 : 3;

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
                                    bookingSource: layout.bookingSource,
                                  }}
                                  onClick={() => handleAppointmentClick(layout)}
                                  onEdit={hasPermission('schedule:update') ? (e) => {
                                    e.stopPropagation();
                                    handleEditAppointment(layout);
                                  } : undefined}
                                  variant="week"
                                  compact={true}
                                  cardHeight={Math.max(height - VERTICAL_GAP * 2, 25)}
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
        container={isFullscreen ? calendarContainerRef.current : undefined}
        disablePortal={isFullscreen}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '& .MuiPickersDay-root.Mui-selected': {
                bgcolor: THEME_COLOR,
                '&:hover': { bgcolor: THEME_COLOR_DARK },
              },
              '& .MuiPickersDay-root:focus.Mui-selected': {
                bgcolor: THEME_COLOR,
              },
            }
          }
        }}
      >
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={locale}
          localeText={i18n.language === 'zh-CN' ? zhCN.components.MuiLocalizationProvider.defaultProps.localeText : undefined}
        >
          <Box>
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
            {/* Today link */}
            <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'center' }}>
              <Typography
                onClick={() => {
                  setCurrentDate(getMerchantNow());
                  setDatePickerAnchor(null);
                }}
                sx={{
                  cursor: 'pointer',
                  color: THEME_COLOR,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(THEME_COLOR, 0.1),
                  },
                }}
              >
                {t('common.today')}
              </Typography>
            </Box>
          </Box>
        </LocalizationProvider>
      </Popover>

      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        container={isFullscreen ? calendarContainerRef.current : document.body}
        PaperProps={{
          sx: {
            width: 400,
            zIndex: isFullscreen ? 9999 : 1300,
            position: isFullscreen ? 'fixed' : 'absolute',
            borderLeft: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
          // 支付主题色 - 与PaymentDialog保持一致
          const PAYMENT_COLOR = isMonochrome ? '#1a1a1a' : '#10b981';
          const PAYMENT_COLOR_DARK = isMonochrome ? '#333' : '#059669';

          // 获取状态配置 - CHECKED_IN状态使用支付主题色（绿色）
          const getStatusConfig = () => {
            if (selectedAppointment.status === 'COMPLETED' || selectedAppointment.paid) {
              return {
                color: isMonochrome ? '#1a1a1a' : '#4CAF50',
                bgColor: alpha(isMonochrome ? '#1a1a1a' : '#4CAF50', 0.08),
                borderColor: alpha(isMonochrome ? '#1a1a1a' : '#4CAF50', 0.2),
              };
            }
            if (selectedAppointment.status === 'CHECKED_IN') {
              // CHECKED_IN状态使用绿色主题，与支付流程保持一致
              return {
                color: PAYMENT_COLOR,
                bgColor: alpha(PAYMENT_COLOR, 0.08),
                borderColor: alpha(PAYMENT_COLOR, 0.2),
              };
            }
            return {
              color: isMonochrome ? '#6a6a6a' : THEME_COLOR,
              bgColor: alpha(isMonochrome ? '#6a6a6a' : THEME_COLOR, 0.08),
              borderColor: alpha(isMonochrome ? '#6a6a6a' : THEME_COLOR, 0.2),
            };
          };

          const statusConfig = getStatusConfig();

          // 抽屉主题色 - CHECKED_IN/COMPLETED/已支付状态使用支付主题色（绿色）
          const usePaymentTheme = selectedAppointment.status === 'CHECKED_IN' || selectedAppointment.status === 'COMPLETED' || selectedAppointment.paid;
          const drawerThemeColor = usePaymentTheme ? PAYMENT_COLOR : THEME_COLOR;
          const drawerThemeColorDark = usePaymentTheme ? PAYMENT_COLOR_DARK : THEME_COLOR_DARK;

          return (
            <Box>
              {/* 简约头部 */}
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: alpha(drawerThemeColor, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: drawerThemeColor,
                    }}
                  >
                    <EventIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.125rem' }}>
                    {t('appointments.appointment')}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailsDrawerOpen(false)}
                  sx={{ color: '#999' }}
                >
                  <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

            <Box sx={{ p: 2.5 }}>
              {/* 客户信息 */}
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#888', fontWeight: 500, mb: 1 }}>
                  {t('appointments.customer')}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1a1a1a' }}>
                      {selectedAppointment.customerName}
                    </Typography>
                    {selectedAppointment.customerMembershipTier && (
                      <Box display="flex" alignItems="center" gap={0.5} sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: alpha(selectedAppointment.customerMembershipTier.color || '#9CA3AF', 0.1),
                      }}>
                        <Box
                          sx={{
                            fontSize: 14,
                            color: selectedAppointment.customerMembershipTier.color || '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {getTierIcon(selectedAppointment.customerMembershipTier.icon || 'star')}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: selectedAppointment.customerMembershipTier.color || '#9CA3AF',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        >
                          {selectedAppointment.customerMembershipTier.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* 签到状态或按钮 */}
                  {selectedAppointment.status === 'COMPLETED' ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={t('appointments.completed', 'Completed')}
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: alpha(isMonochrome ? '#1a1a1a' : '#4CAF50', 0.1),
                        color: isMonochrome ? '#1a1a1a' : '#4CAF50',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        border: 'none',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: isMonochrome ? '#1a1a1a' : '#4CAF50',
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
                        bgcolor: alpha(isMonochrome ? '#4a4a4a' : '#FF9800', 0.1),
                        color: isMonochrome ? '#4a4a4a' : '#FF9800',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        border: 'none',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: isMonochrome ? '#4a4a4a' : '#FF9800',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  ) : selectedAppointment.status === 'PENDING_CONFIRMATION' ? (
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label={t('appointments.confirmBooking', 'Confirm Booking')}
                      size="small"
                      onClick={() => handleConfirmAppointment(selectedAppointment.id)}
                      disabled={!hasPermission('schedule:update')}
                      sx={{
                        height: 24,
                        bgcolor: 'transparent',
                        border: `1px solid ${isMonochrome ? '#666' : '#3B82F6'}`,
                        color: isMonochrome ? '#666' : '#3B82F6',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: isMonochrome ? '#666' : '#3B82F6',
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                        '&:hover': {
                          bgcolor: alpha(isMonochrome ? '#666' : '#3B82F6', 0.08),
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
                        border: `1px solid ${THEME_COLOR}`,
                        color: THEME_COLOR,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '& .MuiChip-icon': {
                          fontSize: 16,
                          color: THEME_COLOR,
                        },
                        '& .MuiChip-label': {
                          px: 1,
                        },
                        '&:hover': {
                          bgcolor: alpha(THEME_COLOR, 0.08),
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
                {/* 预约来源 */}
                {selectedAppointment.bookingSource && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                      {t('appointments.bookingSource')}:
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        selectedAppointment.bookingSource === 'ONLINE' ? t('appointments.sourceOnline') :
                        selectedAppointment.bookingSource === 'GOOGLE' ? t('appointments.sourceGoogle') :
                        t('appointments.sourceAdmin')
                      }
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        bgcolor: selectedAppointment.bookingSource === 'ONLINE' ? alpha('#3B82F6', 0.1) :
                                 selectedAppointment.bookingSource === 'GOOGLE' ? alpha('#EA4335', 0.1) :
                                 alpha('#6B7280', 0.1),
                        color: selectedAppointment.bookingSource === 'ONLINE' ? '#3B82F6' :
                               selectedAppointment.bookingSource === 'GOOGLE' ? '#EA4335' :
                               '#6B7280',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Box sx={{ height: 1, bgcolor: 'rgba(0,0,0,0.06)', my: 2 }} />

              {/* 预约信息 */}
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#888', fontWeight: 500, mb: 1.5 }}>
                  {t('appointments.bookingInfo')}
                </Typography>

                {/* Date & Time - 简约卡片 */}
                <Box
                  sx={{
                    p: 1.25,
                    bgcolor: alpha(drawerThemeColor, 0.04),
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: alpha(drawerThemeColor, 0.1),
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <EventIcon sx={{ fontSize: 14, color: drawerThemeColor }} />
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                        {format(new Date(selectedAppointment.date + 'T00:00:00'), 'PP', { locale })}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: drawerThemeColor }} />
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                        {selectedAppointment.startTime.substring(0, 5)} - {selectedAppointment.endTime.substring(0, 5)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Services */}
                <Box mt={1.5}>
                  {selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                    // 多服务场景：显示每个服务及其价格
                    <>
                      {selectedAppointment.services.map((service, index) => (
                        <Box
                          key={service.serviceId}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{
                            py: 0.75,
                            borderBottom: index < (selectedAppointment.services?.length ?? 0) - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: drawerThemeColor,
                              }}
                            />
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a' }}>
                              {service.serviceName}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: drawerThemeColor }}>
                            {getCurrencySymbol()}{service.price.toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                      {/* Staff信息 */}
                      <Box mt={1} display="flex" alignItems="center" gap={0.5}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                          {t('appointments.staff')}:
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#666' }}>
                          {allStaffList.find(s => s.id === selectedAppointment.resourceId)?.name}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    // 单服务场景或无服务详情：显示服务名称
                    <Box display="flex" alignItems="center" gap={1} py={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: drawerThemeColor }} />
                      <Box flex={1}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a1a', whiteSpace: 'pre-line' }}>
                          {selectedAppointment.serviceName.replace(/, /g, '\n')}
                        </Typography>
                        {selectedAppointment.serviceDetails && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.25 }}>
                            {selectedAppointment.serviceDetails}
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
                          {t('appointments.staff')}: <span style={{ fontWeight: 500, color: '#666' }}>{allStaffList.find(s => s.id === selectedAppointment.resourceId)?.name}</span>
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 价格 */}
              <Box sx={{ height: 1, bgcolor: 'rgba(0,0,0,0.06)', my: 2 }} />
              <Box sx={{ mb: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#666' }}>
                    {t('appointments.total')}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: drawerThemeColor }}>
                    {getCurrencySymbol()}{selectedAppointment.price}
                  </Typography>
                </Box>
              </Box>

              {/* 备注 */}
              <Box sx={{ height: 1, bgcolor: 'rgba(0,0,0,0.06)', my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#888', fontWeight: 500 }}>
                    {t('appointments.notes', 'Notes')}
                  </Typography>
                  {/* 只有非COMPLETED状态才能编辑Notes */}
                  {selectedAppointment.status !== 'COMPLETED' && !selectedAppointment.paid && hasPermission('schedule:edit_notes') && (
                    !editingNotes ? (
                      <IconButton
                        size="small"
                        onClick={() => setEditingNotes(true)}
                        sx={{
                          width: 24,
                          height: 24,
                          color: '#999',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#666' },
                        }}
                      >
                        {selectedAppointment.notes ? <ModeEditIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    ) : (
                    <Box display="flex" gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={handleSaveNotes}
                        sx={{
                          width: 24,
                          height: 24,
                          color: drawerThemeColor,
                          '&:hover': { bgcolor: alpha(drawerThemeColor, 0.1) },
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(selectedAppointment.notes || '');
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          color: '#999',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', color: '#666' },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    )
                  )}
                </Box>
                {editingNotes ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder={t('appointments.addNotes', 'Add notes here...')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fafafa',
                        borderRadius: 1.5,
                        fontSize: '0.8125rem',
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.06)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0,0,0,0.12)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: drawerThemeColor,
                          borderWidth: '1px',
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: selectedAppointment.notes ? '#666' : '#999',
                      fontStyle: selectedAppointment.notes ? 'normal' : 'italic',
                      whiteSpace: 'pre-wrap',
                      bgcolor: '#fafafa',
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid rgba(0,0,0,0.06)',
                      minHeight: 50,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {selectedAppointment.notes || t('appointments.noNotes', 'No notes added')}
                  </Typography>
                )}
              </Box>

              {/* 支付区域 */}
              <Box sx={{ height: 1, bgcolor: 'rgba(0,0,0,0.06)', my: 2 }} />
              <Box>
                {selectedAppointment.status === 'COMPLETED' || selectedAppointment.paid ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 1,
                      bgcolor: alpha(drawerThemeColor, 0.04),
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: alpha(drawerThemeColor, 0.1),
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: drawerThemeColor }} />
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: drawerThemeColor }}>
                      {t('appointments.paid')} {selectedAppointment.paidTime ? format(new Date(selectedAppointment.paidTime), 'p', { locale }) : ''}
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={handleOpenPaymentDialog}
                    disabled={selectedAppointment.status !== 'CHECKED_IN' || !hasPermission('schedule:checkout')}
                    sx={{
                      py: 1,
                      bgcolor: drawerThemeColor,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      textTransform: 'none',
                      borderRadius: 1.5,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: drawerThemeColorDark, boxShadow: 'none' },
                      '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
                    }}
                  >
                    {t('appointments.takePayment')}
                  </Button>
                )}
              </Box>

              {/* 取消预约按钮 */}
              {selectedAppointment.status === 'CONFIRMED' && hasPermission('schedule:cancel') && (
                <Box mt={1.5}>
                  <Button
                    fullWidth
                    size="small"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    sx={{
                      py: 0.75,
                      color: '#ef4444',
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      textTransform: 'none',
                      '&:hover': { bgcolor: alpha('#ef4444', 0.04) },
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
          services={selectedAppointment.services && selectedAppointment.services.length > 1
            ? selectedAppointment.services.map(service => ({
                id: service.serviceId,
                name: service.serviceName,
                price: service.price,
              }))
            : undefined
          }
          amount={selectedAppointment.price}
          serviceName={selectedAppointment.serviceName}
          container={isFullscreen ? calendarContainerRef.current : document.body}
        />
      )}

      {/* 调整可用性对话框 */}
      {adjustAvailabilityData && (
        <AdjustAvailabilityDialog
          open={adjustAvailabilityDialogOpen}
          onClose={() => setAdjustAvailabilityDialogOpen(false)}
          staffId={adjustAvailabilityData.staffId}
          staffName={adjustAvailabilityData.staffName}
          date={currentDate}
          scheduledStart={adjustAvailabilityData.scheduledStart}
          scheduledEnd={adjustAvailabilityData.scheduledEnd}
          scheduledTimeSlots={adjustAvailabilityData.scheduledTimeSlots}
          actualStart={adjustAvailabilityData.actualStart}
          actualEnd={adjustAvailabilityData.actualEnd}
          onSave={handleSaveAvailabilityAdjustment}
          onShowMessage={(message, severity) => setSnackbar({ open: true, message, severity })}
          container={isFullscreen ? calendarContainerRef.current : undefined}
        />
      )}

      {/* 待确认预约浮动通知面板 - 简约设计 */}
      {pendingConfirmationAppointments.length > 0 && (
        <Portal container={isFullscreen ? calendarContainerRef.current : undefined}>
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: isFullscreen ? 99999 : 1400,
              maxWidth: 340,
              maxHeight: pendingPanelExpanded ? 360 : 'auto',
              bgcolor: '#fff',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
          >
            {/* 标题栏 - 始终可见 */}
            <Box
              onClick={() => setPendingPanelExpanded(!pendingPanelExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                borderBottom: pendingPanelExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: isMonochrome ? '#1a1a1a' : '#8B5CF6',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {pendingConfirmationAppointments.length}
                </Box>
                <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {t('schedule.pendingConfirmations', 'Pending Confirmations')}
                </Typography>
              </Box>
              <ChevronLeftIcon
                sx={{
                  fontSize: 18,
                  color: '#999',
                  transform: pendingPanelExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </Box>

            {/* 预约列表 - 展开时显示 */}
            {pendingPanelExpanded && (
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {pendingConfirmationAppointments.map((apt, index) => {
                  const staffName = realStaff.find(s => s.id === apt.resourceId)?.name || '-';
                  return (
                    <Box
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setDetailsDrawerOpen(true);
                      }}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: index < pendingConfirmationAppointments.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a1a', mb: 0.25 }} noWrap>
                          {apt.customerName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#888' }} noWrap>
                          {format(parseISO(apt.date), 'M/d')} · {apt.startTime.substring(0, 5)} · {staffName}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmAppointment(apt.id);
                        }}
                        disabled={!hasPermission('schedule:update')}
                        sx={{
                          minWidth: 56,
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          color: isMonochrome ? '#1a1a1a' : '#3B82F6',
                          border: `1px solid ${isMonochrome ? '#ddd' : alpha('#3B82F6', 0.3)}`,
                          borderRadius: 1.5,
                          bgcolor: 'transparent',
                          '&:hover': {
                            bgcolor: isMonochrome ? 'rgba(0,0,0,0.04)' : alpha('#3B82F6', 0.08),
                            borderColor: isMonochrome ? '#ccc' : '#3B82F6',
                          },
                        }}
                      >
                        {t('common.confirm', 'Confirm')}
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Portal>
      )}

      {/* 通知组件 */}
      <Portal container={isFullscreen ? calendarContainerRef.current : undefined}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={snackbar.duration || 4000}
          onClose={(event, reason) => {
            if (reason === 'timeout' || reason === 'escapeKeyDown') {
              setSnackbar({ ...snackbar, open: false });
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: isFullscreen ? 99999 : 100000 }}
          disableWindowBlurListener
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Portal>
    </Box>
  );
};

export default ShiftCalendarView;
