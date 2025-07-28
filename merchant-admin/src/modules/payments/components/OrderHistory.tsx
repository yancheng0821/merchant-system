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
  Menu,
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
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { TimeZoneUtils, CurrencyUtils } from '../../../config/constants';
import { useTranslation } from 'react-i18next';

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
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
}

const OrderHistory: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const today = TimeZoneUtils.getTodayVancouverDateString();
    return {
      start: today,
      end: today,
    };
  });

  const fetchOrders = useCallback(async () => {
    try {
      const params = {
        tenantId: user?.tenantId || 0,
        page: page,
        size: rowsPerPage,
        searchTerm: searchTerm || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        orderStatus: orderStatusFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      };

      const response = await api.getOrders(params);
      setOrders(response?.content || []);
      setTotalElements(response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, dateRange]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchOrders();
    }
  }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, dateRange, fetchOrders]);

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
      default: return <PaymentIcon sx={{ fontSize: 16 }} />;
    }
  };

  const handleViewDetails = () => {
    setDetailsDialog(true);
    setMenuAnchorEl(null);
  };



  const formatDateTime = (dateString: string) => {
    return TimeZoneUtils.formatVancouverDateTime(dateString);
  };

  return (
    <Box>
      {/* Search and Filter Section */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
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
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('orders.paymentStatus')}</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label={t('orders.paymentStatus')}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">{t('orders.allPayments')}</MenuItem>
                  <MenuItem value="pending">{t('orders.pending')}</MenuItem>
                  <MenuItem value="paid">{t('orders.paid')}</MenuItem>
                  <MenuItem value="refunded">{t('orders.refunded')}</MenuItem>
                  <MenuItem value="failed">{t('orders.failed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>{t('orders.orderStatus')}</InputLabel>
                <Select
                  value={orderStatusFilter}
                  label={t('orders.orderStatus')}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">{t('orders.allStatuses')}</MenuItem>
                  <MenuItem value="draft">{t('orders.draft')}</MenuItem>
                  <MenuItem value="confirmed">{t('orders.confirmed')}</MenuItem>
                  <MenuItem value="in_progress">{t('orders.inProgress')}</MenuItem>
                  <MenuItem value="completed">{t('orders.completed')}</MenuItem>
                  <MenuItem value="cancelled">{t('orders.cancelled')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label={t('orders.startDate')}
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label={t('orders.endDate')}
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.amount')}</TableCell>
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                        onClick={(e) => {
                          setMenuAnchorEl(e.currentTarget);
                          setSelectedOrder(order);
                        }}
                      >
                        <MoreVertIcon />
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

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18, color: '#6366F1' }} />
          {t('orders.viewDetails')}
        </MenuItem>

      </Menu>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('orders.orderDetails')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">{t('orders.orderNumber')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981' }}>
                  {selectedOrder.orderNumber}
                </Typography>
              </Box>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('orders.customer')}</Typography>
                  <Typography variant="body2">{selectedOrder.customerName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedOrder.customerPhone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('orders.date')}</Typography>
                  <Typography variant="body2">
                    {formatDateTime(selectedOrder.createdAt).date}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(selectedOrder.createdAt).time}
                  </Typography>
                </Grid>
              </Grid>

              {/* 显示预约和资源信息 */}
              {(selectedOrder.appointmentId || selectedOrder.resourceId) && (
                <>
                  <Grid container spacing={2} mb={2}>
                    {selectedOrder.appointmentId && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">{t('orders.appointmentId')}</Typography>
                        <Typography variant="body2">#{selectedOrder.appointmentId}</Typography>
                      </Grid>
                    )}
                    {selectedOrder.resourceId && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">{t('orders.assignedResource')}</Typography>
                        <Typography variant="body2">{selectedOrder.resourceName || `${selectedOrder.resourceType} #${selectedOrder.resourceId}`}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedOrder.resourceType}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('orders.services')}</Typography>
              <List dense>
                {selectedOrder.services && selectedOrder.services.map((service, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={service.serviceName}
                      secondary={`${service.quantity} x ${CurrencyUtils.formatAmount(service.price)}`}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {CurrencyUtils.formatAmount(service.quantity * service.price)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('orders.subtotal')}</Typography>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(selectedOrder.subtotal)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('orders.tax')}</Typography>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(selectedOrder.taxAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('orders.tip')}</Typography>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(selectedOrder.tipAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{t('orders.total')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {CurrencyUtils.formatAmount(selectedOrder.totalAmount)}
                  </Typography>
                </Box>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">{t('orders.paymentStatus')}</Typography>
                {getStatusChip(selectedOrder.paymentStatus)}
              </Box>

              {selectedOrder.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">{t('orders.notes')}</Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>{t('orders.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderHistory;