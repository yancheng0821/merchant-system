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
  Collapse,
  useMediaQuery,
  useTheme as useMuiTheme,
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
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#06B6D4';
  const THEME_COLOR_HOVER = isMonochrome ? '#333' : '#0891B2';

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

  // 移动端筛选面板展开状态
  const [serviceFiltersExpanded, setServiceFiltersExpanded] = useState(false);
  const [packageFiltersExpanded, setPackageFiltersExpanded] = useState(false);

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
      // 失败时保持对话框打开，让用户可以修改
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
      // 失败时保持对话框打开，让用户可以修改
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
      <Box mb={isMobile ? 2 : 4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h1"
              sx={{
                fontWeight: 600,
                color: THEME_COLOR,
                mb: 0.5,
              }}
            >
              {t('products.title')}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: '#888' }}>
                {t('products.subtitle')}
              </Typography>
            )}
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
                fontWeight: 500,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                textTransform: 'none',
                minHeight: { xs: 44, sm: 56 },
                '&.Mui-selected': {
                  fontWeight: 600,
                  color: THEME_COLOR,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                backgroundColor: THEME_COLOR,
              },
            }}
          >
            {tabsConfig.map((tab) => (
              <Tab
                key={tab.key}
                label={tab.label}
                disableRipple={isMobile}
                sx={{
                  // 移动端移除所有点击高亮效果
                  ...(isMobile && {
                    WebkitTapHighlightColor: 'transparent',
                    '&:focus': {
                      outline: 'none',
                    },
                    '&:active': {
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-focusVisible': {
                      backgroundColor: 'transparent',
                    },
                  }),
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Services Tab Content */}
      {currentTabKey === 'services' && (
        <>
          {/* 搜索和筛选区域 - 响应式设计 */}
          {isMobile ? (
            /* 移动端筛选布局 */
            <Box sx={{ mb: 1.5 }}>
              {/* 搜索栏 + 筛选按钮 + 添加按钮 */}
              <Box display="flex" gap={1} mb={1.5} alignItems="stretch">
                <TextField
                  placeholder={t('products.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: '#fafafa',
                      fontSize: '0.8rem',
                      height: 40,
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                      '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  onClick={() => setServiceFiltersExpanded(!serviceFiltersExpanded)}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    color: serviceFiltersExpanded ? THEME_COLOR : '#666',
                    bgcolor: serviceFiltersExpanded ? alpha(THEME_COLOR, 0.08) : 'transparent',
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {hasPermission('products:create') && (
                  <IconButton
                    onClick={() => {
                      setSelectedService(null);
                      setServiceDialogOpen(true);
                    }}
                    sx={{
                      bgcolor: THEME_COLOR,
                      borderRadius: 1.5,
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      color: '#fff',
                      '&:hover': { bgcolor: THEME_COLOR_HOVER },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                )}
              </Box>

              {/* 可折叠筛选面板 */}
              <Collapse in={serviceFiltersExpanded}>
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                        {t('products.category')}
                      </InputLabel>
                      <Select
                        value={categoryFilter}
                        label={t('products.category')}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: '#fafafa',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('products.allCategories')}</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id.toString()} sx={{ fontSize: '0.75rem' }}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                        {t('products.status')}
                      </InputLabel>
                      <Select
                        value={statusFilter}
                        label={t('products.status')}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: '#fafafa',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('products.allStatuses')}</MenuItem>
                        <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>{t('products.active')}</MenuItem>
                        <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>{t('products.inactive')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Collapse>
            </Box>
          ) : (
            /* 桌面端筛选布局 */
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2.5,
                alignItems: 'center',
              }}
            >
              <TextField
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{
                  minWidth: 280,
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: '#666', fontSize: '0.875rem' }}>{t('products.category')}</InputLabel>
                <Select
                  value={categoryFilter}
                  label={t('products.category')}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>{t('products.allCategories')}</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()} sx={{ fontSize: '0.875rem' }}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: '#666', fontSize: '0.875rem' }}>{t('products.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('products.status')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>{t('products.allStatuses')}</MenuItem>
                  <MenuItem value="ACTIVE" sx={{ fontSize: '0.875rem' }}>{t('products.active')}</MenuItem>
                  <MenuItem value="INACTIVE" sx={{ fontSize: '0.875rem' }}>{t('products.inactive')}</MenuItem>
                </Select>
              </FormControl>
              <PermissionButton
                permission={PRODUCT_PERMISSIONS.CREATE}
                size="small"
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  setSelectedService(null);
                  setServiceDialogOpen(true);
                }}
                sx={{
                  borderRadius: 1.5,
                  height: 40,
                  px: 2,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  bgcolor: THEME_COLOR,
                  boxShadow: 'none',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: THEME_COLOR_HOVER,
                    boxShadow: 'none',
                  },
                }}
              >
                {t('products.addService')}
              </PermissionButton>
            </Box>
          )}

      {/* 管理分类按钮 - 移动端隐藏 */}
      {!isMobile && hasPermission('product_categories:manage') && (
        <Box mb={2.5}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCategoryDialogOpen(true)}
            sx={{
              borderRadius: 1.5,
              borderColor: alpha(THEME_COLOR, 0.3),
              color: THEME_COLOR,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: THEME_COLOR,
                backgroundColor: alpha(THEME_COLOR, 0.05),
              },
            }}
          >
            {t('products.manageCategories')}
          </Button>
        </Box>
      )}

      {/* 服务列表 - 响应式设计 */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        /* 移动端卡片列表 */
        <Box>
          {services.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 1.5,
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {t('products.noServices')}
              </Typography>
            </Box>
          ) : (
            <>
              {services.map((service) => (
                <Card
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setViewDetailsDialogOpen(true);
                  }}
                  sx={{
                    mb: 1.5,
                    borderRadius: 1.5,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    '&:active': {
                      bgcolor: 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    {/* 第一行：服务名称 + 类别 */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', mb: 0.25 }}>
                          {service.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 1,
                              bgcolor: alpha(getCategoryColor(service.categoryId), 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: getCategoryColor(service.categoryId),
                              '& svg': { fontSize: 12 },
                            }}
                          >
                            {getCategoryIcon(service.categoryId)}
                          </Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                            {service.categoryName || categories.find(c => c.id === service.categoryId)?.name}
                          </Typography>
                        </Box>
                      </Box>
                      {getStatusChip(service.status)}
                    </Box>

                    {/* 第二行：价格 + 时长 */}
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: THEME_COLOR }}>
                        {CurrencyUtils.formatAmount(service.price)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                        {service.duration} {t('products.minutes')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {/* 移动端简化分页 */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: '#fff',
                  borderRadius: 1.5,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalCount)} / {totalCount}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      color: '#666',
                      borderRadius: 1,
                    }}
                  >
                    {t('common.previousPage')}
                  </Button>
                  <Button
                    size="small"
                    disabled={(page + 1) * rowsPerPage >= totalCount}
                    onClick={() => setPage(page + 1)}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      color: THEME_COLOR,
                      borderRadius: 1,
                    }}
                  >
                    {t('common.nextPage')}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      ) : (
        /* 桌面端表格 */
        <Box
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.service')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.category')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.price')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.duration')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.resourceType')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>{t('products.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      '& td': { py: 1.5, fontSize: '0.875rem' },
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {service.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                          ID: {service.id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            bgcolor: alpha(getCategoryColor(service.categoryId), 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: getCategoryColor(service.categoryId),
                          }}
                        >
                          {getCategoryIcon(service.categoryId)}
                        </Box>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {service.categoryName || categories.find(c => c.id === service.categoryId)?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1a1a1a' }}>
                        {CurrencyUtils.formatAmount(service.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                        {service.duration} {t('products.minutes')}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={service.resourceType}
                        size="small"
                        sx={{
                          backgroundColor: alpha(THEME_COLOR, 0.1),
                          color: THEME_COLOR,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 22,
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
                          color: '#999',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            color: '#666',
                          },
                        }}
                      >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
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
            labelRowsPerPage={t('common.rowsPerPage')}
            sx={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              '& .MuiTablePagination-select': {
                borderRadius: 1,
              },
            }}
          />
        </Box>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              mt: 0.5,
              minWidth: 160,
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
            sx={{
              fontSize: '0.875rem',
              py: 1,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
            }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 16, color: THEME_COLOR }} />
            {t('products.editService')}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setViewDetailsDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{
            fontSize: '0.875rem',
            py: 1,
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 16, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
          {t('products.viewDetails')}
        </MenuItem>
        {hasPermission('products:delete') && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{
              fontSize: '0.875rem',
              py: 1,
              '&:hover': { backgroundColor: alpha('#EF4444', 0.08) }
            }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 16, color: '#EF4444' }} />
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
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ py: 2, px: 3 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('products.confirmDeleteService')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            {t('products.confirmDeleteServiceMessage', { serviceName: selectedService?.name })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            size="small"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#666',
              textTransform: 'none',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="small"
            onClick={handleDeleteService}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: '#EF4444',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: 'none',
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
            borderRadius: { xs: 2, sm: 2.5 },
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            m: { xs: 1, sm: 'auto' },
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100% - 64px)' },
          }
        }}
      >
        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' }, color: THEME_COLOR }}>
              {t('products.serviceDetails')}
            </Typography>
            <IconButton
              onClick={() => setViewDetailsDialogOpen(false)}
              size="small"
              sx={{ color: '#999', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#666' } }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedService && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: THEME_COLOR, fontWeight: 600, mb: 1.5 }}>
                  {t('services.basicInfo')}
                </Typography>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {t('products.serviceName')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedService.name}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {t('products.category')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedService.categoryName || categories.find(c => c.id === selectedService.categoryId)?.name}
                  </Typography>
                </Box>
              </Grid>

              {/* Service Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: THEME_COLOR, fontWeight: 600, mb: 1.5 }}>
                  {t('services.serviceDetails')}
                </Typography>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {t('products.price')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {CurrencyUtils.formatAmount(selectedService.price)}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="caption" color="text.secondary">
                    {t('products.duration')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedService.duration} {t('products.minutes')}
                  </Typography>
                </Box>
              </Grid>

              {/* Resource Type and Status */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: THEME_COLOR, fontWeight: 600, mb: 1.5 }}>
                  {t('products.resourceType')}
                </Typography>
                <Chip
                  label={selectedService.resourceType}
                  sx={{
                    backgroundColor: alpha(THEME_COLOR, 0.1),
                    color: THEME_COLOR,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: THEME_COLOR, fontWeight: 600, mb: 1.5 }}>
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
                    <Typography variant="subtitle2" sx={{ color: THEME_COLOR, fontWeight: 600, mb: 1.5 }}>
                      {t('products.description')}
                    </Typography>
                    <Typography variant="body2" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px solid rgba(0,0,0,0.06)' }}>
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
          {/* Package Search and Filters - 响应式设计 */}
          {isMobile ? (
            /* 移动端筛选布局 */
            <Box sx={{ mb: 1.5 }}>
              {/* 搜索栏 + 筛选按钮 + 添加按钮 */}
              <Box display="flex" gap={1} mb={1.5} alignItems="stretch">
                <TextField
                  placeholder={t('packages.searchPlaceholder')}
                  value={packageSearchTerm}
                  onChange={(e) => setPackageSearchTerm(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: '#fafafa',
                      fontSize: '0.8rem',
                      height: 40,
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                      '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  onClick={() => setPackageFiltersExpanded(!packageFiltersExpanded)}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 1.5,
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    color: packageFiltersExpanded ? THEME_COLOR : '#666',
                    bgcolor: packageFiltersExpanded ? alpha(THEME_COLOR, 0.08) : 'transparent',
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {hasPermission('packages:create') && (
                  <IconButton
                    onClick={() => {
                      setSelectedPackage(null);
                      setPackageDialogOpen(true);
                    }}
                    sx={{
                      bgcolor: THEME_COLOR,
                      borderRadius: 1.5,
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      color: '#fff',
                      '&:hover': { bgcolor: THEME_COLOR_HOVER },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                )}
              </Box>

              {/* 可折叠筛选面板 */}
              <Collapse in={packageFiltersExpanded}>
                <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                        {t('packages.statusFilter')}
                      </InputLabel>
                      <Select
                        value={packageStatusFilter}
                        onChange={(e) => setPackageStatusFilter(e.target.value)}
                        label={t('packages.statusFilter')}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: '#fafafa',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                      >
                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('common.all')}</MenuItem>
                        <MenuItem value="ACTIVE" sx={{ fontSize: '0.75rem' }}>{t('packages.active')}</MenuItem>
                        <MenuItem value="INACTIVE" sx={{ fontSize: '0.75rem' }}>{t('packages.inactive')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                        {t('packages.sortBy')}
                      </InputLabel>
                      <Select
                        value={packageSortBy}
                        onChange={(e) => setPackageSortBy(e.target.value as any)}
                        label={t('packages.sortBy')}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: '#fafafa',
                          fontSize: '0.75rem',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                      >
                        <MenuItem value="created" sx={{ fontSize: '0.75rem' }}>{t('packages.sortByCreated')}</MenuItem>
                        <MenuItem value="name" sx={{ fontSize: '0.75rem' }}>{t('packages.sortByName')}</MenuItem>
                        <MenuItem value="price" sx={{ fontSize: '0.75rem' }}>{t('packages.sortByPrice')}</MenuItem>
                        <MenuItem value="discount" sx={{ fontSize: '0.75rem' }}>{t('packages.sortByDiscount')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Collapse>
            </Box>
          ) : (
            /* 桌面端筛选布局 */
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2.5,
                alignItems: 'center',
              }}
            >
              <TextField
                placeholder={t('packages.searchPlaceholder')}
                value={packageSearchTerm}
                onChange={(e) => setPackageSearchTerm(e.target.value)}
                size="small"
                sx={{
                  minWidth: 280,
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: '#666', fontSize: '0.875rem' }}>{t('packages.statusFilter')}</InputLabel>
                <Select
                  value={packageStatusFilter}
                  onChange={(e) => setPackageStatusFilter(e.target.value)}
                  label={t('packages.statusFilter')}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.875rem' }}>{t('common.all')}</MenuItem>
                  <MenuItem value="ACTIVE" sx={{ fontSize: '0.875rem' }}>{t('packages.active')}</MenuItem>
                  <MenuItem value="INACTIVE" sx={{ fontSize: '0.875rem' }}>{t('packages.inactive')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: '#666', fontSize: '0.875rem' }}>{t('packages.sortBy')}</InputLabel>
                <Select
                  value={packageSortBy}
                  onChange={(e) => setPackageSortBy(e.target.value as any)}
                  label={t('packages.sortBy')}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0,0,0,0.12)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: THEME_COLOR,
                    },
                  }}
                >
                  <MenuItem value="created" sx={{ fontSize: '0.875rem' }}>{t('packages.sortByCreated')}</MenuItem>
                  <MenuItem value="name" sx={{ fontSize: '0.875rem' }}>{t('packages.sortByName')}</MenuItem>
                  <MenuItem value="price" sx={{ fontSize: '0.875rem' }}>{t('packages.sortByPrice')}</MenuItem>
                  <MenuItem value="discount" sx={{ fontSize: '0.875rem' }}>{t('packages.sortByDiscount')}</MenuItem>
                </Select>
              </FormControl>
              {hasPermission('packages:create') && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    setSelectedPackage(null);
                    setPackageDialogOpen(true);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    height: 40,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    bgcolor: THEME_COLOR,
                    boxShadow: 'none',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: THEME_COLOR_HOVER,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {t('packages.createPackage')}
                </Button>
              )}
            </Box>
          )}

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
                borderRadius: 2.5,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            <DialogTitle sx={{ py: 2, px: 3 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {t('packages.confirmDeletePackage')}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 2 }}>
              <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                {t('packages.confirmDeletePackageMessage', {
                  packageName: packageToDelete?.name || ''
                })}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Button
                size="small"
                onClick={() => {
                  setPackageDeleteDialogOpen(false);
                  setPackageToDelete(null);
                }}
                sx={{
                  borderRadius: 1.5,
                  px: 2.5,
                  py: 0.75,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#666',
                  textTransform: 'none',
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="small"
                onClick={confirmDeletePackage}
                variant="contained"
                sx={{
                  borderRadius: 1.5,
                  px: 2.5,
                  py: 0.75,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  bgcolor: '#EF4444',
                  boxShadow: 'none',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#DC2626',
                    boxShadow: 'none',
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
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 服务错误提示 */}
      <Snackbar
        open={!!serviceError}
        autoHideDuration={5000}
        onClose={() => setServiceError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setServiceError(null)}
          severity="error"
          sx={{
            width: '100%',
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {serviceError}
        </Alert>
      </Snackbar>

      {/* 套餐错误提示 */}
      <Snackbar
        open={!!packageError}
        autoHideDuration={5000}
        onClose={() => setPackageError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setPackageError(null)}
          severity="error"
          sx={{
            width: '100%',
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {packageError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceManagement; 