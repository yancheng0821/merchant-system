import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Box,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  Stepper,
  Step,
  StepLabel,
  alpha,
  Paper,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  EventNote as AppointmentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/config';
import { Appointment, Customer, Staff, customerApi, staffApi } from '../../../services/api';

interface AddAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onSave: (appointment: Partial<Appointment>) => void;
}

const serviceOptions = [
  { category: 'Hair & Beauty', items: ['Hair Cut', 'Hair Color', 'Hair Styling', 'Blow Dry', 'Beard Trim'] },
  { category: 'Nail Care', items: ['Manicure', 'Pedicure', 'Gel Polish', 'Nail Art'] },
  { category: 'Facial Treatment', items: ['Basic Facial', 'Deep Cleansing', 'Anti-Aging Treatment', 'Acne Treatment'] },
  { category: 'Spa Package', items: ['Full Body Massage', 'Aromatherapy', 'Hot Stone Massage', 'Reflexology'] },
];

// 移除硬编码的员工数据，改为从API获取

const AddAppointmentDialog: React.FC<AddAppointmentDialogProps> = ({
  open,
  onClose,
  customers,
  onSave
}) => {
  const { t } = useTranslation();
  const steps = [t('dialogs.selectCustomerStep'), t('dialogs.selectServiceStep'), t('dialogs.scheduleTimeStep'), t('dialogs.confirmAppointmentStep')];
  const [activeStep, setActiveStep] = useState(0);

  // 获取当前语言设置
  const currentLocale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currentLocale === 'zh-CN' ? 'CNY' : 'USD'
    }).format(amount);
  };

  // 格式化日期，避免时区转换问题
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month是0-based
    return date.toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 表单数据
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);



  // 获取租户ID
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(user.tenantId || 1);
  }, []);

  // 加载员工数据
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await staffApi.getActiveStaff(tenantId);
        setStaffOptions(staff);
      } catch (error) {
        console.error('Failed to load staff:', error);
      }
    };

    if (open) {
      loadStaff();
    }
  }, [open, tenantId]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setActiveStep(0);
      setSelectedCustomer(null);
      setNewCustomerData({ firstName: '', lastName: '', phone: '', email: '' });
      setSelectedServices([]);
      setAppointmentDate('');
      setAppointmentTime('');
      setSelectedStaff('');
      setNotes('');
      setCustomerSearch('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 0: // 客户选择
        // 必须选择一个已存在的客户或者填写新客户信息
        const hasSelectedCustomer = selectedCustomer !== null;
        const hasNewCustomerInfo = newCustomerData.firstName.trim() || newCustomerData.lastName.trim() ||
          newCustomerData.phone.trim() || newCustomerData.email.trim();

        if (!hasSelectedCustomer && !hasNewCustomerInfo) {
          newErrors.customer = t('appointments.validation.customerRequired');
        }

        // 如果开始填写新客户信息，则必须填写完整
        if (hasNewCustomerInfo && !hasSelectedCustomer) {
          if (!newCustomerData.firstName.trim()) {
            newErrors.firstName = t('dialogs.firstNameRequired');
          }
          if (!newCustomerData.lastName.trim()) {
            newErrors.lastName = t('dialogs.lastNameRequired');
          }
          if (!newCustomerData.phone.trim()) {
            newErrors.phone = t('dialogs.phoneRequired');
          }
          if (!newCustomerData.email.trim()) {
            newErrors.email = t('dialogs.emailRequired');
          }
        }
        break;
      case 1: // 服务选择
        if (selectedServices.length === 0) {
          newErrors.services = t('appointments.validation.servicesRequired');
        }
        break;
      case 2: // 时间安排
        if (!appointmentDate.trim() || !appointmentTime.trim() || !selectedStaff) {
          newErrors.schedule = t('appointments.validation.scheduleRequired');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // 获取租户ID
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = Number(user.tenantId || 1);

      let customerId: number;
      let createdCustomer: Customer | null = null;

      // 如果是新客户，先创建客户
      if (!selectedCustomer) {
        const newCustomer = {
          tenantId: tenantId.toString(),
          firstName: newCustomerData.firstName,
          lastName: newCustomerData.lastName,
          phone: newCustomerData.phone,
          email: newCustomerData.email,
          membershipLevel: 'REGULAR' as const,
          status: 'ACTIVE' as const,
        };

        console.log('Creating new customer:', newCustomer);
        createdCustomer = await customerApi.createCustomer(newCustomer);
        customerId = Number(createdCustomer.id);
        console.log('Customer created with ID:', customerId);
      } else {
        customerId = Number(selectedCustomer.id);
      }

      // 计算总时长和总价格（这里应该根据实际选择的服务计算）
      const totalDuration = selectedServices.length * 60; // 临时计算，应该根据实际服务
      const totalAmount = selectedServices.length * 80;   // 临时计算，应该根据实际服务价格

      const appointment: any = {
        tenantId,
        customerId,
        appointmentDate, // 格式: "2024-01-15"
        appointmentTime: appointmentTime + ':00', // 格式: "14:30:00"
        duration: totalDuration,
        totalAmount: totalAmount, // 后端会自动转换为BigDecimal
        status: 'CONFIRMED',
        notes: notes.trim() || null,
        staffId: selectedStaff || null,
        rating: null, // 明确设置为null
        review: null, // 明确设置为null
      };

      // 验证必需字段
      if (!customerId || !appointmentDate || !appointmentTime) {
        throw new Error('Missing required fields: customerId, appointmentDate, or appointmentTime');
      }

      console.log('Submitting appointment:', appointment);
      console.log('Appointment data types:', {
        tenantId: typeof appointment.tenantId,
        customerId: typeof appointment.customerId,
        appointmentDate: typeof appointment.appointmentDate,
        appointmentTime: typeof appointment.appointmentTime,
        duration: typeof appointment.duration,
        totalAmount: typeof appointment.totalAmount,
        status: typeof appointment.status,
        staffId: typeof appointment.staffId,
      });

      try {
        await onSave(appointment);
        onClose();
      } catch (appointmentError) {
        console.error('Appointment creation failed:', appointmentError);
        console.error('Failed appointment data:', appointment);

        // 如果预约创建失败且我们刚创建了新客户，考虑是否需要删除客户
        // 这里可以根据业务需求决定是否删除刚创建的客户
        if (createdCustomer) {
          console.warn('New customer was created but appointment failed. Customer ID:', createdCustomer.id);
        }

        throw appointmentError;
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);

      // 设置用户友好的错误消息
      let errorMessage = t('appointments.createError');

      if (error?.message) {
        if (error.message.includes('phone number already exists')) {
          errorMessage = t('customers.phoneAlreadyExists');
        } else if (error.message.includes('email already exists')) {
          errorMessage = t('customers.emailAlreadyExists');
        } else {
          errorMessage = error.message;
        }
      }

      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 3 }}>
              {t('appointments.selectCustomer')}
            </Typography>

            <TextField
              fullWidth
              placeholder={t('appointments.searchCustomerPlaceholder')}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8B5CF6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8B5CF6',
                  },
                },
              }}
            />

            {errors.customer && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.customer}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: alpha('#8B5CF6', 0.2),
                    borderRadius: 2,
                    background: alpha('#8B5CF6', 0.02),
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('appointments.searchResults')}
                  </Typography>
                  <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {filteredCustomers.map((customer) => (
                      <ListItem
                        key={customer.id}
                        button
                        selected={selectedCustomer?.id === customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          '&.Mui-selected': {
                            backgroundColor: alpha('#8B5CF6', 0.1),
                          },
                          '&:hover': {
                            backgroundColor: alpha('#8B5CF6', 0.05),
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${customer.firstName} ${customer.lastName}`}
                          secondary={
                            <Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <PhoneIcon sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{customer.phone}</Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <EmailIcon sx={{ fontSize: 12 }} />
                                <Typography variant="caption">{customer.email}</Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: alpha('#8B5CF6', 0.2),
                    borderRadius: 2,
                    background: alpha('#8B5CF6', 0.02),
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('appointments.orAddNewCustomer')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('dialogs.firstName')}
                        value={newCustomerData.firstName}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('dialogs.lastName')}
                        value={newCustomerData.lastName}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('dialogs.phoneNumber')}
                        value={newCustomerData.phone}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('dialogs.emailAddress')}
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#8B5CF6',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 3 }}>
              {t('appointments.selectServices')}
            </Typography>

            {errors.services && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.services}
              </Alert>
            )}

            <Grid container spacing={2}>
              {serviceOptions.map((category) => (
                <Grid item xs={12} sm={6} key={category.category}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: alpha('#8B5CF6', 0.2),
                      borderRadius: 2,
                      background: alpha('#8B5CF6', 0.02),
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 2 }}>
                      {category.category}
                    </Typography>
                    {category.items.map((service) => (
                      <Chip
                        key={service}
                        label={service}
                        clickable
                        variant={selectedServices.includes(service) ? "filled" : "outlined"}
                        onClick={() => {
                          if (selectedServices.includes(service)) {
                            setSelectedServices(prev => prev.filter(s => s !== service));
                          } else {
                            setSelectedServices(prev => [...prev, service]);
                          }
                        }}
                        sx={{
                          m: 0.5,
                          borderColor: '#8B5CF6',
                          color: selectedServices.includes(service) ? 'white' : '#8B5CF6',
                          backgroundColor: selectedServices.includes(service) ? '#8B5CF6' : 'transparent',
                          '&:hover': {
                            backgroundColor: selectedServices.includes(service)
                              ? '#7C3AED'
                              : alpha('#8B5CF6', 0.1),
                          },
                        }}
                      />
                    ))}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {selectedServices.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 3,
                  border: '1px solid',
                  borderColor: alpha('#10B981', 0.2),
                  borderRadius: 2,
                  background: alpha('#10B981', 0.02),
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#10B981', mb: 1 }}>
                  {t('appointments.selectedServices')}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  {selectedServices.map((service) => (
                    <Chip
                      key={service}
                      label={service}
                      onDelete={() => setSelectedServices(prev => prev.filter(s => s !== service))}
                      sx={{
                        backgroundColor: alpha('#10B981', 0.1),
                        color: '#10B981',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('appointments.estimatedDuration')}:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10B981' }}>
                      {selectedServices.length * 60} {t('dialogs.minutes')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('appointments.estimatedPrice')}:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10B981' }}>
                      {formatCurrency(selectedServices.length * 80)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 3 }}>
              {t('appointments.scheduleAppointment')}
            </Typography>

            {errors.schedule && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.schedule}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.appointmentDate')}
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon sx={{ color: '#8B5CF6' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('appointments.appointmentTime')}
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon sx={{ color: '#8B5CF6' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('appointments.selectStaff')}</InputLabel>
                  <Select
                    value={selectedStaff}
                    label={t('appointments.selectStaff')}
                    onChange={(e) => setSelectedStaff(e.target.value as number)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                    }}
                  >
                    {staffOptions.map((staff) => (
                      <MenuItem key={staff.id} value={staff.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#8B5CF6', fontSize: '0.75rem' }}>
                            {staff.name.charAt(0)}
                          </Avatar>
                          {staff.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('appointments.notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('appointments.notesPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#8B5CF6',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const customerName = selectedCustomer ?
          `${selectedCustomer.firstName} ${selectedCustomer.lastName}` :
          `${newCustomerData.firstName} ${newCustomerData.lastName}`;
        const customerPhone = selectedCustomer?.phone || newCustomerData.phone;
        const customerEmail = selectedCustomer?.email || newCustomerData.email;

        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 3 }}>
              {t('appointments.confirmAppointment')}
            </Typography>

            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.submit}
              </Alert>
            )}

            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: alpha('#8B5CF6', 0.2),
                borderRadius: 3,
                background: alpha('#8B5CF6', 0.02),
              }}
            >
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 2 }}>
                      {t('dialogs.customerInfoSection')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerName}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerPhone}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{customerEmail}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 2 }}>
                      {t('dialogs.appointmentDetails')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{formatDate(appointmentDate)}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{appointmentTime}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {selectedStaff ? staffOptions.find(staff => staff.id === selectedStaff)?.name || t('appointments.unassigned') : t('appointments.unassigned')}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 2 }}>
                      {t('appointments.services')}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedServices.map((service) => (
                        <Chip
                          key={service}
                          label={service}
                          sx={{
                            backgroundColor: alpha('#8B5CF6', 0.1),
                            color: '#8B5CF6',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          {t('appointments.duration')}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#8B5CF6' }}>
                          {selectedServices.length * 60} {t('dialogs.minutes')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          {t('dialogs.estimatedPrice')}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#10B981' }}>
                          {formatCurrency(selectedServices.length * 80)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>

                  {notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 1 }}>
                        {t('dialogs.notes')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Alert
              severity="info"
              sx={{
                mt: 3,
                borderRadius: 2,
                backgroundColor: alpha('#3B82F6', 0.1),
                borderColor: alpha('#3B82F6', 0.2),
              }}
            >
              {t('appointments.notificationsSent')}
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          bgcolor: 'background.paper',
          minHeight: '70vh',
        }
      }}
    >
      {/* 现代化对话框标题 */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.08))',
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
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
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
                {t('appointments.addAppointment')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dialogs.createNewAppointment')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#8B5CF6', 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 步骤器 */}
        <Box mt={3}>
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-root .Mui-completed': {
                color: '#8B5CF6',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: '#8B5CF6',
              },
              '& .MuiStepConnector-line': {
                borderColor: alpha('#8B5CF6', 0.3),
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: 500,
                      '&.Mui-active': {
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha('#8B5CF6', 0.02),
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

        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            sx={{
              borderRadius: 2,
              px: 3,
              color: '#8B5CF6',
              '&:hover': {
                backgroundColor: alpha('#8B5CF6', 0.1),
              },
            }}
          >
            {t('appointments.back')}
          </Button>
        )}

        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isSubmitting}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
            },
            '&:disabled': {
              background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
              boxShadow: 'none',
            },
          }}
        >
          {isSubmitting ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} sx={{ color: 'white' }} />
              {activeStep === steps.length - 1 ? t('appointments.creating') : t('appointments.next')}
            </Box>
          ) : (
            activeStep === steps.length - 1 ? t('appointments.confirmAndBook') : t('appointments.next')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAppointmentDialog; 