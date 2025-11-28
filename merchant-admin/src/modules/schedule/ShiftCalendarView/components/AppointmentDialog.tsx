import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  alpha,
  Paper,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  EventAvailable as AppointmentIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as ServiceIcon,
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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { api, Customer as ApiCustomer, staffAttendanceApi } from '../../../../services/api';
import CustomTimePicker from './CustomTimePicker';
import CountryCodeSelector from '../../../../components/common/CountryCodeSelector';
import { getMerchantNow } from '../../../../utils/timezoneUtils';
import { useTheme } from '../../../../contexts/ThemeContext';

// 根据主题模式获取输入框样式
const getInputStyles = (themeColor: string) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#fff',
    '& fieldset': { borderColor: '#d0d0d0' },
    '&:hover fieldset': { borderColor: '#bbb' },
    '&.Mui-focused fieldset': { borderColor: themeColor, borderWidth: '1px' },
  },
  '& .MuiInputLabel-root': {
    color: '#999',
    '&.Mui-focused': { color: themeColor },
  },
});

interface AppointmentData {
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  customerCountryCode?: string;
  customerEmail?: string;
  serviceName: string; // 保留用于向后兼容
  date: string;
  startTime: string;
  endTime: string;
  resourceId: number;
  price: number;
  notes?: string;
  services?: Array<{ id: number; name: string; duration: number; price: number; }>; // 多服务支持
}

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  onSave: (appointment: AppointmentData) => void;
  date: Date;
  startTime: string; // 格式: "HH:mm:ss"
  endTime: string; // 格式: "HH:mm:ss"
  resourceId: number;
  resourceName?: string;
  services?: Array<{ id: number; name: string; duration: number; price: number; }>;
  resourceAvailability?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  existingAppointments?: Array<{
    id: number;
    startTime: string;
    endTime: string;
    date: string;
    status?: string;
  }>;
  // 编辑模式相关
  editMode?: boolean;
  existingAppointment?: {
    id: number;
    customerId: number;
    customerName: string;
    date: string; // 预约日期 (YYYY-MM-DD格式)
    serviceIds?: number[];
    notes?: string;
  };
  // 全屏模式支持
  container?: HTMLElement | null;
}

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  onClose,
  onExited,
  onSave,
  date,
  startTime,
  endTime,
  resourceId,
  resourceName,
  services = [],
  resourceAvailability = [],
  existingAppointments = [],
  editMode = false,
  existingAppointment,
  container,
}) => {
  const { t } = useTranslation();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const themeColor = isMonochrome ? '#1a1a1a' : '#3B82F6';
  const themeColorDark = isMonochrome ? '#333' : '#2563EB';
  const inputStyles = getInputStyles(themeColor);

  const [formData, setFormData] = useState<AppointmentData>({
    customerFirstName: '',
    customerLastName: '',
    customerPhone: '',
    customerCountryCode: '+1-CA',
    customerEmail: '',
    serviceName: '',
    date: format(date, 'yyyy-MM-dd'),
    startTime: startTime,
    endTime: endTime,
    resourceId: resourceId,
    price: 0,
    notes: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [countryCode, setCountryCode] = useState<string>('+1-CA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usePlaceholderEmail, setUsePlaceholderEmail] = useState(false);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Array<{ id: number; name: string; duration: number; price: number; }>>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [exceedsWorkingHours, setExceedsWorkingHours] = useState(false);
  const [timeConflictError, setTimeConflictError] = useState<string>('');
  const [staffAttendance, setStaffAttendance] = useState<any>(null);

  // 生成占位邮箱的函数
  const generatePlaceholderEmail = (countryCode: string, phone: string): string => {
    // 提取国家码中的数字部分 ('+1-CA' -> '1', '+86-CN' -> '86')
    const countryCodeDigits = countryCode.replace(/[^0-9]/g, '');
    // 去除手机号中的特殊字符
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `${countryCodeDigits}${cleanPhone}.placeholder@vamerchant.app`;
  };

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

  // Check if appointment exceeds staff working hours
  // Returns true if exceeds, false otherwise
  const checkWorkingHours = useCallback((endTime: string): boolean => {
    // Convert appointment times to minutes
    const [startHours, startMinutes] = (formData.startTime || '').split(':').map(Number);
    const appointmentStartMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const appointmentEndMinutes = endHours * 60 + endMinutes;

    console.log('checkWorkingHours called:', {
      appointmentTime: `${formData.startTime} - ${endTime}`,
      hasAttendance: !!staffAttendance,
      checkInTime: staffAttendance?.checkInTime,
      checkOutTime: staffAttendance?.checkOutTime
    });

    // Priority 1: Check against today's check-in/check-out time if available
    if (staffAttendance && staffAttendance.checkInTime && staffAttendance.checkOutTime) {
      const checkInTime = staffAttendance.checkInTime.slice(0, 5); // HH:mm
      const checkOutTime = staffAttendance.checkOutTime.slice(0, 5); // HH:mm

      const [checkInHours, checkInMin] = checkInTime.split(':').map(Number);
      const checkInMinutes = checkInHours * 60 + checkInMin;

      const [checkOutHours, checkOutMin] = checkOutTime.split(':').map(Number);
      const checkOutMinutes = checkOutHours * 60 + checkOutMin;

      // Appointment must be completely within check-in/check-out time
      const isWithinCheckInOut = appointmentStartMinutes >= checkInMinutes &&
                                  appointmentEndMinutes <= checkOutMinutes;

      console.log('Using check-in/out time:', {
        checkIn: checkInTime,
        checkOut: checkOutTime,
        isWithin: isWithinCheckInOut
      });

      const exceeds = !isWithinCheckInOut;
      setExceedsWorkingHours(exceeds);
      return exceeds;
    }

    console.log('Falling back to scheduled availability');

    // Priority 2: Fall back to scheduled availability
    if (!resourceAvailability || resourceAvailability.length === 0) {
      setExceedsWorkingHours(false);
      return false;
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 format

    // Get ALL availability segments for this day (支持多时间段)
    const dayAvailabilities = resourceAvailability.filter(
      (avail) => avail.dayOfWeek === backendDayOfWeek && avail.isAvailable
    );

    if (!dayAvailabilities || dayAvailabilities.length === 0) {
      setExceedsWorkingHours(false);
      return false;
    }

    // Check if appointment falls within ANY available time segment
    const isWithinAnySegment = dayAvailabilities.some((segment) => {
      const [segStartHours, segStartMinutes] = segment.startTime.split(':').map(Number);
      const segmentStartMinutes = segStartHours * 60 + segStartMinutes;

      const [segEndHours, segEndMinutes] = segment.endTime.split(':').map(Number);
      const segmentEndMinutes = segEndHours * 60 + segEndMinutes;

      // Appointment must be completely within this segment
      return appointmentStartMinutes >= segmentStartMinutes &&
             appointmentEndMinutes <= segmentEndMinutes;
    });

    // If not within any segment, then it exceeds working hours
    const exceeds = !isWithinAnySegment;
    setExceedsWorkingHours(exceeds);
    return exceeds;
  }, [formData.startTime, staffAttendance, resourceAvailability, date]);

  // Load customers when dialog opens
  useEffect(() => {
    const loadCustomers = async () => {
      if (!open) return;

      setLoadingCustomers(true);
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = user.tenantId;

        if (!tenantId) {
          console.error('No tenantId found');
          return;
        }

        const response = await api.getCustomers({
          tenantId: tenantId,
          page: 0,
          size: 1000, // Load all customers for autocomplete
          status: 'ACTIVE',
        });

        setCustomers(response.customers || []);
      } catch (error) {
        console.error('Failed to load customers:', error);
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, [open]);

  // Load staff attendance (check-in/check-out) for today
  useEffect(() => {
    const loadAttendance = async () => {
      if (!open || !resourceId) return;

      try {
        // In edit mode, use formData.date if available (the actual appointment date)
        // Otherwise use date prop (the selected date from calendar view)
        const targetDate = editMode && formData.date ? formData.date : format(date, 'yyyy-MM-dd');
        console.log('Loading staff attendance for date:', targetDate, { editMode, formDataDate: formData.date });
        const attendance = await staffAttendanceApi.getByResourceAndDate(resourceId, targetDate);
        setStaffAttendance(attendance);
        console.log('Staff attendance loaded:', attendance);
      } catch (error) {
        console.error('Failed to load staff attendance:', error);
        setStaffAttendance(null);
      }
    };

    loadAttendance();
  }, [open, resourceId, date, editMode, formData.date]);

  // Check working hours when in edit mode and attendance/form data is loaded
  useEffect(() => {
    if (open && editMode && formData.endTime && formData.startTime) {
      // In edit mode, validate the existing appointment time against check-in/out
      console.log('Edit mode validation triggered:', {
        staffAttendance: !!staffAttendance,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      checkWorkingHours(formData.endTime);
    }
  }, [open, editMode, staffAttendance, formData.startTime, formData.endTime, checkWorkingHours]);

  // 对话框打开/关闭时的统一初始化逻辑
  useEffect(() => {
    if (!open) {
      // 对话框关闭时立即清空所有状态，避免下次打开时显示旧数据
      setCountryCode('+1-CA');
      setSelectedCustomer(null);
      setSelectedServices([]);
      setUsePlaceholderEmail(false);
      setFormData({
        customerFirstName: '',
        customerLastName: '',
        customerPhone: '',
        customerCountryCode: '+1-CA',
        customerEmail: '',
        serviceName: '',
        date: '',
        startTime: '',
        endTime: '',
        resourceId: 0,
        price: 0,
        notes: '',
      });
      setErrors({});
      setTimeConflictError('');
      setExceedsWorkingHours(false);
      return;
    }

    if (!editMode) {
      // ========== 创建模式 ==========
      console.log('AppointmentDialog opened (create mode)');

      // 批量设置所有状态（React会自动批处理，只触发一次渲染）
      setCountryCode('+1-CA');
      setSelectedCustomer(null);
      setSelectedServices([]);
      setUsePlaceholderEmail(false);
      setFormData({
        customerFirstName: '',
        customerLastName: '',
        customerPhone: '',
        customerCountryCode: '+1-CA',
        customerEmail: '',
        serviceName: '',
        date: format(date, 'yyyy-MM-dd'),
        startTime: startTime,
        endTime: endTime,
        resourceId: resourceId,
        price: 0,
        notes: '',
      });
      setErrors({});
      setTimeConflictError('');
      setExceedsWorkingHours(false);
    } else if (editMode && existingAppointment && customers.length > 0) {
      // ========== 编辑模式（仅当customers已加载）==========
      console.log('AppointmentDialog opened (edit mode) with customers loaded');

      // 查找客户
      const customer = customers.find(c => c.id === existingAppointment.customerId);

      // 预选择服务并计算总价
      let preselectedServices: Array<{ id: number; name: string; duration: number; price: number }> = [];
      let totalPrice = 0;
      let serviceNames = '';

      if (existingAppointment.serviceIds && existingAppointment.serviceIds.length > 0) {
        preselectedServices = services.filter(s =>
          existingAppointment.serviceIds!.includes(s.id)
        );
        totalPrice = preselectedServices.reduce((sum, service) => sum + service.price, 0);
        serviceNames = preselectedServices.map(s => s.name).join(', ');
      }

      // 批量设置所有状态（React会自动批处理，只触发一次渲染）
      setSelectedServices(preselectedServices);
      setFormData({
        customerFirstName: customer?.firstName || '',
        customerLastName: customer?.lastName || '',
        customerPhone: customer?.phone || '',
        customerCountryCode: customer?.countryCode || '+1-CA',
        customerEmail: customer?.email || '',
        serviceName: serviceNames,
        date: existingAppointment.date,
        startTime: startTime,
        endTime: endTime,
        resourceId: resourceId,
        price: totalPrice,
        notes: existingAppointment.notes || '',
      });
      setSelectedCustomer(customer || null);
      setCountryCode(customer?.countryCode || '+1-CA');
      setErrors({});
      setTimeConflictError('');
      setExceedsWorkingHours(false);
    }
  }, [open, editMode, existingAppointment, customers, services, date, startTime, endTime, resourceId]);

  const handleChange = (field: keyof AppointmentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCustomerSelect = (customer: ApiCustomer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      // 加载客户的国家码
      const customerCountryCode = customer.countryCode || '+1-CA';
      setCountryCode(customerCountryCode);

      setFormData(prev => ({
        ...prev,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerPhone: customer.phone || '',
        customerCountryCode: customerCountryCode,
        customerEmail: customer.email || '',
      }));
      // 选择客户时，取消占位邮箱状态（因为客户已有邮箱）
      setUsePlaceholderEmail(false);
    } else {
      // Clear input fields when customer is deselected
      setCountryCode('+1-CA');
      setFormData(prev => ({
        ...prev,
        customerFirstName: '',
        customerLastName: '',
        customerPhone: '',
        customerCountryCode: '+1-CA',
        customerEmail: '',
      }));
      // 清除客户时，也重置占位邮箱状态
      setUsePlaceholderEmail(false);
    }
  };

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setFormData(prev => ({
      ...prev,
      customerCountryCode: newCountryCode,
    }));
    // 如果已勾选占位邮箱，需要重新生成
    if (usePlaceholderEmail && formData.customerPhone) {
      const placeholderEmail = generatePlaceholderEmail(newCountryCode, formData.customerPhone);
      setFormData(prev => ({
        ...prev,
        customerEmail: placeholderEmail,
      }));
    }
  };

  const handlePlaceholderEmailChange = (checked: boolean) => {
    setUsePlaceholderEmail(checked);
    if (checked) {
      // 勾选：生成并填充占位邮箱
      if (formData.customerPhone) {
        const placeholderEmail = generatePlaceholderEmail(countryCode, formData.customerPhone);
        setFormData(prev => ({
          ...prev,
          customerEmail: placeholderEmail,
        }));
        // 清除邮箱错误
        if (errors.customerEmail) {
          setErrors(prev => ({ ...prev, customerEmail: '' }));
        }
      }
    } else {
      // 取消勾选：清空邮箱
      setFormData(prev => ({
        ...prev,
        customerEmail: '',
      }));
    }
  };

  const handleServiceSelect = (services: Array<{ id: number; name: string; duration: number; price: number }>) => {
    setSelectedServices(services);

    if (services.length > 0) {
      // 计算总时长和总价格
      const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
      const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

      // 设置服务名称（多个服务用逗号分隔）
      const serviceNames = services.map(s => s.name).join(', ');
      handleChange('serviceName', serviceNames);
      handleChange('price', totalPrice);

      // 根据总时长调整结束时间 - 使用当前的开始时间（formData.startTime）
      const currentStartTime = formData.startTime;
      const [hours, minutes] = currentStartTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalDuration;
      const newEndHours = Math.floor(endMinutes / 60);
      const newEndMinutes = endMinutes % 60;
      const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMinutes).padStart(2, '0')}:00`;

      handleChange('endTime', newEndTime);

      // Check if exceeds working hours
      checkWorkingHours(newEndTime);

      // Check for time conflicts
      checkTimeConflict(newEndTime);
    } else {
      // 清空服务信息
      handleChange('serviceName', '');
      handleChange('price', 0);
    }
  };

  // Check if the selected end time conflicts with existing appointments
  const checkTimeConflict = (newEndTime: string) => {
    if (!existingAppointments || existingAppointments.length === 0) {
      setTimeConflictError('');
      return;
    }

    const currentDate = formData.date || format(date, 'yyyy-MM-dd');

    // Filter appointments for the same date and resource
    // In edit mode, exclude the current appointment being edited
    // Exclude cancelled appointments
    const sameResourceAppointments = existingAppointments.filter(
      apt => apt.date === currentDate &&
      apt.status !== 'CANCELLED' &&
      apt.status !== 'CANCELED' &&
      (!editMode || !existingAppointment || apt.id !== existingAppointment.id)
    );

    if (sameResourceAppointments.length === 0) {
      setTimeConflictError('');
      return;
    }

    // Convert current appointment times to minutes
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const currentStartMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = newEndTime.split(':').map(Number);
    const currentEndMinutes = endHours * 60 + endMinutes;

    // Sort appointments by start time
    const sortedAppointments = sameResourceAppointments
      .map(apt => {
        const [aptStartHours, aptStartMinutes] = apt.startTime.split(':').map(Number);
        const [aptEndHours, aptEndMinutes] = apt.endTime.split(':').map(Number);
        return {
          ...apt,
          startMinutes: aptStartHours * 60 + aptStartMinutes,
          endMinutes: aptEndHours * 60 + aptEndMinutes,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Find the next appointment after current start time
    const nextAppointment = sortedAppointments.find(
      apt => apt.startMinutes >= currentStartMinutes
    );

    if (nextAppointment && currentEndMinutes > nextAppointment.startMinutes) {
      setTimeConflictError(
        t('appointments.timeConflict', { time: nextAppointment.startTime.substring(0, 5) })
      );
    } else {
      setTimeConflictError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer Information
    if (!formData.customerFirstName?.trim()) {
      newErrors.customerFirstName = t('appointments.firstNameRequired', 'First name is required');
    }

    if (!formData.customerLastName?.trim()) {
      newErrors.customerLastName = t('appointments.lastNameRequired', 'Last name is required');
    }

    if (!formData.customerPhone?.trim()) {
      newErrors.customerPhone = t('appointments.phoneRequired', 'Phone number is required');
    }

    if (!countryCode) {
      newErrors.customerCountryCode = t('appointments.countryCodeRequired', 'Country code is required');
    }

    // 验证邮箱必填
    if (!formData.customerEmail?.trim()) {
      newErrors.customerEmail = t('appointments.emailRequired', 'Email is required');
    } else {
      // 验证邮箱格式（占位邮箱跳过格式验证）
      const isPlaceholderEmail = formData.customerEmail.endsWith('.placeholder@vamerchant.app');
      if (!isPlaceholderEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.customerEmail.trim())) {
          newErrors.customerEmail = t('appointments.emailInvalid', 'Invalid email format');
        }
      }
    }

    // Appointment Information
    if (!formData.serviceName?.trim()) {
      newErrors.serviceName = t('appointments.serviceRequired');
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = t('appointments.priceRequired');
    }

    if (!formData.date?.trim()) {
      newErrors.date = t('appointments.dateRequired', 'Date is required');
    }

    if (!formData.startTime?.trim()) {
      newErrors.startTime = t('appointments.startTimeRequired', 'Start time is required');
    }

    // Validate that the appointment time is not in the past (based on merchant timezone)
    if (formData.date && formData.startTime) {
      // Use merchant timezone current time instead of browser local time
      const now = getMerchantNow();
      // Parse the date string as local date (YYYY-MM-DD)
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Add a 5-minute buffer to avoid rejecting appointments being created right now
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      if (appointmentDate < fiveMinutesAgo) {
        newErrors.startTime = t('appointments.pastTimeNotAllowed', 'Cannot create appointments in the past');
      }
    }

    if (!formData.endTime?.trim()) {
      newErrors.endTime = t('appointments.endTimeRequired', 'End time is required');
    }

    // 验证时间范围
    if (formData.startTime && formData.endTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const duration = endMinutes - startMinutes;

      if (duration <= 0) {
        newErrors.endTime = t('appointments.invalidTimeRange', 'End time must be after start time');
      } else if (selectedServices.length > 0) {
        // 如果选择了服务，验证时间不能少于总服务时长
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        if (duration < totalDuration) {
          newErrors.endTime = t('appointments.durationBelowService', {
            duration: totalDuration,
            defaultValue: `Appointment duration cannot be less than the total service duration (${totalDuration} minutes)`
          });
        }
      } else {
        // 如果没有选择服务，默认最小30分钟
        if (duration < 30) {
          newErrors.endTime = t('appointments.minimumDuration', 'Appointment duration must be at least 30 minutes');
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Re-validate working hours with latest staffAttendance data
    // This ensures we check against actual check-in/out times
    const exceeds = checkWorkingHours(formData.endTime);

    // Check if appointment exceeds working hours
    if (exceeds) {
      setShowConfirmDialog(true);
      return;
    }

    proceedWithSave();
  };

  const proceedWithSave = () => {
    // Include customerId, countryCode and services if selected
    const dataToSave = {
      ...formData,
      customerCountryCode: countryCode, // 确保传递最新的国家码
      customerId: selectedCustomer?.id,
      services: selectedServices, // 传递多个服务
    };
    onSave(dataToSave);
    setShowConfirmDialog(false);
    onClose();
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  // 对话框完全关闭后的清理函数
  const handleExited = () => {
    // 清空所有状态，为下次打开做准备
    setCountryCode('+1-CA');
    setSelectedCustomer(null);
    setSelectedServices([]);
    setUsePlaceholderEmail(false);
    setFormData({
      customerFirstName: '',
      customerLastName: '',
      customerPhone: '',
      customerCountryCode: '+1-CA',
      customerEmail: '',
      serviceName: '',
      date: format(date, 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      resourceId: 0,
      price: 0,
      notes: '',
    });
    setErrors({});
    setTimeConflictError('');
    setExceedsWorkingHours(false);
    setStaffAttendance(null);

    // 调用外部的onExited回调
    if (onExited) {
      onExited();
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      container={container || undefined}
      sx={{ zIndex: 9999 }}
      PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' } }}
      TransitionProps={{ onExited: handleExited }}
    >
      {/* 简约标题 */}
      <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: alpha(themeColor, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: themeColor,
            }}>
              <AppointmentIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
                {editMode ? t('appointments.editAppointment') : t('appointments.addAppointment')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {resourceName && `${t('appointments.for')} ${resourceName}`}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClose(); }} sx={{ color: '#999' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, flex: 1, overflow: 'auto', '&.MuiDialogContent-root': { pt: 2.5 } }}>
          {/* 客户信息 */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PersonIcon sx={{ fontSize: 18, color: themeColor }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {t('appointments.customerInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* 客户搜索 */}
              <Grid item xs={12}>
                <Autocomplete
                  key={editMode && existingAppointment ? `edit-${existingAppointment.id}` : 'add'}
                  options={customers}
                  value={selectedCustomer}
                  onChange={(_, value) => handleCustomerSelect(value)}
                  loading={loadingCustomers}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  getOptionKey={(option) => option.id?.toString() || `${option.firstName}-${option.lastName}-${option.phone}`}
                  slotProps={{
                    popper: {
                      container: container || undefined,
                      disablePortal: !!container,
                      sx: {
                        zIndex: 10000, // Higher than Dialog's 9999
                      },
                    },
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {option.membershipTier && (
                        <Box
                          sx={{
                            fontSize: 20,
                            color: option.membershipTier.color || '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {getTierIcon(option.membershipTier.icon || 'star')}
                        </Box>
                      )}
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.phone} • {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('appointments.searchCustomer', 'Search Customer')}
                      placeholder={t('appointments.searchCustomerPlaceholder', 'Type to search existing customers...')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            {selectedCustomer?.membershipTier && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  ml: 1,
                                  mr: 0.5,
                                  color: selectedCustomer.membershipTier.color || '#9CA3AF',
                                }}
                              >
                                {getTierIcon(selectedCustomer.membershipTier.icon || 'star')}
                              </Box>
                            )}
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* OR 分隔符 */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} my={2}>
                  <Box flex={1} height="2px" bgcolor={alpha(themeColor, 0.3)} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: themeColor,
                      fontWeight: 700,
                      fontSize: 14,
                      whiteSpace: 'nowrap',
                      px: 1,
                    }}
                  >
                    {t('appointments.orAddNewCustomerPhoneBooking', '或快速添加新客户（电话预约）')}
                  </Typography>
                  <Box flex={1} height="2px" bgcolor={alpha(themeColor, 0.3)} />
                </Box>
              </Grid>

              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.firstName', 'First Name')}
                  value={formData.customerFirstName}
                  onChange={(e) => handleChange('customerFirstName', e.target.value)}
                  error={!!errors.customerFirstName}
                  helperText={errors.customerFirstName}
                  required
                  disabled={!!selectedCustomer}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.lastName', 'Last Name')}
                  value={formData.customerLastName}
                  onChange={(e) => handleChange('customerLastName', e.target.value)}
                  error={!!errors.customerLastName}
                  helperText={errors.customerLastName}
                  required
                  disabled={!!selectedCustomer}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Phone with Country Code */}
              <Grid item xs={12} sm={6}>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <CountryCodeSelector
                      value={countryCode}
                      onChange={handleCountryCodeChange}
                      label={t('appointments.countryCode', 'Code')}
                      size="medium"
                      fullWidth
                      disabled={!!selectedCustomer}
                      container={container}
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      label={t('appointments.customerPhone')}
                      value={formData.customerPhone}
                      onChange={(e) => {
                        const newPhone = e.target.value;
                        handleChange('customerPhone', newPhone);
                        // 如果已勾选占位邮箱，重新生成
                        if (usePlaceholderEmail && newPhone) {
                          const placeholderEmail = generatePlaceholderEmail(countryCode, newPhone);
                          handleChange('customerEmail', placeholderEmail);
                        }
                      }}
                      error={!!errors.customerPhone}
                      helperText={errors.customerPhone}
                      required
                      disabled={!!selectedCustomer}
                      placeholder="1234567890"
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, fontSize: 20, color: themeColor }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.customerEmail')}
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleChange('customerEmail', e.target.value)}
                  error={!!errors.customerEmail}
                  helperText={
                    errors.customerEmail || (
                      !selectedCustomer && !usePlaceholderEmail && formData.customerPhone && (
                        <Box
                          component="span"
                          onClick={() => handlePlaceholderEmailChange(true)}
                          sx={{
                            cursor: 'pointer',
                            color: themeColor,
                            textDecoration: 'underline',
                            '&:hover': {
                              color: themeColorDark,
                            }
                          }}
                        >
                          {t('appointments.noEmailClickToFill', '💡 暂无邮箱？点击自动填充')}
                        </Box>
                      )
                    )
                  }
                  required
                  disabled={!!selectedCustomer || usePlaceholderEmail}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, fontSize: 20, color: themeColor }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 预约信息 */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <EventIcon sx={{ fontSize: 18, color: themeColor }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {t('appointments.appointmentInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                {services.length > 0 ? (
                  <Autocomplete
                    multiple
                    options={services}
                    getOptionLabel={(option) => option.name}
                    value={selectedServices}
                    onChange={(_, value) => handleServiceSelect(value)}
                    slotProps={{
                      popper: {
                        container: container || undefined,
                        disablePortal: !!container,
                        sx: {
                          zIndex: 10000, // Higher than Dialog's 9999
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('appointments.service')}
                        required
                        error={!!errors.serviceName}
                        helperText={errors.serviceName || t('appointments.multipleServicesHint', 'You can select multiple services')}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: themeColor,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: themeColor,
                            },
                          },
                        }}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={t('appointments.service')}
                    value={formData.serviceName}
                    onChange={(e) => handleChange('serviceName', e.target.value)}
                    error={!!errors.serviceName}
                    helperText={errors.serviceName}
                    required
                    InputProps={{
                      startAdornment: <ServiceIcon sx={{ mr: 1, fontSize: 20, color: themeColor }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.price')}
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  error={!!errors.price}
                  helperText={errors.price}
                  required
                  disabled={selectedServices.length > 0}
                  InputProps={{
                    startAdornment: <MoneyIcon sx={{ mr: 1, fontSize: 20, color: themeColor }} />,
                    readOnly: selectedServices.length > 0,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('appointments.date')}
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  error={!!errors.date}
                  helperText={errors.date}
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <CustomTimePicker
                  label={t('appointments.startTime')}
                  value={formData.startTime}
                  onChange={(value) => {
                    handleChange('startTime', value);
                    // 如果已选择服务，重新计算结束时间
                    if (selectedServices.length > 0) {
                      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
                      const [hours, minutes] = value.split(':').map(Number);
                      const startMinutes = hours * 60 + minutes;
                      const endMinutes = startMinutes + totalDuration;
                      const newEndHours = Math.floor(endMinutes / 60);
                      const newEndMinutes = endMinutes % 60;
                      const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMinutes).padStart(2, '0')}:00`;
                      handleChange('endTime', newEndTime);
                      checkWorkingHours(newEndTime);
                      checkTimeConflict(newEndTime);
                    }
                  }}
                  error={!!errors.startTime}
                  helperText={errors.startTime}
                  required
                  themeColor={themeColor}
                  container={container}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <CustomTimePicker
                  label={t('appointments.endTime')}
                  value={formData.endTime}
                  onChange={(value) => {
                    handleChange('endTime', value);
                    checkWorkingHours(value);
                    checkTimeConflict(value);
                  }}
                  error={!!errors.endTime || !!timeConflictError}
                  helperText={errors.endTime || timeConflictError}
                  required
                  themeColor={themeColor}
                  minTime={
                    selectedServices.length > 0 && formData.startTime
                      ? (() => {
                          const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
                          const [hours, minutes] = formData.startTime.split(':').map(Number);
                          const startMinutes = hours * 60 + minutes;
                          const minEndMinutes = startMinutes + totalDuration;
                          const minEndHours = Math.floor(minEndMinutes / 60);
                          const minEndMins = minEndMinutes % 60;
                          return `${String(minEndHours).padStart(2, '0')}:${String(minEndMins).padStart(2, '0')}`;
                        })()
                      : undefined
                  }
                  container={container}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('appointments.notes')}
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder={t('appointments.notesPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
        <Button size="small" onClick={onClose} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
        }}>
          {t('common.cancel')}
        </Button>
        <Button size="small" variant="contained" onClick={handleSave} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          bgcolor: themeColor, boxShadow: 'none', textTransform: 'none',
          '&:hover': { bgcolor: themeColorDark, boxShadow: 'none' },
        }}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Confirmation Dialog for Exceeding Working Hours */}
    <Dialog
      open={showConfirmDialog}
      onClose={handleCancelConfirm}
      maxWidth="sm"
      fullWidth
      container={container}
      sx={{ zIndex: 10000 }}
      PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
    >
      <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5,
            bgcolor: alpha('#F59E0B', 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#D97706',
          }}>
            <EventIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
            {t('appointments.exceedsWorkingHours', 'Exceeds Working Hours')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2.5 }}>
        <Typography variant="body2" sx={{ color: '#333', mb: 1.5 }}>
          {t('appointments.exceedsWorkingHoursMessage',
            'This appointment extends beyond the staff member\'s scheduled working hours.')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {t('appointments.confirmExceedHours',
            'Have you confirmed with the staff member that they can work beyond their scheduled hours?')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Button size="small" onClick={handleCancelConfirm} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
        }}>
          {t('common.cancel')}
        </Button>
        <Button size="small" variant="contained" onClick={proceedWithSave} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          bgcolor: '#F59E0B', boxShadow: 'none', textTransform: 'none',
          '&:hover': { bgcolor: '#D97706', boxShadow: 'none' },
        }}>
          {t('appointments.confirmAndSave', 'Confirm and Save')}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default AppointmentDialog;
