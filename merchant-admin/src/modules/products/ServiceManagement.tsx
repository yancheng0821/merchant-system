import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  Box,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Tabs,
  Tab,
  Fade,
  Divider,
} from '@mui/material';
import { PermissionButton } from '../../components/common/PermissionButton';
import { PRODUCT_PERMISSIONS } from '../../config/permissions';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  LocalOffer as ServiceIcon,
  AttachMoney as PriceIcon,
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
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { CurrencyUtils } from '../../config/constants';
import ServiceDialog from './components/ServiceDialog';
import ServiceCategoryDialog from './components/ServiceCategoryDialog';
import { PackageDialog, PackageList } from './components';
import PackageDetailsDialog from './components/PackageDetailsDialog';
import CustomDialog from '../../components/common/CustomDialog';
import { serviceManagementApi, serviceCategoryApi, packageApi, ServiceManagement as ServiceManagementType, ServiceCategory, Package, handleApiError } from '../../services/api';

// 使用从API导入的接口类型

const ServiceManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Define tabs with permissions
  const allTabsConfig = [
    { key: 'services', permission: 'products:view' as const, label: t('products.services') },
    { key: 'packages', permission: 'packages:view' as const, label: t('packages.title') },
  ];

  // Filter tabs based on permissions
  const tabsConfig = allTabsConfig.filter(tab => hasPermission(tab.permission));

  // Tab状态
  const [selectedTab, setSelectedTab] = useState(0);
  const currentTabKey = tabsConfig[selectedTab]?.key;

  // 状态管理 - Services
  const [services, setServices] = useState<ServiceManagementType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceManagementType | null>(null);

  // 状态管理 - Packages
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [viewPackageOpen, setViewPackageOpen] = useState(false);
  const [viewPackage, setViewPackage] = useState<Package | null>(null);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [packageStatusFilter, setPackageStatusFilter] = useState('');
  const [packageSortBy, setPackageSortBy] = useState<'name' | 'price' | 'discount' | 'created'>('created');
  const [packageDeleteDialogOpen, setPackageDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);

  // 对话框状态
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 获取租户ID
  const tenantId = user?.tenantId;

  // 加载数据
  const loadData = useCallback(async () => {
    if (!tenantId) {
      setServiceError('No tenant ID available');
      return;
    }

    setLoading(true);
    setServiceError(null);
    try {
      // 并行加载分类和服务数据
      const [categoriesResponse, servicesResponse] = await Promise.all([
        serviceCategoryApi.getCategories(tenantId),
        serviceManagementApi.getServices({
          tenantId,
          categoryId: categoryFilter && categoryFilter !== '' ? Number(categoryFilter) : undefined,
          status: statusFilter && statusFilter !== '' ? statusFilter : undefined,
          searchTerm: searchTerm && searchTerm !== '' ? searchTerm : undefined,
          page: page + 1,
          size: rowsPerPage,
        })
      ]);

      setCategories(categoriesResponse);
      setServices(servicesResponse.data);
      setTotalCount(servicesResponse.total);
    } catch (err) {
      setServiceError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, categoryFilter, statusFilter, searchTerm, page, rowsPerPage]);

  // 加载Packages数据
  const loadPackages = useCallback(async () => {
    if (!tenantId) return;

    setPackageLoading(true);
    try {
      const packagesResponse = await packageApi.getPackages(tenantId);
      setPackages(packagesResponse);
    } catch (err) {
      setPackageError(handleApiError(err));
    } finally {
      setPackageLoading(false);
    }
  }, [tenantId]);

  // 初始加载
  useEffect(() => {
    if (tenantId) {
      loadData();
      loadPackages();
    }
  }, [tenantId, page, rowsPerPage, categoryFilter, statusFilter, searchTerm, loadData, loadPackages]);

  // 自动清除服务错误消息
  useEffect(() => {
    if (serviceError) {
      const timer = setTimeout(() => {
        setServiceError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [serviceError]);

  // 自动清除套餐错误消息
  useEffect(() => {
    if (packageError) {
      const timer = setTimeout(() => {
        setPackageError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [packageError]);

  // 如果没有租户ID，显示错误信息
  if (!tenantId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">无法获取租户信息，请重新登录</Alert>
      </Box>
    );
  }

  const getCategoryIcon = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    const iconProps = { sx: { fontSize: 16 } };

    switch (category?.icon) {
      // 美容护理类
      case 'hair': return <HairIcon {...iconProps} />;
      case 'spa': return <SpaIcon {...iconProps} />;
      case 'face': return <FaceIcon {...iconProps} />;
      case 'nail': return <NailIcon {...iconProps} />;
      // 健康医疗类
      case 'medical': return <MedicalIcon {...iconProps} />;
      case 'healing': return <HealingIcon {...iconProps} />;
      case 'therapy': return <TherapyIcon {...iconProps} />;
      case 'yoga': return <YogaIcon {...iconProps} />;
      // 运动健身类
      case 'gym': return <GymIcon {...iconProps} />;
      case 'swimming': return <SwimmingIcon {...iconProps} />;
      case 'sports': return <SportsIcon {...iconProps} />;
      case 'running': return <RunningIcon {...iconProps} />;
      case 'martialarts': return <MartialArtsIcon {...iconProps} />;
      // 娱乐休闲类
      case 'music': return <MusicIcon {...iconProps} />;
      case 'movie': return <MovieIcon {...iconProps} />;
      case 'video': return <VideoIcon {...iconProps} />;
      case 'photo': return <PhotoIcon {...iconProps} />;
      case 'art': return <ArtIcon {...iconProps} />;
      case 'piano': return <PianoIcon {...iconProps} />;
      // 教育培训类
      case 'education': return <EducationIcon {...iconProps} />;
      case 'book': return <BookIcon {...iconProps} />;
      case 'computer': return <ComputerIcon {...iconProps} />;
      case 'language': return <LanguageIcon {...iconProps} />;
      // 商务服务类
      case 'business': return <BusinessIcon {...iconProps} />;
      case 'bank': return <BankIcon {...iconProps} />;
      case 'legal': return <LegalIcon {...iconProps} />;
      case 'engineering': return <EngineeringIcon {...iconProps} />;
      // 生活服务类
      case 'food': return <FoodIcon {...iconProps} />;
      case 'laundry': return <LaundryIcon {...iconProps} />;
      case 'cleaning': return <CleaningIcon {...iconProps} />;
      case 'repair': return <RepairIcon {...iconProps} />;
      case 'electrical': return <ElectricalIcon {...iconProps} />;
      case 'plumbing': return <PlumbingIcon {...iconProps} />;
      // 交通出行类
      case 'car': return <CarIcon {...iconProps} />;
      case 'taxi': return <TaxiIcon {...iconProps} />;
      case 'bike': return <BikeIcon {...iconProps} />;
      case 'flight': return <FlightIcon {...iconProps} />;
      // 宠物服务类
      case 'pet': return <PetIcon {...iconProps} />;
      // 购物零售类
      case 'shopping': return <ShoppingIcon {...iconProps} />;
      case 'store': return <StoreIcon {...iconProps} />;
      case 'mall': return <MallIcon {...iconProps} />;
      // 通用图标
      case 'star': return <StarIcon {...iconProps} />;
      case 'heart': return <HeartIcon {...iconProps} />;
      case 'diamond': return <DiamondIcon {...iconProps} />;
      case 'trophy': return <TrophyIcon {...iconProps} />;
      case 'celebration': return <CelebrationIcon {...iconProps} />;
      case 'flower': return <FlowerIcon {...iconProps} />;
      case 'sun': return <SunIcon {...iconProps} />;
      case 'moon': return <MoonIcon {...iconProps} />;
      // 科技数码类
      case 'phone': return <PhoneIcon {...iconProps} />;
      case 'laptop': return <LaptopIcon {...iconProps} />;
      case 'watch': return <WatchIcon {...iconProps} />;
      default: return <StoreIcon {...iconProps} />;
    }
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6366F1';
  };



  const getStatusChip = (status: string) => {
    const isActive = status === 'ACTIVE';
    return (
      <Chip
        label={isActive ? t('products.active') : t('products.inactive')}
        sx={{
          backgroundColor: isActive ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
          color: isActive ? '#10B981' : '#EF4444',
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 2,
          },
        }}
      />
    );
  };

  // 处理服务删除
  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      await serviceManagementApi.deleteService(selectedService.id);
      setDeleteDialogOpen(false);
      setSelectedService(null);
      setSuccessMessage(t('products.serviceDeletedSuccess'));
      loadData(); // 重新加载数据
    } catch (err) {
      setServiceError(t('products.serviceDeleteFailed') + ': ' + handleApiError(err));
    }
  };

  // 处理服务保存
  const handleSaveService = async (serviceData: Partial<ServiceManagementType>) => {
    try {
      if (selectedService) {
        // 更新服务 - 确保包含tenantId
        await serviceManagementApi.updateService(selectedService.id, {
          ...serviceData,
          tenantId,
        });
        setSuccessMessage(t('products.serviceUpdatedSuccess'));
      } else {
        // 创建服务
        await serviceManagementApi.createService({
          ...serviceData,
          tenantId,
        } as any);
        setSuccessMessage(t('products.serviceCreatedSuccess'));
      }
      setServiceDialogOpen(false);
      setSelectedService(null);
      loadData(); // 重新加载数据
    } catch (err) {
      const errorMessage = selectedService
        ? t('products.serviceUpdateFailed')
        : t('products.serviceCreateFailed');
      setServiceError(errorMessage + ': ' + handleApiError(err));
      // 关闭对话框以便用户可以看到错误消息
      setServiceDialogOpen(false);
      setSelectedService(null);
    }
  };

  // 处理分类保存
  const handleSaveCategories = async (categoriesData: ServiceCategory[]) => {
    try {
      // 这里可以实现批量更新分类的逻辑
      setCategoryDialogOpen(false);
      setSuccessMessage(t('products.categorySavedSuccess'));
      loadData(); // 重新加载数据
    } catch (err) {
      setServiceError(handleApiError(err));
    }
  };

  // Package处理函数
  const handleSavePackage = async (packageData: Partial<Package>) => {
    try {
      if (selectedPackage) {
        await packageApi.updatePackage(selectedPackage.id, packageData);
        setSuccessMessage(t('packages.packageUpdatedSuccess'));
      } else {
        await packageApi.createPackage({
          ...packageData,
          tenant_id: tenantId,
        });
        setSuccessMessage(t('packages.packageCreatedSuccess'));
      }
      setPackageDialogOpen(false);
      setSelectedPackage(null);
      loadPackages();
    } catch (err) {
      const errorMessage = selectedPackage
        ? t('packages.packageUpdateFailed')
        : t('packages.packageCreateFailed');
      setPackageError(errorMessage + ': ' + handleApiError(err));
      // 关闭对话框以便用户可以看到错误消息
      setPackageDialogOpen(false);
      setSelectedPackage(null);
    }
  };

  const handleDeletePackage = (pkg: Package) => {
    setPackageToDelete(pkg);
    setPackageDeleteDialogOpen(true);
  };

  const confirmDeletePackage = async () => {
    if (!packageToDelete) return;

    try {
      // 先关闭对话框，避免视觉闪烁
      setPackageDeleteDialogOpen(false);

      await packageApi.deletePackage(packageToDelete.id, tenantId!);
      setSuccessMessage(t('packages.packageDeletedSuccess'));
      setPackageToDelete(null);
      loadPackages();
    } catch (err) {
      // 显示错误消息
      setPackageError(t('packages.packageDeleteFailed') + ': ' + handleApiError(err));
      // 错误时也清空选中的包
      setPackageToDelete(null);
    }
  };

  const handleViewPackage = (pkg: Package) => {
    setViewPackage(pkg);
    setViewPackageOpen(true);
  };

  // Filter and sort packages
  const getFilteredAndSortedPackages = () => {
    let filtered = [...packages];

    // Apply search filter
    if (packageSearchTerm) {
      const searchLower = packageSearchTerm.toLowerCase();
      filtered = filtered.filter(pkg => {
        const name = pkg.name || '';
        return name.toLowerCase().includes(searchLower) ||
          (pkg.description && pkg.description.toLowerCase().includes(searchLower));
      });
    }

    // Apply status filter
    if (packageStatusFilter) {
      filtered = filtered.filter(pkg => pkg.status === packageStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (packageSortBy) {
        case 'name':
          const aName = a.name || '';
          const bName = b.name || '';
          return aName.localeCompare(bName);
        case 'price':
          return a.package_price - b.package_price;
        case 'discount':
          return (b.discount_percentage || 0) - (a.discount_percentage || 0);
        case 'created':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return filtered;
  };

  return (
    <Box>
      {/* 现代化页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #0891B2, #67E8F9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('products.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('products.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tab Navigation */}
      {tabsConfig.length > 0 && (
        <Box mb={3}>
          <Tabs
            value={selectedTab}
            onChange={(e, v) => setSelectedTab(v)}
            sx={{
              borderBottom: '2px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 56,
                '&.Mui-selected': {
                  color: '#06B6D4',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: '#06B6D4',
              },
            }}
          >
            {tabsConfig.map((tab) => (
              <Tab key={tab.key} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Services Tab Content */}
      {currentTabKey === 'services' && (
        <>
          {/* 搜索和筛选区域 */}
          <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder={t('products.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#06B6D4' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#f8fafc',
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderWidth: 1,
                },
                '&:hover fieldset': {
                  borderColor: alpha('#06B6D4', 0.5),
                  borderWidth: 1,
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#06B6D4',
                  borderWidth: 2,
                },
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>{t('products.category')}</InputLabel>
            <Select
              value={categoryFilter}
              label={t('products.category')}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{
                borderRadius: 3,
                backgroundColor: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderWidth: 1,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha('#06B6D4', 0.5),
                  borderWidth: 1,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#06B6D4',
                  borderWidth: 2,
                },
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                },
              }}
            >
              <MenuItem value="">{t('products.allCategories')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>{t('products.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('products.status')}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                borderRadius: 3,
                backgroundColor: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderWidth: 1,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha('#06B6D4', 0.5),
                  borderWidth: 1,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#06B6D4',
                  borderWidth: 2,
                },
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                },
              }}
            >
              <MenuItem value="">{t('products.allStatuses')}</MenuItem>
              <MenuItem value="ACTIVE">{t('products.active')}</MenuItem>
              <MenuItem value="INACTIVE">{t('products.inactive')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Box display="flex" gap={1} height="100%">
            <PermissionButton
              permission={PRODUCT_PERMISSIONS.CREATE}
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedService(null);
                setServiceDialogOpen(true);
              }}
              sx={{
                borderRadius: 3,
                background: 'linear-gradient(45deg, #67E8F9, #0891B2)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0891B2, #0E7490)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
                },
                transition: 'all 0.3s ease',
                flex: 1,
              }}
            >
              {t('products.addService')}
            </PermissionButton>
          </Box>
        </Grid>
      </Grid>

      {/* 管理分类按钮 */}
      {hasPermission('product_categories:manage') && (
        <Box mb={3}>
          <Button
            variant="outlined"
            onClick={() => setCategoryDialogOpen(true)}
            sx={{
              borderRadius: 3,
              borderColor: '#06B6D4',
              color: '#06B6D4',
              '&:hover': {
                borderColor: '#0891B2',
                backgroundColor: alpha('#06B6D4', 0.05),
              },
            }}
          >
            {t('products.manageCategories')}
          </Button>
        </Box>
      )}

      {/* 错误提示 - 只在 Services tab 显示 */}
      <Fade in={!!serviceError && currentTabKey === 'services'} timeout={300}>
        <Box>
          {serviceError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {serviceError}
            </Alert>
          )}
        </Box>
      </Fade>



      {/* 服务列表表格 */}
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.service')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.category')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.price')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.duration')}</TableCell>

                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.resourceType')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow
                      key={service.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha('#06B6D4', 0.04),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {service.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            ID: {service.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${getCategoryColor(service.categoryId)}, ${getCategoryColor(service.categoryId)}80)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            {getCategoryIcon(service.categoryId)}
                          </Box>
                          <Typography variant="body2">
                            {service.categoryName || categories.find(c => c.id === service.categoryId)?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {CurrencyUtils.formatAmount(service.price)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {service.duration} {t('products.minutes')}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={service.resourceType}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#6366F1', 0.1),
                            color: '#6366F1',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusChip(service.status)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setSelectedService(service);
                          }}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha('#06B6D4', 0.1),
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#f8fafc',
              }}
            />
          </>
        )}
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid rgba(0,0,0,0.08)',
              mt: 1,
            }
          }
        }}
      >
        {hasPermission('products:update') && (
          <MenuItem
            onClick={() => {
              setServiceDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#06B6D4', 0.08) } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#06B6D4' }} />
            {t('products.editService')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setViewDetailsDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.08) } }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          {t('products.viewDetails')}
        </MenuItem>
        {hasPermission('products:delete') && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
            {t('products.deleteService')}
          </MenuItem>
        )}
      </Menu>

      {/* 对话框组件 */}
      <ServiceDialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
        onExited={() => setSelectedService(null)}
        service={selectedService}
        categories={categories}
        mode={selectedService ? 'edit' : 'add'}
        onSave={handleSaveService}
      />

      <ServiceCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        categories={categories}
        onSave={handleSaveCategories}
        tenantId={tenantId}
      />

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#EF4444' }}>
          {t('products.confirmDeleteService')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('products.confirmDeleteServiceMessage', { serviceName: selectedService?.name })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteService}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details对话框 */}
      <Dialog
        open={viewDetailsDialogOpen}
        onClose={() => setViewDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#06B6D4' }}>
              {t('products.serviceDetails')}
            </Typography>
            <IconButton onClick={() => setViewDetailsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedService && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: '#06B6D4', fontWeight: 600 }}>
                  {t('services.basicInfo')}
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.serviceName')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedService.name}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.category')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedService.categoryName || categories.find(c => c.id === selectedService.categoryId)?.name}
                  </Typography>
                </Box>
              </Grid>

              {/* Service Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: '#06B6D4', fontWeight: 600 }}>
                  {t('services.serviceDetails')}
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.price')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {CurrencyUtils.formatAmount(selectedService.price)}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.duration')}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {selectedService.duration} {t('products.minutes')}
                  </Typography>
                </Box>
              </Grid>

              {/* Resource Type and Status */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: '#06B6D4', fontWeight: 600 }}>
                  {t('products.resourceType')}
                </Typography>
                <Chip
                  label={selectedService.resourceType}
                  sx={{
                    backgroundColor: alpha('#06B6D4', 0.1),
                    color: '#06B6D4',
                    fontWeight: 600,
                  }}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom sx={{ color: '#06B6D4', fontWeight: 600 }}>
                  {t('products.status')}
                </Typography>
                {getStatusChip(selectedService.status)}
              </Grid>

              {/* Description */}
              {selectedService.description && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#06B6D4', fontWeight: 600 }}>
                      {t('products.description')}
                    </Typography>
                    <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {selectedService.description}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

        </>
      )}

      {/* Packages Tab Content */}
      {currentTabKey === 'packages' && (
        <>
          {/* 错误提示 - 只在 Packages tab 显示 */}
          <Fade in={!!packageError} timeout={300}>
            <Box>
              {packageError && (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                >
                  {packageError}
                </Alert>
              )}
            </Box>
          </Fade>

          {/* Package Search and Filters - Matching Service Management Style */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('packages.searchPlaceholder')}
                value={packageSearchTerm}
                onChange={(e) => setPackageSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#06B6D4' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: '#f8fafc',
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#06B6D4', 0.5),
                      borderWidth: 1,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#06B6D4',
                      borderWidth: 2,
                    },
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('packages.statusFilter')}</InputLabel>
                <Select
                  value={packageStatusFilter}
                  onChange={(e) => setPackageStatusFilter(e.target.value)}
                  label={t('packages.statusFilter')}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha('#06B6D4', 0.5),
                      borderWidth: 1,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#06B6D4',
                      borderWidth: 2,
                    },
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                    },
                  }}
                >
                  <MenuItem value="">{t('common.all')}</MenuItem>
                  <MenuItem value="ACTIVE">{t('packages.active')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('packages.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('packages.sortBy')}</InputLabel>
                <Select
                  value={packageSortBy}
                  onChange={(e) => setPackageSortBy(e.target.value as any)}
                  label={t('packages.sortBy')}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha('#06B6D4', 0.5),
                      borderWidth: 1,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#06B6D4',
                      borderWidth: 2,
                    },
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: `0 0 0 2px ${alpha('#06B6D4', 0.1)}`,
                    },
                  }}
                >
                  <MenuItem value="created">{t('packages.sortByCreated')}</MenuItem>
                  <MenuItem value="name">{t('packages.sortByName')}</MenuItem>
                  <MenuItem value="price">{t('packages.sortByPrice')}</MenuItem>
                  <MenuItem value="discount">{t('packages.sortByDiscount')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {hasPermission('packages:create') && (
              <Grid item xs={12} md={2}>
                <Box display="flex" gap={1} height="100%">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedPackage(null);
                      setPackageDialogOpen(true);
                    }}
                    sx={{
                      borderRadius: 3,
                      background: 'linear-gradient(45deg, #67E8F9, #0891B2)',
                      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0891B2, #0E7490)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                      flex: 1,
                    }}
                  >
                    {t('packages.createPackage')}
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          <PackageList
            packages={getFilteredAndSortedPackages()}
            services={services}
            loading={packageLoading}
            onEdit={(pkg) => {
              setSelectedPackage(pkg);
              setPackageDialogOpen(true);
            }}
            onDelete={handleDeletePackage}
            onView={handleViewPackage}
            onCreate={() => setPackageDialogOpen(true)}
          />

          <PackageDialog
            open={packageDialogOpen}
            onClose={() => setPackageDialogOpen(false)}
            onExited={() => setSelectedPackage(null)}
            packageData={selectedPackage}
            services={services}
            onSave={handleSavePackage}
            mode={selectedPackage ? 'edit' : 'add'}
          />

          <PackageDetailsDialog
            open={viewPackageOpen}
            onClose={() => {
              setViewPackageOpen(false);
              setViewPackage(null);
            }}
            packageData={viewPackage}
            services={services}
          />

          {/* 删除确认对话框 */}
          <Dialog
            open={packageDeleteDialogOpen}
            onClose={() => {
              setPackageDeleteDialogOpen(false);
              setPackageToDelete(null);
            }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
                {t('packages.confirmDeletePackage')}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography>
                {t('packages.confirmDeletePackageMessage', {
                  packageName: packageToDelete?.name || ''
                })}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              <Button
                onClick={() => {
                  setPackageDeleteDialogOpen(false);
                  setPackageToDelete(null);
                }}
                sx={{
                  borderRadius: 2,
                  px: 3,
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={confirmDeletePackage}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  backgroundColor: '#EF4444',
                  '&:hover': {
                    backgroundColor: '#DC2626',
                  },
                }}
              >
                {t('common.delete')}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* 成功提示 */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceManagement; 