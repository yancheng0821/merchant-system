import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCut as HairIcon,
  Spa as SpaIcon,
  Face as FaceIcon,
  LocalOffer as NailIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ServiceCategory } from '../ServiceManagement';

interface ServiceCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  onSave: (categories: ServiceCategory[]) => void;
}

const ServiceCategoryDialog: React.FC<ServiceCategoryDialogProps> = ({
  open,
  onClose,
  categories,
  onSave,
}) => {
  const { t } = useTranslation();
  const [localCategories, setLocalCategories] = useState<ServiceCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    icon: 'hair',
    color: '#FF6B6B',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 统一的主题色
  const themeColor = '#06B6D4';

  React.useEffect(() => {
    if (open) {
      setLocalCategories([...categories]);
      setEditingCategory(null);
      setIsAdding(false);
      setFormData({
        name: '',
        nameEn: '',
        description: '',
        icon: 'hair',
        color: '#FF6B6B',
      });
      setErrors({});
    }
  }, [open, categories]);

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      icon: 'hair',
      color: '#FF6B6B',
    });
    setErrors({});
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setIsAdding(false);
    setFormData({
      name: category.name,
      nameEn: category.nameEn,
      description: category.description,
      icon: category.icon,
      color: category.color,
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setIsAdding(false);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      icon: 'hair',
      color: '#FF6B6B',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('services.categoryNameRequired');
    }

    if (!formData.nameEn.trim()) {
      newErrors.nameEn = t('services.categoryNameEnRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('services.categoryDescriptionRequired');
    }

    // 检查名称是否已存在
    const existingCategory = localCategories.find(c => 
      c.name === formData.name && c.id !== editingCategory?.id
    );
    if (existingCategory) {
      newErrors.name = t('services.categoryNameExists');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCategory = () => {
    if (!validateForm()) return;

    if (isAdding) {
      const newCategory: ServiceCategory = {
        id: `cat_${Date.now()}`,
        name: formData.name,
        nameEn: formData.nameEn,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        isActive: true,
        displayOrder: localCategories.length + 1,
      };
      setLocalCategories(prev => [...prev, newCategory]);
    } else if (editingCategory) {
      setLocalCategories(prev => prev.map(c =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: formData.name,
              nameEn: formData.nameEn,
              description: formData.description,
              icon: formData.icon,
              color: formData.color,
            }
          : c
      ));
    }

    handleCancelEdit();
  };

  const handleToggleActive = (category: ServiceCategory) => {
    setLocalCategories(prev => prev.map(c =>
      c.id === category.id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const handleDelete = (category: ServiceCategory) => {
    setLocalCategories(prev => prev.filter(c => c.id !== category.id));
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'hair': return <HairIcon />;
      case 'spa': return <SpaIcon />;
      case 'face': return <FaceIcon />;
      case 'nail': return <NailIcon />;
      case 'star': return <StarIcon />;
      default: return <HairIcon />;
    }
  };

  const iconOptions = [
    { value: 'hair', label: t('services.iconHair'), icon: <HairIcon /> },
    { value: 'spa', label: t('services.iconSpa'), icon: <SpaIcon /> },
    { value: 'face', label: t('services.iconFace'), icon: <FaceIcon /> },
    { value: 'nail', label: t('services.iconNail'), icon: <NailIcon /> },
    { value: 'star', label: t('services.iconStar'), icon: <StarIcon /> },
  ];

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE',
    '#82E0AA', '#F8C471', '#85C1E9', '#F1948A', '#D2B4DE'
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${themeColor}20`,
        color: themeColor,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('services.manageCategoriesTitle')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        <Grid container spacing={3}>
          {/* 分类列表 */}
          <Grid item xs={12} md={8}>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={3}
              sx={{
                p: 2,
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Typography variant="h6" sx={{ color: themeColor, fontWeight: 600 }}>
                {t('services.existingCategories')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${themeColor}, #0891B2)`,
                  boxShadow: `0 4px 15px ${themeColor}30`,
                  fontWeight: 600,
                  '&:hover': {
                    background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 20px ${themeColor}40`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('services.addCategory')}
              </Button>
            </Box>

            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <List sx={{ p: 0 }}>
                {localCategories.map((category, index) => (
                  <ListItem 
                    key={category.id} 
                    divider={index < localCategories.length - 1}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: `${themeColor}08`,
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box 
                            sx={{ 
                              color: 'white',
                              backgroundColor: category.color,
                              borderRadius: 2,
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 40,
                              height: 40,
                            }}
                          >
                            {getCategoryIcon(category.icon)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.nameEn}
                            </Typography>
                          </Box>
                          <Chip
                            label={category.isActive ? t('services.active') : t('services.inactive')}
                            sx={{
                              backgroundColor: category.isActive 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : 'rgba(107, 114, 128, 0.1)',
                              color: category.isActive ? '#10B981' : '#6B7280',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ mt: 1, display: 'block' }}
                        >
                          {category.description}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Switch
                          checked={category.isActive}
                          onChange={() => handleToggleActive(category)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: themeColor,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: themeColor,
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => handleEdit(category)}
                          size="small"
                          sx={{
                            color: themeColor,
                            '&:hover': {
                              backgroundColor: `${themeColor}15`,
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(category)}
                          size="small"
                          sx={{
                            color: '#EF4444',
                            '&:hover': {
                              backgroundColor: '#EF444415',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          {/* 编辑表单 */}
          <Grid item xs={12} md={4}>
            {(isAdding || editingCategory) && (
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  p: 3,
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: themeColor, 
                    fontWeight: 600,
                    mb: 3,
                    pb: 2,
                    borderBottom: `2px solid ${themeColor}20`,
                  }}
                >
                  {isAdding ? t('services.addNewCategory') : t('services.editCategory')}
                </Typography>

                <Box display="flex" flexDirection="column" gap={3}>
                  <TextField
                    fullWidth
                    label={t('services.categoryName')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${themeColor}80`,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('services.categoryNameEn')}
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    error={!!errors.nameEn}
                    helperText={errors.nameEn}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${themeColor}80`,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('services.categoryDescription')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    error={!!errors.description}
                    helperText={errors.description}
                    multiline
                    rows={3}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${themeColor}80`,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>{t('services.categoryIcon')}</InputLabel>
                    <Select
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      label={t('services.categoryIcon')}
                      sx={{
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${themeColor}80`,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      }}
                    >
                      {iconOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('services.categoryColor')}
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: '#f8fafc',
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Grid container spacing={1}>
                        {colorOptions.map((color) => (
                          <Grid item key={color}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: color,
                                borderRadius: 2,
                                cursor: 'pointer',
                                border: formData.color === color 
                                  ? `3px solid ${themeColor}` 
                                  : '2px solid #e2e8f0',
                                boxShadow: formData.color === color 
                                  ? `0 0 0 2px ${themeColor}30` 
                                  : 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                },
                              }}
                              onClick={() => setFormData(prev => ({ ...prev, color }))}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>

                  <Box display="flex" gap={2} mt={3}>
                    <Button
                      variant="contained"
                      onClick={handleSaveCategory}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${themeColor}, #0891B2)`,
                        boxShadow: `0 4px 15px ${themeColor}30`,
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 20px ${themeColor}40`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isAdding ? t('services.create') : t('services.update')}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        borderColor: '#6B7280',
                        color: '#6B7280',
                        py: 1.5,
                        '&:hover': {
                          borderColor: '#4B5563',
                          backgroundColor: '#F9FAFB',
                        },
                      }}
                    >
                      {t('services.cancel')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {!isAdding && !editingCategory && (
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: `${themeColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <EditIcon sx={{ fontSize: 32, color: themeColor }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('services.selectCategoryToEdit')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('services.selectCategoryToEditDescription')}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${themeColor}20`,
        backgroundColor: '#f8fafc',
        gap: 2,
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            borderRadius: 2,
            px: 4,
            py: 1.5,
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6',
            },
          }}
        >
          {t('services.cancel')}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: `linear-gradient(135deg, ${themeColor}, #0891B2)`,
            boxShadow: `0 4px 15px ${themeColor}30`,
            fontWeight: 600,
            '&:hover': {
              background: `linear-gradient(135deg, #0891B2, #0E7490)`,
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 20px ${themeColor}40`,
            },
            transition: 'all 0.3s ease',
          }}
        >
          {t('services.saveChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceCategoryDialog; 