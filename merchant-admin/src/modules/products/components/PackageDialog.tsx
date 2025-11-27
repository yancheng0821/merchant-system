import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  IconButton,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  alpha,
  Paper,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CardGiftcard as PackageIcon,
  LocalOffer as ServiceIcon,
  AttachMoney as PriceIcon,
  Settings as SettingsIcon,
  // 套餐相关图标
  Redeem as RedeemIcon,
  Loyalty as LoyaltyIcon,
  Sell as SellIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  VolunteerActivism as VolunteerActivismIcon,
  Spa as SpaIcon,
  SelfImprovement as SelfImprovementIcon,
  HotTub as HotTubIcon,
  Pool as PoolIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  Stars as StarsIcon,
  AutoAwesome as AutoAwesomeIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Cake as CakeIcon,
  Celebration as CelebrationIcon,
  EmojiEvents as EmojiEventsIcon,
  MilitaryTech as MilitaryTechIcon,
  Weekend as WeekendIcon,
  Hotel as HotelIcon,
  BeachAccess as BeachAccessIcon,
  Cottage as CottageIcon,
  WineBar as WineBarIcon,
  Coffee as CoffeeIcon,
  Restaurant as RestaurantIcon,
  LocalCafe as LocalCafeIcon,
  LocalFlorist as LocalFloristIcon,
  Yard as YardIcon,
  Nature as NatureIcon,
  Park as ParkIcon,
  Healing as HealingIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  MedicalServices as MedicalServicesIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Package } from '../../../services/api';
import { useTheme } from '../../../contexts/ThemeContext';

interface Service {
  id: number;
  name: string;
  price: number;
  categoryName?: string;
}

// Extended PackageService interface to handle temporary empty state during editing
interface EditablePackageService {
  service_id: number;
  count: number | string;  // Allow string temporarily during editing
}

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  packageData: Package | null;
  services: Service[];
  onSave: (data: Partial<Package>) => Promise<void>;
  mode: 'add' | 'edit';
}

// 套餐图标选项
const PACKAGE_ICON_OPTIONS = [
  { value: 'card_giftcard', label: '礼品卡', icon: <PackageIcon /> },
  { value: 'redeem', label: '兑换', icon: <RedeemIcon /> },
  { value: 'loyalty', label: '会员', icon: <LoyaltyIcon /> },
  { value: 'local_offer', label: '优惠', icon: <ServiceIcon /> },
  { value: 'sell', label: '促销', icon: <SellIcon /> },
  { value: 'favorite', label: '喜爱', icon: <FavoriteIcon /> },
  { value: 'favorite_border', label: '心形', icon: <FavoriteBorderIcon /> },
  { value: 'volunteer_activism', label: '爱心', icon: <VolunteerActivismIcon /> },
  { value: 'spa', label: 'SPA', icon: <SpaIcon /> },
  { value: 'self_improvement', label: '冥想', icon: <SelfImprovementIcon /> },
  { value: 'hot_tub', label: '温泉', icon: <HotTubIcon /> },
  { value: 'pool', label: '泳池', icon: <PoolIcon /> },
  { value: 'diamond', label: '钻石', icon: <DiamondIcon /> },
  { value: 'star', label: '星星', icon: <StarIcon /> },
  { value: 'stars', label: '繁星', icon: <StarsIcon /> },
  { value: 'auto_awesome', label: '精彩', icon: <AutoAwesomeIcon /> },
  { value: 'workspace_premium', label: '高级', icon: <WorkspacePremiumIcon /> },
  { value: 'cake', label: '蛋糕', icon: <CakeIcon /> },
  { value: 'celebration', label: '庆祝', icon: <CelebrationIcon /> },
  { value: 'emoji_events', label: '奖杯', icon: <EmojiEventsIcon /> },
  { value: 'military_tech', label: '勋章', icon: <MilitaryTechIcon /> },
  { value: 'weekend', label: '周末', icon: <WeekendIcon /> },
  { value: 'hotel', label: '酒店', icon: <HotelIcon /> },
  { value: 'beach_access', label: '海滩', icon: <BeachAccessIcon /> },
  { value: 'cottage', label: '小屋', icon: <CottageIcon /> },
  { value: 'wine_bar', label: '酒吧', icon: <WineBarIcon /> },
  { value: 'coffee', label: '咖啡', icon: <CoffeeIcon /> },
  { value: 'restaurant', label: '餐厅', icon: <RestaurantIcon /> },
  { value: 'local_cafe', label: '咖啡馆', icon: <LocalCafeIcon /> },
  { value: 'local_florist', label: '花艺', icon: <LocalFloristIcon /> },
  { value: 'yard', label: '花园', icon: <YardIcon /> },
  { value: 'nature', label: '自然', icon: <NatureIcon /> },
  { value: 'park', label: '公园', icon: <ParkIcon /> },
  { value: 'healing', label: '康复', icon: <HealingIcon /> },
  { value: 'health_and_safety', label: '健康', icon: <HealthAndSafetyIcon /> },
  { value: 'medical_services', label: '医疗', icon: <MedicalServicesIcon /> },
  { value: 'psychology', label: '心理', icon: <PsychologyIcon /> },
];

