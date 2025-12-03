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
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  Favorite as PreferencesIcon,
  Star as StarIcon,
  Stars as StarsIcon,
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Customer, Service, serviceApi, membershipTierApi, MembershipTier } from '../../../services/api';
import CountryCodeSelector from '../../../components/common/CountryCodeSelector';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isNativeApp = Capacitor.isNativePlatform();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';
  const THEME_COLOR_HOVER = isMonochrome ? '#333' : '#DB2777';
  const inputStyles = getInputStyles(THEME_COLOR);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say' as 'male' | 'female' | 'other' | 'prefer-not-to-say',
    membershipTierId: null as number | null,
    status: 'active' as 'active' | 'inactive',
    preferredServiceIds: [] as number[],
    allergies: '',
    communicationPreference: 'email' as 'both' | 'email' | 'sms',
    notes: ''
  });

  const [countryCode, setCountryCode] = useState<string>('+1-CA');
  const [services, setServices] = useState<Service[]>([]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'error',
  });

  const getTierIcon = (iconName?: string, color?: string) => {
    if (!iconName) return null;
    const iconProps = { sx: { fontSize: '0.875rem', color: color || 'inherit' } };
    switch (iconName.toLowerCase()) {
      case 'star': return <StarIcon {...iconProps} />;
      case 'stars': return <StarsIcon {...iconProps} />;
      case 'trophy': return <TrophyIcon {...iconProps} />;
      case 'medal': return <MedalIcon {...iconProps} />;
      case 'diamond': return <DiamondIcon {...iconProps} />;
      case 'premium': return <PremiumIcon {...iconProps} />;
      case 'verified': return <VerifiedIcon {...iconProps} />;
      case 'membership': return <MembershipIcon {...iconProps} />;
      default: return <StarIcon {...iconProps} />;
    }
  };

  useEffect(() => {
    const loadServices = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = user.tenantId || 1;
        const serviceList = await serviceApi.getActiveServices(tenantId.toString());
        setServices(Array.isArray(serviceList) ? serviceList : []);
      } catch (error) {
        console.error('Failed to load services:', error);
        setServices([]);
      }
    };
    if (open) loadServices();
  }, [open]);

  useEffect(() => {
    const loadMembershipTiers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const tenantId = user.tenantId || 1;
        const tierList = await membershipTierApi.getAllTiers(tenantId);
        setMembershipTiers(Array.isArray(tierList) ? tierList : []);
      } catch (error) {
        console.error('Failed to load membership levels:', error);
        setMembershipTiers([]);
      }
    };
    if (open) loadMembershipTiers();
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
        gender: customer.gender ? customer.gender.toLowerCase().replace('_', '-') as any : 'prefer-not-to-say',
        membershipTierId: customer.membershipTierId || customer.membershipTier?.id || null,
        status: customer.status ? customer.status.toLowerCase() as 'active' | 'inactive' : 'active',
        preferredServiceIds: customer.preferredServiceIds || [],
        allergies: customer.allergies || '',
        communicationPreference: customer.communicationPreference ? (customer.communicationPreference === 'SMS' ? 'sms' : customer.communicationPreference === 'BOTH' ? 'both' : 'email') as any : 'email',
        notes: customer.notes || ''
      });
      setCountryCode(customer.countryCode || '+1-CA');
    } else {
      setFormData({
        firstName: '', lastName: '', phone: '', email: '', address: '', dateOfBirth: '',
        gender: 'prefer-not-to-say',
        membershipTierId: membershipTiers.length > 0 && membershipTiers[0].id ? membershipTiers[0].id : null,
        status: 'active', preferredServiceIds: [], allergies: '', communicationPreference: 'email', notes: ''
      });
      setCountryCode('+1-CA');
    }
  }, [customer, open, membershipTiers]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setSnackbar({ open: true, message: t('customers.validation.firstNameRequired'), severity: 'error' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setSnackbar({ open: true, message: t('customers.validation.lastNameRequired'), severity: 'error' });
      return false;
    }
    if (!formData.phone.trim()) {
      setSnackbar({ open: true, message: t('customers.validation.phoneRequired'), severity: 'error' });
      return false;
    } else if (!/^[0-9\s\-()]+$/.test(formData.phone.trim())) {
      setSnackbar({ open: true, message: t('customers.validation.phoneInvalid'), severity: 'error' });
      return false;
    }
    if (!countryCode) {
      setSnackbar({ open: true, message: t('customers.validation.countryCodeRequired'), severity: 'error' });
      return false;
    }
    if (!formData.email.trim()) {
      setSnackbar({ open: true, message: t('customers.validation.emailRequired'), severity: 'error' });
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setSnackbar({ open: true, message: t('customers.validation.emailInvalid'), severity: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenantId || 1;
      let dateOfBirth = formData.dateOfBirth || undefined;

      const convertGender = (gender: string): 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' => {
        switch (gender) {
          case 'male': return 'MALE';
          case 'female': return 'FEMALE';
          case 'other': return 'OTHER';
          default: return 'PREFER_NOT_TO_SAY';
        }
      };

      const convertCommunicationPreference = (pref: string): 'SMS' | 'EMAIL' | 'BOTH' => {
        switch (pref) {
          case 'sms': return 'SMS';
          case 'both': return 'BOTH';
          default: return 'EMAIL';
        }
      };

      const customerData: Partial<Customer> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        countryCode: countryCode || '+1-CA',
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
        dateOfBirth,
        id: customer?.id,
        tenantId: customer?.tenantId || tenantId,
        points: customer?.points || 0,
        totalSpent: customer?.totalSpent || 0,
        status: (formData.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        membershipTierId: formData.membershipTierId || undefined,
        gender: convertGender(formData.gender),
        communicationPreference: convertCommunicationPreference(formData.communicationPreference),
        notes: formData.notes.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        preferredServiceIds: formData.preferredServiceIds,
      };

      if (customer?.id) {
        customerData.lastVisit = customer.lastVisit;
      } else {
        customerData.lastVisit = new Date().toISOString();
      }

      Object.keys(customerData).forEach(key => {
        if (customerData[key as keyof Customer] === undefined) {
          delete customerData[key as keyof Customer];
        }
      });

      try {
        await onSave(customerData);
        onClose();
      } catch (error: any) {
        console.error('Failed to save customer:', error);
        setSnackbar({ open: true, message: error.message || t('customers.saveFailed'), severity: 'error' });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{ onExited }}
      sx={isNativeApp ? {
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          pt: '60px',
        }
      } : undefined}
      PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
    >
      {/* 简约标题 */}
      <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: alpha(THEME_COLOR, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: THEME_COLOR,
            }}>
              <PersonIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
                {customer ? t('customers.editCustomer') : t('customers.addCustomer')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {customer ? t('customers.editCustomerInfo') : t('customers.createNewCustomerProfile')}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, '&.MuiDialogContent-root': { pt: 2.5 } }}>
        {/* 基本信息 */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PersonIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('customers.basicInfo')}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('customers.firstName')} value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)} sx={inputStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('customers.lastName')} value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)} sx={inputStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <CountryCodeSelector value={countryCode} onChange={setCountryCode}
                    label={t('customers.countryCode', 'Code')} size="medium" fullWidth />
                </Grid>
                <Grid item xs={8}>
                  <TextField fullWidth label={t('customers.phone')} value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)} placeholder="1234567890" sx={inputStyles} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('customers.email')} type="email" value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)} sx={inputStyles} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={`${t('customers.address')} (${t('customers.optional')})`}
                value={formData.address} onChange={(e) => handleChange('address', e.target.value)} sx={inputStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={`${t('customers.dateOfBirth')} (${t('customers.optional')})`}
                type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }} sx={inputStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <FormLabel sx={{ color: '#666', fontSize: '0.875rem', mb: 0.5 }}>
                  {t('customers.gender')} ({t('customers.optional')})
                </FormLabel>
                <RadioGroup row value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                  {['male', 'female', 'other', 'prefer-not-to-say'].map((g) => (
                    <FormControlLabel key={g} value={g}
                      control={<Radio size="small" sx={{ color: '#999', '&.Mui-checked': { color: THEME_COLOR } }} />}
                      label={<Typography variant="caption">{t(`customers.${g === 'prefer-not-to-say' ? 'preferNotToSay' : g}`)}</Typography>} />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* 会员信息 */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <MembershipIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('customers.membershipInfo')}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputStyles}>
                <InputLabel>{t('customers.membershipLevel')}</InputLabel>
                <Select value={formData.membershipTierId || ''} label={t('customers.membershipLevel')}
                  onChange={(e) => handleChange('membershipTierId', e.target.value)}>
                  {membershipTiers.map((tier) => (
                    <MenuItem key={tier.id} value={tier.id}>
                      <Chip icon={getTierIcon(tier.icon, tier.color) || undefined} label={tier.name} size="small"
                        sx={{ bgcolor: alpha(tier.color || '#6B7280', 0.1), color: tier.color || '#6B7280', fontWeight: 500 }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputStyles}>
                <InputLabel>{t('customers.status')}</InputLabel>
                <Select value={formData.status} label={t('customers.status')}
                  onChange={(e) => handleChange('status', e.target.value)}>
                  <MenuItem value="active">
                    <Chip label={t('customers.customerStatuses.active')} size="small"
                      sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981', fontWeight: 500 }} />
                  </MenuItem>
                  <MenuItem value="inactive">
                    <Chip label={t('customers.customerStatuses.inactive')} size="small"
                      sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', fontWeight: 500 }} />
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth sx={inputStyles}>
                <InputLabel>{t('customers.communicationPreference')}</InputLabel>
                <Select value={formData.communicationPreference} label={t('customers.communicationPreference')}
                  onChange={(e) => handleChange('communicationPreference', e.target.value)}>
                  <MenuItem value="email">{t('customers.email')}</MenuItem>
                  <MenuItem value="sms">{t('customers.sms')}</MenuItem>
                  <MenuItem value="both">{t('customers.both')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* 服务偏好 */}
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PreferencesIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('customers.preferences')} ({t('customers.optional')})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                multiple options={services} getOptionLabel={(option) => option.name}
                value={services.filter(service => formData.preferredServiceIds.includes(service.id))}
                onChange={(_, newValue) => handleChange('preferredServiceIds', newValue.map(s => s.id))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small"
                      sx={{ bgcolor: alpha(THEME_COLOR, 0.1), color: THEME_COLOR, fontWeight: 500 }} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label={t('customers.preferredServices')}
                    placeholder={t('customers.selectServices')} sx={inputStyles} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label={t('customers.allergies')} value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
                placeholder={t('customers.allergiesPlaceholder')} sx={inputStyles} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label={t('customers.notes')} value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('customers.notesPlaceholder')} sx={inputStyles} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Button size="small" onClick={onClose} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
        }}>
          {t('customers.cancel')}
        </Button>
        <Button size="small" variant="contained" onClick={handleSubmit} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          bgcolor: THEME_COLOR, boxShadow: 'none', textTransform: 'none',
          '&:hover': { bgcolor: THEME_COLOR_HOVER, boxShadow: 'none' },
        }}>
          {customer ? t('customers.updateCustomer') : t('customers.createCustomer')}
        </Button>
      </DialogActions>

      <Snackbar open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 1.5,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CustomerDialog;
