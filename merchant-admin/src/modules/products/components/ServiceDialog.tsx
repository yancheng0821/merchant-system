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
import { ServiceManagement as ServiceManagementType, ServiceCategory } from '../../../services/api';

// 主题颜色 - 使用青色主题
const THEME_COLOR = '#06B6D4';
const THEME_COLOR_DARK = '#0891B2';
const THEME_COLOR_DARKER = '#0E7490';

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: Partial<ServiceManagementType>) => void;
  service: ServiceManagementType | null;
  categories: ServiceCategory[];
  mode: 'add' | 'edit';
}

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onClose,
  onSave,
  service,
  categories,
  mode,
}) => {
  const { t } = useTranslation();
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
          resourceType: 'STAFF',
        });
      }
      setErrors({});
    }
  }, [open, mode, service]);

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
    return `¥${numValue.toFixed(2)}`;
  };

  const resourceTypes = [
    { value: 'STAFF', label: t('services.staff') },
    { value: 'ROOM', label: t('services.room') },
    { value: 'BOTH', label: t('services.both') },
  ];

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
          background: `linear-gradient(135deg, ${alpha(THEME_COLOR, 0.08)}, ${alpha(THEME_COLOR_DARK, 0.08)})`,
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
                background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ServiceIcon sx={{ fontSize: 24 }} />
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
                {mode === 'add' ? t('services.addService') : t('services.editService')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === 'add' ? t('dialogs.createNewService') : t('dialogs.editService')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha(THEME_COLOR, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* 基本信息 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha(THEME_COLOR, 0.2),
              borderRadius: 2,
              background: alpha(THEME_COLOR, 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <ServiceIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                {t('services.basicInfo')}
              </Typography>
            </Box>

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
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha(THEME_COLOR, 0.2),
              borderRadius: 2,
              background: alpha(THEME_COLOR, 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PriceIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                {t('services.serviceDetails')}
              </Typography>
            </Box>

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
                    value={formData.resourceType || 'STAFF'}
                    onChange={handleChange('resourceType')}
                    label={t('services.resourceType')}
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
                    {resourceTypes.map((type) => (
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
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha(THEME_COLOR, 0.02),
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
          {t('services.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 3,
            background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
            boxShadow: `0 4px 15px ${alpha(THEME_COLOR, 0.3)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${THEME_COLOR_DARK}, ${THEME_COLOR_DARKER})`,
              boxShadow: `0 6px 20px ${alpha(THEME_COLOR, 0.4)}`,
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