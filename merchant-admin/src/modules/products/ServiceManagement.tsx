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
} from '@mui/material';
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
import { CurrencyUtils } from '../../config/constants';
import ServiceDialog from './components/ServiceDialog';
import ServiceCategoryDialog from './components/ServiceCategoryDialog';
import CustomDialog from '../../components/common/CustomDialog';
import { serviceManagementApi, serviceCategoryApi, ServiceManagement as ServiceManagementType, ServiceCategory, handleApiError } from '../../services/api';

// 使用从API导入的接口类型

const ServiceManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // 状态管理
  const [services, setServices] = useState<ServiceManagementType[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedService, setSelectedService] = useState<ServiceManagementType | null>(null);

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
      setError('No tenant ID available');
      return;
    }

    setLoading(true);
    setError(null);
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
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, categoryFilter, statusFilter, searchTerm, page, rowsPerPage]);

  // 初始加载
  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId, page, rowsPerPage, categoryFilter, statusFilter, searchTerm, loadData]);

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
      setError(t('products.serviceDeleteFailed') + ': ' + handleApiError(err));
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
      setError(errorMessage + ': ' + handleApiError(err));
    }
  };

  // 处理分类保存
  const handleSaveCategories = async (categoriesData: ServiceCategory[]) => {
    try {
      // 这里可以实现批量更新分类的逻辑
      setCategoryDialogOpen(false);
      loadData(); // 重新加载数据
    } catch (err) {
      setError(handleApiError(err));
    }
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
                border: '2px solid transparent',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  borderColor: alpha('#06B6D4', 0.3),
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  borderColor: '#06B6D4',
                  boxShadow: `0 0 0 3px ${alpha('#06B6D4', 0.1)}`,
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
                '& .MuiOutlinedInput-root': {
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha('#06B6D4', 0.5),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06B6D4',
                  },
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
                '& .MuiOutlinedInput-root': {
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha('#06B6D4', 0.5),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#06B6D4',
                  },
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
            <Button
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
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* 管理分类按钮 */}
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

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



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
      </Menu>

      {/* 对话框组件 */}
      <ServiceDialog
        open={serviceDialogOpen}
        onClose={() => {
          setServiceDialogOpen(false);
          setSelectedService(null);
        }}
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            bgcolor: 'background.paper',
          }
        }}
      >
        {/* 现代化对话框标题 */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha('#06B6D4', 0.08)}, ${alpha('#0891B2', 0.08)})`,
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
                  background: `linear-gradient(135deg, #06B6D4, #0891B2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <VisibilityIcon sx={{ fontSize: 24 }} />
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
                  {t('products.viewDetails')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedService?.name}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setViewDetailsDialogOpen(false)}
              sx={{
                '&:hover': {
                  backgroundColor: alpha('#06B6D4', 0.1),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedService && (
            <Box sx={{ p: 3 }}>
              {/* 基本信息 */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  border: '1px solid',
                  borderColor: alpha('#6366F1', 0.2),
                  borderRadius: 2,
                  background: alpha('#6366F1', 0.02),
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, #6366F1, #8B5CF6)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <ServiceIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#6366F1' }}>
                    {t('services.basicInfo')}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.serviceName')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {selectedService.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.category')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            background: `linear-gradient(135deg, ${getCategoryColor(selectedService.categoryId)}, ${getCategoryColor(selectedService.categoryId)}80)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {getCategoryIcon(selectedService.categoryId)}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {selectedService.categoryName || categories.find(c => c.id === selectedService.categoryId)?.name}
                        </Typography>
                      </Box>
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
                  borderColor: alpha('#10B981', 0.2),
                  borderRadius: 2,
                  background: alpha('#10B981', 0.02),
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, #10B981, #059669)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <PriceIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                    {t('services.serviceDetails')}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.price')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                        {CurrencyUtils.formatAmount(selectedService.price)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.duration')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                        {selectedService.duration} {t('products.minutes')}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.resourceType')}
                      </Typography>
                      <Chip
                        label={selectedService.resourceType}
                        sx={{
                          backgroundColor: alpha('#8B5CF6', 0.1),
                          color: '#8B5CF6',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          height: 32,
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('products.status')}
                      </Typography>
                      {getStatusChip(selectedService.status)}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* 描述信息 */}
              {selectedService.description && (
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
                        background: `linear-gradient(135deg, #EC4899, #BE185D)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
                      {t('products.description')}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.6,
                      color: 'text.primary',
                    }}
                  >
                    {selectedService.description}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: alpha('#06B6D4', 0.02),
          }}
        >
          <Button 
            onClick={() => setViewDetailsDialogOpen(false)}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 4,
              background: `linear-gradient(135deg, #06B6D4, #0891B2)`,
              boxShadow: `0 4px 15px ${alpha('#06B6D4', 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, #0891B2, #0E7490)`,
                boxShadow: `0 6px 20px ${alpha('#06B6D4', 0.4)}`,
              },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

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