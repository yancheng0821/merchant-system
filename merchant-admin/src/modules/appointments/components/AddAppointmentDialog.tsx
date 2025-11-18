import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
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
  MeetingRoom as MeetingRoomIcon,
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
import i18n from '../../../i18n/config';
import { CurrencyUtils } from '../../../config/constants';
import { Appointment, Customer, Resource, Service, ServiceCategory, customerApi, resourceApi, serviceApi, serviceCategoryApi, merchantConfigApi } from '../../../services/api';
import ResourceSelector from '../../../components/common/ResourceSelector';
import SmartTimeSelector from '../../../components/common/SmartTimeSelector';
import ResourceAvailabilityDisplay from '../../../components/common/ResourceAvailabilityDisplay';

interface AddAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onSave: (appointment: Partial<Appointment>) => void;
}

// 移除硬编码的服务数据，改为从API获取

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
    return CurrencyUtils.formatAmount(amount);
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

  // 表单数据
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedResource, setSelectedResource] = useState<number | ''>('');
  const [selectedRoom, setSelectedRoom] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<Resource[]>([]);
  const [merchantResourceTypes, setMerchantResourceTypes] = useState<string[]>([]);
  const [loadingResourceTypes, setLoadingResourceTypes] = useState(false);

  // 计算当前选择的服务需要的资源类型
  const getRequiredResourceTypes = useMemo(() => {
    if (selectedServices.length === 0) {
      return merchantResourceTypes; // 如果没有选择服务，使用商户默认配置
    }

    const serviceResourceTypes = new Set<string>();
    selectedServices.forEach(service => {
      if (service.resourceType) {
        if (service.resourceType === 'BOTH') {
          serviceResourceTypes.add('STAFF');
          serviceResourceTypes.add('ROOM');
        } else {
          serviceResourceTypes.add(service.resourceType);
        }
      }
    });

    // 如果服务没有指定资源类型，使用商户默认配置
    if (serviceResourceTypes.size === 0) {
      return merchantResourceTypes;
    }

    return Array.from(serviceResourceTypes);
  }, [selectedServices, merchantResourceTypes]);

  // 当服务选择变化时，清空资源选择
  useEffect(() => {
    setSelectedResource('');
    setSelectedRoom('');
  }, [selectedServices]);



  // 获取租户ID
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(user.tenantId || 1);
  }, []);

  // 加载资源数据和服务数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingServices(true);
        setLoadingResourceTypes(true);
        
        // 并行加载资源、服务分类、服务数据和商户资源类型配置
        const [resources, categories, servicesData, resourceTypes] = await Promise.all([
          resourceApi.getAllResources(tenantId),
          serviceCategoryApi.getCategories(tenantId),
          serviceApi.getServices(tenantId.toString()),
          merchantConfigApi.getResourceTypes(tenantId).catch(() => ['STAFF']) // 默认为员工类型
        ]);
        
        
        setResourceOptions(resources || []);
        setServiceCategories(categories || []);
        setServices(servicesData || []);
        setMerchantResourceTypes(resourceTypes || ['STAFF']);
      } catch (error) {
        console.error('Failed to load data:', error);
        // 设置空数组以防止UI错误
        setResourceOptions([]);
        setServiceCategories([]);
        setServices([]);
        setMerchantResourceTypes(['STAFF']); // 默认为员工类型
      } finally {
        setLoadingServices(false);
        setLoadingResourceTypes(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open, tenantId]);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens to avoid flickering
      setActiveStep(0);
      setSelectedCustomer(null);
      setNewCustomerData({ firstName: '', lastName: '', phone: '', email: '' });
      setSelectedServices([]);
      setAppointmentDate('');
      setAppointmentTime('');
      setSelectedResource('');
      setSelectedRoom('');
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
        if (!appointmentDate.trim() || !appointmentTime.trim()) {
          newErrors.schedule = t('appointments.validation.scheduleRequired');
        }
        
        // 根据当前选择的服务需要的资源类型验证资源选择
        const requiredTypes = getRequiredResourceTypes;
        if (requiredTypes.includes('ROOM') && requiredTypes.includes('STAFF')) {
          // 如果同时需要房间和员工，必须先选择房间，再选择员工
          if (!selectedRoom) {
            newErrors.room = t('appointments.validation.roomRequired');
          }
          if (!selectedResource) {
            newErrors.staff = t('appointments.validation.staffRequired');
          }
        } else if (requiredTypes.includes('ROOM')) {
          // 只需要房间
          if (!selectedRoom) {
            newErrors.room = t('appointments.validation.roomRequired');
          }
        } else if (requiredTypes.includes('STAFF')) {
          // 只需要员工
          if (!selectedResource) {
            newErrors.staff = t('appointments.validation.staffRequired');
          }
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

        createdCustomer = await customerApi.createCustomer(newCustomer);
        customerId = Number(createdCustomer.id);
      } else {
        customerId = Number(selectedCustomer.id);
      }

      // 计算总时长和总价格（根据实际选择的服务计算）
      const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
      const totalAmount = selectedServices.reduce((total, service) => total + service.price, 0);

      // 构建选中的资源列表
      const selectedResources: any[] = [];
      
      const requiredTypes = getRequiredResourceTypes;
      if (requiredTypes.includes('ROOM') && requiredTypes.includes('STAFF')) {
        // 同时需要房间和员工
        if (selectedResource) {
          selectedResources.push({
            id: selectedResource,
            type: 'STAFF'
          });
        }
        if (selectedRoom) {
          selectedResources.push({
            id: selectedRoom,
            type: 'ROOM'
          });
        }
      } else if (requiredTypes.includes('ROOM')) {
        // 只需要房间
        if (selectedRoom) {
          selectedResources.push({
            id: selectedRoom,
            type: 'ROOM'
          });
        }
      } else if (requiredTypes.includes('STAFF')) {
        // 只需要员工
        if (selectedResource) {
          selectedResources.push({
            id: selectedResource,
            type: 'STAFF'
          });
        }
      }

      // 确定主要资源（用于兼容性）
      let finalResourceId = null;
      let finalResourceType = null;
      if (selectedResources.length > 0) {
        // 优先使用员工作为主要资源
        const staffResource = selectedResources.find(r => r.type === 'STAFF');
        const roomResource = selectedResources.find(r => r.type === 'ROOM');
        
        if (staffResource) {
          finalResourceId = staffResource.id;
          finalResourceType = 'STAFF';
        } else if (roomResource) {
          finalResourceId = roomResource.id;
          finalResourceType = 'ROOM';
        }
      }

      const appointment: any = {
        tenantId,
        customerId,
        appointmentDate, // 格式: "2024-01-15"
        appointmentTime: appointmentTime + ':00', // 格式: "14:30:00"
        duration: totalDuration,
        totalAmount: totalAmount, // 后端会自动转换为BigDecimal
        status: 'CONFIRMED',
        notes: notes.trim() || null,
        resourceId: finalResourceId,
        resourceType: finalResourceType,
        selectedResources: selectedResources, // 添加选中的资源列表
        rating: null, // 明确设置为null
        review: null, // 明确设置为null
        // 添加服务信息
        services: selectedServices.map(service => ({
          serviceId: service.id,
          serviceName: service.name,
          duration: service.duration,
          price: service.price,
          categoryId: service.categoryId
        }))
      };
      
      // 验证必需字段
      if (!customerId || !appointmentDate || !appointmentTime) {
        throw new Error('Missing required fields: customerId, appointmentDate, or appointmentTime');
      }


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
                    {selectedCustomer?.membershipTier ? (
                      <Box
                        sx={{
                          fontSize: 20,
                          color: selectedCustomer.membershipTier.color || '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          mr: 0.5,
                        }}
                      >
                        {getTierIcon(selectedCustomer.membershipTier.icon || 'star')}
                      </Box>
                    ) : (
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    )}
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
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{customer.firstName} {customer.lastName}</span>
                              {customer.membershipTier && (
                                <Box
                                  sx={{
                                    fontSize: 16,
                                    color: customer.membershipTier.color || '#9CA3AF',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {getTierIcon(customer.membershipTier.icon || 'star')}
                                </Box>
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PhoneIcon sx={{ fontSize: 12 }} />
                                <Typography variant="caption" component="span">{customer.phone}</Typography>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <EmailIcon sx={{ fontSize: 12 }} />
                                <Typography variant="caption" component="span">{customer.email}</Typography>
                              </span>
                            </>
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

            {loadingServices ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress sx={{ color: '#8B5CF6' }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {serviceCategories.map((category) => {
                  const categoryServices = services.filter(service => service.categoryId === category.id && service.status === 'ACTIVE');
                  
                  if (categoryServices.length === 0) return null;
                  
                  return (
                    <Grid item xs={12} sm={6} key={category.id}>
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
                          {category.name}
                        </Typography>
                        {categoryServices.map((service) => (
                          <Chip
                            key={service.id}
                            label={`${service.name} - ${formatCurrency(service.price)}`}
                            clickable
                            variant={selectedServices.some(s => s.id === service.id) ? "filled" : "outlined"}
                            onClick={() => {
                              if (selectedServices.some(s => s.id === service.id)) {
                                setSelectedServices(prev => prev.filter(s => s.id !== service.id));
                              } else {
                                setSelectedServices(prev => [...prev, service]);
                              }
                              // 清空资源选择，因为服务变化可能需要不同类型的资源
                              setSelectedResource('');
                              setSelectedRoom('');
                            }}
                            sx={{
                              m: 0.5,
                              borderColor: '#8B5CF6',
                              color: selectedServices.some(s => s.id === service.id) ? 'white' : '#8B5CF6',
                              backgroundColor: selectedServices.some(s => s.id === service.id) ? '#8B5CF6' : 'transparent',
                              '&:hover': {
                                backgroundColor: selectedServices.some(s => s.id === service.id)
                                  ? '#7C3AED'
                                  : alpha('#8B5CF6', 0.1),
                              },
                            }}
                          />
                        ))}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}

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
                      key={service.id}
                      label={`${service.name} - ${formatCurrency(service.price)}`}
                      onDelete={() => {
                        setSelectedServices(prev => prev.filter(s => s.id !== service.id));
                        // 清空资源选择，因为服务变化可能需要不同类型的资源
                        setSelectedResource('');
                        setSelectedRoom('');
                      }}
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
                      {selectedServices.reduce((total, service) => total + service.duration, 0)} {t('dialogs.minutes')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('appointments.estimatedPrice')}:
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#10B981' }}>
                      {formatCurrency(selectedServices.reduce((total, service) => total + service.price, 0))}
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
                    inputProps: {
                      // 设置最小日期为今天（使用本地日期而不是UTC）
                      min: (() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })(),
                      // 可选：设置最大日期（例如：未来3个月）
                      max: (() => {
                        const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                        const year = future.getFullYear();
                        const month = String(future.getMonth() + 1).padStart(2, '0');
                        const day = String(future.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()
                    }
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
                <SmartTimeSelector
                  selectedDate={appointmentDate}
                  selectedTime={appointmentTime}
                  onTimeChange={setAppointmentTime}
                  resourceId={selectedResource || selectedRoom || undefined}
                  duration={selectedServices.reduce((total, service) => total + service.duration, 0)}
                />
              </Grid>

              {/* 根据当前选择的服务需要的资源类型显示资源选择器 */}
              {loadingResourceTypes ? (
                <Grid item xs={12}>
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight={200}
                    sx={{
                      backgroundColor: alpha('#8B5CF6', 0.02),
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha('#8B5CF6', 0.1),
                    }}
                  >
                    <CircularProgress sx={{ color: '#8B5CF6' }} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {t('resources.loadingResourceTypes')}
                    </Typography>
                  </Box>
                </Grid>
              ) : selectedServices.length === 0 ? (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      {t('appointments.selectServicesFirst')}
                    </Typography>
                  </Alert>
                </Grid>
              ) : (
                <>
                  {/* 显示当前选择的服务需要的资源类型提示 */}
                  {selectedServices.length > 0 && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                          {getRequiredResourceTypes.includes('ROOM') && getRequiredResourceTypes.includes('STAFF')
                            ? t('appointments.requiresBothStaffAndRoom')
                            : getRequiredResourceTypes.includes('ROOM')
                            ? t('appointments.requiresRoom')
                            : getRequiredResourceTypes.includes('STAFF')
                            ? t('appointments.requiresStaff')
                            : t('appointments.noResourceRequired')
                          }
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* 如果同时需要房间和员工，先选择房间 */}
                  {getRequiredResourceTypes.includes('ROOM') && getRequiredResourceTypes.includes('STAFF') && (
                    <>
                      <Grid item xs={12}>
                        <Box sx={{ minHeight: 80 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 1 }}>
                            {t('appointments.selectRoomFirst')}
                          </Typography>
                          <ResourceSelector
                          tenantId={tenantId}
                          resourceType="ROOM"
                          selectedResourceId={selectedRoom || undefined}
                          onResourceSelect={(resource) => {
                            setSelectedRoom(resource?.id || '');
                            // 清空员工选择，因为房间变化可能影响可用员工
                            setSelectedResource('');
                          }}
                          appointmentDate={appointmentDate}
                          appointmentTime={appointmentTime}
                          duration={selectedServices.reduce((total, service) => total + service.duration, 0)}
                            showAvailability={true}
                            variant="dropdown"
                          />
                          {errors.room && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {errors.room}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ minHeight: 80 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 1 }}>
                            {t('appointments.selectStaffForRoom')}
                          </Typography>
                          <ResourceSelector
                          tenantId={tenantId}
                          resourceType="STAFF"
                          selectedResourceId={selectedResource || undefined}
                          onResourceSelect={(resource) => setSelectedResource(resource?.id || '')}
                          appointmentDate={appointmentDate}
                          appointmentTime={appointmentTime}
                          duration={selectedServices.reduce((total, service) => total + service.duration, 0)}
                          showAvailability={true}
                            variant="dropdown"
                            disabled={!selectedRoom} // 必须先选择房间
                          />
                          {errors.staff && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {errors.staff}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </>
                  )}
                  
                  {/* 如果只需要房间 */}
                  {getRequiredResourceTypes.includes('ROOM') && !getRequiredResourceTypes.includes('STAFF') && (
                    <Grid item xs={12}>
                      <Box sx={{ minHeight: 80 }}>
                        <ResourceSelector
                        tenantId={tenantId}
                        resourceType="ROOM"
                        selectedResourceId={selectedRoom || undefined}
                        onResourceSelect={(resource) => setSelectedRoom(resource?.id || '')}
                        appointmentDate={appointmentDate}
                        appointmentTime={appointmentTime}
                        duration={selectedServices.reduce((total, service) => total + service.duration, 0)}
                          showAvailability={true}
                          variant="dropdown"
                        />
                        {errors.room && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            {errors.room}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}
                  
                  {/* 如果只需要员工 */}
                  {getRequiredResourceTypes.includes('STAFF') && !getRequiredResourceTypes.includes('ROOM') && (
                    <Grid item xs={12}>
                      <Box sx={{ minHeight: 80 }}>
                        <ResourceSelector
                        tenantId={tenantId}
                        resourceType="STAFF"
                        selectedResourceId={selectedResource || undefined}
                        onResourceSelect={(resource) => setSelectedResource(resource?.id || '')}
                        appointmentDate={appointmentDate}
                        appointmentTime={appointmentTime}
                        duration={selectedServices.reduce((total, service) => total + service.duration, 0)}
                          showAvailability={true}
                          variant="dropdown"
                        />
                        {errors.staff && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            {errors.staff}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}
                </>
              )}

              {/* 显示选中资源的可用性 */}
              {(selectedResource || selectedRoom) && appointmentDate && (
                <Grid item xs={12}>
                  <Box display="flex" flexDirection="column" gap={2} sx={{ minHeight: 100 }}>
                    {selectedResource && (
                      <ResourceAvailabilityDisplay
                        resourceId={selectedResource}
                        resourceName={resourceOptions.find(r => r.id === selectedResource)?.name || 'Staff'}
                        resourceType="STAFF"
                        selectedDate={appointmentDate}
                        compact={true}
                      />
                    )}
                    {selectedRoom && selectedRoom !== selectedResource && (
                      <ResourceAvailabilityDisplay
                        resourceId={selectedRoom}
                        resourceName={resourceOptions.find(r => r.id === selectedRoom)?.name || 'Room'}
                        resourceType="ROOM"
                        selectedDate={appointmentDate}
                        compact={true}
                      />
                    )}
                  </Box>
                </Grid>
              )}

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
                    {/* 显示选中的资源（员工和/或房间） */}
                    {selectedResource && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PersonIcon sx={{ fontSize: 16, color: '#6366F1' }} />
                        <Typography variant="body2">
                          {t('appointments.staff')}: {resourceOptions.find(resource => resource.id === selectedResource)?.name || t('appointments.unassigned')}
                        </Typography>
                      </Box>
                    )}
                    {selectedRoom && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <MeetingRoomIcon sx={{ fontSize: 16, color: '#10B981' }} />
                        <Typography variant="body2">
                          {t('appointments.room')}: {resourceOptions.find(room => room.id === selectedRoom)?.name || t('appointments.unassigned')}
                        </Typography>
                      </Box>
                    )}
                    {!selectedResource && !selectedRoom && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {t('appointments.unassigned')}
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8B5CF6', mb: 2 }}>
                      {t('appointments.services')}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {selectedServices.map((service) => (
                        <Chip
                          key={service.id}
                          label={`${service.name} - ${formatCurrency(service.price)}`}
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
                          {selectedServices.reduce((total, service) => total + service.duration, 0)} {t('dialogs.minutes')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          {t('dialogs.estimatedPrice')}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#10B981' }}>
                          {formatCurrency(selectedServices.reduce((total, service) => total + service.price, 0))}
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
      disableEnforceFocus
      disableAutoFocus
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

      <DialogContent sx={{ p: 3, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>
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