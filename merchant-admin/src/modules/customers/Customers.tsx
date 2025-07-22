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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { customerApi, Customer, CustomerStats, handleApiError } from '../../services/api';
import CustomerDialog from './components/CustomerDialog';
import AppointmentHistory from './components/AppointmentHistory';

// 使用API中定义的Customer接口

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 对话框状态
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    membershipLevel: membershipFilter !== 'all' ? (membershipFilter.toUpperCase() as 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM') : undefined,
    page: pageNum,
    size: rowsPerPage,
    sortBy: 'updatedAt',
    sortDir: 'desc' as const,
  }), [tenantId, searchTerm, statusFilter, membershipFilter, page, rowsPerPage]);

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

  // 统一的数据加载逻辑
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(buildQueryParams());
    }, searchTerm ? 500 : 0); // 只有在搜索时才防抖

    return () => clearTimeout(timeoutId);
  }, [fetchCustomers, buildQueryParams]); // 使用稳定的函数引用

  // 初始加载统计数据
  useEffect(() => {
    loadCustomerStats();
  }, [loadCustomerStats]);

  // 删除客户
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.id) return;
    
    try {
      setLoading(true);
      await customerApi.deleteCustomer(selectedCustomer.id);
      
      setSnackbar({
        open: true,
        message: t('customers.deleteSuccess') || '客户删除成功',
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
      setLoading(true);
      
      if (selectedCustomer?.id) {
        // 更新客户
        await customerApi.updateCustomer(selectedCustomer.id, customerData as Customer);
        setSnackbar({
          open: true,
          message: t('customers.updateSuccess') || '客户信息更新成功',
          severity: 'success',
        });
      } else {
        // 创建客户
        customerData.tenantId = tenantId;
        // 保证 id 一定有值
        if (!customerData.id) customerData.id = `${Date.now()}`;
        await customerApi.createCustomer(customerData as Customer);
        setSnackbar({
          open: true,
          message: t('customers.createSuccess') || '客户创建成功',
          severity: 'success',
        });
      }
      
      setCustomerDialogOpen(false);
      setSelectedCustomer(null);
      // 重新加载数据
      const params = {
        tenantId,
        keyword: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'ACTIVE' : statusFilter === 'inactive' ? 'INACTIVE' : undefined) as 'ACTIVE' | 'INACTIVE' | undefined : undefined,
        membershipLevel: membershipFilter !== 'all' ? (membershipFilter.toUpperCase() as 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM') : undefined,
        page,
        size: rowsPerPage,
        sortBy: 'updatedAt',
        sortDir: 'desc' as const,
      };
      fetchCustomers(params);
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

  const getMembershipChip = (level?: string) => {
    const membershipConfig = {
      REGULAR: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: t('customers.membershipLevels.regular') },
      SILVER: { color: '#9CA3AF', bg: alpha('#9CA3AF', 0.1), label: t('customers.membershipLevels.silver') },
      GOLD: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('customers.membershipLevels.gold') },
      PLATINUM: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('customers.membershipLevels.platinum') },
    };
    
    const config = membershipConfig[level as keyof typeof membershipConfig] || membershipConfig.REGULAR;
    
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
                background: 'linear-gradient(45deg, #D97706, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('customers.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('customers.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 现代化统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#6366F1', 0.1),
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
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <GroupsIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
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
                    background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <WalletIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                  ¥{Math.round(customerStats?.averageSpending || 0)}
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
            <Grid item xs={12} md={4}>
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
                      borderColor: '#F59E0B',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F59E0B',
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
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
                      borderColor: '#F59E0B',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F59E0B',
                    },
                  }}
                >
                  <MenuItem value="all">{t('customers.allLevels')}</MenuItem>
                  <MenuItem value="regular">{t('customers.membershipLevels.regular')}</MenuItem>
                  <MenuItem value="silver">{t('customers.membershipLevels.silver')}</MenuItem>
                  <MenuItem value="gold">{t('customers.membershipLevels.gold')}</MenuItem>
                  <MenuItem value="platinum">{t('customers.membershipLevels.platinum')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
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
                      borderColor: '#F59E0B',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F59E0B',
                    },
                  }}
                >
                  <MenuItem value="all">{t('customers.allStatuses')}</MenuItem>
                  <MenuItem value="active">{t('customers.customerStatuses.active')}</MenuItem>
                  <MenuItem value="inactive">{t('customers.customerStatuses.inactive')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCustomerDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D97706, #B45309)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('customers.addCustomer')}
              </Button>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {t('customers.noCustomers') || '暂无客户数据'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow 
                    key={customer.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#F59E0B', 0.04),
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
                            bgcolor: '#6366F1',
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
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
                            {customer.phone}
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
                      {getMembershipChip(customer.membershipLevel)}
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
                        ¥{(customer.totalSpent || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {customer.lastVisit ? (
                        <Box>
                          <Typography variant="body2">
                            {new Date(customer.lastVisit).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(customer.lastVisit).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t('customers.neverVisited') || '从未访问'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(customer.status)}
                    </TableCell>
                    <TableCell>
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
        <MenuItem
          onClick={() => {
            setAppointmentHistoryOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.08) } }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          查看预约
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCustomerDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#F59E0B', 0.08) } }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18, color: '#F59E0B' }} />
          编辑资料
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
          删除客户
        </MenuItem>
      </Menu>

      {/* 对话框组件 */}
      <CustomerDialog 
        open={customerDialogOpen} 
        onClose={() => {
          setCustomerDialogOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      <AppointmentHistory 
        open={appointmentHistoryOpen} 
        onClose={() => setAppointmentHistoryOpen(false)}
        customer={selectedCustomer}
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
            确认删除客户
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
            {t('common.cancel') || '取消'}
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
            {loading ? <CircularProgress size={20} color="inherit" /> : (t('common.delete') || '删除')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知组件 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
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