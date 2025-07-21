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
import CustomerDialog from './components/CustomerDialog';
import AppointmentHistory from './components/AppointmentHistory';

// 客户数据接口
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  membershipLevel: 'regular' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
  notes?: string;
  preferredServices: string[];
  allergies?: string;
  communicationPreference: 'phone' | 'email' | 'sms';
  status: 'active' | 'inactive';
  avatar?: string;
}

const CustomerManagement: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // 对话框状态
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 生成模拟数据
  React.useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        firstName: 'San',
        lastName: 'Zhang',
        phone: '138-0000-0001',
        email: 'zhangsan@example.com',
        address: '123 Chaoyang District, Beijing',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        membershipLevel: 'gold',
        points: 1250,
        totalSpent: 2850,
        lastVisit: '2024-01-15T14:30:00',
        createdAt: '2023-06-01T10:00:00',
        preferredServices: ['haircut', 'styling'],
        communicationPreference: 'phone',
        status: 'active',
      },
      {
        id: '2',
        firstName: 'Si',
        lastName: 'Li',
        phone: '139-0000-0002',
        email: 'lisi@example.com',
        address: '456 Pudong New Area, Shanghai',
        dateOfBirth: '1988-11-22',
        gender: 'female',
        membershipLevel: 'platinum',
        points: 2100,
        totalSpent: 4200,
        lastVisit: '2024-01-18T11:15:00',
        createdAt: '2023-03-15T16:30:00',
        preferredServices: ['color', 'treatment'],
        communicationPreference: 'email',
        status: 'active',
      },
      {
        id: '3',
        firstName: 'Wu',
        lastName: 'Wang',
        phone: '137-0000-0003',
        email: 'wangwu@example.com',
        address: '789 Tianhe District, Guangzhou',
        gender: 'male',
        membershipLevel: 'silver',
        points: 680,
        totalSpent: 1450,
        lastVisit: '2024-01-12T09:45:00',
        createdAt: '2023-09-10T14:20:00',
        preferredServices: ['haircut'],
        communicationPreference: 'sms',
        status: 'active',
      },
    ];
    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  const getMembershipChip = (level: string) => {
    const membershipConfig = {
          regular: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: t('customers.membershipLevels.regular') },
    silver: { color: '#9CA3AF', bg: alpha('#9CA3AF', 0.1), label: t('customers.membershipLevels.silver') },
    gold: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('customers.membershipLevels.gold') },
    platinum: { color: '#8B5CF6', bg: alpha('#8B5CF6', 0.1), label: t('customers.membershipLevels.platinum') },
    };
    
    const config = membershipConfig[level as keyof typeof membershipConfig] || membershipConfig.regular;
    
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

  const getStatusChip = (status: string) => {
    const config = status === 'active' 
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
                  {customers.length}
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
                  {customers.filter(c => c.status === 'active').length}
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
                  {customers.filter(c => c.membershipLevel === 'gold' || c.membershipLevel === 'platinum').length}
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
                  ¥{Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length) || 0}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setMembershipFilter(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
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
                          src={customer.avatar}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#6366F1',
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          {customer.firstName.charAt(0) + customer.lastName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customer.firstName}{customer.lastName}
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
                          {customer.points}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ¥{customer.totalSpent.toFixed(2)}
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
                          从未访问
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
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredCustomers.length}
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
        onClose={() => setCustomerDialogOpen(false)}
        customer={selectedCustomer}
        onSave={(customer) => {
          // 处理保存逻辑
          setCustomerDialogOpen(false);
        }}
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
            确定要删除客户 {selectedCustomer?.firstName}{selectedCustomer?.lastName} 吗？此操作无法撤销。
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
            取消
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
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerManagement; 