// 套餐颜色选项 - 参考服务分类的颜色
const PACKAGE_COLOR_OPTIONS = [
  // 红色系
  '#FF6B6B', '#FF5722', '#E91E63', '#F44336',
  // 粉色系
  '#FF69B4', '#FF1493', '#FCE4EC', '#F8BBD0',
  // 橙色系
  '#FF9800', '#FF7043', '#FF8A65', '#FFAB91',
  // 黄色系
  '#FFC107', '#FFD54F', '#FFEB3B', '#FFEE58',
  // 绿色系
  '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65',
  // 青色系
  '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA',
  // 蓝色系
  '#2196F3', '#03A9F4', '#0097A7', '#64B5F6',
  // 深蓝色系
  '#3F51B5', '#536DFE', '#7986CB', '#9FA8DA',
  // 紫色系
  '#9C27B0', '#673AB7', '#7B1FA2', '#BA68C8',
  // 棕色系
  '#795548', '#8D6E63', '#A1887F', '#BCAAA4',
  // 灰色系
  '#607D8B', '#78909C', '#90A4AE', '#B0BEC5',
  // 特殊色彩
  '#FF4081', '#E040FB', '#7C4DFF', '#448AFF',
  '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59',
  '#667eea', '#764ba2', '#f093fb', '#4facfe',
];

