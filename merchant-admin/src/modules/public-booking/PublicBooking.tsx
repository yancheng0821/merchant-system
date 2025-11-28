import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  TextField,
  IconButton,
  Collapse,
  useMediaQuery,
  useTheme,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowLeft as ChevronLeftIcon,
  KeyboardArrowRight as ChevronRightIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  People as PeopleIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, addDays, addHours, isBefore, startOfWeek, startOfDay, addWeeks, isSameDay, isAfter, getDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/timezoneUtils';
import CountryCodeSelector from '../../components/common/CountryCodeSelector';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';

// API Base URL - 生产环境使用相对路径，开发环境使用环境变量或 localhost
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (
  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'
);

interface MerchantInfo {
  id: number;
  merchantName: string;
  address: string;
  phone: string;
  logoUrl?: string;
  welcomeMessage?: string;
  timezone: string;
  maxAdvanceDays: number;  // 后端字段名是 maxAdvanceDays
  minAdvanceHours: number;
  allowCustomerCancel: boolean;
  cancelDeadlineHours?: number;  // 取消截止时间（小时）
  allowCustomerReschedule: boolean;
  rescheduleDeadlineHours?: number;  // 改期截止时间（小时）
  requireDeposit: boolean;
  depositType?: string;
  depositAmount?: number;
  widgetColor: string;
  showTechnicianPhotos?: boolean;  // 是否显示技师头像
}

interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  categoryName?: string;
}

interface StaffMember {
  id: number;
  name: string;
  title?: string;
  avatar?: string;  // 后端返回的字段名是 avatar
  position?: string;
  rating?: number;
  specialties?: string[];
  serviceIds?: number[];  // 该员工可提供的服务ID列表
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableResources?: Array<{
    resourceId: number;
    resourceName: string;
    avatar?: string;
  }>;
}

interface TimeSlotResponse {
  date: string;
  slots: TimeSlot[];
}

interface BookingResponse {
  bookingId: number;
  confirmationCode: string;
  serviceName: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime: string;
  merchantName: string;
  merchantAddress: string;
  merchantPhone: string;
  status: string;  // CONFIRMED | PENDING_CONFIRMATION
}

// 格式化时长
const formatDuration = (minutes: number, t: (key: string) => string) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} ${t('publicBooking.hour')}`;
    }
    return `${hours} ${t('publicBooking.hour')} ${mins} ${t('publicBooking.minute')}`;
  }
  return `${minutes} ${t('publicBooking.minute')}`;
};

// 获取员工名称首字母
const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.substring(0, 2);
};

// 获取头像URL（处理相对路径和完整URL）
const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return undefined;
  // 如果已经是完整URL（包括S3 URL），直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  // 否则拼接API_BASE_URL（用于本地静态文件）
  return `${API_BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
};

