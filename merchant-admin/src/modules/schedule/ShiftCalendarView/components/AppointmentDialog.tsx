import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { api, Customer as ApiCustomer } from '../../../../services/api';
import CustomTimePicker from './CustomTimePicker';
import CountryCodeSelector from '../../../../components/common/CountryCodeSelector';
import { getMerchantNow } from '../../../../utils/timezoneUtils';

// 主题颜色 - 使用蓝色主题与界面一致
const themeColor = '#3B82F6';
const themeColorLight = 'rgba(59, 130, 246, 0.15)';
const themeColorDark = '#2563EB';
const themeColorDarker = '#1D4ED8';

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
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Array<{ id: number; name: string; duration: number; price: number; }>>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [exceedsWorkingHours, setExceedsWorkingHours] = useState(false);
  const [timeConflictError, setTimeConflictError] = useState<string>('');

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

  // 对话框打开/关闭时的初始化逻辑
  useEffect(() => {
    if (open) {
      console.log('AppointmentDialog opened with:', { startTime, endTime, date, editMode, existingAppointment });

      // 立即重置为默认值，避免显示上次的状态
      if (!editMode) {
        setCountryCode('+1-CA');
        setSelectedCustomer(null);
        setSelectedServices([]);
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
      }

      setErrors({});
      setTimeConflictError('');
      setExceedsWorkingHours(false);
    }
  }, [open, date, startTime, endTime, resourceId, editMode]);

  // 编辑模式下加载客户数据（仅当customers加载完成后执行）
  useEffect(() => {
    if (open && editMode && existingAppointment && customers.length > 0) {
      console.log('Loading edit mode data with customers:', customers.length);

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
        setSelectedServices(preselectedServices);
      }

      // 设置表单数据，包含客户信息和价格
      setFormData({
        customerFirstName: customer?.firstName || '',
        customerLastName: customer?.lastName || '',
        customerPhone: customer?.phone || '',
        customerCountryCode: customer?.countryCode || '+1-CA',
        customerEmail: customer?.email || '',
        serviceName: serviceNames,
        date: existingAppointment.date, // 使用预约的原始日期
        startTime: startTime,
        endTime: endTime,
        resourceId: resourceId,
        price: totalPrice,
        notes: existingAppointment.notes || '',
      });

      // 设置选中的客户和国家码
      if (customer) {
        setSelectedCustomer(customer);
        setCountryCode(customer.countryCode || '+1-CA');
      }
    }
  }, [open, editMode, existingAppointment, customers, services, startTime, endTime, resourceId]);

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
    }
  };

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setFormData(prev => ({
      ...prev,
      customerCountryCode: newCountryCode,
    }));
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

  // Check if appointment exceeds staff working hours
  const checkWorkingHours = (endTime: string) => {
    if (!resourceAvailability || resourceAvailability.length === 0) {
      setExceedsWorkingHours(false);
      return;
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
      return;
    }

    // Convert appointment times to minutes
    const [startHours, startMinutes] = (formData.startTime || '').split(':').map(Number);
    const appointmentStartMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const appointmentEndMinutes = endHours * 60 + endMinutes;

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
    setExceedsWorkingHours(!isWithinAnySegment);
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
    const sameResourceAppointments = existingAppointments.filter(
      apt => apt.date === currentDate &&
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
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail.trim())) {
        newErrors.customerEmail = t('appointments.emailInvalid', 'Invalid email format');
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

    // Check if appointment exceeds working hours
    if (exceedsWorkingHours) {
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

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      sx={{
        zIndex: 9999,
      }}
      container={container || undefined}
      disablePortal={!!container}
      TransitionProps={{
        onExited: onExited,
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          bgcolor: 'background.paper',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.08)})`,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 3,
          pt: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: themeColorLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColor,
              }}
            >
              <AppointmentIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                {editMode ? t('appointments.editAppointment') : t('appointments.addAppointment')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resourceName && `${t('appointments.for')} ${resourceName}`}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha(themeColor, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* 客户信息 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha(themeColor, 0.2),
              borderRadius: 2,
              background: alpha(themeColor, 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: themeColorLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeColor,
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
                {t('appointments.customerInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* 客户搜索 */}
              <Grid item xs={12}>
                <Autocomplete
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
                    <Box component="li" {...props} key={option.id}>
                      <Box>
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
                    {t('appointments.orAddNewCustomer', 'Or Add New Customer')}
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
                      onChange={(e) => handleChange('customerPhone', e.target.value)}
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
                  helperText={errors.customerEmail}
                  required
                  disabled={!!selectedCustomer}
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
          </Paper>

          {/* 预约信息 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha(themeColor, 0.2),
              borderRadius: 2,
              background: alpha(themeColor, 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: themeColorLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeColor,
                }}
              >
                <EventIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
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
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha(themeColor, 0.02),
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            px: 3,
            color: 'text.secondary',
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            background: themeColorLight,
            color: themeColor,
            fontWeight: 600,
            boxShadow: `0 2px 8px ${alpha(themeColor, 0.2)}`,
            '&:hover': {
              background: alpha(themeColor, 0.2),
              boxShadow: `0 4px 12px ${alpha(themeColor, 0.3)}`,
            },
          }}
        >
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
      sx={{
        zIndex: 10000, // Higher than main dialog's 9999
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: alpha('#F59E0B', 0.1),
        color: '#D97706',
        borderBottom: '1px solid',
        borderColor: alpha('#F59E0B', 0.2),
        pb: 2,
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon />
          <Typography variant="h6" component="span">
            {t('appointments.exceedsWorkingHours', 'Exceeds Working Hours')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, mt: 2 }}>
        <Typography variant="body1" gutterBottom>
          {t('appointments.exceedsWorkingHoursMessage',
            'This appointment extends beyond the staff member\'s scheduled working hours.')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={2}>
          {t('appointments.confirmExceedHours',
            'Have you confirmed with the staff member that they can work beyond their scheduled hours?')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleCancelConfirm}
          variant="outlined"
          sx={{
            borderColor: alpha('#6B7280', 0.3),
            color: '#6B7280',
            textTransform: 'none',
            '&:hover': {
              borderColor: '#6B7280',
              bgcolor: alpha('#6B7280', 0.05),
            }
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={proceedWithSave}
          variant="contained"
          sx={{
            bgcolor: '#F59E0B',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#D97706',
            }
          }}
        >
          {t('appointments.confirmAndSave', 'Confirm and Save')}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default AppointmentDialog;
