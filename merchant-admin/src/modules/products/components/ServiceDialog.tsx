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
  Switch,
  FormControlLabel,
  Typography,
  Autocomplete,
  InputAdornment,
  Box,
  alpha,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as ServiceIcon,
  Person as PersonIcon,
  AttachMoney as PriceIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Service, ServiceCategory } from '../ServiceManagement';

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (service: Partial<Service>) => void;
  service: Service | null;
  categories: ServiceCategory[];
  mode: 'add' | 'edit';
}

// 模拟员工数据
const mockStaff = [
  'Sarah Johnson',
  'Jennifer Wong',
  'Maria Lopez',
  'Alex Chen',
  'Emily Davis',
];

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onClose,
  onSave,
  service,
  categories,
  mode,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    nameEn: '',
    categoryId: '',
    price: 0,
    duration: 60,
    description: '',
    descriptionEn: '',
    isActive: true,
    skillLevel: 'intermediate',
    availableStaff: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && service) {
        setFormData({
          name: service.name,
          nameEn: service.nameEn,
          categoryId: service.categoryId,
          price: service.price,
          duration: service.duration,
          description: service.description,
          descriptionEn: service.descriptionEn,
          isActive: service.isActive,
          skillLevel: service.skillLevel,
          availableStaff: service.availableStaff,
        });
      } else {
        setFormData({
          name: '',
          nameEn: '',
          categoryId: '',
          price: 0,
          duration: 60,
          description: '',
          descriptionEn: '',
          isActive: true,
          skillLevel: 'intermediate',
          availableStaff: [],
        });
      }
      setErrors({});
    }
  }, [open, mode, service]);

  const handleChange = (field: keyof Service) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStaffChange = (event: any, newValue: string[]) => {
    setFormData(prev => ({
      ...prev,
      availableStaff: newValue
    }));
    // 清除员工选择的错误
    if (errors.availableStaff) {
      setErrors(prev => ({ ...prev, availableStaff: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('services.nameRequired');
    }

    if (!formData.nameEn?.trim()) {
      newErrors.nameEn = t('services.nameEnRequired');
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

    if (!formData.availableStaff || formData.availableStaff.length === 0) {
      newErrors.availableStaff = t('services.staffRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const category = categories.find(c => c.id === formData.categoryId);
    const serviceData: Partial<Service> = {
      ...formData,
      category: category?.name || '',
    };

    onSave(serviceData);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toFixed(2)}`;
  };

  const skillLevels = [
    { value: 'beginner', label: t('services.beginner') },
    { value: 'intermediate', label: t('services.intermediate') },
    { value: 'advanced', label: t('services.advanced') },
    { value: 'expert', label: t('services.expert') },
  ];

  const getSkillLevelColor = (level: string) => {
    const colors = {
      beginner: '#10B981',
      intermediate: '#F59E0B', 
      advanced: '#EF4444',
      expert: '#8B5CF6'
    };
    return colors[level as keyof typeof colors] || colors.intermediate;
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
                          {/* {t('dialogs.basicInfo')} */}
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
                <ServiceIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
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
                  label={t('services.serviceNameEn')}
                  value={formData.nameEn || ''}
                  onChange={handleChange('nameEn')}
                  error={!!errors.nameEn}
                  helperText={errors.nameEn}
                  placeholder="Service Name (English)"
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
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel>{t('services.category')}</InputLabel>
                  <Select
                    value={formData.categoryId || ''}
                    onChange={handleChange('categoryId')}
                    label={t('services.category')}
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
                    {categories.filter(c => c.isActive).map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon sx={{ fontSize: 16, color: '#EC4899' }} />
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
                       borderColor: alpha('#EC4899', 0.2),
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
                        checked={formData.isActive || false}
                        onChange={handleChange('isActive')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#EC4899',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#EC4899',
                          },
                        }}
                      />
                    }
                    label={formData.isActive ? t('dialogs.enabled') : t('dialogs.disabled')}
                    labelPlacement="start"
                    sx={{ 
                      margin: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        color: formData.isActive ? '#10B981' : 'text.secondary',
                        fontWeight: 500,
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

                          {/* {t('dialogs.serviceDetails')} */}
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
                <PriceIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
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
                        <PriceIcon sx={{ color: '#EC4899' }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
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
                        <TimeIcon sx={{ color: '#EC4899' }} />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 15, step: 15 }}
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

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('services.skillLevel')}</InputLabel>
                  <Select
                    value={formData.skillLevel || 'intermediate'}
                    onChange={handleChange('skillLevel')}
                    label={t('services.skillLevel')}
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
                    {skillLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: getSkillLevelColor(level.value),
                            }}
                          />
                          {level.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
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
                  label={t('services.descriptionEn')}
                  multiline
                  rows={2}
                  value={formData.descriptionEn || ''}
                  onChange={handleChange('descriptionEn')}
                  placeholder="Service description in English (optional)..."
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

                          {/* {t('dialogs.staffConfiguration')} */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
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
                {t('services.staffConfiguration')}
              </Typography>
            </Box>

            <Autocomplete
              multiple
              options={mockStaff}
              value={formData.availableStaff || []}
              onChange={handleStaffChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    sx={{
                      backgroundColor: alpha('#EC4899', 0.1),
                      color: '#EC4899',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: '#EC4899',
                      },
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('services.availableStaff')}
                  placeholder={t('services.selectStaff')}
                  error={!!errors.availableStaff}
                  helperText={errors.availableStaff}
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

            {formData.availableStaff && formData.availableStaff.length > 0 && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  backgroundColor: alpha('#3B82F6', 0.1),
                  borderColor: alpha('#3B82F6', 0.2),
                }}
              >
                {t('dialogs.selectedStaffCount', { count: formData.availableStaff.length })}
              </Alert>
            )}
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
          {t('services.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
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
          {mode === 'add' ? t('services.create') : t('services.update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceDialog; 