const PackageDialog: React.FC<PackageDialogProps> = ({
  open,
  onClose,
  onExited,
  packageData,
  services,
  onSave,
  mode,
}) => {
  const { t } = useTranslation();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#06B6D4';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0891B2';

  // Separate state type to handle editable fields properly
  interface EditableFormData extends Omit<Partial<Package>, 'services' | 'validity_days' | 'max_shared_users'> {
    services: EditablePackageService[];
    validity_days: number | string;
    max_shared_users: number | string;
  }

  const [formData, setFormData] = useState<EditableFormData>({
    name: '',
    description: '',
    icon: 'card_giftcard',
    color: '#66B89A',
    services: [],
    original_price: 0,
    package_price: 0,
    validity_days: 365,
    max_shared_users: 1,
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (packageData && mode === 'edit') {
      setFormData({
        ...packageData,
        name: packageData.name || '',
        services: Array.isArray(packageData.services)
          ? packageData.services
          : JSON.parse(packageData.services as any),
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        description: '',
        icon: 'card_giftcard',
        color: '#66B89A',
        services: [],
        original_price: 0,
        package_price: 0,
        validity_days: 365,
        max_shared_users: 1,
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [packageData, mode, open]);

  // Calculate original price based on selected services
  useEffect(() => {
    const packageServices = Array.isArray(formData.services) ? formData.services : [];
    const total = packageServices.reduce((sum, ps) => {
      const service = services.find(s => s.id === ps.service_id);
      const count = ps.count === '' ? 0 : Number(ps.count);
      return sum + (service ? service.price * count : 0);
    }, 0);
    setFormData(prev => ({
      ...prev,
      original_price: total,
      discount_percentage: total > 0 ? ((total - (prev.package_price || 0)) / total * 100) : 0,
    }));
  }, [formData.services, services]);

  // Calculate discount percentage when package price changes
  useEffect(() => {
    const original = formData.original_price || 0;
    const packagePrice = formData.package_price || 0;
    if (original > 0) {
      const discount = ((original - packagePrice) / original * 100);
      setFormData(prev => ({
        ...prev,
        discount_percentage: discount,
      }));
    }
  }, [formData.package_price, formData.original_price]);

  const handleAddService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { service_id: 0, count: 1 }],
    }));
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleServiceChange = (index: number, field: 'service_id' | 'count', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => {
        if (i !== index) return s;
        // For count field, allow empty string or 0 temporarily during editing
        if (field === 'count') {
          // If user clears the field, keep it empty
          // If user types 0, keep it as 0
          // Otherwise convert to number
          const numValue = value === '' ? '' : value;
          return { ...s, [field]: numValue };
        }
        return { ...s, [field]: Number(value) };
      }),
    }));
  };

  const handleServiceCountBlur = (index: number, currentValue: number | string) => {
    // On blur, if field is empty, default to 1
    // Allow 0 if explicitly typed
    if (currentValue === '' || currentValue === null || currentValue === undefined) {
      handleServiceChange(index, 'count', 1);
    } else {
      // Ensure it's a valid number (including 0)
      const numValue = Number(currentValue);
      if (isNaN(numValue) || numValue < 0) {
        handleServiceChange(index, 'count', 1);
      } else {
        // Keep the value as-is (including 0)
        handleServiceChange(index, 'count', numValue);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const packageServices = Array.isArray(formData.services) ? formData.services : [];

    if (!formData.name?.trim()) {
      newErrors.name = t('packages.nameRequired');
    }
    if (packageServices.length === 0) {
      newErrors.services = t('packages.servicesRequired');
    }
    if (packageServices.some(s => s.service_id === 0)) {
      newErrors.services = t('packages.invalidServiceSelection');
    }
    if ((formData.package_price || 0) <= 0) {
      newErrors.package_price = t('packages.priceRequired');
    }
    if ((formData.package_price || 0) > (formData.original_price || 0)) {
      newErrors.package_price = t('packages.priceTooHigh');
    }

    const validityDays = typeof formData.validity_days === 'string' ? Number(formData.validity_days) : formData.validity_days;
    if (!validityDays || validityDays <= 0) {
      newErrors.validity_days = t('packages.validityRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Ensure all fields are valid numbers before saving
    const cleanedFormData: Partial<Package> = {
      ...formData,
      services: formData.services.map(s => ({
        service_id: s.service_id,
        count: !s.count || s.count === '' || Number(s.count) === 0 ? 1 : Number(s.count)
      })),
      validity_days: !formData.validity_days || formData.validity_days === ''
        ? 365 : Number(formData.validity_days),
      max_shared_users: !formData.max_shared_users || formData.max_shared_users === ''
        ? 1 : Number(formData.max_shared_users)
    };

    setSaving(true);
    try {
      await onSave(cleanedFormData);
      onClose();
    } catch (error) {
      console.error('Failed to save package:', error);
    } finally {
      setSaving(false);
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
      {/* 简约对话框标题 */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: THEME_COLOR }}>
            {mode === 'edit' ? t('packages.editPackage') : t('packages.createPackage')}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: '#999', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#666' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* 基本信息 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 2,
              background: '#fafafa',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME_COLOR, mb: 2 }}>
              {t('packages.basicInfo')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('packages.packageName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('packages.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('packages.icon')}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    <Grid container spacing={1}>
                      {PACKAGE_ICON_OPTIONS.map((option) => (
                        <Grid item key={option.value}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              cursor: 'pointer',
                              border: formData.icon === option.value
                                ? `2px solid ${THEME_COLOR}`
                                : '1px solid #e2e8f0',
                              backgroundColor: formData.icon === option.value
                                ? `${alpha(THEME_COLOR, 0.1)}`
                                : 'white',
                              color: formData.icon === option.value
                                ? THEME_COLOR
                                : '#6B7280',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                backgroundColor: `${alpha(THEME_COLOR, 0.08)}`,
                                color: THEME_COLOR,
                              },
                            }}
                            onClick={() => setFormData({ ...formData, icon: option.value })}
                            title={option.label}
                          >
                            {option.icon}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {t('packages.color')}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    <Grid container spacing={1}>
                      {PACKAGE_COLOR_OPTIONS.map((color) => (
                        <Grid item key={color} xs="auto">
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              backgroundColor: color,
                              borderRadius: 2,
                              cursor: 'pointer',
                              border: formData.color === color
                                ? `2px solid ${THEME_COLOR}`
                                : '1px solid #e2e8f0',
                              boxShadow: formData.color === color
                                ? `0 0 0 2px ${alpha(THEME_COLOR, 0.3)}`
                                : 'none',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                              '&:hover': {
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                zIndex: 1,
                              },
                              '&:after': formData.color === color ? {
                                content: '""',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              } : {},
                            }}
                            onClick={() => setFormData({ ...formData, color })}
                            title={color}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* 服务选择 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 2,
              background: '#fafafa',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                {t('packages.includedServices')}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddService}
                sx={{
                  color: THEME_COLOR,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: alpha(THEME_COLOR, 0.1),
                  },
                }}
              >
                {t('packages.addService')}
              </Button>
            </Box>

            {errors.services && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errors.services}</Alert>
            )}

            {(!Array.isArray(formData.services) || formData.services.length === 0) ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                {t('packages.noServicesAdded')}
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {formData.services.map((ps, index) => {
                  const selectedService = services.find(s => s.id === ps.service_id);
                  const count = ps.count === '' ? 0 : Number(ps.count);
                  const subtotal = selectedService ? selectedService.price * count : 0;

                  return (
                    <Box
                      key={index}
                      display="flex"
                      gap={2}
                      alignItems="center"
                      sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: alpha(THEME_COLOR, 0.2),
                      }}
                    >
                      <FormControl sx={{ flex: 2 }}>
                        <InputLabel size="small">{t('packages.service')}</InputLabel>
                        <Select
                          size="small"
                          value={ps.service_id}
                          label={t('packages.service')}
                          onChange={(e) => handleServiceChange(index, 'service_id', Number(e.target.value))}
                          sx={{
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: THEME_COLOR,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: THEME_COLOR,
                            },
                          }}
                        >
                          <MenuItem value={0} disabled>
                            {t('packages.selectService')}
                          </MenuItem>
                          {services.map(service => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name} - ${service.price}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        type="number"
                        size="small"
                        label={t('packages.count')}
                        value={ps.count === '' ? '' : ps.count}
                        onChange={(e) => handleServiceChange(index, 'count', e.target.value)}
                        onBlur={(e) => handleServiceCountBlur(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          // Allow backspace, delete, tab, escape, enter
                          const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
                          // Allow arrow keys
                          if (e.key.startsWith('Arrow')) return;
                          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                          if (e.ctrlKey || e.metaKey) return;
                          // Allow numbers 0-9
                          if (/^\d$/.test(e.key)) return;
                          // Prevent all other keys
                          if (!allowedKeys.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="1"
                        inputProps={{ min: 0 }}
                        sx={{
                          width: 100,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: THEME_COLOR,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: THEME_COLOR,
                            },
                          },
                        }}
                      />
                      {ps.service_id > 0 && (
                        <Chip
                          label={`$${subtotal.toFixed(2)}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(THEME_COLOR, 0.1),
                            color: THEME_COLOR_DARK,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveService(index)}
                        sx={{
                          color: '#EF4444',
                          '&:hover': {
                            backgroundColor: alpha('#EF4444', 0.1),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* 定价 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 2,
              background: '#fafafa',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME_COLOR, mb: 2 }}>
              {t('packages.pricing')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('packages.originalPrice')}
                  value={(formData.original_price || 0).toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PriceIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText={t('packages.autoCalculated')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: alpha(THEME_COLOR, 0.05),
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('packages.packagePrice')}
                  value={formData.package_price || ''}
                  onChange={(e) => setFormData({ ...formData, package_price: Number(e.target.value) || 0 })}
                  onFocus={(e) => e.target.select()}
                  error={!!errors.package_price}
                  helperText={errors.package_price}
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PriceIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('packages.discount')}
                  value={formData.discount_percentage?.toFixed(2) || '0.00'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText={t('packages.autoCalculated')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: alpha(THEME_COLOR, 0.05),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 设置 */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2.5,
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 2,
              background: '#fafafa',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: THEME_COLOR, mb: 2 }}>
              {t('packages.settings')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('packages.validityDays')}
                  value={formData.validity_days === '' ? '' : formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: e.target.value === '' ? '' : e.target.value })}
                  onBlur={(e) => {
                    // On blur, if field is empty or invalid, default to 365
                    const value = e.target.value;
                    if (value === '' || Number(value) < 1 || isNaN(Number(value))) {
                      setFormData({ ...formData, validity_days: 365 });
                    } else {
                      setFormData({ ...formData, validity_days: Number(value) });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  error={!!errors.validity_days}
                  helperText={errors.validity_days || t('packages.validityHelp')}
                  inputProps={{ min: 1 }}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('packages.maxSharedUsers')}
                  value={formData.max_shared_users === '' ? '' : formData.max_shared_users}
                  onChange={(e) => setFormData({ ...formData, max_shared_users: e.target.value === '' ? '' : e.target.value })}
                  onBlur={(e) => {
                    // On blur, if field is empty or invalid, default to 1
                    const value = e.target.value;
                    if (value === '' || Number(value) < 1 || isNaN(Number(value))) {
                      setFormData({ ...formData, max_shared_users: 1 });
                    } else {
                      setFormData({ ...formData, max_shared_users: Number(value) });
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  helperText={t('packages.maxSharedUsersHelp')}
                  inputProps={{ min: 1 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('packages.statusLabel')}</InputLabel>
                  <Select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    label={t('packages.statusLabel')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                    }}
                  >
                    <MenuItem value="ACTIVE">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#10B981',
                          }}
                        />
                        {t('packages.active')}
                      </Box>
                    </MenuItem>
                    <MenuItem value="INACTIVE">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#EF4444',
                          }}
                        />
                        {t('packages.inactive')}
                      </Box>
                    </MenuItem>
                  </Select>
                  <FormHelperText>{t('packages.statusHelp')}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('packages.termsAndConditions')}
                  value={formData.terms || ''}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  multiline
                  rows={3}
                  placeholder={t('packages.termsPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: THEME_COLOR,
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
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            color: '#666',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            bgcolor: THEME_COLOR,
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              bgcolor: THEME_COLOR_DARK,
              boxShadow: 'none',
            },
          }}
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackageDialog;
