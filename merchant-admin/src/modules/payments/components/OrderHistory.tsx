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
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
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
  // const { t } = useTranslation();
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
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
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
      pending: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: 'Pending' },
      paid: { color: '#10B981', bg: alpha('#10B981', 0.1), label: 'Paid' },
      refunded: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'Refunded' },
      failed: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'Failed' },
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
      draft: { color: '#6B7280', bg: alpha('#6B7280', 0.1), label: 'Draft' },
      confirmed: { color: '#3B82F6', bg: alpha('#3B82F6', 0.1), label: 'Confirmed' },
      in_progress: { color: '#F59E0B', bg: alpha('#F59E0B', 0.1), label: 'In Progress' },
      completed: { color: '#10B981', bg: alpha('#10B981', 0.1), label: 'Completed' },
      cancelled: { color: '#EF4444', bg: alpha('#EF4444', 0.1), label: 'Cancelled' },
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

  const handleExportReceipt = () => {
    // In real implementation, this would generate a PDF receipt
    console.log('Exporting receipt for order:', selectedOrder?.orderNumber);
    setMenuAnchorEl(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
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
                placeholder="Search by order number or customer name..."
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
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Order Status</InputLabel>
                <Select
                  value={orderStatusFilter}
                  label="Order Status"
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
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
                label="End Date"
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
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>Order Number</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Services</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
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
                        {order.services?.length || 0} items
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
          View Details
        </MenuItem>
        <MenuItem onClick={handleExportReceipt}>
          <ReceiptIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
          Export Receipt
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
            Order Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">Order Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981' }}>
                  {selectedOrder.orderNumber}
                </Typography>
              </Box>

              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                  <Typography variant="body2">{selectedOrder.customerName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedOrder.customerPhone}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography variant="body2">
                    {formatDateTime(selectedOrder.createdAt).date}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(selectedOrder.createdAt).time}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Services</Typography>
              <List dense>
                {selectedOrder.services && selectedOrder.services.map((service, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={service.serviceName}
                      secondary={`${service.quantity} x ¥${service.price}`}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ¥{(service.quantity * service.price).toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">¥{selectedOrder.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tax</Typography>
                  <Typography variant="body2">¥{selectedOrder.taxAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tip</Typography>
                  <Typography variant="body2">¥{selectedOrder.tipAmount.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    ¥{selectedOrder.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                {getStatusChip(selectedOrder.paymentStatus)}
              </Box>

              {selectedOrder.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportReceipt}
            sx={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
              },
            }}
          >
            Export Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderHistory;