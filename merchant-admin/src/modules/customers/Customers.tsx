import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Avatar,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  History as HistoryIcon,
  CardGiftcard as PackageIcon,
  // 会员等级图标
  StarHalf as StarHalfIcon,
  StarRate as StarRateIcon,
  Grade as GradeIcon,
  Stars as StarsIcon,
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  CardMembership as MembershipIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { customerApi, Customer, CustomerStats, handleApiError, membershipTierApi, MembershipTier } from '../../services/api';
import { CurrencyUtils } from '../../config/constants';
import { usePermission } from '../../hooks/usePermission';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';
import CustomerDialog from './components/CustomerDialog';
import AppointmentHistory from './components/AppointmentHistory';
import CustomerPackages from './components/CustomerPackages';
import PackagePurchase from './components/PackagePurchase';
import { CustomerImport } from './components/CustomerImport';
import { ImportHistory } from './components/ImportHistory';

// 使用API中定义的Customer接口

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 对话框状态
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false);
  const [customerPackagesOpen, setCustomerPackagesOpen] = useState(false);
  const [packagePurchaseDialogOpen, setPackagePurchaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerImportOpen, setCustomerImportOpen] = useState(false);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 通知状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 获取租户ID（从localStorage或context中获取）
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return String(user.tenantId || 1); // 默认租户ID为1
  }, []);

  // 构建查询参数
  const buildQueryParams = useCallback((pageNum = page) => ({
    tenantId,
    keyword: searchTerm || undefined,
    status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'ACTIVE' : statusFilter === 'inactive' ? 'INACTIVE' : undefined) as 'ACTIVE' | 'INACTIVE' | undefined : undefined,
    membershipLevel: membershipFilter !== 'all' ? membershipFilter.toUpperCase() : undefined,
    page: pageNum,
    size: rowsPerPage,
    sortBy: sortBy,
    sortDir: 'desc',
  }), [tenantId, searchTerm, statusFilter, membershipFilter, page, rowsPerPage, sortBy]);

  // 请求去重机制
  const requestIdRef = useRef(0);

  // 加载客户数据的核心函数
  const fetchCustomers = useCallback(async (params: any) => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const response = await customerApi.getCustomers(params);

      // 只有当前请求是最新的才更新状态
      if (currentRequestId === requestIdRef.current) {
        setCustomers(response.customers);
        setTotalItems(response.totalItems);
      }
    } catch (err) {
      // 只有当前请求是最新的才处理错误
      if (currentRequestId === requestIdRef.current) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    } finally {
      // 只有当前请求是最新的才设置loading为false
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // 加载客户统计数据
  const loadCustomerStats = useCallback(async () => {
    try {
      const stats = await customerApi.getCustomerStats(tenantId);
      setCustomerStats(stats);
    } catch (err) {
      console.error('Failed to load customer stats:', err);
    }
  }, [tenantId]);

  // 加载会员等级列表
  const loadMembershipTiers = useCallback(async () => {
    try {
      const tiers = await membershipTierApi.getAllTiers(Number(tenantId));
      setMembershipTiers(tiers);
    } catch (err) {
      console.error('Failed to load membership levels:', err);
    }
  }, [tenantId]);

  // 统一的数据加载逻辑
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(buildQueryParams());
    }, searchTerm ? 500 : 0); // 只有在搜索时才防抖

    return () => clearTimeout(timeoutId);
  }, [fetchCustomers, buildQueryParams, searchTerm]); // 使用稳定的函数引用

  // 初始加载统计数据
  useEffect(() => {
    loadCustomerStats();
  }, [loadCustomerStats]);

  // 初始加载会员等级
  useEffect(() => {
    loadMembershipTiers();
  }, [loadMembershipTiers]);

  // 删除客户
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.id) return;

    try {
      setLoading(true);
      await customerApi.deleteCustomer(String(selectedCustomer.id));

      setSnackbar({
        open: true,
        message: t('customers.deleteSuccess'),
        severity: 'success',
      });

      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      // 重新加载数据
      fetchCustomers(buildQueryParams());
      loadCustomerStats(); // 重新加载统计数据
    } catch (err) {
      const errorMessage = handleApiError(err);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 保存客户（创建或更新）
  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      setSubmitting(true);

      if (selectedCustomer?.id) {
        // 更新客户
        await customerApi.updateCustomer(String(selectedCustomer.id), customerData as Customer);
        setSnackbar({
          open: true,
          message: t('customers.updateSuccess'),
          severity: 'success',
        });
      } else {
        // 创建客户
        customerData.tenantId = Number(tenantId);
        // 不要设置ID，让后端自动生成
        delete customerData.id;

        // 确保必填字段存在
        if (!customerData.firstName || !customerData.lastName || !customerData.phone) {
          setSnackbar({
            open: true,
            message: t('customers.validation.requiredFields'),
            severity: 'error',
          });
          setSubmitting(false);
          // 抛出错误，让子组件知道保存失败
          throw new Error(t('customers.validation.requiredFields'));
        }

        // 移除可能导致问题的字段，但保留用户填写的可选字段
        delete customerData.createdAt;
        delete customerData.updatedAt;

        await customerApi.createCustomer(customerData as Customer);
        setSnackbar({
          open: true,
          message: t('customers.createSuccess'),
          severity: 'success',
        });
      }

      // 成功后才关闭对话框和清空选中
      setCustomerDialogOpen(false);
      setSelectedCustomer(null);
      // 重新加载数据
      const params = buildQueryParams();
      fetchCustomers(params);
      loadCustomerStats(); // 重新加载统计数据
    } catch (err) {
      console.error('Error saving customer:', err);
      const errorMessage = handleApiError(err);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      // 重新抛出错误，让子组件知道保存失败
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // 切换客户状态（激活/失效）
  const handleToggleCustomerStatus = async () => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);

      const newStatus = selectedCustomer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updatedCustomer: Customer = {
        ...selectedCustomer,
        status: newStatus
      } as Customer;

      await customerApi.updateCustomer(String(selectedCustomer.id), updatedCustomer);

      setSnackbar({
        open: true,
        message: newStatus === 'ACTIVE'
          ? t('customers.activateSuccess')
          : t('customers.deactivateSuccess'),
        severity: 'success',
      });

      // 重新加载数据
      const params = buildQueryParams();
      fetchCustomers(params);
      loadCustomerStats();
    } catch (err) {
      console.error('Error toggling customer status:', err);
      const errorMessage = handleApiError(err);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取会员等级图标
  const getTierIcon = (iconName?: string, color?: string) => {
    if (!iconName) return null;

    const iconSx = { fontSize: '1rem', color: color || 'inherit' };

    switch (iconName.toLowerCase()) {
      case 'star': return <StarIcon sx={iconSx} />;
      case 'starhalf': return <StarHalfIcon sx={iconSx} />;
      case 'starrate': return <StarRateIcon sx={iconSx} />;
      case 'grade': return <GradeIcon sx={iconSx} />;
      case 'stars': return <StarsIcon sx={iconSx} />;
      case 'trophy': return <TrophyIcon sx={iconSx} />;
      case 'medal': return <MedalIcon sx={iconSx} />;
      case 'diamond': return <DiamondIcon sx={iconSx} />;
      case 'premium': return <PremiumIcon sx={iconSx} />;
      case 'verified': return <VerifiedIcon sx={iconSx} />;
      case 'membership': return <MembershipIcon sx={iconSx} />;
      default: return <StarIcon sx={iconSx} />;
    }
  };

  const getMembershipChip = (tier?: any) => {
    if (!tier) {
      return (
        <Chip
          label="-"
          sx={{
            backgroundColor: alpha('#6B7280', 0.1),
            color: '#6B7280',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
      );
    }

    return (
      <Chip
        icon={getTierIcon(tier.icon, tier.color) || undefined}
        label={tier.name}
        sx={{
          backgroundColor: alpha(tier.color || '#6B7280', 0.1),
          color: tier.color || '#6B7280',
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 2,
          },
          '& .MuiChip-icon': {
            color: tier.color || '#6B7280',
            marginLeft: 1,
            marginRight: -0.5,
          },
        }}
      />
    );
  };

  const getStatusChip = (status?: string) => {
    const config = status === 'ACTIVE'
      ? { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('customers.customerStatuses.active') }
      : { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('customers.customerStatuses.inactive') };

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

  // 获取头像显示的缩写
  const getAvatarInitials = (customer: Customer) => {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    // 特殊处理：Walk-in Customer 显示为 "VI" (Visitor)
    if (fullName.toLowerCase() === 'walk-in customer' || firstName.toLowerCase() === 'walk-in') {
      return 'VI';
    }

    // 生成缩写
    let initials = '';
    if (firstName && lastName) {
      initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    } else if (firstName) {
      initials = firstName.substring(0, 2).toUpperCase();
    } else if (lastName) {
      initials = lastName.substring(0, 2).toUpperCase();
    } else {
      initials = '?';
    }

    return initials.toUpperCase();
  };

  // 检查是否是 Walk-in Customer
  const isWalkInCustomer = (customer: Customer) => {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.toLowerCase() === 'walk-in customer' || firstName.toLowerCase() === 'walk-in';
  };

  return (
    <Box>
      {/* 现代化统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
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
                  <GroupsIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                  {customerStats?.totalCustomers || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('customers.totalCustomers')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {customerStats?.activeCustomers || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('customers.activeCustomers')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#F59E0B', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <StarIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {customerStats?.vipCustomers || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('customers.vipCustomers')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(236, 72, 153, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <WalletIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3B82F6' }}>
                  {CurrencyUtils.formatAmountWithCommas(Math.round(customerStats?.averageSpending || 0))}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('customers.avgSpending')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 现代化搜索和过滤区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder={t('customers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  const newSearchTerm = e.target.value;
                  setSearchTerm(newSearchTerm);
                  if (page !== 0) {
                    setPage(0); // 只有当前不在第一页时才重置
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
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

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('customers.membershipFilter')}</InputLabel>
                <Select
                  value={membershipFilter}
                  label={t('customers.membershipFilter')}
                  onChange={(e) => {
                    setMembershipFilter(e.target.value);
                    if (page !== 0) {
                      setPage(0); // 只有当前不在第一页时才重置
                    }
                  }}
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
                  <MenuItem value="all">{t('customers.allLevels')}</MenuItem>
                  {membershipTiers.map((tier) => (
                    <MenuItem key={tier.id} value={tier.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTierIcon(tier.icon, tier.color)}
                        <span style={{ color: tier.color || '#6B7280', fontWeight: 600 }}>{tier.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('customers.statusFilter')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('customers.statusFilter')}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    if (page !== 0) {
                      setPage(0); // 只有当前不在第一页时才重置
                    }
                  }}
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
                  <MenuItem value="all">{t('customers.allStatuses')}</MenuItem>
                  <MenuItem value="active">{t('customers.customerStatuses.active')}</MenuItem>
                  <MenuItem value="inactive">{t('customers.customerStatuses.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'text.secondary' }}>{t('customers.sortBy')}</InputLabel>
                <Select
                  value={sortBy}
                  label={t('customers.sortBy')}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    if (page !== 0) {
                      setPage(0);
                    }
                  }}
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
                  <MenuItem value="createdAt">{t('customers.sortOptions.createdAt')}</MenuItem>
                  <MenuItem value="updatedAt">{t('customers.sortOptions.updatedAt')}</MenuItem>
                  <MenuItem value="firstName">{t('customers.sortOptions.name')}</MenuItem>
                  <MenuItem value="lastVisitDate">{t('customers.sortOptions.lastVisit')}</MenuItem>
                  <MenuItem value="totalSpent">{t('customers.sortOptions.totalSpent')}</MenuItem>
                  <MenuItem value="points">{t('customers.sortOptions.points')}</MenuItem>
                  <MenuItem value="membershipTier">{t('customers.sortOptions.membershipLevel')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} flexWrap="wrap">
                {hasPermission('customers:create') && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerDialogOpen(true);
                    }}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                      boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #DB2777, #BE185D)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                      minWidth: 140,
                    }}
                  >
                    {t('customers.addCustomer')}
                  </Button>
                )}

                {hasPermission('customers:import') && (
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setCustomerImportOpen(true)}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      borderColor: '#EC4899',
                      color: '#EC4899',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: '#DB2777',
                        backgroundColor: alpha('#EC4899', 0.04),
                        transform: 'translateY(-1px)',
                        borderWidth: 2,
                      },
                      transition: 'all 0.3s ease',
                      minWidth: 140,
                    }}
                  >
                    {t('customers.batchImport')}
                  </Button>
                )}

                {hasPermission('customers:import') && (
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => setImportHistoryOpen(true)}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      borderColor: '#EC4899',
                    color: '#EC4899',
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#DB2777',
                      backgroundColor: alpha('#EC4899', 0.04),
                      transform: 'translateY(-1px)',
                      borderWidth: 2,
                    },
                    transition: 'all 0.3s ease',
                    minWidth: 140,
                  }}
                >
                  {t('customers.importHistory')}
                </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 现代化表格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('customers.tableHeaders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.contact')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.membership')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.packages')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.points')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.totalSpent')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.lastVisit')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.status')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('customers.tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {t('customers.noCustomers')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#EC4899', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#EC4899',
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          {getAvatarInitials(customer)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customer.fullName || `${customer.firstName} ${customer.lastName}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {customer.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {customer.countryCode && `${customer.countryCode.replace(/-[A-Z]{2}$/, '')} `}{customer.phone}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getMembershipChip(customer.membershipTier)}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {(customer.activePackageCount || 0) > 0 ? (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: hasPermission('customer_packages:view') ? 'pointer' : 'default',
                              '&:hover': hasPermission('customer_packages:view') ? {
                                '& .package-count': {
                                  backgroundColor: alpha('#06B6D4', 0.2),
                                }
                              } : {},
                            }}
                            onClick={(e) => {
                              if (hasPermission('customer_packages:view')) {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                                setCustomerPackagesOpen(true);
                              }
                            }}
                          >
                            <Chip
                              className="package-count"
                              icon={<PackageIcon sx={{ fontSize: 16 }} />}
                              label={customer.activePackageCount}
                              size="small"
                              sx={{
                                height: 24,
                                backgroundColor: alpha('#06B6D4', 0.1),
                                color: '#0891B2',
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  color: '#06B6D4',
                                },
                              }}
                            />
                            {hasPermission('customer_packages:view') && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#06B6D4',
                                  fontWeight: 500,
                                  textDecoration: 'underline',
                                  textDecorationStyle: 'dotted',
                                  textUnderlineOffset: 3,
                                }}
                              >
                                {t('customers.viewDetails')}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          !isWalkInCustomer(customer) && hasPermission('customer_packages:purchase') && (
                            <Chip
                              icon={<AddIcon sx={{ fontSize: 14 }} />}
                              label={t('customers.addPackage')}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                                setPackagePurchaseDialogOpen(true);
                              }}
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                backgroundColor: alpha('#EC4899', 0.1),
                                color: '#DB2777',
                                cursor: 'pointer',
                                '& .MuiChip-icon': {
                                  color: '#EC4899',
                                  fontSize: 16,
                                },
                                '&:hover': {
                                  backgroundColor: alpha('#EC4899', 0.2),
                                },
                                transition: 'background-color 0.2s ease',
                              }}
                            />
                          )
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                          {customer.points || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {CurrencyUtils.formatAmount(customer.totalSpent || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {customer.lastVisit ? (
                        <Box>
                          <Typography variant="body2">
                            {formatUtcToMerchantTime(customer.lastVisit, 'yyyy-MM-dd')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatUtcToMerchantTime(customer.lastVisit, 'HH:mm')}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.neverVisited')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(customer.status)}
                    </TableCell>
                    <TableCell>
                      {!isWalkInCustomer(customer) && (hasPermission('customers:update') ||
                        hasPermission('customers:delete') ||
                        hasPermission('customer_packages:purchase') ||
                        hasPermission('appointments:view')) && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchorEl(e.currentTarget);
                            setSelectedCustomer(customer);
                          }}
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha('#F59E0B', 0.1),
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalItems}
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
        {hasPermission('appointments:view') && (
          <MenuItem
            onClick={() => {
              setAppointmentHistoryOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EC4899', 0.08) } }}
          >
            <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#EC4899' }} />
            {t('customers.viewAppointments')}
          </MenuItem>
        )}
        {hasPermission('customer_packages:purchase') && (
          <MenuItem
            onClick={() => {
              setPackagePurchaseDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#10B981', 0.08) } }}
          >
            <AddIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
            {t('customers.purchasePackage')}
          </MenuItem>
        )}
        {hasPermission('customers:update') && (
          <MenuItem
            onClick={() => {
              setCustomerDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EC4899', 0.08) } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#EC4899' }} />
            {t('customers.editCustomer')}
          </MenuItem>
        )}
        {/* Temporarily commented out - Deactivate/Activate Customer functionality */}
        {/* {hasPermission('customers:update') && (
          <MenuItem
            onClick={() => {
              handleToggleCustomerStatus();
              setMenuAnchorEl(null);
            }}
            sx={{
              '&:hover': {
                backgroundColor: selectedCustomer?.status === 'ACTIVE'
                  ? alpha('#EF4444', 0.08)
                  : alpha('#10B981', 0.08)
              }
            }}
          >
            {selectedCustomer?.status === 'ACTIVE' ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
                {t('customers.deactivateCustomer')}
              </>
            ) : (
              <>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
                {t('customers.activateCustomer')}
              </>
            )}
          </MenuItem>
        )} */}
        {hasPermission('customers:delete') && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
            {t('customers.deleteCustomer')}
          </MenuItem>
        )}
      </Menu>

      {/* 对话框组件 */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onExited={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      <AppointmentHistory
        open={appointmentHistoryOpen}
        onClose={() => setAppointmentHistoryOpen(false)}
        customer={selectedCustomer}
      />

      <CustomerPackages
        open={customerPackagesOpen}
        onClose={() => setCustomerPackagesOpen(false)}
        customer={selectedCustomer}
        onPurchasePackage={() => {
          setCustomerPackagesOpen(false);
          setPackagePurchaseDialogOpen(true);
        }}
      />

      {/* 套餐购买对话框 */}
      <PackagePurchase
        open={packagePurchaseDialogOpen}
        onClose={() => setPackagePurchaseDialogOpen(false)}
        customer={selectedCustomer}
        onSuccess={() => {
          fetchCustomers(buildQueryParams());
          setSnackbar({
            open: true,
            message: t('customers.packagePurchaseSuccess'),
            severity: 'success',
          });
        }}
      />

      {/* 客户数据导入对话框 */}
      <CustomerImport
        open={customerImportOpen}
        onClose={() => setCustomerImportOpen(false)}
        onImportComplete={() => {
          // 重新加载客户数据和统计信息
          fetchCustomers(buildQueryParams());
          loadCustomerStats();
          setSnackbar({
            open: true,
            message: t('customers.import.importSuccess'),
            severity: 'success',
          });
        }}
      />

      {/* 导入历史对话框 */}
      <ImportHistory
        open={importHistoryOpen}
        onClose={() => setImportHistoryOpen(false)}
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
            {t('customers.confirmDelete')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('customers.deleteConfirmMessage', {
              name: selectedCustomer?.fullName || `${selectedCustomer?.firstName} ${selectedCustomer?.lastName}`
            }) || `确定要删除客户 ${selectedCustomer?.firstName}${selectedCustomer?.lastName} 吗？此操作无法撤销。`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedCustomer(null);
            }}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteCustomer}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CustomerManagement; 