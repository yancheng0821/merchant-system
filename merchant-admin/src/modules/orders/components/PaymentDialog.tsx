import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Order } from '../OrderManagement';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentComplete: (updatedOrder: Order) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  order,
  onPaymentComplete,
}) => {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const simulatePaymentProcessing = async (): Promise<{ success: boolean; transactionId?: string; authCode?: string; cardLast4?: string }> => {
    // 模拟支付处理延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟支付结果（90% 成功率）
    const success = Math.random() > 0.1;
    
    if (success) {
      const transactionId = `TXN-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
      const authCode = `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const cardLast4 = paymentMethod.includes('card') ? Math.floor(1000 + Math.random() * 9000).toString() : undefined;
      
      return { success: true, transactionId, authCode, cardLast4 };
    } else {
      return { success: false };
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const result = await simulatePaymentProcessing();
      
      if (result.success) {
        const updatedOrder: Order = {
          ...order,
          paymentMethod: paymentMethod as any,
          paymentStatus: 'paid',
          orderStatus: order.orderStatus === 'draft' ? 'confirmed' : order.orderStatus,
          transactionId: result.transactionId,
          authorizationCode: result.authCode,
          cardLast4: result.cardLast4,
          posTerminalId: `POS-${Math.floor(Math.random() * 999 + 1).toString().padStart(3, '0')}`,
          completedAt: new Date().toISOString(),
        };

        setSuccess(t('orders.paymentSuccessful'));
        setTimeout(() => {
          onPaymentComplete(updatedOrder);
          onClose();
        }, 1500);
      } else {
        setError(t('orders.paymentFailed'));
      }
    } catch (err) {
      setError(t('orders.paymentError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: t('orders.cash'), icon: <MoneyIcon /> },
    { value: 'credit_card', label: t('orders.credit_card'), icon: <CreditCardIcon /> },
    { value: 'debit_card', label: t('orders.debit_card'), icon: <PaymentIcon /> },
    { value: 'mobile_pay', label: t('orders.mobile_pay'), icon: <WalletIcon /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">
          {t('orders.processPayment')}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {t('orders.orderNumber')}: {order.orderNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Order Summary */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            {t('orders.paymentSummary')}
          </Typography>
          <Box p={2} bgcolor="grey.50" borderRadius={1}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">{t('orders.subtotal')}:</Typography>
              <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">
                {t('orders.tax')} ({(order.taxRate * 100).toFixed(1)}%):
              </Typography>
              <Typography variant="body2">{formatCurrency(order.taxAmount)}</Typography>
            </Box>
            {order.tipAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="success.main">
                  {t('orders.tip')} ({order.tipPercentage}%):
                </Typography>
                <Typography variant="body2" color="success.main">
                  {formatCurrency(order.tipAmount)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">{t('orders.totalAmount')}:</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(order.totalAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Payment Method Selection */}
        <Typography variant="h6" gutterBottom color="primary">
          {t('orders.selectPaymentMethod')}
        </Typography>
        
        <Grid container spacing={2} mb={3}>
          {paymentMethods.map((method) => (
            <Grid item xs={6} key={method.value}>
              <Button
                fullWidth
                variant={paymentMethod === method.value ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod(method.value)}
                startIcon={method.icon}
                sx={{ py: 2, flexDirection: 'column', gap: 1 }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  {method.icon}
                  <Typography variant="body2">
                    {method.label}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Payment Method Specific Information */}
        {paymentMethod === 'cash' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('orders.cashPaymentInfo')}
          </Alert>
        )}

        {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('orders.cardPaymentInfo')}
          </Alert>
        )}

        {paymentMethod === 'mobile_pay' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('orders.mobilePaymentInfo')}
          </Alert>
        )}

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Box textAlign="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              {paymentMethod === 'cash' 
                ? t('orders.processingCashPayment')
                : t('orders.processingCardPayment')
              }
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          {t('orders.cancel')}
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={isProcessing}
        >
          {isProcessing
            ? t('orders.processing')
            : `${t('orders.processPayment')} ${formatCurrency(order.totalAmount)}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog; 