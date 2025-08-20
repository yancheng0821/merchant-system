import React, { useState, useEffect } from 'react';
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
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  MoneyOff as RefundIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Order } from '../OrderManagement';
import { CurrencyUtils } from '../../../config/constants';
import { api } from '../../../services/api';

interface RefundReason {
  value: string;
  translationKey: string;
  stripe_value: string;
}

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
  const { t, i18n } = useTranslation();
  
  // 确保每次组件创建时状态都是全新的
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundReasons, setRefundReasons] = useState<RefundReason[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 组件挂载时立即清空错误
  React.useEffect(() => {
    console.log('🔵 RefundDialog MOUNTED, clearing error');
    setError('');
    return () => {
      console.log('🔴 RefundDialog UNMOUNTING, clearing error');
      setError('');
    };
  }, []); // 空依赖，只在挂载和卸载时执行
  
  // 监控 error 状态的所有变化
  React.useEffect(() => {
    console.log('⚠️ Error state changed to:', error);
    if (error) {
      console.trace('Error was set from:');
    }
  }, [error]);

  const maxRefundAmount = order ? order.totalAmount - (order.refundAmount || 0) : 0;

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

  // 统一的重置函数
  const resetForm = React.useCallback(() => {
    setError('');
    setIsProcessing(false);
    setRefundType('full');
    setRefundReason('');
    setRefundAmount(0);
  }, []);

  // handleClose 函数必须在使用之前定义
  const handleClose = React.useCallback(() => {
    console.log('🚪 handleClose called, current error:', error);
    // 使用统一的重置函数
    resetForm();
    // 调用父组件的关闭回调
    onClose();
    console.log('🚪 handleClose completed');
  }, [resetForm, onClose]);

  // 监听对话框打开/关闭，重置状态
  React.useEffect(() => {
    console.log('📝 Dialog open state changed:', open, 'Order:', order?.id);
    
    if (open) {
      console.log('✅ Dialog OPENING - clearing all states');
      console.log('   Current error before clear:', error);
      
      // 每次打开时立即清空错误（最重要！）
      setError('');
      setIsProcessing(false);
      setRefundType('full');
      setRefundReason('');
      
      // 设置初始金额
      if (order) {
        console.log('   Setting refund amount to:', maxRefundAmount);
        setRefundAmount(maxRefundAmount);
      } else {
        console.log('   No order, setting refund amount to 0');
        setRefundAmount(0);
      }
    } else {
      console.log('❌ Dialog CLOSING - clearing error and processing state');
      console.log('   Current error before clear:', error);
      // 关闭时也清空错误
      setError('');
      setIsProcessing(false);
    }
  }, [open]); // 只依赖 open，不依赖其他值

  // 如果没有订单或订单状态不对，渲染一个空的但正常关闭的对话框
  if (!order || order.paymentStatus !== 'paid') {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Typography>{t('orders.invalidOrderForRefund')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('orders.close')}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const formatCurrency = (amount: number) => {
    return CurrencyUtils.formatAmount(amount);
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
      // 获取选中的退款原因对象
      const selectedReason = refundReasons.find(r => r.value === refundReason);
      const stripeReason = selectedReason?.stripe_value || 'requested_by_customer';
      const displayReason = selectedReason ? t(selectedReason.translationKey) : refundReason;
      
      // 调用真实的退款API
      const response = await api.processRefund({
        orderId: parseInt(order.id, 10),
        amount: refundAmount,
        reason: `${stripeReason}|${displayReason}` // 传递Stripe值和显示文本
      });
      
      if (response.success) {
        const totalRefunded = (order.refundAmount || 0) + refundAmount;
        const updatedOrder: Order = {
          ...order,
          paymentStatus: totalRefunded >= order.totalAmount ? 'refunded' : 'paid',
          refundAmount: totalRefunded,
          refundReason: order.refundReason 
            ? `${order.refundReason}; ${displayReason}` 
            : displayReason,
        };

        // 先调用回调通知父组件
        onRefundComplete(updatedOrder);
        
        // 确保对话框真的关闭
        handleClose();
      } else {
        const errorMsg = response.message || t('orders.refundFailed');
        console.log('💥 Refund failed, setting error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      // 显示具体的错误信息
      const errorMessage = err?.response?.data?.message || err?.message || t('orders.refundError');
      console.log('💥 Refund exception, setting error:', errorMessage);
      setError(errorMessage);
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
    // 当用户修改退款类型时，清除之前的错误信息
    if (error) {
      setError('');
    }
  };

  const handleRefundAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(event.target.value) || 0;
    setRefundAmount(Math.min(amount, maxRefundAmount));
    // 当用户修改退款金额时，清除之前的错误信息
    if (error) {
      setError('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disablePortal  // 不使用 Portal
      transitionDuration={0}  // 禁用动画
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
                startAdornment: CurrencyUtils.getSymbol()
              }}
              helperText={t('orders.maxRefundAmount', { amount: formatCurrency(maxRefundAmount) })}
            />
          </Box>
        )}

        {/* Refund Reason */}
        <Typography variant="h6" gutterBottom color="primary">
          {t('orders.refundReason')}
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('orders.selectRefundReason')}</InputLabel>
          <Select
            value={refundReason}
            onChange={(e) => {
              setRefundReason(e.target.value);
              // 当用户修改退款原因时，清除之前的错误信息
              if (error) {
                setError('');
              }
            }}
            label={t('orders.selectRefundReason')}
          >
            {refundReasons.map((reason) => (
              <MenuItem key={reason.value} value={reason.value}>
                {t(reason.translationKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Error Alert - 只有在对话框打开时才显示 */}
        {open && error && (
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
        <Button onClick={handleClose} disabled={isProcessing}>
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