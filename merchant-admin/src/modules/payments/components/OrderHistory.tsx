import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Avatar,
  InputAdornment,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  Menu,
  ListItemIcon,
  Alert,
  Snackbar,
  Popover,
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  EventNote as EventNoteIcon,
  Undo as RefundIcon,
  MoreVert as MoreVertIcon,
  CardGiftcard as PackageIcon,
  Event as EventIcon,
  CompareArrows as MixedPaymentIcon,
  // Membership tier icons
  Star as StarIcon,
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
  TrendingUp as TrendingUpIcon,
  Loyalty as LoyaltyIcon,
  Redeem as RedeemIcon,
  Favorite as HeartIcon,
  AutoAwesome as SparkleIcon,
  Whatshot as FireIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { formatUtcToMerchantTime, getMerchantNow } from '../../../utils/timezoneUtils';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';

interface MembershipTier {
  id: number;
  name: string;
  code: string;
  requiredPoints: number;
  discountRate: number;
  color?: string;
  icon?: string;
  benefits?: string;
  isActive: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerMembershipTier?: MembershipTier;
  appointmentId?: number;
  resourceId?: number;
  resourceName?: string;
  resourceType?: string;
  services?: any[];
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
}

interface RefundReason {
  value: string;
  translationKey: string;
  stripe_value: string;
}

const OrderHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  // Orders theme color
  const ORDERS_COLOR = '#10B981';

  // Get locale for date picker
  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [detailsDialog, setDetailsDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundReasons, setRefundReasons] = useState<RefundReason[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuOrder, setMenuOrder] = useState<Order | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

  // Date picker popover states
  const [startDateAnchorEl, setStartDateAnchorEl] = useState<null | HTMLElement>(null);
  const [endDateAnchorEl, setEndDateAnchorEl] = useState<null | HTMLElement>(null);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = getMerchantNow();
    return {
      start: today,
      end: today,
    };
  });

  // Get membership tier icon
  const getTierIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <StarIcon />;
      case 'starhalf': return <StarHalfIcon />;
      case 'starrate': return <StarRateIcon />;
      case 'grade': return <GradeIcon />;
      case 'stars': return <StarsIcon />;
      case 'trophy': return <TrophyIcon />;
      case 'medal': return <MedalIcon />;
      case 'diamond': return <DiamondIcon />;
      case 'premium': return <PremiumIcon />;
      case 'verified': return <VerifiedIcon />;
      case 'membership': return <MembershipIcon />;
      case 'trendingup': return <TrendingUpIcon />;
      case 'loyalty': return <LoyaltyIcon />;
      case 'redeem': return <RedeemIcon />;
      case 'heart': return <HeartIcon />;
      case 'sparkle': return <SparkleIcon />;
      case 'fire': return <FireIcon />;
      case 'celebration': return <CelebrationIcon />;
      default: return <StarIcon />;
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      // 后端会处理时区转换，前端只需发送商户本地日期
      const params = {
        tenantId: user?.tenantId || 0,
        page: page,
        size: rowsPerPage,
        searchTerm: searchTerm || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        orderStatus: orderStatusFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        startDate: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined,
      };

      const response = await api.getOrders(params);
      setOrders(response?.content || []);
      setTotalElements(response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, paymentMethodFilter, dateRange]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchOrders();
    }
  }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, paymentMethodFilter, dateRange, fetchOrders]);

  // 获取退款原因选项
  useEffect(() => {
    // 使用国际化的退款原因选项
    setRefundReasons([
      { value: 'DUPLICATE_CHARGE', translationKey: 'orders.refundReasons.duplicateCharge', stripe_value: 'duplicate' },
      { value: 'FRAUDULENT', translationKey: 'orders.refundReasons.fraudulent', stripe_value: 'fraudulent' },
      { value: 'CUSTOMER_REQUEST', translationKey: 'orders.refundReasons.customerRequest', stripe_value: 'requested_by_customer' },
      { value: 'PRODUCT_UNACCEPTABLE', translationKey: 'orders.refundReasons.productUnacceptable', stripe_value: 'product_unacceptable' },
      { value: 'SERVICE_UNSATISFACTORY', translationKey: 'orders.refundReasons.serviceUnsatisfactory', stripe_value: 'service_unsatisfactory' },
      { value: 'ORDER_CANCELLED', translationKey: 'orders.refundReasons.orderCancelled', stripe_value: 'order_cancelled' },
      { value: 'OTHER', translationKey: 'orders.refundReasons.other', stripe_value: 'other' }
    ]);
  }, []);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('orders.pending') },
      paid: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('orders.paid') },
      refunded: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('orders.refunded') },
      failed: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('orders.failed') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
        }}
      />
    );
  };

  const getOrderStatusChip = (status: string) => {
    const statusConfig = {
      draft: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: t('orders.draft') },
      confirmed: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: t('orders.confirmed') },
      in_progress: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: t('orders.inProgress') },
      completed: { color: '#10B981', bg: alpha('#10B981', 0.1), label: t('orders.completed') },
      cancelled: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: t('orders.cancelled') },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
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
      case 'package': return <PackageIcon sx={{ fontSize: 16 }} />;
      case 'gift_card': return <PackageIcon sx={{ fontSize: 16 }} />;
      case 'mixed': return <MixedPaymentIcon sx={{ fontSize: 16 }} />;
      default: return <PaymentIcon sx={{ fontSize: 16 }} />;
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialog(true);
  };

  const handleRefund = (order: Order) => {
    setSelectedOrder(order);
    setRefundAmount(order.totalAmount.toString());
    setRefundReason('');
    setRefundDialog(true);
  };

  const processRefund = async () => {
    if (!selectedOrder || !refundAmount || !refundReason) {
      setRefundError(t('orders.refundValidationError'));
      return;
    }

    // 验证退款金额
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedOrder.totalAmount) {
      setRefundError(t('orders.invalidRefundAmount'));
      return;
    }

    setRefundLoading(true);
    setRefundError(null);
    
    try {
      const response = await api.processRefund({
        orderId: selectedOrder.id,
        amount: amount,
        reason: refundReason,
      });

      // 检查响应是否成功
      if (response && response.success !== false) {
        // 刷新订单列表
        await fetchOrders();
        
        // 显示成功提示
        setRefundSuccess(true);
        
        // 关闭对话框
        setRefundDialog(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedOrder(null);
      } else {
        setRefundError(response?.message || t('orders.refundFailed'));
      }
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      
      // 提取错误信息
      let errorMessage = t('orders.refundFailed');
      if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setRefundError(errorMessage);
    } finally {
      setRefundLoading(false);
    }
  };

  const canRefund = (order: Order) => {
    return order.paymentStatus === 'paid' && order.orderStatus === 'completed';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setMenuOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  const handleMenuViewDetails = () => {
    if (menuOrder) {
      handleViewDetails(menuOrder);
    }
    handleMenuClose();
  };

  const handleMenuRefund = () => {
    if (menuOrder) {
      handleRefund(menuOrder);
    }
    handleMenuClose();
  };



  const formatDateTime = (dateString: string) => {
    // 将 UTC 时间转换为商户本地时区
    const fullDateTime = formatUtcToMerchantTime(dateString, 'yyyy-MM-dd HH:mm:ss');
    const [date, time] = fullDateTime.split(' ');
    return { date, time };
  };

  return (
    <Box>
      {/* Search and Filter Section */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
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
                    '&.Mui-focused fieldset': {
                      borderColor: ORDERS_COLOR,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.25}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ '&.Mui-focused': { color: ORDERS_COLOR } }}>
                  {t('orders.paymentMethod')}
                </InputLabel>
                <Select
                  value={paymentMethodFilter}
                  label={t('orders.paymentMethod')}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: ORDERS_COLOR,
                    },
                  }}
                >
                  <MenuItem value="">{t('orders.allMethods')}</MenuItem>
                  <MenuItem value="cash">{t('orders.cash')}</MenuItem>
                  <MenuItem value="credit_card">{t('orders.credit_card')}</MenuItem>
                  <MenuItem value="debit_card">{t('orders.debit_card')}</MenuItem>
                  <MenuItem value="mobile_pay">{t('orders.mobile_pay')}</MenuItem>
                  <MenuItem value="package">{t('orders.package')}</MenuItem>
                  <MenuItem value="gift_card">{t('orders.gift_card')}</MenuItem>
                  <MenuItem value="mixed">{t('orders.mixed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.25}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ '&.Mui-focused': { color: ORDERS_COLOR } }}>
                  {t('orders.paymentStatus')}
                </InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label={t('orders.paymentStatus')}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: ORDERS_COLOR,
                    },
                  }}
                >
                  <MenuItem value="">{t('orders.allPayments')}</MenuItem>
                  <MenuItem value="pending">{t('orders.pending')}</MenuItem>
                  <MenuItem value="paid">{t('orders.paid')}</MenuItem>
                  <MenuItem value="refunded">{t('orders.refunded')}</MenuItem>
                  <MenuItem value="failed">{t('orders.failed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Order Status Filter - Temporarily Commented Out */}
            {/* <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ '&.Mui-focused': { color: ORDERS_COLOR } }}>
                  {t('orders.orderStatus')}
                </InputLabel>
                <Select
                  value={orderStatusFilter}
                  label={t('orders.orderStatus')}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: ORDERS_COLOR,
                    },
                  }}
                >
                  <MenuItem value="">{t('orders.allStatuses')}</MenuItem>
                  <MenuItem value="draft">{t('orders.draft')}</MenuItem>
                  <MenuItem value="confirmed">{t('orders.confirmed')}</MenuItem>
                  <MenuItem value="in_progress">{t('orders.inProgress')}</MenuItem>
                  <MenuItem value="completed">{t('orders.completed')}</MenuItem>
                  <MenuItem value="cancelled">{t('orders.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label={t('orders.startDate')}
                value={format(dateRange.start, 'yyyy-MM-dd')}
                onClick={(e) => setStartDateAnchorEl(e.currentTarget)}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={(e) => setStartDateAnchorEl(e.currentTarget)}
                        edge="end"
                        size="small"
                      >
                        <EventIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&.Mui-focused fieldset': {
                      borderColor: ORDERS_COLOR,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORDERS_COLOR,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label={t('orders.endDate')}
                value={format(dateRange.end, 'yyyy-MM-dd')}
                onClick={(e) => setEndDateAnchorEl(e.currentTarget)}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={(e) => setEndDateAnchorEl(e.currentTarget)}
                        edge="end"
                        size="small"
                      >
                        <EventIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&.Mui-focused fieldset': {
                      borderColor: ORDERS_COLOR,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORDERS_COLOR,
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>{t('orders.orderNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.customer')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.services')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.subtotal')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.tax')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.tip')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.total')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.payment')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.paymentStatus')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.date')}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders && orders.map((order) => {
                const dateTime = formatDateTime(order.createdAt);
                return (
                  <TableRow
                    key={order.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#10B981', 0.04),
                      },
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
                        {order.services?.length || 0} {t('orders.items')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {CurrencyUtils.formatAmount(order.subtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {CurrencyUtils.formatAmount(order.taxAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {CurrencyUtils.formatAmount(order.tipAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                        {CurrencyUtils.formatAmount(order.totalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getPaymentMethodIcon(order.paymentMethod)}
                        {getStatusChip(order.paymentStatus)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getOrderStatusChip(order.orderStatus)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{dateTime.date}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dateTime.time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(event) => handleMenuOpen(event, order)}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha('#6B7280', 0.1),
                          },
                        }}
                      >
                        <MoreVertIcon sx={{ color: '#6B7280' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8fafc',
          }}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 160,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuViewDetails}>
          <ListItemIcon>
            <VisibilityIcon sx={{ fontSize: 20, color: '#10B981' }} />
          </ListItemIcon>
          <Typography variant="body2">{t('orders.viewDetails')}</Typography>
        </MenuItem>
        {/* Refund functionality temporarily disabled */}
        {/* {hasPermission('orders:refund') && menuOrder && canRefund(menuOrder) && (
          <MenuItem onClick={handleMenuRefund}>
            <ListItemIcon>
              <RefundIcon sx={{ fontSize: 20, color: '#EF4444' }} />
            </ListItemIcon>
            <Typography variant="body2">{t('orders.processRefund')}</Typography>
          </MenuItem>
        )} */}
      </Menu>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
              {t('orders.orderDetails')}
            </Typography>
            <IconButton
              onClick={() => setDetailsDialog(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha('#10B981', 0.08) }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
          {selectedOrder && (
            <Box>
              {/* Order Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                    {t('orders.orderNumber')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                    {selectedOrder.orderNumber}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                    {formatDateTime(selectedOrder.createdAt).date}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {formatDateTime(selectedOrder.createdAt).time}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              {/* Customer & Order Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 1.5 }}>
                    {t('orders.customer')}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <PersonIcon sx={{ fontSize: 18, color: '#10B981' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedOrder.customerName}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <PhoneIcon sx={{ fontSize: 18, color: '#64748b' }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedOrder.customerPhone}
                    </Typography>
                  </Box>
                  {selectedOrder.customerMembershipTier && (
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          fontSize: 18,
                          color: selectedOrder.customerMembershipTier.color || '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {getTierIcon(selectedOrder.customerMembershipTier.icon || 'star')}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: selectedOrder.customerMembershipTier.color || '#9CA3AF' }}>
                          {selectedOrder.customerMembershipTier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {t('orders.memberPrice')}: {selectedOrder.customerMembershipTier.discountRate}% ({(100 - selectedOrder.customerMembershipTier.discountRate).toFixed(0)}% {t('orders.off')})
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 1.5 }}>
                    {t('orders.orderInfo')}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Box sx={{ color: '#10B981' }}>
                      {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                    </Box>
                    <Typography variant="body2">{t(`orders.${selectedOrder.paymentMethod}`)}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    {getStatusChip(selectedOrder.paymentStatus)}
                    {getOrderStatusChip(selectedOrder.orderStatus)}
                  </Box>
                </Grid>
              </Grid>

              {/* 显示退款信息 - Temporarily Disabled */}
              {/* {selectedOrder.paymentStatus === 'refunded' && selectedOrder.refundAmount && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#EF4444' }}>
                      {t('orders.refundInfo')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('orders.refundAmount')}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
                        {CurrencyUtils.formatAmount(selectedOrder.refundAmount)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('orders.refundReason')}:
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.refundReason || t('orders.notSpecified')}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )} */}

              {/* Appointment & Staff Info */}
              {(selectedOrder.appointmentId || selectedOrder.resourceId) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 1.5 }}>
                    {t('orders.appointmentInfo')}
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedOrder.appointmentId && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <EventNoteIcon sx={{ fontSize: 18, color: '#10B981' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                              {t('orders.relatedAppointment')}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                mb: 0.5
                              }}
                            >
                              #{selectedOrder.appointmentId}
                            </Typography>
                            <Button
                              onClick={() => {
                                setDetailsDialog(false);
                                navigate(`/appointments?appointmentId=${selectedOrder.appointmentId}`);
                              }}
                              sx={{
                                minWidth: 'auto',
                                padding: 0,
                                textTransform: 'none',
                                color: '#10B981',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {t('orders.viewAppointment')}
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {selectedOrder.resourceId && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <PersonIcon sx={{ fontSize: 18, color: '#10B981' }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                              {selectedOrder.resourceType}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {selectedOrder.resourceName || `#${selectedOrder.resourceId}`}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                  <Divider sx={{ mt: 2.5 }} />
                </Box>
              )}

              {/* Services */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 2 }}>
                  {t('orders.services')}
                </Typography>
                {selectedOrder.services && selectedOrder.services.length > 0 ? (
                  <Box>
                    {selectedOrder.services.map((service, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                      >
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {service.serviceName}
                            </Typography>
                            {service.paymentMethod && (
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                sx={{
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: 1,
                                  bgcolor: alpha('#10B981', 0.1),
                                  color: '#10B981',
                                }}
                              >
                                {getPaymentMethodIcon(service.paymentMethod)}
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                  {t(`orders.${service.paymentMethod}`)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {service.quantity} x {CurrencyUtils.formatAmount(service.price)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {CurrencyUtils.formatAmount(service.quantity * service.price)}
                        </Typography>
                      </Box>
                    ))}

                    <Divider sx={{ my: 2 }} />

                    {/* Subtotals */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {t('orders.subtotal')}
                      </Typography>
                      <Typography variant="body2">
                        {CurrencyUtils.formatAmount(selectedOrder.subtotal)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {t('orders.tax')}
                      </Typography>
                      <Typography variant="body2">
                        {CurrencyUtils.formatAmount(selectedOrder.taxAmount)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        {t('orders.tip')}
                      </Typography>
                      <Typography variant="body2">
                        {CurrencyUtils.formatAmount(selectedOrder.tipAmount)}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Total */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('orders.total')}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981' }}>
                        {CurrencyUtils.formatAmount(selectedOrder.totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('orders.noServiceDetails')}
                  </Typography>
                )}
              </Box>

              {selectedOrder.notes && (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mb: 1.5 }}>
                    {t('orders.notes')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
                    {selectedOrder.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog - Temporarily Disabled */}
      {/* <Dialog
        open={refundDialog}
        onClose={() => setRefundDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
              {t('orders.processRefund')}
            </Typography>
            <IconButton onClick={() => setRefundDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('orders.refundOrderInfo', { orderNumber: selectedOrder.orderNumber })}
              </Typography>

              {refundError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {refundError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('orders.refundAmount')}
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={t('orders.maxRefundAmount', { amount: CurrencyUtils.formatAmount(selectedOrder.totalAmount) })}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('orders.refundReason')}</InputLabel>
                    <Select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      label={t('orders.refundReason')}
                    >
                      {refundReasons.map((reason) => (
                        <MenuItem key={reason.value} value={reason.value}>
                          {t(reason.translationKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setRefundDialog(false)}
            sx={{ mr: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={processRefund}
            disabled={refundLoading || !refundAmount || !refundReason}
            sx={{
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {refundLoading ? t('orders.processing') : t('orders.processRefund')}
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* Success Snackbar - Temporarily Disabled */}
      {/* <Snackbar
        open={refundSuccess}
        autoHideDuration={6000}
        onClose={() => setRefundSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setRefundSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {t('orders.refundSuccessMessage')}
        </Alert>
      </Snackbar> */}

      {/* Start Date Picker Popover */}
      <Popover
        open={Boolean(startDateAnchorEl)}
        anchorEl={startDateAnchorEl}
        onClose={() => setStartDateAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={dateRange.start}
            onChange={(newDate) => {
              if (newDate) {
                setDateRange({ ...dateRange, start: newDate });
                setStartDateAnchorEl(null);
              }
            }}
            slotProps={{
              actionBar: {
                actions: []
              }
            }}
          />
        </LocalizationProvider>
      </Popover>

      {/* End Date Picker Popover */}
      <Popover
        open={Boolean(endDateAnchorEl)}
        anchorEl={endDateAnchorEl}
        onClose={() => setEndDateAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={dateRange.end}
            onChange={(newDate) => {
              if (newDate) {
                setDateRange({ ...dateRange, end: newDate });
                setEndDateAnchorEl(null);
              }
            }}
            slotProps={{
              actionBar: {
                actions: []
              }
            }}
          />
        </LocalizationProvider>
      </Popover>
    </Box>
  );
};

export default OrderHistory;