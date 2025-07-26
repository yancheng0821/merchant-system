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

  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  // 美容护理类
  ContentCut as HairIcon,
  Spa as SpaIcon,
  Face as FaceIcon,
  LocalOffer as NailIcon,
  // 健康医疗类
  LocalHospital as MedicalIcon,
  Healing as HealingIcon,
  Psychology as TherapyIcon,
  SelfImprovement as YogaIcon,
  // 运动健身类
  FitnessCenter as GymIcon,
  Pool as SwimmingIcon,
  SportsBasketball as SportsIcon,
  DirectionsRun as RunningIcon,
  SportsKabaddi as MartialArtsIcon,
  // 娱乐休闲类
  MusicNote as MusicIcon,
  Movie as MovieIcon,
  Videocam as VideoIcon,
  PhotoCamera as PhotoIcon,
  Brush as ArtIcon,
  Piano as PianoIcon,
  // 教育培训类
  School as EducationIcon,
  MenuBook as BookIcon,
  Computer as ComputerIcon,
  Language as LanguageIcon,
  // 商务服务类
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  Gavel as LegalIcon,
  Engineering as EngineeringIcon,
  // 生活服务类
  Restaurant as FoodIcon,
  LocalLaundryService as LaundryIcon,
  CleaningServices as CleaningIcon,
  Build as RepairIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  // 交通出行类
  DirectionsCar as CarIcon,
  LocalTaxi as TaxiIcon,
  TwoWheeler as BikeIcon,
  Flight as FlightIcon,
  // 宠物服务类
  Pets as PetIcon,
  // 购物零售类
  ShoppingCart as ShoppingIcon,
  Store as StoreIcon,
  LocalMall as MallIcon,
  // 通用图标
  Star as StarIcon,
  Favorite as HeartIcon,
  Diamond as DiamondIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  LocalFlorist as FlowerIcon,
  WbSunny as SunIcon,
  Nightlight as MoonIcon,
  // 科技数码类
  PhoneAndroid as PhoneIcon,
  Laptop as LaptopIcon,
  Watch as WatchIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ServiceCategory, serviceCategoryApi, handleApiError } from '../../../services/api';

interface ServiceCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  onSave: (categories: ServiceCategory[]) => void;
  tenantId: number;
}

const ServiceCategoryDialog: React.FC<ServiceCategoryDialogProps> = ({
  open,
  onClose,
  categories,
  onSave,
  tenantId,
}) => {
  const { t } = useTranslation();
  const [localCategories, setLocalCategories] = useState<ServiceCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    icon: string;
    color: string;
    sortOrder: number;
  }>({
    name: '',
    description: '',
    icon: 'hair',
    color: '#FF6B6B',
    sortOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 统一的主题色
  const themeColor = '#06B6D4';

  React.useEffect(() => {
    if (open) {
      setLocalCategories([...categories]);
      setEditingCategory(null);
      setIsAdding(false);
      setFormData({
        name: '',
        description: '',
        icon: 'hair',
        color: '#FF6B6B',
        sortOrder: 0,
      });
      setErrors({});
    }
  }, [open, categories]);

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'hair',
      color: '#FF6B6B',
      sortOrder: localCategories.length,
    });
    setErrors({});
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    setIsAdding(false);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'hair',
      color: category.color || '#FF6B6B',
      sortOrder: category.sortOrder,
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setIsAdding(false);
    setFormData({
      name: '',
      description: '',
      icon: 'hair',
      color: '#FF6B6B',
      sortOrder: 0,
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('services.categoryNameRequired');
    }

    if (!formData.description?.trim()) {
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

  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (isAdding) {
        const newCategoryData = {
          tenantId,
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          sortOrder: formData.sortOrder,
          status: 'ACTIVE' as const,
        };
        const newCategory = await serviceCategoryApi.createCategory(newCategoryData);
        setLocalCategories(prev => [...prev, newCategory]);
      } else if (editingCategory) {
        const updatedCategoryData = {
          tenantId: editingCategory.tenantId,
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          sortOrder: formData.sortOrder,
          status: editingCategory.status,
        };
        const updatedCategory = await serviceCategoryApi.updateCategory(editingCategory.id, updatedCategoryData);
        setLocalCategories(prev => prev.map(c =>
          c.id === editingCategory.id ? updatedCategory : c
        ));
      }

      handleCancelEdit();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: ServiceCategory) => {
    try {
      const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updatedCategory = await serviceCategoryApi.updateCategory(category.id, { 
        tenantId: category.tenantId,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        status: newStatus 
      });
      setLocalCategories(prev => prev.map(c =>
        c.id === category.id ? updatedCategory : c
      ));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (category: ServiceCategory) => {
    try {
      await serviceCategoryApi.deleteCategory(category.id);
      setLocalCategories(prev => prev.filter(c => c.id !== category.id));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      // 美容护理类
      case 'hair': return <HairIcon />;
      case 'spa': return <SpaIcon />;
      case 'face': return <FaceIcon />;
      case 'nail': return <NailIcon />;
      // 健康医疗类
      case 'medical': return <MedicalIcon />;
      case 'healing': return <HealingIcon />;
      case 'therapy': return <TherapyIcon />;
      case 'yoga': return <YogaIcon />;
      // 运动健身类
      case 'gym': return <GymIcon />;
      case 'swimming': return <SwimmingIcon />;
      case 'sports': return <SportsIcon />;
      case 'running': return <RunningIcon />;
      case 'martialarts': return <MartialArtsIcon />;
      // 娱乐休闲类
      case 'music': return <MusicIcon />;
      case 'movie': return <MovieIcon />;
      case 'video': return <VideoIcon />;
      case 'photo': return <PhotoIcon />;
      case 'art': return <ArtIcon />;
      case 'piano': return <PianoIcon />;
      // 教育培训类
      case 'education': return <EducationIcon />;
      case 'book': return <BookIcon />;
      case 'computer': return <ComputerIcon />;
      case 'language': return <LanguageIcon />;
      // 商务服务类
      case 'business': return <BusinessIcon />;
      case 'bank': return <BankIcon />;
      case 'legal': return <LegalIcon />;
      case 'engineering': return <EngineeringIcon />;
      // 生活服务类
      case 'food': return <FoodIcon />;
      case 'laundry': return <LaundryIcon />;
      case 'cleaning': return <CleaningIcon />;
      case 'repair': return <RepairIcon />;
      case 'electrical': return <ElectricalIcon />;
      case 'plumbing': return <PlumbingIcon />;
      // 交通出行类
      case 'car': return <CarIcon />;
      case 'taxi': return <TaxiIcon />;
      case 'bike': return <BikeIcon />;
      case 'flight': return <FlightIcon />;
      // 宠物服务类
      case 'pet': return <PetIcon />;
      // 购物零售类
      case 'shopping': return <ShoppingIcon />;
      case 'store': return <StoreIcon />;
      case 'mall': return <MallIcon />;
      // 通用图标
      case 'star': return <StarIcon />;
      case 'heart': return <HeartIcon />;
      case 'diamond': return <DiamondIcon />;
      case 'trophy': return <TrophyIcon />;
      case 'celebration': return <CelebrationIcon />;
      case 'flower': return <FlowerIcon />;
      case 'sun': return <SunIcon />;
      case 'moon': return <MoonIcon />;
      // 科技数码类
      case 'phone': return <PhoneIcon />;
      case 'laptop': return <LaptopIcon />;
      case 'watch': return <WatchIcon />;
      default: return <HairIcon />;
    }
  };

  const iconOptions = [
    // 美容护理类
    { value: 'hair', label: '美发护理', icon: <HairIcon /> },
    { value: 'spa', label: 'SPA水疗', icon: <SpaIcon /> },
    { value: 'face', label: '面部护理', icon: <FaceIcon /> },
    { value: 'nail', label: '美甲服务', icon: <NailIcon /> },
    
    // 健康医疗类
    { value: 'medical', label: '医疗服务', icon: <MedicalIcon /> },
    { value: 'healing', label: '康复理疗', icon: <HealingIcon /> },
    { value: 'therapy', label: '心理咨询', icon: <TherapyIcon /> },
    { value: 'yoga', label: '瑜伽冥想', icon: <YogaIcon /> },
    
    // 运动健身类
    { value: 'gym', label: '健身训练', icon: <GymIcon /> },
    { value: 'swimming', label: '游泳教学', icon: <SwimmingIcon /> },
    { value: 'sports', label: '体育运动', icon: <SportsIcon /> },
    { value: 'running', label: '跑步训练', icon: <RunningIcon /> },
    { value: 'martialarts', label: '武术格斗', icon: <MartialArtsIcon /> },
    
    // 娱乐休闲类
    { value: 'music', label: '音乐服务', icon: <MusicIcon /> },
    { value: 'movie', label: '影视娱乐', icon: <MovieIcon /> },
    { value: 'video', label: '视频制作', icon: <VideoIcon /> },
    { value: 'photo', label: '摄影服务', icon: <PhotoIcon /> },
    { value: 'art', label: '艺术创作', icon: <ArtIcon /> },
    { value: 'piano', label: '钢琴教学', icon: <PianoIcon /> },
    
    // 教育培训类
    { value: 'education', label: '教育培训', icon: <EducationIcon /> },
    { value: 'book', label: '阅读指导', icon: <BookIcon /> },
    { value: 'computer', label: '计算机培训', icon: <ComputerIcon /> },
    { value: 'language', label: '语言学习', icon: <LanguageIcon /> },
    
    // 商务服务类
    { value: 'business', label: '商务服务', icon: <BusinessIcon /> },
    { value: 'bank', label: '金融服务', icon: <BankIcon /> },
    { value: 'legal', label: '法律咨询', icon: <LegalIcon /> },
    { value: 'engineering', label: '工程技术', icon: <EngineeringIcon /> },
    
    // 生活服务类
    { value: 'food', label: '餐饮服务', icon: <FoodIcon /> },
    { value: 'laundry', label: '洗衣服务', icon: <LaundryIcon /> },
    { value: 'cleaning', label: '清洁服务', icon: <CleaningIcon /> },
    { value: 'repair', label: '维修服务', icon: <RepairIcon /> },
    { value: 'electrical', label: '电工服务', icon: <ElectricalIcon /> },
    { value: 'plumbing', label: '水管维修', icon: <PlumbingIcon /> },
    
    // 交通出行类
    { value: 'car', label: '汽车服务', icon: <CarIcon /> },
    { value: 'taxi', label: '出租车', icon: <TaxiIcon /> },
    { value: 'bike', label: '自行车', icon: <BikeIcon /> },
    { value: 'flight', label: '航空服务', icon: <FlightIcon /> },
    
    // 宠物服务类
    { value: 'pet', label: '宠物服务', icon: <PetIcon /> },
    
    // 购物零售类
    { value: 'shopping', label: '购物服务', icon: <ShoppingIcon /> },
    { value: 'store', label: '零售商店', icon: <StoreIcon /> },
    { value: 'mall', label: '商场服务', icon: <MallIcon /> },
    
    // 通用图标
    { value: 'star', label: '星级服务', icon: <StarIcon /> },
    { value: 'heart', label: '爱心服务', icon: <HeartIcon /> },
    { value: 'diamond', label: '钻石服务', icon: <DiamondIcon /> },
    { value: 'trophy', label: '获奖服务', icon: <TrophyIcon /> },
    { value: 'celebration', label: '庆典服务', icon: <CelebrationIcon /> },
    { value: 'flower', label: '花艺服务', icon: <FlowerIcon /> },
    { value: 'sun', label: '阳光服务', icon: <SunIcon /> },
    { value: 'moon', label: '夜间服务', icon: <MoonIcon /> },
    
    // 科技数码类
    { value: 'phone', label: '手机服务', icon: <PhoneIcon /> },
    { value: 'laptop', label: '电脑服务', icon: <LaptopIcon /> },
    { value: 'watch', label: '手表服务', icon: <WatchIcon /> },
  ];

  const colorOptions = [
    // 红色系
    '#FF6B6B', '#FF5722', '#E91E63', '#F44336', '#DC143C', '#B71C1C',
    // 粉色系
    '#FF69B4', '#FF1493', '#C2185B', '#AD1457', '#880E4F', '#FCE4EC',
    // 橙色系
    '#FF9800', '#FF7043', '#FF8A65', '#FFAB91', '#FFCCBC',
    // 黄色系
    '#FFC107', '#FFD54F', '#FFEB3B', '#FFEE58', '#FFF176', '#FFF59D',
    // 绿色系
    '#4CAF50', '#8BC34A', '#CDDC39', '#9CCC65', '#AED581', '#C5E1A5',
    // 青色系
    '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2', '#E0F2F1',
    // 蓝色系
    '#2196F3', '#03A9F4', '#0097A7', '#006064', '#E1F5FE',
    // 深蓝色系
    '#3F51B5', '#303F9F', '#1A237E', '#536DFE', '#7986CB', '#9FA8DA',
    // 紫色系
    '#9C27B0', '#673AB7', '#7B1FA2', '#4A148C', '#E1BEE7',
    // 棕色系
    '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9',
    // 灰色系
    '#607D8B', '#78909C', '#90A4AE', '#B0BEC5', '#CFD8DC', '#ECEFF1',
    // 特殊色彩
    '#FF4081', '#E040FB', '#7C4DFF', '#448AFF', '#40C4FF',
    '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00',
    '#FFD740', '#FFAB40', '#FF6E40', '#FF5252', '#FF1744', '#F50057',
    // 渐变色风格
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
    '#ff9a9e', '#fecfef', '#ffeaa7', '#fab1a0', '#fd79a8', '#fdcb6e'
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
        {t('services.manageCategoriesTitle')}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#f8fafc' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
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
              <Typography variant="h5" sx={{ color: themeColor, fontWeight: 600 }}>
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
                            {getCategoryIcon(category.icon || 'hair')}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {category.name}
                            </Typography>
                          </Box>
                          <Chip
                            label={category.status === 'ACTIVE' ? t('services.active') : t('services.inactive')}
                            sx={{
                              backgroundColor: category.status === 'ACTIVE' 
                                ? 'rgba(16, 185, 129, 0.1)' 
                                : 'rgba(107, 114, 128, 0.1)',
                              color: category.status === 'ACTIVE' ? '#10B981' : '#6B7280',
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
                          checked={category.status === 'ACTIVE'}
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
                  variant="h5" 
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



                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t('services.categoryIcon')}
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
                        {iconOptions.map((option) => (
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
                                  ? `2px solid ${themeColor}` 
                                  : '1px solid #e2e8f0',
                                backgroundColor: formData.icon === option.value 
                                  ? `${themeColor}10` 
                                  : 'white',
                                color: formData.icon === option.value 
                                  ? themeColor 
                                  : '#6B7280',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  backgroundColor: `${themeColor}08`,
                                  color: themeColor,
                                },
                              }}
                              onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                              title={option.label}
                            >
                              {option.icon}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>

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
                        maxHeight: 240,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f1f1f1',
                          borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: themeColor,
                          borderRadius: '3px',
                          '&:hover': {
                            backgroundColor: '#0891B2',
                          },
                        },
                      }}
                    >
                      <Grid container spacing={1}>
                        {colorOptions.map((color) => (
                          <Grid item key={color} xs="auto">
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                backgroundColor: color,
                                borderRadius: 2,
                                cursor: 'pointer',
                                border: formData.color === color 
                                  ? `2px solid ${themeColor}` 
                                  : '1px solid #e2e8f0',
                                boxShadow: formData.color === color 
                                  ? `0 0 0 2px ${themeColor}30` 
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
                              onClick={() => setFormData(prev => ({ ...prev, color }))}
                              title={color}
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
                      disabled={loading}
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
                      {loading ? t('common.saving') : (isAdding ? t('services.create') : t('services.update'))}
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
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
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