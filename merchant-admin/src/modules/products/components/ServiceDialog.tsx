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
  Switch,
  FormControlLabel,
  Typography,
  InputAdornment,
  Box,
  alpha,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as ServiceIcon,
  AttachMoney as PriceIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { CurrencyUtils } from '../../../config/constants';
import { ServiceManagement as ServiceManagementType, ServiceCategory, merchantConfigApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onExited?: () => void;
  onSave: (service: Partial<ServiceManagementType>) => void;
  service: ServiceManagementType | null;
  categories: ServiceCategory[];
  mode: 'add' | 'edit';
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onClose,
  onExited,
  onSave,
  service,
  categories,
  mode,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#06B6D4';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0891B2';
  const [formData, setFormData] = useState<Partial<ServiceManagementType>>({
    name: '',
    categoryId: 0,
    price: 0,
    duration: 60,
    description: '',
    status: 'ACTIVE',
    resourceType: 'STAFF',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableResourceTypes, setAvailableResourceTypes] = useState<Array<{ value: string; label: string }>>([]);

  // 获取商户配置，确定可用的资源类型
  useEffect(() => {
    const fetchMerchantConfig = async () => {
      if (!user?.tenantId) return;
      
      try {
        const config = await merchantConfigApi.getMerchantConfig(user.tenantId);
        const resourceTypesArray = config.resource_types || config.resourceTypes || config.resourceType || ['STAFF'];
        
        const types: Array<{ value: string; label: string }> = [];
        
        // 根据商户配置的资源类型，设置可用选项
        if (Array.isArray(resourceTypesArray)) {
          if (resourceTypesArray.includes('STAFF') && resourceTypesArray.includes('ROOM')) {
            // 商户同时有员工和房间，可以选择所有选项
            types.push({ value: 'STAFF', label: t('services.staff') });
            types.push({ value: 'ROOM', label: t('services.room') });
            types.push({ value: 'BOTH', label: t('services.both') });
          } else if (resourceTypesArray.includes('STAFF')) {
            // 商户只有员工
            types.push({ value: 'STAFF', label: t('services.staff') });
          } else if (resourceTypesArray.includes('ROOM')) {
            // 商户只有房间
            types.push({ value: 'ROOM', label: t('services.room') });
          }
        } else {
          // 默认只有员工
          types.push({ value: 'STAFF', label: t('services.staff') });
        }
        
        setAvailableResourceTypes(types);
        
        // 如果当前选择的资源类型不在可用选项中，设置为第一个可用选项
        if (types.length > 0 && !types.find(t => t.value === formData.resourceType)) {
          setFormData(prev => ({ ...prev, resourceType: types[0].value as 'STAFF' | 'ROOM' | 'BOTH' }));
        }
      } catch (error) {
        console.error('Failed to fetch merchant config:', error);
        // 出错时使用默认值
        setAvailableResourceTypes([{ value: 'STAFF', label: t('services.staff') }]);
      }
    };
    
    if (open) {
      fetchMerchantConfig();
    }
  }, [open, user?.tenantId, t]);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && service) {
        setFormData({
          name: service.name,
          categoryId: service.categoryId,
          price: service.price,
          duration: service.duration,
          description: service.description,
          status: service.status,
          resourceType: service.resourceType,
        });
      } else {
        setFormData({
          name: '',
          categoryId: 0,
          price: 0,
          duration: 60,
          description: '',
          status: 'ACTIVE',
          resourceType: availableResourceTypes.length > 0 ? availableResourceTypes[0].value as 'STAFF' | 'ROOM' | 'BOTH' : 'STAFF',
        });
      }
      setErrors({});
    }
  }, [open, mode, service, availableResourceTypes]);

  const handleChange = (field: keyof ServiceManagementType) => (event: any) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;

    // 对数值字段进行类型转换
    if (field === 'price' || field === 'duration') {
      value = value === '' ? 0 : parseFloat(value) || 0;
    } else if (field === 'categoryId') {
      value = value === '' ? 0 : parseInt(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('services.nameRequired');
    }

    if (!formData.categoryId) {
      newErrors.categoryId = t('services.categoryRequired');
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = t('services.priceRequired');
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = t('services.durationRequired');
    }

    if (!formData.description?.trim()) {
      newErrors.description = t('services.descriptionRequired');
    }

    if (!formData.resourceType) {
      newErrors.resourceType = t('services.resourceTypeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const serviceData: Partial<ServiceManagementType> = {
      ...formData,
    };

    onSave(serviceData);
  };

  const formatCurrency = (value: number | string | undefined) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return CurrencyUtils.formatAmount(numValue);
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
            {mode === 'add' ? t('services.addService') : t('services.editService')}
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
              {t('services.basicInfo')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('services.serviceName')}
                  value={formData.name || ''}
                  onChange={handleChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
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
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel>{t('services.category')}</InputLabel>
                  <Select
                    value={formData.categoryId && categories.filter(c => c.status === 'ACTIVE').some(c => c.id === formData.categoryId) ? formData.categoryId : ''}
                    onChange={handleChange('categoryId')}
                    label={t('services.category')}
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
                    {categories.filter(c => c.status === 'ACTIVE').map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.categoryId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.categoryId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" justifyContent="space-between" p={2}
                  sx={{
                    border: '1px solid',
                    borderColor: alpha(THEME_COLOR, 0.2),
                    borderRadius: 2,
                    height: '56px',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {t('dialogs.serviceStatus')}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === 'ACTIVE'}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            status: e.target.checked ? 'ACTIVE' : 'INACTIVE'
                          }));
                        }}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: THEME_COLOR,
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: THEME_COLOR,
                          },
                        }}
                      />
                    }
                    label={formData.status === 'ACTIVE' ? t('dialogs.enabled') : t('dialogs.disabled')}
                    labelPlacement="start"
                    sx={{
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        color: formData.status === 'ACTIVE' ? '#10B981' : 'text.secondary',
                        fontWeight: 500,
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* 服务详情 */}
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
              {t('services.serviceDetails')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('services.price')}
                  type="number"
                  value={formData.price || ''}
                  onChange={handleChange('price')}
                  error={!!errors.price}
                  helperText={errors.price || formatCurrency(formData.price || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PriceIcon sx={{ color: THEME_COLOR }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
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
                  label={t('services.duration')}
                  type="number"
                  value={formData.duration || ''}
                  onChange={handleChange('duration')}
                  error={!!errors.duration}
                  helperText={errors.duration || `${formData.duration || 0} ${t('dialogs.minutes')}`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon sx={{ color: THEME_COLOR }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 15, step: 15 }}
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
                <FormControl fullWidth error={!!errors.resourceType}>
                  <InputLabel>{t('services.resourceType')}</InputLabel>
                  <Select
                    value={
                      availableResourceTypes.length > 0 &&
                      availableResourceTypes.find(t => t.value === formData.resourceType)
                        ? formData.resourceType
                        : availableResourceTypes.length > 0
                        ? availableResourceTypes[0].value
                        : ''
                    }
                    onChange={handleChange('resourceType')}
                    label={t('services.resourceType')}
                    disabled={availableResourceTypes.length <= 1}
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
                    {availableResourceTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.resourceType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.resourceType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('services.description')}
                  multiline
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleChange('description')}
                  error={!!errors.description}
                  helperText={errors.description}
                  placeholder={t('dialogs.serviceDescriptionPlaceholder')}
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
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            color: '#666',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {t('services.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
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
          {mode === 'add' ? t('services.create') : t('services.update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDialog;