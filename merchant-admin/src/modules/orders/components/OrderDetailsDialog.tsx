import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Order } from '../OrderManagement';

interface OrderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  open,
  onClose,
  order,
}) => {
  const { t } = useTranslation();

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-CA');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <MoneyIcon />;
      case 'credit_card': return <CreditCardIcon />;
      case 'debit_card': return <PaymentIcon />;
      case 'mobile_pay': return <WalletIcon />;
      default: return <PaymentIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'confirmed': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'refunded': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {t('orders.orderDetails')} - {order.orderNumber}
          </Typography>
          <Box>
            <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* 客户信息 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.customerInfo')}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {order.customerName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {order.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customerPhone}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 订单信息 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.orderInfo')}
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                {t('orders.orderNumber')}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {order.orderNumber}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                {t('orders.createdAt')}
              </Typography>
              <Typography variant="subtitle1">
                {formatDateTime(order.createdAt)}
              </Typography>
            </Box>
            {order.completedAt && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  {t('orders.completedAt')}
                </Typography>
                <Typography variant="subtitle1">
                  {formatDateTime(order.completedAt)}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* 服务员信息 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.staffInfo')}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600}>
              {order.staff}
            </Typography>
            {order.posTerminalId && (
              <Typography variant="body2" color="text.secondary">
                POS 终端: {order.posTerminalId}
              </Typography>
            )}
          </Grid>

          {/* 状态信息 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.status')}
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <Chip
                label={t(`orders.${order.orderStatus}`)}
                color={getStatusColor(order.orderStatus) as any}
                size="medium"
              />
              <Chip
                label={t(`orders.${order.paymentStatus}`)}
                color={getPaymentStatusColor(order.paymentStatus) as any}
                size="medium"
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* 服务项目详情 */}
        <Typography variant="h6" gutterBottom color="primary">
          {t('orders.serviceDetails')}
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('orders.serviceName')}</TableCell>
              <TableCell>{t('orders.category')}</TableCell>
              <TableCell align="center">{t('orders.quantity')}</TableCell>
              <TableCell align="center">{t('orders.duration')}</TableCell>
              <TableCell align="center">{t('orders.staff')}</TableCell>
              <TableCell align="right">{t('orders.price')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.category}</TableCell>
                <TableCell align="center">{service.quantity}</TableCell>
                <TableCell align="center">{service.duration} min</TableCell>
                <TableCell align="center">{service.staff}</TableCell>
                <TableCell align="right">{formatCurrency(service.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider sx={{ my: 3 }} />

        {/* 支付信息 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.paymentInfo')}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {getPaymentMethodIcon(order.paymentMethod)}
              <Typography variant="subtitle1">
                {t(`orders.${order.paymentMethod}`)}
              </Typography>
            </Box>
            
            {order.transactionId && (
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {t('orders.transactionId')}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {order.transactionId}
                </Typography>
              </Box>
            )}
            
            {order.authorizationCode && (
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {t('orders.authorizationCode')}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {order.authorizationCode}
                </Typography>
              </Box>
            )}
            
            {order.cardLast4 && (
              <Box mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {t('orders.cardNumber')}
                </Typography>
                <Typography variant="body2">
                  **** **** **** {order.cardLast4}
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.amountBreakdown')}
            </Typography>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  {t('orders.subtotal')}:
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(order.subtotal)}
                </Typography>
              </Box>
            </Box>
            
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">
                  {t('orders.tax')} ({(order.taxRate * 100).toFixed(1)}%):
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(order.taxAmount)}
                </Typography>
              </Box>
            </Box>
            
            {order.tipAmount > 0 && (
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    {t('orders.tip')} ({order.tipPercentage}%):
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(order.tipAmount)}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">
                {t('orders.totalAmount')}:
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(order.totalAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 备注 */}
        {order.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom color="primary">
              {t('orders.notes')}
            </Typography>
            <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {order.notes}
            </Typography>
          </>
        )}

        {/* 退款信息 */}
        {order.refundAmount && order.refundAmount > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom color="warning.main">
              {t('orders.refundInfo')}
            </Typography>
            <Box mb={1}>
              <Typography variant="body2" color="text.secondary">
                {t('orders.refundAmount')}
              </Typography>
              <Typography variant="h6" color="warning.main">
                {formatCurrency(order.refundAmount)}
              </Typography>
            </Box>
            {order.refundReason && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('orders.refundReason')}
                </Typography>
                <Typography variant="body2">
                  {order.refundReason}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('orders.close')}
        </Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />}>
          {t('orders.printReceipt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsDialog; 