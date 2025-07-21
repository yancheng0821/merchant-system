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
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Typography variant="h6">
          {t('services.manageCategoriesTitle')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 分类列表 */}
          <Grid item xs={12} md={8}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">
                {t('services.existingCategories')}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                size="small"
              >
                {t('services.addCategory')}
              </Button>
            </Box>

            <List>
              {localCategories.map((category) => (
                <ListItem key={category.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: category.color }}>
                          {getCategoryIcon(category.icon)}
                        </Box>
                        <Typography variant="subtitle1">
                          {category.name}
                        </Typography>
                        <Chip
                          label={category.isActive ? t('services.active') : t('services.inactive')}
                          color={category.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {category.nameEn}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={category.isActive}
                      onChange={() => handleToggleActive(category)}
                      size="small"
                    />
                    <IconButton
                      onClick={() => handleEdit(category)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(category)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* 编辑表单 */}
          <Grid item xs={12} md={4}>
            {(isAdding || editingCategory) && (
              <Box>
                <Typography variant="h6" gutterBottom color="primary">
                  {isAdding ? t('services.addNewCategory') : t('services.editCategory')}
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    fullWidth
                    label={t('services.categoryName')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={!!errors.name}
                    helperText={errors.name}
                    size="small"
                    required
                  />

                  <TextField
                    fullWidth
                    label={t('services.categoryNameEn')}
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    error={!!errors.nameEn}
                    helperText={errors.nameEn}
                    size="small"
                    required
                  />

                  <TextField
                    fullWidth
                    label={t('services.categoryDescription')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    error={!!errors.description}
                    helperText={errors.description}
                    multiline
                    rows={2}
                    size="small"
                    required
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>{t('services.categoryIcon')}</InputLabel>
                    <Select
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      label={t('services.categoryIcon')}
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
                    <Typography variant="body2" gutterBottom>
                      {t('services.categoryColor')}
                    </Typography>
                    <Grid container spacing={1}>
                      {colorOptions.map((color) => (
                        <Grid item key={color}>
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              backgroundColor: color,
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                            }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      variant="contained"
                      onClick={handleSaveCategory}
                      size="small"
                      fullWidth
                    >
                      {isAdding ? t('services.create') : t('services.update')}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      size="small"
                      fullWidth
                    >
                      {t('services.cancel')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {!isAdding && !editingCategory && (
              <Alert severity="info">
                {t('services.selectCategoryToEdit')}
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('services.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {t('services.saveChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceCategoryDialog; 