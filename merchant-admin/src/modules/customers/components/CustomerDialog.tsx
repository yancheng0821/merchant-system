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
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  Favorite as PreferencesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer } from '../Customers';

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (customer: Partial<Customer>) => void;
}

const serviceOptions = [
  'Hair Cut',
  'Hair Color',
  'Hair Styling',
  'Beard Trim',
  'Manicure',
  'Pedicure',
  'Facial',
  'Massage',
  'Eyebrow Threading',
  'Lash Extensions',
  'Waxing',
  'Nail Art'
];

const CustomerDialog: React.FC<CustomerDialogProps> = ({
  open,
  onClose,
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
    preferredServices: [] as string[],
    allergies: '',
    communicationPreference: 'email' as 'phone' | 'email' | 'sms',
    notes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        dateOfBirth: customer.dateOfBirth || '',
        gender: customer.gender || 'prefer-not-to-say',
        membershipLevel: customer.membershipLevel || 'regular',
        preferredServices: customer.preferredServices || [],
        allergies: customer.allergies || '',
        communicationPreference: customer.communicationPreference || 'email',
        notes: customer.notes || ''
      });
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
        preferredServices: [],
        allergies: '',
        communicationPreference: 'email',
        notes: ''
      });
    }
    setErrors({});
  }, [customer, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('customers.validation.firstNameRequired');
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t('customers.validation.lastNameRequired');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('customers.validation.phoneRequired');
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[-\s()]/g, ''))) {
      newErrors.phone = t('customers.validation.phoneInvalid');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('customers.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('customers.validation.emailInvalid');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('customers.validation.addressRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const customerData: Partial<Customer> = {
        ...formData,
        id: customer?.id || `cust_${Date.now()}`,
        points: customer?.points || 0,
        totalSpent: customer?.totalSpent || 0,
        lastVisit: customer?.lastVisit,
        status: customer?.status || 'active',
        createdAt: customer?.createdAt || new Date().toISOString(),
      };

      onSave(customerData);
      onClose();
    }
  };



  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
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
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(217, 119, 6, 0.08))',
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
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
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
                {customer ? '编辑客户信息' : '创建新的客户档案'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha('#F59E0B', 0.1),
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
              borderColor: alpha('#F59E0B', 0.2),
              borderRadius: 2,
              background: alpha('#F59E0B', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
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
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
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
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.phone')}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('customers.address')}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  error={!!errors.address}
                  helperText={errors.address}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers.dateOfBirth')}
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
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel sx={{ color: '#F59E0B', fontWeight: 600, mb: 1 }}>
                    {t('customers.gender')}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    <FormControlLabel
                      value="male"
                      control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                      label={t('customers.male')}
                    />
                    <FormControlLabel
                      value="female"
                      control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                      label={t('customers.female')}
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
                      label={t('customers.other')}
                    />
                    <FormControlLabel
                      value="prefer_not_to_say"
                      control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />}
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
              borderColor: alpha('#F59E0B', 0.2),
              borderRadius: 2,
              background: alpha('#F59E0B', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <MembershipIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                {t('customers.membershipInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('customers.membershipLevel')}</InputLabel>
                  <Select
                    value={formData.membershipLevel}
                    label={t('customers.membershipLevel')}
                    onChange={(e) => handleChange('membershipLevel', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
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
                          backgroundColor: alpha('#F59E0B', 0.1),
                          color: '#F59E0B',
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('customers.communicationPreference')}</InputLabel>
                  <Select
                    value={formData.communicationPreference}
                    label={t('customers.communicationPreference')}
                    onChange={(e) => handleChange('communicationPreference', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                    }}
                  >
                    <MenuItem value="email">{t('customers.email')}</MenuItem>
                    <MenuItem value="sms">{t('customers.sms')}</MenuItem>
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
              borderColor: alpha('#F59E0B', 0.2),
              borderRadius: 2,
              background: alpha('#F59E0B', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PreferencesIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                {t('customers.preferences')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={serviceOptions}
                  value={formData.preferredServices}
                  onChange={(_, newValue) => handleChange('preferredServices', newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        sx={{
                          backgroundColor: alpha('#F59E0B', 0.1),
                          color: '#F59E0B',
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
                            borderColor: '#F59E0B',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#F59E0B',
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
                  placeholder="请描述任何已知的过敏或健康注意事项..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
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
                        borderColor: '#F59E0B',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B',
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
          background: alpha('#F59E0B', 0.02),
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
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #D97706, #B45309)',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
            },
          }}
        >
          {customer ? t('customers.updateCustomer') : t('customers.createCustomer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDialog; 