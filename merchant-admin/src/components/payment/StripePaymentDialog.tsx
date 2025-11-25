import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { paymentApi } from '../../services/api';

// Stripe Promise将在组件外部初始化
let stripePromise: ReturnType<typeof loadStripe> | null = null;

const initializeStripe = async () => {
  if (!stripePromise) {
    try {
      const response = await paymentApi.getPaymentConfig();
      if (response.success && response.data) {
        stripePromise = loadStripe(response.data.publishableKey);
      }
    } catch (error) {
      console.error('Failed to load Stripe:', error);
    }
  }
  return stripePromise;
};

interface Invoice {
  id: number;
  invoiceNumber: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  amount: number;
  currency: string;
  taxRegion?: string;
  description?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

interface StripePaymentDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

// 支付表单组件
const CheckoutForm: React.FC<{
  invoice: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ invoice, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?tab=billing&payment=success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || t('payment.paymentFailed'));
        setProcessing(false);
      } else {
        // 支付成功
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || t('payment.paymentFailed'));
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={processing}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {t('payment.processing')}
            </>
          ) : (
            t('payment.payNow', { amount: `$${invoice.amount.toFixed(2)}` })
          )}
        </Button>
      </Box>
    </form>
  );
};

// 主支付对话框组件
const StripePaymentDialog: React.FC<StripePaymentDialogProps> = ({
  open,
  invoice,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);

  useEffect(() => {
    if (open && invoice) {
      initStripe();
      createPaymentIntent();
    }
  }, [open, invoice]);

  const initStripe = async () => {
    const stripeInstance = await initializeStripe();
    setStripe(stripeInstance);
  };

  const createPaymentIntent = async () => {
    if (!invoice) return;

    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.createPaymentIntent(invoice.id);
      if (response.success && response.data) {
        setClientSecret(response.data.clientSecret);
      } else {
        setError(response.message || t('payment.createPaymentFailed'));
      }
    } catch (err: any) {
      console.error('Create payment intent failed:', err);
      setError(err.message || t('payment.createPaymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // 对话框完全关闭后清理状态
  const handleExited = () => {
    setClientSecret(null);
    setError(null);
    setLoading(false);
  };

  if (!invoice) return null;

  const options: StripeElementsOptions = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#10B981',
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
      TransitionProps={{
        onExited: handleExited,
      }}
    >
      <DialogTitle>
        {t('payment.paymentTitle')}
      </DialogTitle>

      <DialogContent dividers>
        {/* 账单信息 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('payment.invoiceDetails')}
          </Typography>
          <Box sx={{ bgcolor: '#F9FAFB', p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('billing.invoiceNumber')}:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {invoice.invoiceNumber}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('billing.billingPeriod')}:
              </Typography>
              <Typography variant="body2">
                {invoice.billingPeriodStart} ~ {invoice.billingPeriodEnd}
              </Typography>
            </Box>
            {invoice.description && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.description')}:
                </Typography>
                <Typography variant="body2">
                  {invoice.description}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            {/* Subtotal */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t('billing.subtotal')}:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                ${(invoice.subtotal || invoice.amount).toFixed(2)} {invoice.currency}
              </Typography>
            </Box>
            {/* Tax (if applicable) */}
            {invoice.taxAmount !== undefined && invoice.taxAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.tax')} {invoice.taxRegion && `(${invoice.taxRegion})`}:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  ${invoice.taxAmount.toFixed(2)} {invoice.currency}
                  {invoice.taxRate !== undefined && invoice.taxRate > 0 && ` (${(invoice.taxRate * 100).toFixed(2)}%)`}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            {/* Total */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" fontWeight={600}>
                {t('billing.totalAmount')}:
              </Typography>
              <Typography variant="h6" fontWeight={600} color="primary">
                ${invoice.amount.toFixed(2)} {invoice.currency}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 加载状态 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 错误信息 */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stripe支付表单 */}
        {!loading && !error && clientSecret && stripe && (
          <Elements stripe={stripe} options={options}>
            <CheckoutForm
              invoice={invoice}
              onSuccess={handleSuccess}
              onCancel={handleClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentDialog;
