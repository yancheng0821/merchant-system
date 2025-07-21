import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Divider,
} from '@mui/material';
import {
  MoneyOff as RefundIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Order } from '../OrderManagement';

interface RefundDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onRefundComplete: (updatedOrder: Order) => void;
}

const RefundDialog: React.FC<RefundDialogProps> = ({
  open,
  onClose,
  order,
  onRefundComplete,
}) => {
  const { t } = useTranslation();
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const maxRefundAmount = order ? order.totalAmount - (order.refundAmount || 0) : 0;

  React.useEffect(() => {
    if (open && order) {
      setRefundAmount(maxRefundAmount);
      setRefundType('full');
      setRefundReason('');
      setError('');
    }
  }, [open, order, maxRefundAmount]);

  if (!order || order.paymentStatus !== 'paid') return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const simulateRefundProcessing = async (): Promise<{ success: boolean; refundId?: string }> => {
    // 模拟退款处理延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟退款结果（95% 成功率）
    const success = Math.random() > 0.05;
    
    if (success) {
      const refundId = `REF-${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')}`;
      return { success: true, refundId };
    } else {
      return { success: false };
    }
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setError(t('orders.refundReasonRequired'));
      return;
    }

    if (refundAmount <= 0 || refundAmount > maxRefundAmount) {
      setError(t('orders.invalidRefundAmount'));
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await simulateRefundProcessing();
      
      if (result.success) {
        const totalRefunded = (order.refundAmount || 0) + refundAmount;
        const updatedOrder: Order = {
          ...order,
          paymentStatus: totalRefunded >= order.totalAmount ? 'refunded' : 'paid',
          refundAmount: totalRefunded,
          refundReason: order.refundReason 
            ? `${order.refundReason}; ${refundReason}` 
            : refundReason,
        };

        onRefundComplete(updatedOrder);
        onClose();
      } else {
        setError(t('orders.refundFailed'));
      }
    } catch (err) {
      setError(t('orders.refundError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const type = event.target.value as 'full' | 'partial';
    setRefundType(type);
    if (type === 'full') {
      setRefundAmount(maxRefundAmount);
    } else {
      setRefundAmount(0);
    }
  };

  const handleRefundAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(event.target.value) || 0;
    setRefundAmount(Math.min(amount, maxRefundAmount));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <RefundIcon color="warning" />
          <Typography variant="h6">
            {t('orders.processRefund')}
          </Typography>
        </Box>
        <Typography variant="subtitle2" color="text.secondary">
          {t('orders.orderNumber')}: {order.orderNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Order Payment Summary */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="primary">
            {t('orders.paymentSummary')}
          </Typography>
          <Box p={2} bgcolor="grey.50" borderRadius={1}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">{t('orders.originalAmount')}:</Typography>
              <Typography variant="body2">{formatCurrency(order.totalAmount)}</Typography>
            </Box>
            {order.refundAmount && order.refundAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="warning.main">
                  {t('orders.previousRefunds')}:
                </Typography>
                <Typography variant="body2" color="warning.main">
                  -{formatCurrency(order.refundAmount)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">{t('orders.availableToRefund')}:</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(maxRefundAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Refund Type Selection */}
        <Typography variant="h6" gutterBottom color="primary">
          {t('orders.refundType')}
        </Typography>
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <RadioGroup
            value={refundType}
            onChange={handleRefundTypeChange}
          >
            <FormControlLabel 
              value="full" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    {t('orders.fullRefund')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('orders.refundFullAmount', { amount: formatCurrency(maxRefundAmount) })}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="partial" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    {t('orders.partialRefund')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('orders.refundCustomAmount')}
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>

        {/* Refund Amount Input */}
        {refundType === 'partial' && (
          <Box mb={3}>
            <TextField
              fullWidth
              label={t('orders.refundAmount')}
              type="number"
              value={refundAmount || ''}
              onChange={handleRefundAmountChange}
              inputProps={{
                min: 0.01,
                max: maxRefundAmount,
                step: 0.01
              }}
              InputProps={{
                startAdornment: '$'
              }}
              helperText={t('orders.maxRefundAmount', { amount: formatCurrency(maxRefundAmount) })}
            />
          </Box>
        )}

        {/* Refund Reason */}
        <Typography variant="h6" gutterBottom color="primary">
          {t('orders.refundReason')}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={t('orders.refundReasonPlaceholder')}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('orders.processingRefund')}
          </Alert>
        )}

        {/* Refund Summary */}
        <Box p={2} bgcolor="warning.50" borderRadius={1} border={1} borderColor="warning.200">
          <Typography variant="h6" gutterBottom color="warning.main">
            {t('orders.refundSummary')}
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">{t('orders.refundAmount')}:</Typography>
            <Typography variant="body2" fontWeight={600} color="warning.main">
              -{formatCurrency(refundAmount)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">{t('orders.remainingBalance')}:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(maxRefundAmount - refundAmount)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          {t('orders.cancel')}
        </Button>
        <Button
          onClick={handleRefund}
          variant="contained"
          color="warning"
          disabled={isProcessing || refundAmount <= 0 || !refundReason.trim()}
          startIcon={<RefundIcon />}
        >
          {isProcessing
            ? t('orders.processing')
            : `${t('orders.processRefund')} ${formatCurrency(refundAmount)}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundDialog; 