import React, { useState } from 'react';
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
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  ContentCut as HairIcon,
  Spa as SpaIcon,
  Face as FaceIcon,
  LocalOffer as NailIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ServiceDialog from './components/ServiceDialog';
import ServiceCategoryDialog from './components/ServiceCategoryDialog';

// 服务接口
export interface Service {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryId: string;
  price: number;
  duration: number; // 分钟
  description: string;
  descriptionEn: string;
  isActive: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  availableStaff: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 服务分类接口
export interface ServiceCategory {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
}

const ServiceManagement: React.FC = () => {
  const { t } = useTranslation();
  
  // 模拟服务分类数据
  const mockCategories: ServiceCategory[] = [
    {
      id: 'cat_001',
      name: t('products.categories.hairCare'),
      nameEn: 'Hair Care',
      description: '专业美发服务',
      icon: 'hair',
      color: '#EC4899',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 'cat_002',
      name: t('products.categories.spaTreatments'),
      nameEn: 'Spa Treatments',
      description: '放松身心的SPA服务',
      icon: 'spa',
      color: '#10B981',
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 'cat_003',
      name: t('products.categories.facialCare'),
      nameEn: 'Facial Care',
      description: '专业面部护理',
      icon: 'face',
      color: '#F59E0B',
      isActive: true,
      displayOrder: 3,
    },
    {
      id: 'cat_004',
      name: t('products.categories.nailCare'),
      nameEn: 'Nail Care',
      description: '专业美甲服务',
      icon: 'nail',
      color: '#8B5CF6',
      isActive: true,
      displayOrder: 4,
    },
  ];

  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>(mockCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // 对话框状态
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 生成模拟数据
  React.useEffect(() => {
    const mockServices: Service[] = [
      {
        id: 'srv_001',
        name: t('products.services.premiumHaircut'),
        nameEn: 'Premium Haircut',
        category: t('products.categories.hairCare'),
        categoryId: 'cat_001',
        price: 88.00,
        duration: 60,
        description: '专业理发师提供个性化理发服务',
        descriptionEn: 'Professional haircut service with personalized styling',
        isActive: true,
        skillLevel: 'advanced',
        availableStaff: ['李师傅', '王小姐'],
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2024-01-10T15:30:00Z',
      },
      {
        id: 'srv_002',
        name: t('products.services.deepTreatmentSpa'),
        nameEn: 'Deep Treatment Spa',
        category: t('products.categories.spaTreatments'),
        categoryId: 'cat_002',
        price: 168.00,
        duration: 90,
        description: '全身放松深层护理体验',
        descriptionEn: 'Full body relaxation and deep treatment experience',
        isActive: true,
        skillLevel: 'expert',
        availableStaff: ['张师傅'],
        createdAt: '2023-02-10T14:00:00Z',
        updatedAt: '2024-01-08T11:20:00Z',
      },
      {
        id: 'srv_003',
        name: t('products.services.rejuvenatingFacial'),
        nameEn: 'Rejuvenating Facial',
        category: t('products.categories.facialCare'),
        categoryId: 'cat_003',
        price: 128.00,
        duration: 75,
        description: '深度清洁和保湿面部护理',
        descriptionEn: 'Deep cleansing and moisturizing facial treatment',
        isActive: true,
        skillLevel: 'intermediate',
        availableStaff: ['李师傅', '王小姐'],
        createdAt: '2023-03-05T09:00:00Z',
        updatedAt: '2024-01-05T16:45:00Z',
      },
      {
        id: 'srv_004',
        name: t('products.services.frenchManicure'),
        nameEn: 'French Manicure',
        category: t('products.categories.nailCare'),
        categoryId: 'cat_004',
        price: 58.00,
        duration: 45,
        description: '经典法式美甲设计',
        descriptionEn: 'Classic French manicure design',
        isActive: true,
        skillLevel: 'beginner',
        availableStaff: ['王小姐'],
        createdAt: '2023-03-20T13:00:00Z',
        updatedAt: '2024-01-03T12:15:00Z',
      },
    ];
    setFilteredServices(mockServices);
  }, [t]);

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    switch (category?.icon) {
      case 'hair': return <HairIcon sx={{ fontSize: 16 }} />;
      case 'spa': return <SpaIcon sx={{ fontSize: 16 }} />;
      case 'face': return <FaceIcon sx={{ fontSize: 16 }} />;
      case 'nail': return <NailIcon sx={{ fontSize: 16 }} />;
      default: return <StoreIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6366F1';
  };

  const getSkillLevelChip = (level: string) => {
    const levelConfig = {
      beginner: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('products.skillLevels.beginner') },
      intermediate: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('products.skillLevels.intermediate') },
      advanced: { color: '#EC4899', bg: alpha('#EC4899', 0.1), label: t('products.skillLevels.advanced') },
      expert: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('products.skillLevels.expert') },
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
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

  const getStatusChip = (isActive: boolean) => {
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
                background: 'linear-gradient(45deg, #DB2777, #EC4899)',
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
                  <SearchIcon sx={{ color: '#EC4899' }} />
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
                  borderColor: alpha('#EC4899', 0.3),
                },
                '&.Mui-focused': {
                  backgroundColor: 'white',
                  borderColor: '#EC4899',
                  boxShadow: `0 0 0 3px ${alpha('#EC4899', 0.1)}`,
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
                    borderColor: alpha('#EC4899', 0.5),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EC4899',
                  },
                },
              }}
            >
              <MenuItem value="all">{t('products.allCategories')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
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
                    borderColor: alpha('#EC4899', 0.5),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#EC4899',
                  },
                },
              }}
            >
              <MenuItem value="all">{t('products.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('products.active')}</MenuItem>
              <MenuItem value="inactive">{t('products.inactive')}</MenuItem>
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
                background: 'linear-gradient(45deg, #EC4899, #F472B6)',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #DB2777, #EC4899)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
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
            borderColor: '#EC4899',
            color: '#EC4899',
            '&:hover': {
              borderColor: '#DB2777',
              backgroundColor: alpha('#EC4899', 0.05),
            },
          }}
        >
          {t('products.manageCategories')}
        </Button>
      </Box>

      {/* 服务列表表格 */}
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.service')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.category')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.price')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.duration')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.skillLevel')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.availableStaff')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('products.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((service) => (
                  <TableRow 
                    key={service.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#EC4899', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {service.nameEn}
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
                            background: `linear-gradient(135deg, ${getCategoryColor(service.categoryId)}, ${getCategoryColor(service.categoryId)}dd)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {getCategoryIcon(service.categoryId)}
                        </Box>
                        <Typography variant="body2">
                          {service.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ¥{service.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {service.duration} {t('products.minutes')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getSkillLevelChip(service.skillLevel)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {service.availableStaff.slice(0, 2).map((staff, index) => (
                          <Avatar
                            key={index}
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: '0.75rem',
                              bgcolor: '#6366F1',
                            }}
                          >
                            {staff.charAt(0)}
                          </Avatar>
                        ))}
                        {service.availableStaff.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{service.availableStaff.length - 2}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(service.isActive)}
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
                            backgroundColor: alpha('#EC4899', 0.1),
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
          count={filteredServices.length}
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
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            setServiceDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#EC4899', 0.08) } }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18, color: '#EC4899' }} />
          {t('products.editService')}
        </MenuItem>
        <MenuItem
          onClick={() => {
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
        onClose={() => setServiceDialogOpen(false)}
        service={selectedService}
        categories={categories}
        mode={selectedService ? 'edit' : 'add'}
        onSave={(service) => {
          // 处理保存逻辑
          setServiceDialogOpen(false);
        }}
      />

      <ServiceCategoryDialog 
        open={categoryDialogOpen} 
        onClose={() => setCategoryDialogOpen(false)}
        categories={categories}
        onSave={(categories) => {
          setCategories(categories);
          setCategoryDialogOpen(false);
        }}
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
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
            {t('products.confirmDeleteService')}
          </Typography>
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
            onClick={() => {
              // 处理删除逻辑
              setDeleteDialogOpen(false);
            }}
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
    </Box>
  );
};

export default ServiceManagement; 