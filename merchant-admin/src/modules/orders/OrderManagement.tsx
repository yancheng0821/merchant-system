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
  Payment as PaymentIcon,
  MoneyOff as RefundIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import AddOrderDialog from './components/AddOrderDialog';
import OrderDetailsDialog from './components/OrderDetailsDialog';
import PaymentDialog from './components/PaymentDialog';
import RefundDialog from './components/RefundDialog';

// 订单接口
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  services: OrderService[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  tipAmount: number;
  tipPercentage: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_pay' | 'gift_card';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  orderStatus: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  staff: string;
  posTerminalId?: string;
  transactionId?: string;
  cardLast4?: string;
  authorizationCode?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
}

export interface OrderService {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  staff?: string;
  duration?: number;
}

const OrderManagement: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 对话框状态
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // 生成模拟数据
  React.useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 'ord_001',
        orderNumber: 'ORD-20240125-001',
        customerId: '1',
        customerName: 'Emily Johnson',
        customerPhone: '+1-555-0123',
        services: [
          { id: 's1', name: 'Hair Cut', category: 'Hair & Beauty', price: 65.00, quantity: 1, staff: 'Sarah Johnson', duration: 60 },
          { id: 's2', name: 'Hair Color', category: 'Hair & Beauty', price: 120.00, quantity: 1, staff: 'Sarah Johnson', duration: 120 }
        ],
        subtotal: 185.00,
        taxRate: 0.13, // 13% HST (Ontario)
        taxAmount: 24.05,
        tipAmount: 37.00,
        tipPercentage: 20,
        totalAmount: 246.05,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        staff: 'Sarah Johnson',
        posTerminalId: 'POS-001',
        transactionId: 'TXN-20240125-14:32:15',
        cardLast4: '4242',
        authorizationCode: 'AUTH123456',
        createdAt: '2024-01-25T14:30:00Z',
        completedAt: '2024-01-25T16:45:00Z',
        notes: 'Customer was very satisfied with the service'
      },
      {
        id: 'ord_002',
        orderNumber: 'ORD-20240125-002',
        customerId: '2',
        customerName: 'Michael Chen',
        customerPhone: '+1-555-0234',
        services: [
          { id: 's3', name: 'Full Body Massage', category: 'Spa Package', price: 150.00, quantity: 1, staff: 'Jennifer Wong', duration: 90 },
          { id: 's4', name: 'Facial', category: 'Facial Treatment', price: 80.00, quantity: 1, staff: 'Jennifer Wong', duration: 60 }
        ],
        subtotal: 230.00,
        taxRate: 0.13,
        taxAmount: 29.90,
        tipAmount: 41.40,
        tipPercentage: 18,
        totalAmount: 301.30,
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        staff: 'Jennifer Wong',
        posTerminalId: 'POS-002',
        transactionId: 'TXN-20240125-11:15:33',
        cardLast4: '5555',
        authorizationCode: 'AUTH789012',
        createdAt: '2024-01-25T11:00:00Z',
        completedAt: '2024-01-25T13:30:00Z'
      },
      {
        id: 'ord_003',
        orderNumber: 'ORD-20240125-003',
        customerId: '3',
        customerName: 'Sarah Williams',
        customerPhone: '+1-555-0345',
        services: [
          { id: 's5', name: 'Manicure', category: 'Nail Care', price: 45.00, quantity: 1, staff: 'Maria Lopez', duration: 45 },
          { id: 's6', name: 'Pedicure', category: 'Nail Care', price: 55.00, quantity: 1, staff: 'Maria Lopez', duration: 60 }
        ],
        subtotal: 100.00,
        taxRate: 0.13,
        taxAmount: 13.00,
        tipAmount: 18.00,
        tipPercentage: 18,
        totalAmount: 131.00,
        paymentMethod: 'debit_card',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        staff: 'Maria Lopez',
        posTerminalId: 'POS-003',
        transactionId: 'TXN-20240125-16:22:45',
        cardLast4: '1234',
        authorizationCode: 'AUTH345678',
        createdAt: '2024-01-25T16:00:00Z',
        completedAt: '2024-01-25T17:45:00Z'
      },
      {
        id: 'ord_004',
        orderNumber: 'ORD-20240125-004',
        customerId: '4',
        customerName: 'David Rodriguez',
        customerPhone: '+1-555-0456',
        services: [
          { id: 's7', name: 'Hair Cut', category: 'Hair Care', price: 35.00, quantity: 1, staff: 'Alex Chen', duration: 30 },
          { id: 's8', name: 'Beard Trim', category: 'Hair Care', price: 25.00, quantity: 1, staff: 'Alex Chen', duration: 15 }
        ],
        subtotal: 60.00,
        taxRate: 0.13,
        taxAmount: 7.80,
        tipAmount: 9.00,
        tipPercentage: 15,
        totalAmount: 76.80,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        staff: 'Alex Chen',
        createdAt: '2024-01-25T13:15:00Z',
        completedAt: '2024-01-25T14:00:00Z'
      },
      {
        id: 'ord_005',
        orderNumber: 'ORD-20240125-005',
        customerId: '5',
        customerName: 'Jessica Thompson',
        customerPhone: '+1-555-0567',
        services: [
          { id: 's9', name: 'Deep Cleansing Facial', category: 'Facial Treatment', price: 95.00, quantity: 1, staff: 'Sarah Johnson', duration: 75 }
        ],
        subtotal: 95.00,
        taxRate: 0.13,
        taxAmount: 12.35,
        tipAmount: 0,
        tipPercentage: 0,
        totalAmount: 107.35,
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        orderStatus: 'in_progress',
        staff: 'Sarah Johnson',
        createdAt: '2024-01-25T15:30:00Z'
      }
    ];
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  const getStatusChip = (status: string) => {
    const statusConfig = {
          pending: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: 'status.pending' },
    paid: { color: '#10B981', bg: alpha('#10B981', 0.1), label: 'status.paid' },
    refunded: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'status.refunded' },
    failed: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'status.failed' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Chip
        label={t(config.label)}
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

  const getOrderStatusChip = (status: string) => {
    const statusConfig = {
          draft: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: 'status.draft' },
    confirmed: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: 'status.confirmed' },
    in_progress: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: 'status.inProgress' },
    completed: { color: '#10B981', bg: alpha('#10B981', 0.1), label: 'status.completed' },
    cancelled: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'status.cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Chip
        label={t(config.label)}
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <MoneyIcon sx={{ fontSize: 16 }} />;
      case 'credit_card': return <CreditCardIcon sx={{ fontSize: 16 }} />;
      case 'debit_card': return <PaymentIcon sx={{ fontSize: 16 }} />;
      case 'mobile_pay': return <WalletIcon sx={{ fontSize: 16 }} />;
      default: return <PaymentIcon sx={{ fontSize: 16 }} />;
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
                background: 'linear-gradient(45deg, #059669, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('orders.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('orders.subtitle')}
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
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  ¥{orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('orders.todayRevenue')}
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
                  <OrdersIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
                  {orders.length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('orders.todayOrders')}
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
                  <PaymentIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {orders.filter(order => order.paymentStatus === 'paid').length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('orders.pendingPayments')}
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
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                  ¥{orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length) : 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('analytics.avgOrderValue')}
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
                placeholder={t('orders.searchPlaceholder')}
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
                      borderColor: '#10B981',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'text.secondary' }}>{t('filters.orderStatus')}</InputLabel>
                <Select
                  value={statusFilter}
                                      label={t('filters.orderStatus')}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                  }}
                >
                                      <MenuItem value="all">{t('filters.allStatuses')}</MenuItem>
                    <MenuItem value="draft">{t('status.draft')}</MenuItem>
                    <MenuItem value="confirmed">{t('status.confirmed')}</MenuItem>
                    <MenuItem value="in_progress">{t('status.inProgress')}</MenuItem>
                    <MenuItem value="completed">{t('status.completed')}</MenuItem>
                    <MenuItem value="cancelled">{t('status.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'text.secondary' }}>{t('filters.paymentStatus')}</InputLabel>
                <Select
                  value={paymentFilter}
                                      label={t('filters.paymentStatus')}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10B981',
                    },
                  }}
                >
                                      <MenuItem value="all">{t('filters.allStatuses')}</MenuItem>
                    <MenuItem value="pending">{t('status.pending')}</MenuItem>
                    <MenuItem value="paid">{t('status.paid')}</MenuItem>
                    <MenuItem value="refunded">{t('status.refunded')}</MenuItem>
                    <MenuItem value="failed">{t('status.failed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddOrderOpen(true)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('orders.newOrder')}
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
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('tableHeaders.orderNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.service')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.amount')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.paymentMethod')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.paymentStatus')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.orderStatus')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.createdAt')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow 
                    key={order.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#10B981', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#6366F1',
                            fontSize: '0.875rem',
                          }}
                        >
                          {order.customerName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {order.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customerPhone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.services.length}{t('orders.items')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.services[0]?.name}
                        {order.services.length > 1 && ` +${order.services.length - 1}${t('orders.moreItems')}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ¥{order.totalAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <Typography variant="body2">
                                                  {order.paymentMethod === 'credit_card' && t('orders.paymentMethods.credit_card')}
                        {order.paymentMethod === 'cash' && t('orders.paymentMethods.cash')}
                        {order.paymentMethod === 'mobile_pay' && t('orders.paymentMethods.mobile_pay')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusChip(order.orderStatus)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchorEl(e.currentTarget);
                          setSelectedOrder(order);
                        }}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha('#10B981', 0.1),
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
          count={filteredOrders.length}
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
            setOrderDetailsOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.08) } }}
        >
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          {t('orders.viewDetails')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPaymentDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#10B981', 0.08) } }}
        >
          <PaymentIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
          {t('orders.processPayment')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setRefundDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#F59E0B', 0.08) } }}
        >
          <RefundIcon sx={{ mr: 1, fontSize: 18, color: '#F59E0B' }} />
          {t('orders.requestRefund')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
          {t('orders.deleteOrder')}
        </MenuItem>
      </Menu>

      {/* 对话框组件 */}
      <AddOrderDialog 
        open={addOrderOpen} 
        onClose={() => setAddOrderOpen(false)}
        onSave={(order) => {
          // 处理保存逻辑
          setAddOrderOpen(false);
        }}
      />

      <OrderDetailsDialog 
        open={orderDetailsOpen} 
        onClose={() => setOrderDetailsOpen(false)}
        order={selectedOrder}
      />

      <PaymentDialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        order={selectedOrder}
        onPaymentComplete={(updatedOrder) => {
          // 处理支付完成逻辑
          setPaymentDialogOpen(false);
        }}
      />

      <RefundDialog 
        open={refundDialogOpen} 
        onClose={() => setRefundDialogOpen(false)}
        order={selectedOrder}
        onRefundComplete={(updatedOrder) => {
          // 处理退款完成逻辑
          setRefundDialogOpen(false);
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
            确认删除订单
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除订单 {selectedOrder?.orderNumber} 吗？此操作无法撤销。
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

export default OrderManagement; 