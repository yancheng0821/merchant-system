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
  Chip,
  Box,
  Typography,
  IconButton,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  alpha,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  Favorite as PreferencesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer, Service, serviceApi } from '../../../services/api';
import CountryCodeSelector from '../../../components/common/CountryCodeSelector';

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  customer: Customer | null;
  onSave: (customer: Partial<Customer>) => Promise<void>;
}



const CustomerDialog: React.FC<CustomerDialogProps> = ({
  open,
  onClose,
  onExited,
  customer,
  onSave
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say' as 'male' | 'female' | 'other' | 'prefer-not-to-say',
    membershipLevel: 'regular' as 'regular' | 'silver' | 'gold' | 'platinum',
    status: 'active' as 'active' | 'inactive',
    preferredServiceIds: [] as number[],
    allergies: '',
    communicationPreference: 'email' as 'both' | 'email' | 'sms',
    notes: ''
  });

  const [countryCode, setCountryCode] = useState<string>('+1-CA');
  const [services, setServices] = useState<Service[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'error',
  });

  // 加载服务列表
  useEffect(() => {
    const loadServices = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = user.tenantId || 1;
        const serviceList = await serviceApi.getActiveServices(tenantId.toString());
        // 确保 serviceList 是数组
        setServices(Array.isArray(serviceList) ? serviceList : []);
      } catch (error) {
        console.error('Failed to load services:', error);
        // 出错时设置为空数组
        setServices([]);
      }
    };

    if (open) {
      loadServices();
    }
  }, [open]);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
        // 转换后端大写枚举为前端小写
        gender: customer.gender ? customer.gender.toLowerCase().replace('_', '-') as 'male' | 'female' | 'other' | 'prefer-not-to-say' : 'prefer-not-to-say',
        membershipLevel: customer.membershipLevel ? customer.membershipLevel.toLowerCase() as 'regular' | 'silver' | 'gold' | 'platinum' : 'regular',
        status: customer.status ? customer.status.toLowerCase() as 'active' | 'inactive' : 'active',
        preferredServiceIds: customer.preferredServiceIds || [],
        allergies: customer.allergies || '',
        communicationPreference: customer.communicationPreference ? (customer.communicationPreference === 'SMS' ? 'sms' : customer.communicationPreference === 'BOTH' ? 'both' : customer.communicationPreference.toLowerCase()) as 'both' | 'email' | 'sms' : 'email',
        notes: customer.notes || ''
      });
      // 直接使用数据库中的countryCode
      setCountryCode(customer.countryCode || '+1-CA');
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        dateOfBirth: '',
        gender: 'prefer-not-to-say' as 'male' | 'female' | 'other' | 'prefer-not-to-say',
        membershipLevel: 'regular',
        status: 'active' as 'active' | 'inactive',
        preferredServiceIds: [],
        allergies: '',
        communicationPreference: 'email',
        notes: ''
      });
      setCountryCode('+1-CA');
    }
  }, [customer, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // 必填字段：firstName, lastName, email, phone, countryCode
    if (!formData.firstName.trim()) {
      setSnackbar({
        open: true,
        message: t('customers.validation.firstNameRequired'),
        severity: 'error',
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      setSnackbar({
        open: true,
        message: t('customers.validation.lastNameRequired'),
        severity: 'error',
      });
      return false;
    }

    if (!formData.phone.trim()) {
      setSnackbar({
        open: true,
        message: t('customers.validation.phoneRequired'),
        severity: 'error',
      });
      return false;
    } else if (!/^[0-9\s\-()]+$/.test(formData.phone.trim())) {
      setSnackbar({
        open: true,
        message: t('customers.validation.phoneInvalid'),
        severity: 'error',
      });
      return false;
    }

    if (!countryCode) {
      setSnackbar({
        open: true,
        message: t('customers.validation.countryCodeRequired'),
        severity: 'error',
      });
      return false;
    }

    if (!formData.email.trim()) {
      setSnackbar({
        open: true,
        message: t('customers.validation.emailRequired'),
        severity: 'error',
      });
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setSnackbar({
        open: true,
        message: t('customers.validation.emailInvalid'),
        severity: 'error',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      // 获取用户信息和租户ID
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenantId || 1;

      // 处理日期格式
      let dateOfBirth = undefined;
      if (formData.dateOfBirth) {
        try {
          // 确保日期格式正确
          dateOfBirth = formData.dateOfBirth;
        } catch (e) {
          console.error('Invalid date format:', e);
        }
      }

      // 安全的枚举值转换函数
      const convertGender = (gender: string): 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' => {
        switch (gender) {
          case 'male': return 'MALE';
          case 'female': return 'FEMALE';
          case 'other': return 'OTHER';
          case 'prefer-not-to-say': return 'PREFER_NOT_TO_SAY';
          default: return 'PREFER_NOT_TO_SAY';
        }
      };

      const convertCommunicationPreference = (pref: string): 'SMS' | 'EMAIL' | 'BOTH' => {
        switch (pref) {
          case 'sms': return 'SMS';
          case 'email': return 'EMAIL';
          case 'both': return 'BOTH';
          default: return 'EMAIL';
        }
      };

      const customerData: Partial<Customer> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        countryCode: countryCode || '+1-CA', // 单独存储国家码，确保有值
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
        dateOfBirth: dateOfBirth,
        // 只有编辑时才传ID
        id: customer?.id,
        tenantId: customer?.tenantId || tenantId,
        points: customer?.points || 0,
        totalSpent: customer?.totalSpent || 0,
        // 转换状态为大写
        status: (formData.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        // 转换会员等级为大写
        membershipLevel: (formData.membershipLevel || 'regular').toUpperCase() as 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM',
        // 使用安全的性别转换
        gender: convertGender(formData.gender),
        // 使用安全的通信偏好转换
        communicationPreference: convertCommunicationPreference(formData.communicationPreference),
        notes: formData.notes.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        preferredServiceIds: formData.preferredServiceIds,
      };

      // 设置 lastVisit：编辑时保留原值，新创建时设置为当前时间
      if (customer?.id) {
        // 编辑现有客户，保留原有的 lastVisit
        customerData.lastVisit = customer.lastVisit;
      } else {
        // 新创建客户，设置 lastVisit 为当前时间
        customerData.lastVisit = new Date().toISOString();
      }

      // 只移除 undefined 值，保留用户填写的空字符串
      Object.keys(customerData).forEach(key => {
        if (customerData[key as keyof Customer] === undefined) {
          delete customerData[key as keyof Customer];
        }
      });

      try {
        await onSave(customerData);
        // 只有在成功保存后才关闭对话框
        onClose();
      } catch (error: any) {
        // 在对话框内部显示错误，这样用户可以直接看到并修改
        console.error('Failed to save customer:', error);
        setSnackbar({
          open: true,
          message: error.message || t('customers.saveFailed'),
          severity: 'error',
        });
        // 对话框保持打开状态，让用户可以修改后重试
      }
    }
  };



  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        onExited: onExited,
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          bgcolor: 'background.paper',
        }
      }}
    >
      {/* 现代化对话框标题 */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(219, 39, 119, 0.08))',
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
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <PersonIcon sx={{ fontSize: 24 }} />
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
                {customer ? t('customers.editCustomer') : t('customers.addCustomer')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {customer ? t('customers.editCustomerInfo') : t('customers.createNewCustomerProfile')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#EC4899', 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* 基本信息部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.2),
              borderRadius: 2,
              background: alpha('#EC4899', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
                {t('customers.basicInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.firstName')}
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.lastName')}
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <CountryCodeSelector
                      value={countryCode}
                      onChange={(value) => setCountryCode(value)}
                      label={t('customers.countryCode', 'Code')}
                      size="medium"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      label={t('customers.phone')}
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="1234567890"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#EC4899',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#EC4899',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={`${t('customers.address')} (${t('customers.optional')})`}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}

                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={`${t('customers.dateOfBirth')} (${t('customers.optional')})`}
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: '#EC4899', fontWeight: 600, mb: 1 }}>
                    {t('customers.gender')} ({t('customers.optional')})
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    <FormControlLabel
                      value="male"
                      control={<Radio sx={{ color: '#EC4899', '&.Mui-checked': { color: '#EC4899' } }} />}
                      label={t('customers.male')}
                    />
                    <FormControlLabel
                      value="female"
                      control={<Radio sx={{ color: '#EC4899', '&.Mui-checked': { color: '#EC4899' } }} />}
                      label={t('customers.female')}
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio sx={{ color: '#EC4899', '&.Mui-checked': { color: '#EC4899' } }} />}
                      label={t('customers.other')}
                    />
                    <FormControlLabel
                      value="prefer-not-to-say"
                      control={<Radio sx={{ color: '#EC4899', '&.Mui-checked': { color: '#EC4899' } }} />}
                      label={t('customers.preferNotToSay')}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* 会员信息部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.2),
              borderRadius: 2,
              background: alpha('#EC4899', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <MembershipIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
                {t('customers.membershipInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('customers.membershipLevel')}</InputLabel>
                  <Select
                    value={formData.membershipLevel}
                    label={t('customers.membershipLevel')}
                    onChange={(e) => handleChange('membershipLevel', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    }}
                  >
                    <MenuItem value="regular">
                      <Chip
                        label={t('customers.regular')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#6B7280', 0.1),
                          color: '#6B7280',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="silver">
                      <Chip
                        label={t('customers.silver')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#9CA3AF', 0.1),
                          color: '#9CA3AF',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="gold">
                      <Chip
                        label={t('customers.gold')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#EC4899', 0.1),
                          color: '#EC4899',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="platinum">
                      <Chip
                        label={t('customers.platinum')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#8B5CF6', 0.1),
                          color: '#8B5CF6',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('customers.status')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('customers.status')}
                    onChange={(e) => handleChange('status', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    }}
                  >
                    <MenuItem value="active">
                      <Chip
                        label={t('customers.customerStatuses.active')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#10B981', 0.1),
                          color: '#10B981',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                    <MenuItem value="inactive">
                      <Chip
                        label={t('customers.customerStatuses.inactive')}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#EF4444', 0.1),
                          color: '#EF4444',
                          fontWeight: 600,
                        }}
                      />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('customers.communicationPreference')} </InputLabel>
                  <Select
                    value={formData.communicationPreference}
                    label={t('customers.communicationPreference')}
                    onChange={(e) => handleChange('communicationPreference', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    }}
                  >
                    <MenuItem value="email">{t('customers.email')}</MenuItem>
                    <MenuItem value="sms">{t('customers.sms')}</MenuItem>
                    <MenuItem value="both">{t('customers.both')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* 服务偏好部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.2),
              borderRadius: 2,
              background: alpha('#EC4899', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PreferencesIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
                {t('customers.preferences')}({t('customers.optional')})
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={services}
                  getOptionLabel={(option) => option.name}
                  value={Array.isArray(services) ? services.filter(service => formData.preferredServiceIds.includes(service.id)) : []}
                  onChange={(_, newValue) => handleChange('preferredServiceIds', newValue.map(service => service.id))}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        sx={{
                          backgroundColor: alpha('#EC4899', 0.1),
                          color: '#EC4899',
                          fontWeight: 600,
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('customers.preferredServices')}
                      placeholder={t('customers.selectServices')}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#EC4899',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#EC4899',
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={t('customers.allergies')}
                  value={formData.allergies}
                  onChange={(e) => handleChange('allergies', e.target.value)}
                  placeholder={t('customers.allergiesPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('customers.notes')}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder={t('customers.notesPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#EC4899',
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
          background: alpha('#EC4899', 0.02),
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
          {t('customers.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #EC4899, #DB2777)',
            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #DB2777, #BE185D)',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
            },
          }}
        >
          {customer ? t('customers.updateCustomer') : t('customers.createCustomer')}
        </Button>
      </DialogActions>

      {/* Snackbar for validation errors */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CustomerDialog; 