const PublicBooking: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();

  // 语言状态 - 直接从 i18n 获取
  const isZh = i18n.language === 'zh-CN' || i18n.language?.startsWith('zh');
  const locale = isZh ? zhCN : enUS;

  // 初始化时根据浏览器语言设置 i18n
  useEffect(() => {
    const browserLang = navigator.language || 'en';
    const savedLang = localStorage.getItem('language');
    if (!savedLang) {
      const defaultLang = browserLang.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
      i18n.changeLanguage(defaultLang);
    }
  }, [i18n]);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 商户信息
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);

  // 选择数据
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // 用户选择 - 多选服务
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 周视图
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  // 周可用性数据 - 用于判断某天是否有可用时间段
  const [weekAvailability, setWeekAvailability] = useState<{ [dateStr: string]: TimeSlot[] }>({});
  // 周切换加载状态
  const [weekLoading, setWeekLoading] = useState(false);

  // 客户信息
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [countryCode, setCountryCode] = useState('+1-CA'); // 默认加拿大

  // 预约结果
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);

  // 取消预约状态
  const [searchParams] = useSearchParams();
  const cancelToken = searchParams.get('cancel');
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelBookingInfo, setCancelBookingInfo] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [canCancelBooking, setCanCancelBooking] = useState(true);
  const [cancelReason, setCancelReason] = useState('');

  // UI 状态
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false);

  // 倒计时状态（秒）
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [checkoutStartTime, setCheckoutStartTime] = useState<number | null>(null);

  // 客户查询状态
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<number | null>(null);

  // 计算总价和总时长
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // 根据选中的服务过滤可用员工
  const filteredStaff = staff.filter(member => {
    // 如果员工没有 serviceIds 信息，默认显示
    if (!member.serviceIds || member.serviceIds.length === 0) {
      return true;
    }
    // 检查员工是否能提供所有选中的服务
    const selectedServiceIds = selectedServices.map(s => s.id);
    return selectedServiceIds.every(serviceId => member.serviceIds!.includes(serviceId));
  });

  // 当选中的服务变化时，验证已选员工是否仍然有效
  useEffect(() => {
    if (selectedStaff && selectedServices.length > 0) {
      // 检查当前选中的员工是否能提供所有选中的服务
      if (selectedStaff.serviceIds && selectedStaff.serviceIds.length > 0) {
        const selectedServiceIds = selectedServices.map(s => s.id);
        const canProvideAllServices = selectedServiceIds.every(
          serviceId => selectedStaff.serviceIds!.includes(serviceId)
        );

        // 如果员工不能提供所有服务，清除选择
        if (!canProvideAllServices) {
          setSelectedStaff(null);
          setSelectedTime(null);
          setTimeSlots([]);
        }
      }
    }
  }, [selectedServices]);

  // 获取商户信息
  useEffect(() => {
    const fetchMerchantInfo = async () => {
      if (!slug) {
        setError(t('publicBooking.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/booking/merchants/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError(t('publicBooking.merchantNotFound'));
          } else {
            setError(t('publicBooking.loadFailed'));
          }
          setLoading(false);
          return;
        }
        const data = await response.json();
        setMerchantInfo(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch merchant info:', err);
        setError(t('publicBooking.networkError'));
        setLoading(false);
      }
    };

    fetchMerchantInfo();
  }, [slug, isZh]);

  // 处理取消预约链接
  useEffect(() => {
    const verifyCancelToken = async () => {
      if (!cancelToken) return;

      setCancelMode(true);
      setCancelLoading(true);
      setCancelError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/booking/cancel/verify?token=${encodeURIComponent(cancelToken)}`
        );
        const data = await response.json();

        if (data.success) {
          setCancelBookingInfo(data.booking);
          setCanCancelBooking(data.canCancel);
        } else {
          setCancelError(data.message || t('publicBooking.cancelVerifyFailed'));
        }
      } catch (err) {
        console.error('Failed to verify cancel token:', err);
        setCancelError(t('publicBooking.networkError'));
      } finally {
        setCancelLoading(false);
      }
    };

    verifyCancelToken();
  }, [cancelToken]);

  // 执行取消预约
  const handleCancelBooking = async () => {
    if (!cancelToken) return;

    setCancelLoading(true);
    setCancelError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/booking/cancel/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: cancelToken,
          reason: cancelReason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelSuccess(true);
      } else {
        setCancelError(data.message || t('publicBooking.cancelFailed'));
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setCancelError(t('publicBooking.networkError'));
    } finally {
      setCancelLoading(false);
    }
  };

  // 获取服务列表
  useEffect(() => {
    const fetchServices = async () => {
      if (!merchantInfo) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/booking/merchants/${slug}/services`);
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };

    fetchServices();
  }, [merchantInfo, slug]);

  // 获取技师列表
  useEffect(() => {
    const fetchStaff = async () => {
      if (!merchantInfo) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/booking/merchants/${slug}/staff`
        );
        if (response.ok) {
          const data = await response.json();
          const staffList = Array.isArray(data) ? data : [];
          setStaff(staffList);

          // 预加载员工头像（如果显示头像）
          if (merchantInfo?.showTechnicianPhotos !== false) {
            staffList.forEach((member: StaffMember) => {
              if (member.avatar) {
                const img = new Image();
                img.src = getAvatarUrl(member.avatar) || '';
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    };

    fetchStaff();
  }, [merchantInfo, slug]);

  // 获取可用时间段
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!merchantInfo || selectedServices.length === 0 || !selectedDate) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      // Spring expects multiple parameters with same name for List: serviceIds=1&serviceIds=2
      const serviceIdsParams = selectedServices.map(s => `serviceIds=${s.id}`).join('&');
      let url = `${API_BASE_URL}/api/public/booking/merchants/${slug}/available-slots?${serviceIdsParams}&date=${dateStr}`;

      if (selectedStaff) {
        url += `&resourceId=${selectedStaff.id}`;
      }

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data: TimeSlotResponse = await response.json();
          // 后端返回 { date, slots: [...] }，需要取出 slots 数组
          setTimeSlots(Array.isArray(data?.slots) ? data.slots : []);
        }
      } catch (err) {
        console.error('Failed to fetch time slots:', err);
        setTimeSlots([]);
      }
    };

    fetchTimeSlots();
  }, [merchantInfo, selectedServices, selectedStaff, selectedDate, slug]);

  // 获取指定周的可用性数据
  const fetchWeekAvailability = useCallback(async (targetWeekStart: Date) => {
    if (!merchantInfo || selectedServices.length === 0) return {};

    const serviceIdsParams = selectedServices.map(s => `serviceIds=${s.id}`).join('&');
    const newWeekAvailability: { [dateStr: string]: TimeSlot[] } = {};

    // 并行获取7天的可用性数据
    const fetchPromises = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(targetWeekStart, i);
      const dateStr = format(day, 'yyyy-MM-dd');

      let url = `${API_BASE_URL}/api/public/booking/merchants/${slug}/available-slots?${serviceIdsParams}&date=${dateStr}`;
      if (selectedStaff) {
        url += `&resourceId=${selectedStaff.id}`;
      }

      fetchPromises.push(
        fetch(url)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data?.slots) {
              newWeekAvailability[dateStr] = data.slots;
            } else {
              newWeekAvailability[dateStr] = [];
            }
          })
          .catch(() => {
            newWeekAvailability[dateStr] = [];
          })
      );
    }

    await Promise.all(fetchPromises);
    return newWeekAvailability;
  }, [merchantInfo, selectedServices, selectedStaff, slug]);

  // 切换周（先加载数据再切换，避免闪烁）
  const handleWeekChange = useCallback(async (direction: 'prev' | 'next') => {
    if (weekLoading) return;

    const newWeekStart = direction === 'prev'
      ? addWeeks(weekStart, -1)
      : addWeeks(weekStart, 1);

    setWeekLoading(true);
    const newAvailability = await fetchWeekAvailability(newWeekStart);
    setWeekAvailability(newAvailability);
    setWeekStart(newWeekStart);
    setWeekLoading(false);
  }, [weekStart, weekLoading, fetchWeekAvailability]);

  // 进入日期选择步骤时加载当前周数据（仅在进入步骤2时加载一次）
  useEffect(() => {
    const loadInitialWeekData = async () => {
      if (!merchantInfo || selectedServices.length === 0 || activeStep !== 2) return;

      setWeekLoading(true);
      const availability = await fetchWeekAvailability(weekStart);
      setWeekAvailability(availability);
      setWeekLoading(false);
    };

    loadInitialWeekData();
    // 注意：不包含 weekStart 作为依赖项，因为周切换由 handleWeekChange 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantInfo, selectedServices, selectedStaff, activeStep]);

  // 倒计时 - 当进入结账页面时开始10分钟倒计时
  useEffect(() => {
    if (activeStep === 3 && checkoutStartTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - checkoutStartTime) / 1000);
        const remaining = Math.max(0, 600 - elapsed); // 10分钟 = 600秒
        setCountdownSeconds(remaining);

        if (remaining === 0) {
          clearInterval(timer);
          // 倒计时结束，返回服务选择页面
          setActiveStep(0);
          setCheckoutStartTime(null);
          setError(t('publicBooking.appointmentHoldExpired'));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeStep, checkoutStartTime, isZh]);

  // 确认页面倒计时状态
  const [confirmationCountdown, setConfirmationCountdown] = useState(30);

  // 确认页面30秒后自动刷新
  useEffect(() => {
    if (activeStep === 4) {
      setConfirmationCountdown(30);
      const countdownTimer = setInterval(() => {
        setConfirmationCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            window.location.reload();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownTimer);
    }
  }, [activeStep]);

  // 客户查询 - 根据手机号或邮箱查找现有客户
  const lookupCustomer = async (searchValue: string, searchType: 'phone' | 'email') => {
    if (!merchantInfo || !searchValue || searchValue.length < 5) return;

    setCustomerLookupLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/booking/merchants/${slug}/customer-lookup?${searchType}=${encodeURIComponent(searchValue)}`
      );
      if (response.ok) {
        const text = await response.text();
        // 如果响应为空或不是有效JSON，静默处理
        if (!text || text.trim() === '' || text === 'null') {
          setCustomerFound(false);
          setExistingCustomerId(null);
          return;
        }
        const data = JSON.parse(text);
        if (data && data.id) {
          setCustomerInfo({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: data.email || '',
          });
          setCustomerFound(true);
          setExistingCustomerId(data.id);
        } else {
          setCustomerFound(false);
          setExistingCustomerId(null);
        }
      }
    } catch {
      // 静默处理 - 客户未找到是正常情况
      setCustomerFound(false);
      setExistingCustomerId(null);
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  // 格式化倒计时显示
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化价格显示（使用商户货币单位）
  const formatPrice = (amount: number) => {
    return formatCurrency(amount, merchantInfo?.timezone);
  };

  // 切换服务选择
  const toggleService = (service: ServiceItem) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // 处理步骤导航
  const handleNext = () => {
    if (activeStep === 3) {
      handleSubmitBooking();
    } else {
      const nextStep = activeStep + 1;
      // 当进入结账页面时，开始倒计时
      if (nextStep === 3 && !checkoutStartTime) {
        setCheckoutStartTime(Date.now());
        setCountdownSeconds(600); // 10分钟
      }
      setActiveStep(nextStep);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // 提交预约
  const handleSubmitBooking = async () => {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) return;

    setSubmitting(true);

    const bookingRequest = {
      merchantCode: slug,
      serviceIds: selectedServices.map(s => s.id),
      resourceId: selectedStaff?.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTime,
      customerName: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
      customerPhone: customerInfo.phone,  // 纯电话号码（不含国家代码）
      customerCountryCode: countryCode,   // 国家码（如 "+1-CA"）
      customerEmail: customerInfo.email,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/booking/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest),
      });

      if (response.ok) {
        const result = await response.json();
        setBookingResult(result);
        setActiveStep(4);
      } else {
        // 尝试解析错误响应，如果失败则使用默认错误消息
        let errorMessage = t('publicBooking.bookingFailed');
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch {
          // 静默处理解析错误
        }
        setError(errorMessage);
      }
    } catch {
      setError(t('publicBooking.networkErrorRetry'));
    } finally {
      setSubmitting(false);
    }
  };

  // 检查是否可以进入下一步
  const canProceed = useCallback(() => {
    switch (activeStep) {
      case 0:
        return selectedServices.length > 0;
      case 1:
        return true;
      case 2:
        return selectedDate !== null && selectedTime !== null;
      case 3:
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = customerInfo.email.trim() !== '' && emailRegex.test(customerInfo.email);
        return customerInfo.firstName.trim() !== '' && customerInfo.lastName.trim() !== '' && customerInfo.phone.trim() !== '' && isEmailValid;
      default:
        return true;
    }
  }, [activeStep, selectedServices, selectedDate, selectedTime, customerInfo]);


  // 日期限制
  // minDate: 根据最少提前小时数计算，取该时间点所在日期的开始
  // 例如：现在14:03，提前1小时 = 15:03，所以今天仍然可选
  // 如果现在23:30，提前1小时 = 00:30(明天)，所以今天不可选
  const minDateTime = addHours(new Date(), merchantInfo?.minAdvanceHours || 0);
  const minDate = startOfDay(minDateTime);
  // 使用商户设置的提前预订天数，确保正确处理 0 和 undefined
  const maxAdvanceDays = merchantInfo?.maxAdvanceDays ?? 30;
  const maxDate = addDays(new Date(), maxAdvanceDays);

  const isDateDisabled = (date: Date) => {
    const dateStart = startOfDay(date);
    // 1. 检查日期范围（基于商户设置的提前预订天数）
    if (isBefore(dateStart, minDate) || isAfter(dateStart, maxDate)) {
      return true;
    }

    // 2. 检查该日期是否有可用时间段（仅当有该日期的数据时才检查）
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySlots = weekAvailability[dateStr];

    // 只有当明确加载了该日期的数据且没有可用时段时才禁用
    // 如果还没有加载该日期的数据（undefined），不禁用（让用户可以点击选择）
    if (daySlots !== undefined && daySlots.length === 0) {
      return true;
    }

    // 3. 如果选择了特定员工，检查是否有该员工可用的时间段
    if (selectedStaff && daySlots && daySlots.length > 0) {
      const hasStaffAvailable = daySlots.some(slot => {
        if (!slot.availableResources) return true;
        return slot.availableResources.some(r => r.resourceId === selectedStaff.id);
      });
      if (!hasStaffAvailable) {
        return true;
      }
    }

    return false;
  };

  // 生成周视图日期
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  // 按时段分组时间
  const groupTimeSlots = () => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    // 确保 timeSlots 是数组
    if (!Array.isArray(timeSlots)) {
      return { morning, afternoon, evening };
    }

    timeSlots.forEach((slot) => {
      // startTime 可能是 "09:00" 或 "09:00:00" 格式
      const timeStr = String(slot.startTime);
      const hour = parseInt(timeStr.split(':')[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  // 格式化时间显示 (去掉秒数)
  const formatTimeDisplay = (time: string) => {
    const parts = String(time).split(':');
    if (parts.length >= 2) {
      const hour = parseInt(parts[0], 10);
      const minute = parts[1];
      // 12小时制显示
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${period}`;
    }
    return time;
  };

  // 检查时间槽是否可用
  const isSlotAvailable = (slot: TimeSlot) => {
    // 如果没有 availableResources，默认该时间槽可用（后端可能不返回此字段）
    if (!slot.availableResources) {
      return true;
    }
    // 如果没有选择特定员工，只要有可用资源就是可用的
    if (!selectedStaff) {
      return slot.availableResources.length > 0;
    }
    // 如果选择了特定员工，检查该员工是否在可用资源中
    return slot.availableResources.some(r => r.resourceId === selectedStaff.id);
  };

  // 星期几的简写
  const getDayAbbr = (date: Date) => {
    const dayIndex = getDay(date);
    const days = [
      t('publicBooking.daySun'),
      t('publicBooking.dayMon'),
      t('publicBooking.dayTue'),
      t('publicBooking.dayWed'),
      t('publicBooking.dayThu'),
      t('publicBooking.dayFri'),
      t('publicBooking.daySat'),
    ];
    return days[dayIndex];
  };

  // 加载状态
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#fff',
        }}
      >
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  // 错误状态
  if (error && !merchantInfo) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#fff',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // ==================== 取消预约界面 ====================
  if (cancelMode) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        {/* 顶部导航栏 */}
        <Box
          sx={{
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5 }}>
            {merchantInfo?.logoUrl && (
              <Box
                component="img"
                src={merchantInfo.logoUrl.startsWith('http') ? merchantInfo.logoUrl : `${API_BASE_URL}${merchantInfo.logoUrl}`}
                alt={merchantInfo?.merchantName}
                sx={{
                  width: isMobile ? 28 : 36,
                  height: isMobile ? 28 : 36,
                  borderRadius: 1,
                  objectFit: 'contain',
                }}
              />
            )}
            <Typography sx={{ fontSize: isMobile ? 14 : 16, fontWeight: 500, color: '#1a1a1a' }}>
              {merchantInfo?.merchantName || t('publicBooking.cancelAppointment')}
            </Typography>
          </Box>
          {/* 语言切换器 */}
          <LanguageSwitcher size="small" />
        </Box>

        {/* 取消内容 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', p: isMobile ? 2 : 3, pt: isMobile ? 4 : 6 }}>
          <Box sx={{ maxWidth: 500, width: '100%' }}>
            {/* 加载状态 */}
            {cancelLoading && !cancelBookingInfo && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#000' }} />
              </Box>
            )}

            {/* 错误状态 */}
            {cancelError && !cancelSuccess && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {cancelError}
              </Alert>
            )}

            {/* 取消成功 */}
            {cancelSuccess && (
              <Box
                sx={{
                  bgcolor: '#fff',
                  borderRadius: isMobile ? 2 : 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                {/* 成功状态头部 */}
                <Box
                  sx={{
                    p: isMobile ? 3 : 4,
                    textAlign: 'center',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <CheckIcon sx={{ fontSize: isMobile ? 40 : 48, color: '#22c55e', mb: isMobile ? 1.5 : 2 }} />
                  <Typography sx={{ fontSize: isMobile ? 18 : 22, fontWeight: 600, color: '#1a1a1a', mb: 1, letterSpacing: '-0.3px' }}>
                    {t('publicBooking.cancelSuccess')}
                  </Typography>
                  <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#666', lineHeight: 1.6 }}>
                    {t('publicBooking.cancelSuccessMessage')}
                  </Typography>
                </Box>

                {/* 已取消的预约详情 */}
                {cancelBookingInfo && (
                  <Box sx={{ p: isMobile ? 2.5 : 3 }}>
                    <Typography sx={{ fontSize: isMobile ? 10 : 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', mb: isMobile ? 1.5 : 2 }}>
                      {t('publicBooking.cancelledAppointmentDetails')}
                    </Typography>

                    {/* 服务 */}
                    {cancelBookingInfo.services?.map((service: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#666' }}>
                          {service.serviceName}
                        </Typography>
                        <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#999', textDecoration: 'line-through' }}>
                          {formatCurrency(service.price)}
                        </Typography>
                      </Box>
                    ))}

                    <Divider sx={{ my: isMobile ? 1.5 : 2, borderColor: '#f0f0f0' }} />

                    {/* 日期时间 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5, mb: isMobile ? 1 : 1.5 }}>
                      <CalendarIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#999' }} />
                      <Typography sx={{ fontSize: isMobile ? 12 : 13, color: '#666' }}>
                        {cancelBookingInfo.date && format(new Date(cancelBookingInfo.date + 'T00:00:00'), isZh ? 'yyyy年M月d日' : 'MMMM d, yyyy', { locale })}
                        {' · '}
                        {cancelBookingInfo.startTime} - {cancelBookingInfo.endTime}
                      </Typography>
                    </Box>

                    {/* 员工 */}
                    {cancelBookingInfo.resourceName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5 }}>
                        <PeopleIcon sx={{ fontSize: isMobile ? 14 : 16, color: '#999' }} />
                        <Typography sx={{ fontSize: isMobile ? 12 : 13, color: '#666' }}>
                          {cancelBookingInfo.resourceName}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 操作按钮 */}
                <Box sx={{ p: isMobile ? 2.5 : 3, pt: 0 }}>
                  <Button
                    fullWidth
                    onClick={() => {
                      // 返回预约首页
                      window.location.href = window.location.pathname.split('?')[0];
                    }}
                    sx={{
                      py: isMobile ? 1.2 : 1.5,
                      borderRadius: 2,
                      bgcolor: '#1a1a1a',
                      color: '#fff',
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 500,
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#333' },
                    }}
                  >
                    {t('publicBooking.bookNewAppointment')}
                  </Button>
                </Box>
              </Box>
            )}

            {/* 预约信息和取消确认 */}
            {cancelBookingInfo && !cancelSuccess && (
              <Box
                sx={{
                  bgcolor: '#fff',
                  borderRadius: isMobile ? 2 : 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                {/* 标题 */}
                <Box sx={{ p: isMobile ? 2.5 : 3, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography sx={{ fontSize: isMobile ? 17 : 20, fontWeight: 600, color: '#1a1a1a' }}>
                    {t('publicBooking.cancelAppointment')}
                  </Typography>
                  <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#666', mt: 0.5 }}>
                    {t('publicBooking.cancelConfirmMessage')}
                  </Typography>
                </Box>

                {/* 预约详情 */}
                <Box sx={{ p: isMobile ? 2.5 : 3 }}>
                  <Typography sx={{ fontSize: isMobile ? 11 : 12, color: '#999', textTransform: 'uppercase', mb: 1 }}>
                    {t('publicBooking.appointmentDetails')}
                  </Typography>

                  {/* 服务 */}
                  {cancelBookingInfo.services?.map((service: any, index: number) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: isMobile ? 14 : 15, color: '#1a1a1a' }}>
                        {service.serviceName}
                      </Typography>
                      <Typography sx={{ fontSize: isMobile ? 14 : 15, color: '#666' }}>
                        {formatCurrency(service.price)}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: isMobile ? 1.5 : 2 }} />

                  {/* 日期时间 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                    <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#1a1a1a' }}>
                      {cancelBookingInfo.date && format(new Date(cancelBookingInfo.date + 'T00:00:00'), isZh ? 'yyyy年M月d日' : 'MMMM d, yyyy', { locale })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#666', ml: isMobile ? 3 : 3.5 }}>
                      {cancelBookingInfo.startTime} - {cancelBookingInfo.endTime}
                    </Typography>
                  </Box>

                  {/* 员工 */}
                  {cancelBookingInfo.resourceName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: isMobile ? 1.5 : 2 }}>
                      <PeopleIcon sx={{ fontSize: isMobile ? 16 : 18, color: '#666' }} />
                      <Typography sx={{ fontSize: isMobile ? 13 : 14, color: '#1a1a1a' }}>
                        {cancelBookingInfo.resourceName}
                      </Typography>
                    </Box>
                  )}

                  {/* 状态 */}
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={
                        cancelBookingInfo.status === 'CONFIRMED'
                          ? t('publicBooking.confirmed')
                          : cancelBookingInfo.status === 'CANCELLED'
                          ? t('publicBooking.cancelledStatus')
                          : cancelBookingInfo.status === 'COMPLETED'
                          ? t('publicBooking.completedStatus')
                          : cancelBookingInfo.status === 'NO_SHOW'
                          ? t('publicBooking.noShowStatus')
                          : cancelBookingInfo.status
                      }
                      size="small"
                      sx={{
                        bgcolor:
                          cancelBookingInfo.status === 'CONFIRMED'
                            ? '#e8f5e9'
                            : cancelBookingInfo.status === 'CANCELLED'
                            ? '#ffebee'
                            : cancelBookingInfo.status === 'COMPLETED'
                            ? '#e3f2fd'
                            : '#fff3e0',
                        color:
                          cancelBookingInfo.status === 'CONFIRMED'
                            ? '#2e7d32'
                            : cancelBookingInfo.status === 'CANCELLED'
                            ? '#c62828'
                            : cancelBookingInfo.status === 'COMPLETED'
                            ? '#1565c0'
                            : '#e65100',
                      }}
                    />
                  </Box>

                  {/* 取消原因 */}
                  {canCancelBooking && (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder={t('publicBooking.cancelReasonPlaceholder')}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: 14,
                        },
                      }}
                    />
                  )}
                </Box>

                {/* 操作按钮 */}
                <Box sx={{ p: 3, pt: 1, display: 'flex', gap: 2 }}>
                  {canCancelBooking ? (
                    <>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => window.history.back()}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          borderColor: '#ddd',
                          color: '#666',
                          textTransform: 'none',
                          '&:hover': { borderColor: '#999', bgcolor: '#fafafa' },
                        }}
                      >
                        {t('publicBooking.goBack')}
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleCancelBooking}
                        disabled={cancelLoading}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          bgcolor: '#d32f2f',
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#b71c1c' },
                          '&:disabled': { bgcolor: '#e57373' },
                        }}
                      >
                        {cancelLoading ? (
                          <CircularProgress size={20} sx={{ color: '#fff' }} />
                        ) : (
                          t('publicBooking.confirmCancel')
                        )}
                      </Button>
                    </>
                  ) : (
                    <Alert severity="warning" sx={{ width: '100%' }}>
                      {cancelBookingInfo.status === 'CANCELLED'
                        ? t('publicBooking.alreadyCancelledMessage')
                        : cancelBookingInfo.status === 'COMPLETED'
                        ? t('publicBooking.completedCannotCancelMessage')
                        : cancelBookingInfo.status === 'NO_SHOW'
                        ? t('publicBooking.noShowCannotCancelMessage')
                        : t('publicBooking.cannotCancelMessage')}
                    </Alert>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // ==================== PC端 Appointment Summary 侧边栏 ====================
  const renderAppointmentSummary = () => (
    <Box
      sx={{
        width: 320,
        flexShrink: 0,
        position: 'sticky',
        top: 24,
        alignSelf: 'flex-start',
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
        {t('publicBooking.appointmentSummary')}
      </Typography>

      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e5e5e5' }}>
        {selectedServices.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 14, color: '#666' }}>
              {t('publicBooking.selectServiceToContinue')}
            </Typography>
          </Box>
        ) : (
          <>
            {/* 服务列表 */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: selectedServices.length > 1 ? '1px solid #e5e5e5' : 'none',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                  {selectedServices[0].name}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                  {formatPrice(selectedServices[0].price)} · {formatDuration(selectedServices[0].duration, t)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleService(selectedServices[0]);
                }}
                sx={{
                  color: '#999',
                  p: 0.5,
                  '&:hover': { color: '#666', bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* 其他服务 */}
            {selectedServices.slice(1).map((service) => (
              <Box
                key={service.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                    {service.name}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#666' }}>
                    {formatPrice(service.price)} · {formatDuration(service.duration, t)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => toggleService(service)}
                  sx={{
                    color: '#999',
                    p: 0.5,
                    '&:hover': { color: '#666', bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}

            {/* 日期时间信息 */}
            {selectedDate && selectedTime && (
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e5e5e5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                      {format(selectedDate, isZh ? 'M月d日 EEEE' : 'MMMM d', { locale })}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#666' }}>
                      {formatTimeDisplay(selectedTime)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* 员工信息 */}
            {selectedStaff && (
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {merchantInfo?.showTechnicianPhotos !== false && (
                  <Avatar
                    src={getAvatarUrl(selectedStaff.avatar)}
                    sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#e0e0e0' }}
                  >
                    {getInitials(selectedStaff.name)}
                  </Avatar>
                )}
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                  {t('publicBooking.withStaff')} {selectedStaff.name}
                </Typography>
              </Box>
            )}

            {/* 汇总信息 - 总时间和总金额 */}
            <Box sx={{ px: 2, py: 2, borderTop: '1px solid #e5e5e5', bgcolor: '#fafafa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                  {t('publicBooking.estDuration')}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                  {formatDuration(totalDuration, t)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                  {t('publicBooking.estTotal')}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                  {formatPrice(totalPrice)}
                </Typography>
              </Box>
            </Box>

            {/* Next 按钮 */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || submitting}
                fullWidth
                sx={{
                  bgcolor: canProceed() ? '#1a1a1a' : '#e5e5e5',
                  color: '#fff',
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: 15,
                  fontWeight: 500,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: canProceed() ? '#333' : '#e5e5e5',
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#e5e5e5',
                    color: '#999',
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} sx={{ color: '#fff' }} />
                ) : activeStep === 3 ? (
                  t('publicBooking.bookAppointment')
                ) : (
                  t('publicBooking.next')
                )}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );

  // ==================== 移动端底部栏 ====================
  const renderMobileBottomBar = () => {
    if (selectedServices.length === 0) return null;

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fff',
          borderTop: '1px solid #e5e5e5',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          zIndex: 100,
        }}
      >
        {/* 展开的服务详情 */}
        <Collapse in={mobileCartExpanded}>
          <Box sx={{ maxHeight: 200, overflow: 'auto', borderBottom: '1px solid #e5e5e5' }}>
            {selectedServices.map((service) => (
              <Box
                key={service.id}
                sx={{
                  px: 3,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ fontSize: 14, color: '#000' }}>
                  {service.name}
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#000' }}>
                  {formatPrice(service.price)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Collapse>

        {/* 主栏 */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            onClick={() => setMobileCartExpanded(!mobileCartExpanded)}
            sx={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {selectedStaff && merchantInfo?.showTechnicianPhotos !== false && (
              <Avatar
                src={getAvatarUrl(selectedStaff.avatar)}
                sx={{ width: 36, height: 36, mr: 1.5, fontSize: 12, bgcolor: '#e0e0e0' }}
              >
                {getInitials(selectedStaff.name)}
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>
                {selectedServices.length > 1
                  ? `${selectedServices[0].name} +${selectedServices.length - 1}`
                  : selectedServices[0].name}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#666' }}>
                {formatPrice(totalPrice)} · {formatDuration(totalDuration, t)}
              </Typography>
            </Box>
            <IconButton size="small">
              {mobileCartExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            sx={{
              bgcolor: canProceed() ? '#1a1a1a' : '#e5e5e5',
              color: '#fff',
              borderRadius: 2,
              px: 3,
              py: 1.25,
              fontSize: 15,
              fontWeight: 500,
              textTransform: 'none',
              ml: 2,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: canProceed() ? '#333' : '#e5e5e5',
                boxShadow: 'none',
              },
              '&:disabled': {
                bgcolor: '#e5e5e5',
                color: '#999',
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : activeStep === 3 ? (
              t('publicBooking.book')
            ) : (
              t('publicBooking.next')
            )}
          </Button>
        </Box>
      </Box>
    );
  };

  // ==================== 服务选择页面 ====================
  const renderServiceSelection = () => (
    <Box>
      {/* 标题 */}
      <Typography sx={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', mb: 3 }}>
        {selectedServices.length > 0
          ? t('publicBooking.addMoreServices')
          : t('publicBooking.selectService')}
      </Typography>

      {/* 服务列表 */}
      {services.map((service, index) => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        return (
          <Box
            key={service.id}
            onClick={() => toggleService(service)}
            sx={{
              py: 2.5,
              px: 2,
              mx: -2,
              cursor: 'pointer',
              borderBottom: index < services.length - 1 ? '1px solid #e5e5e5' : 'none',
              borderRadius: 2,
              transition: 'background-color 0.2s',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', mb: 0.5 }}>
              {service.name}
            </Typography>
            {service.description && (
              <Typography sx={{ fontSize: 14, color: '#666', mb: 0.5 }}>
                {service.description}
              </Typography>
            )}
            <Typography sx={{ fontSize: 14, color: '#666', mb: isSelected ? 1 : 0 }}>
              {formatPrice(service.price)} · {formatDuration(service.duration, t)}
            </Typography>
            {isSelected && (
              <Box sx={{ display: 'flex', alignItems: 'center', color: '#1a1a1a' }}>
                <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                  {t('publicBooking.added')}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );

  // ==================== 员工选择页面 ====================
  const renderStaffSelection = () => (
    <Box>
      {/* 返回按钮 - 仅移动端 */}
      {isMobile && (
        <IconButton onClick={handleBack} sx={{ color: '#000', ml: -1, mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
      )}

      {/* 标题 */}
      <Typography sx={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', mb: 3 }}>
        {t('publicBooking.selectStaff')}
      </Typography>

      {/* 员工列表 */}
      <Box>
        {/* 任意员工选项 */}
        <Box
          onClick={() => setSelectedStaff(null)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 2,
            px: 2,
            mx: -2,
            cursor: 'pointer',
            borderBottom: '1px solid #e5e5e5',
            borderRadius: 2,
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#f5f5f5',
              color: '#666',
              mr: 2,
            }}
          >
            <PeopleIcon />
          </Avatar>
          <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', flex: 1 }}>
            {t('publicBooking.anyStaff')}
          </Typography>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: selectedStaff === null ? '2px solid #1a1a1a' : '2px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedStaff === null && (
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1a1a1a' }} />
            )}
          </Box>
        </Box>

        {/* 具体员工 - 根据选中的服务过滤 */}
        {filteredStaff.map((member, index) => (
          <Box
            key={member.id}
            onClick={() => setSelectedStaff(member)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 2,
              px: 2,
              mx: -2,
              cursor: 'pointer',
              borderBottom: index < filteredStaff.length - 1 ? '1px solid #e5e5e5' : 'none',
              borderRadius: 2,
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <Avatar
              src={merchantInfo?.showTechnicianPhotos !== false ? getAvatarUrl(member.avatar) : undefined}
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                fontSize: 16,
                fontWeight: 600,
                bgcolor: '#e0e0e0',
                '& img': {
                  transition: 'opacity 0.3s ease-in-out',
                },
              }}
              imgProps={{
                loading: 'eager',
              }}
            >
              {getInitials(member.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a' }}>
                {member.name}
              </Typography>
              {member.position && (
                <Typography sx={{ fontSize: 13, color: '#666' }}>
                  {member.position}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: selectedStaff?.id === member.id ? '2px solid #1a1a1a' : '2px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedStaff?.id === member.id && (
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1a1a1a' }} />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  // ==================== 日期时间选择页面 ====================
  const renderDateTimeSelection = () => {
    const weekDays = getWeekDays();
    const { morning, afternoon, evening } = groupTimeSlots();

    return (
      <Box>
        {/* 返回按钮 - 仅移动端 */}
        {isMobile && (
          <IconButton onClick={handleBack} sx={{ color: '#1a1a1a', ml: -1, mb: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* 月份标题和导航 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a' }}>
            {format(weekStart, isZh ? 'yyyy年M月' : 'MMM yyyy', { locale })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {weekLoading && <CircularProgress size={20} sx={{ color: '#666', mr: 1 }} />}
            <IconButton
              onClick={() => handleWeekChange('prev')}
              disabled={weekLoading}
              sx={{ border: '1px solid #e5e5e5', borderRadius: 2, color: '#666' }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => handleWeekChange('next')}
              disabled={weekLoading}
              sx={{ border: '1px solid #e5e5e5', borderRadius: 2, color: '#666' }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        {/* 周日期选择 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          {weekDays.map((day) => {
            const isDisabled = isDateDisabled(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <Box
                key={day.toISOString()}
                onClick={() => !isDisabled && setSelectedDate(day)}
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  py: 1.5,
                  mx: 0.5,
                  borderRadius: 2,
                  cursor: isDisabled ? 'default' : 'pointer',
                  bgcolor: isSelected ? '#1a1a1a' : 'transparent',
                  border: isSelected ? 'none' : '1px solid transparent',
                  opacity: isDisabled ? 0.3 : 1,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: isDisabled ? 'transparent' : isSelected ? '#1a1a1a' : '#f5f5f5',
                  },
                }}
              >
                <Typography sx={{ fontSize: 12, color: isSelected ? '#fff' : '#666', mb: 0.5 }}>
                  {getDayAbbr(day)}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 500, color: isSelected ? '#fff' : '#1a1a1a' }}>
                  {format(day, 'd')}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* 展开更多周的按钮 */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <IconButton sx={{ border: '1px solid #e5e5e5', borderRadius: '50%', color: '#666' }}>
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 时区提示 */}
        <Typography sx={{ fontSize: 13, color: '#666', textAlign: 'center', mb: 3 }}>
          {t('publicBooking.timesShownIn')}<strong style={{ color: '#1a1a1a' }}>{merchantInfo?.timezone || 'PST'}</strong>.
        </Typography>

        {/* 选中日期的完整显示 */}
        {selectedDate && (
          <>
            <Typography sx={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', mb: 3 }}>
              {format(selectedDate, isZh ? 'yyyy年M月d日 EEEE' : 'EEEE, MMMM d, yyyy', { locale })}
            </Typography>

            {/* 时间段 */}
            {!Array.isArray(timeSlots) || timeSlots.length === 0 ? (
              <Typography sx={{ color: '#666', py: 2 }}>
                {t('publicBooking.noAvailabilityDate')}
              </Typography>
            ) : (
              <>
                {/* 上午 */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#666', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('publicBooking.morning')}
                  </Typography>
                  {morning.length === 0 ? (
                    <Typography sx={{ fontSize: 14, color: '#999' }}>{t('publicBooking.noAvailability')}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {morning.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const timeStr = String(slot.startTime);
                        return (
                          <Button
                            key={timeStr}
                            onClick={() => available && setSelectedTime(timeStr)}
                            disabled={!available}
                            sx={{
                              minWidth: 100,
                              py: 1.25,
                              borderRadius: 2,
                              border: selectedTime === timeStr ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
                              bgcolor: selectedTime === timeStr ? '#f5f5f5' : '#fff',
                              color: '#1a1a1a',
                              fontSize: 14,
                              fontWeight: 500,
                              textTransform: 'none',
                              '&:hover': { bgcolor: '#f5f5f5', borderColor: '#ccc' },
                              '&:disabled': { bgcolor: '#fafafa', color: '#ccc', borderColor: '#eee' },
                            }}
                          >
                            {formatTimeDisplay(timeStr)}
                          </Button>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* 下午 */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#666', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('publicBooking.afternoon')}
                  </Typography>
                  {afternoon.length === 0 ? (
                    <Typography sx={{ fontSize: 14, color: '#999' }}>{t('publicBooking.noAvailability')}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {afternoon.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const timeStr = String(slot.startTime);
                        return (
                          <Button
                            key={timeStr}
                            onClick={() => available && setSelectedTime(timeStr)}
                            disabled={!available}
                            sx={{
                              minWidth: 100,
                              py: 1.25,
                              borderRadius: 2,
                              border: selectedTime === timeStr ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
                              bgcolor: selectedTime === timeStr ? '#f5f5f5' : '#fff',
                              color: '#1a1a1a',
                              fontSize: 14,
                              fontWeight: 500,
                              textTransform: 'none',
                              '&:hover': { bgcolor: '#f5f5f5', borderColor: '#ccc' },
                              '&:disabled': { bgcolor: '#fafafa', color: '#ccc', borderColor: '#eee' },
                            }}
                          >
                            {formatTimeDisplay(timeStr)}
                          </Button>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* 晚上 */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#666', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('publicBooking.evening')}
                  </Typography>
                  {evening.length === 0 ? (
                    <Typography sx={{ fontSize: 14, color: '#999' }}>{t('publicBooking.noAvailability')}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {evening.map((slot) => {
                        const available = isSlotAvailable(slot);
                        const timeStr = String(slot.startTime);
                        return (
                          <Button
                            key={timeStr}
                            onClick={() => available && setSelectedTime(timeStr)}
                            disabled={!available}
                            sx={{
                              minWidth: 100,
                              py: 1.25,
                              borderRadius: 2,
                              border: selectedTime === timeStr ? '2px solid #1a1a1a' : '1px solid #e5e5e5',
                              bgcolor: selectedTime === timeStr ? '#f5f5f5' : '#fff',
                              color: '#1a1a1a',
                              fontSize: 14,
                              fontWeight: 500,
                              textTransform: 'none',
                              '&:hover': { bgcolor: '#f5f5f5', borderColor: '#ccc' },
                              '&:disabled': { bgcolor: '#fafafa', color: '#ccc', borderColor: '#eee' },
                            }}
                          >
                            {formatTimeDisplay(timeStr)}
                          </Button>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </Box>
    );
  };

  // ==================== 结账页面 ====================
  const renderCheckout = () => (
    <Box>
      {/* 返回按钮 - 仅移动端 */}
      {isMobile && (
        <IconButton onClick={handleBack} sx={{ color: '#1a1a1a', ml: -1, mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
      )}

      {/* 标题和倒计时 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
          {t('publicBooking.checkout')}
        </Typography>
        {/* 极简倒计时显示 */}
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Typography sx={{
            fontSize: 28,
            fontWeight: 300,
            color: countdownSeconds < 120 ? '#DC2626' : '#1a1a1a',
            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
            letterSpacing: '-0.5px',
          }}>
            {formatCountdown(countdownSeconds)}
          </Typography>
          <Typography sx={{
            fontSize: 13,
            color: '#999',
            letterSpacing: '0.3px',
          }}>
            {t('publicBooking.held')}
          </Typography>
        </Box>
      </Box>

      {/* 移动端预约摘要 */}
      {isMobile && (
        <Box sx={{ mb: 4, p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e5e5e5' }}>
              <CalendarIcon sx={{ color: '#666' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>
                {selectedDate && format(selectedDate, isZh ? 'M月d日 EEEE' : 'MMMM d', { locale })}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#666' }}>
                {formatTimeDisplay(selectedTime || '')} · {t('publicBooking.estTotal')}: {formatPrice(totalPrice)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Contact info */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a' }}>
            {t('publicBooking.contactInfo')}
          </Typography>
          {customerFound && (
            <Chip
              label={t('publicBooking.customerRecognized')}
              size="small"
              sx={{
                bgcolor: '#ECFDF5',
                color: '#059669',
                fontSize: 12,
                fontWeight: 500,
                '& .MuiChip-icon': { color: '#059669' },
              }}
              icon={<CheckIcon sx={{ fontSize: 16 }} />}
            />
          )}
        </Box>

        {/* 电话 - 支持客户查询，带国家代码选择 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ width: 120, flexShrink: 0 }}>
              <CountryCodeSelector
                value={countryCode}
                onChange={setCountryCode}
                label=""
                size="medium"
                fullWidth
              />
            </Box>
            <TextField
              fullWidth
              placeholder={t('publicBooking.phoneNumber')}
              value={customerInfo.phone}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, phone: e.target.value });
                setCustomerFound(false);
              }}
              onBlur={(e) => {
                if (e.target.value && e.target.value.length >= 8 && !customerFound) {
                  lookupCustomer(e.target.value, 'phone');
                }
              }}
              InputProps={{
                endAdornment: customerLookupLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : customerInfo.phone.length >= 8 ? (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: customerFound ? '#059669' : '#e5e5e5' },
                  '&:hover fieldset': { borderColor: customerFound ? '#059669' : '#ccc' },
                  '&.Mui-focused fieldset': { borderColor: customerFound ? '#059669' : '#1a1a1a', borderWidth: 1 },
                },
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 12, color: '#999', mt: 1 }}>
            {t('publicBooking.phoneAutoLookup')}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#999', mt: 1, lineHeight: 1.4 }}>
            {t('publicBooking.smsConsent')}
          </Typography>
        </Box>

        {/* 姓名 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder={t('publicBooking.firstName')}
            value={customerInfo.firstName}
            onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
            disabled={customerFound}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: customerFound ? '#fafafa' : 'transparent',
                '& fieldset': { borderColor: '#e5e5e5' },
                '&:hover fieldset': { borderColor: '#ccc' },
                '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: 1 },
              },
            }}
          />
          <TextField
            fullWidth
            placeholder={t('publicBooking.lastName')}
            value={customerInfo.lastName}
            onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
            disabled={customerFound}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: customerFound ? '#fafafa' : 'transparent',
                '& fieldset': { borderColor: '#e5e5e5' },
                '&:hover fieldset': { borderColor: '#ccc' },
                '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: 1 },
              },
            }}
          />
        </Box>

        {/* 邮箱 - 也支持客户查询 */}
        <TextField
          fullWidth
          placeholder={t('publicBooking.emailLookup')}
          type="email"
          value={customerInfo.email}
          onChange={(e) => {
            setCustomerInfo({ ...customerInfo, email: e.target.value });
            if (!customerInfo.phone) setCustomerFound(false);
          }}
          onBlur={(e) => {
            if (e.target.value && e.target.value.includes('@') && !customerFound && !customerInfo.phone) {
              lookupCustomer(e.target.value, 'email');
            }
          }}
          disabled={customerFound}
          InputProps={{
            endAdornment: !customerFound && customerInfo.email.includes('@') ? (
              <InputAdornment position="end">
                <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: customerFound ? '#fafafa' : 'transparent',
              '& fieldset': { borderColor: '#e5e5e5' },
              '&:hover fieldset': { borderColor: '#ccc' },
              '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: 1 },
            },
          }}
        />

        {/* 非该客户按钮 */}
        {customerFound && (
          <Box sx={{ mt: 2 }}>
            <Button
              size="small"
              onClick={() => {
                setCustomerFound(false);
                setExistingCustomerId(null);
                setCustomerInfo({ firstName: '', lastName: '', phone: customerInfo.phone, email: '' });
              }}
              sx={{
                fontSize: 13,
                color: '#666',
                textTransform: 'none',
                '&:hover': { bgcolor: '#f5f5f5' },
              }}
            >
              {t('publicBooking.notYou')}
            </Button>
          </Box>
        )}
      </Box>

      {/* 地点选择 */}
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
          {t('publicBooking.appointmentLocation')}
        </Typography>

        <Box
          sx={{
            p: 2,
            border: '1px solid #e5e5e5',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#ccc' },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>
              {merchantInfo?.merchantName}
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#666' }}>
              {merchantInfo?.address}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />
          </Box>
        </Box>
      </Box>

      {/* 取消/改期政策提示 */}
      {(merchantInfo?.allowCustomerCancel || merchantInfo?.allowCustomerReschedule) && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid #f0f0f0' }}>
          <Typography sx={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
            {merchantInfo?.allowCustomerCancel && merchantInfo?.cancelDeadlineHours && (
              <>
                {t('publicBooking.cancelPolicyNotice', { hours: merchantInfo.cancelDeadlineHours })}
              </>
            )}
            {merchantInfo?.allowCustomerCancel && merchantInfo?.allowCustomerReschedule && ' · '}
            {merchantInfo?.allowCustomerReschedule && merchantInfo?.rescheduleDeadlineHours && (
              <>
                {t('publicBooking.reschedulePolicyNotice', { hours: merchantInfo.rescheduleDeadlineHours })}
              </>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // ==================== 确认页面 ====================
  const renderConfirmation = () => {
    const isPendingConfirmation = bookingResult?.status === 'PENDING_CONFIRMATION';

    return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      {isPendingConfirmation ? (
        <HourglassEmptyIcon sx={{ fontSize: 64, color: '#F59E0B', mb: 3 }} />
      ) : (
        <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 3 }} />
      )}

      <Typography sx={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
        {isPendingConfirmation
          ? t('publicBooking.bookingPendingConfirmation')
          : t('publicBooking.bookingConfirmed')}
      </Typography>

      {isPendingConfirmation && (
        <Typography sx={{ fontSize: 14, color: '#666', mb: 4, maxWidth: 400, mx: 'auto' }}>
          {t('publicBooking.pendingConfirmationNote')}
        </Typography>
      )}

      {/* 预约详情 */}
      <Box
        sx={{
          textAlign: 'left',
          p: 3,
          bgcolor: '#fafafa',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 2,
          maxWidth: 400,
          mx: 'auto',
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
          {t('publicBooking.bookingDetails')}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
            {t('publicBooking.service')}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
            {bookingResult?.serviceName}
          </Typography>
        </Box>

        {bookingResult?.staffName && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
              {t('publicBooking.staff')}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
              {bookingResult.staffName}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
            {t('publicBooking.dateTime')}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
            {bookingResult?.date} {bookingResult?.startTime} - {bookingResult?.endTime}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
            {t('publicBooking.location')}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
            {bookingResult?.merchantAddress}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>
            {t('publicBooking.phone')}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
            {bookingResult?.merchantPhone}
          </Typography>
        </Box>
      </Box>

      {/* 倒计时提示 */}
      <Typography sx={{ fontSize: 13, color: '#999', mt: 4 }}>
        {t('publicBooking.pageRefreshIn', { seconds: confirmationCountdown })}
      </Typography>
    </Box>
    );
  };

  // ==================== 主渲染 ====================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* 顶部导航栏 */}
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fafafa',
        }}
      >
        <Box
          onClick={() => {
            setActiveStep(0);
            setSelectedTime(null);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 0.7,
            },
          }}
        >
          {merchantInfo?.logoUrl && (
            <Box
              component="img"
              src={merchantInfo.logoUrl.startsWith('http') ? merchantInfo.logoUrl : `${API_BASE_URL}${merchantInfo.logoUrl}`}
              alt={merchantInfo?.merchantName}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                objectFit: 'contain',
              }}
            />
          )}
          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 500,
                color: '#1a1a1a',
              }}
            >
              {merchantInfo?.merchantName}
            </Typography>
            {merchantInfo?.address && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: '#666',
                  mt: 0.25,
                }}
              >
                {merchantInfo.address}
              </Typography>
            )}
          </Box>
        </Box>
        {/* 语言切换器 */}
        <LanguageSwitcher size="small" />
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mx: 3, mt: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* 主内容区域 */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: 3,
          py: 4,
          display: 'flex',
          gap: 6,
          pb: isMobile && selectedServices.length > 0 ? 16 : 4,
        }}
      >
        {/* 左侧内容区 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {activeStep === 0 && renderServiceSelection()}
          {activeStep === 1 && renderStaffSelection()}
          {activeStep === 2 && renderDateTimeSelection()}
          {activeStep === 3 && renderCheckout()}
          {activeStep === 4 && renderConfirmation()}
        </Box>

        {/* 右侧 Appointment Summary - 仅 PC 端 */}
        {!isMobile && activeStep < 4 && renderAppointmentSummary()}
      </Box>

      {/* 移动端底部栏 */}
      {isMobile && activeStep < 4 && renderMobileBottomBar()}

      {/* 底部 powered by */}
      {activeStep === 4 && (
        <Box sx={{ textAlign: 'center', py: 3, color: '#999' }}>
          <Typography sx={{ fontSize: 12 }}>
            Powered by SwiftmindSystems
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PublicBooking;
