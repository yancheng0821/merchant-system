import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  alpha,
  Divider,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceApi, subscriptionApi, TenantSubscription } from '../../services/api';
import StripePaymentDialog from '../../components/payment/StripePaymentDialog';

interface Invoice {
  id: number;
  invoiceNumber: string;
  tenantId: number;
  tenantName: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  amount: number;
  currency: string;
  taxRegion?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  paymentDate?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const BillingTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changingBillingCycle, setChangingBillingCycle] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user?.tenantId) {
      fetchInvoices();
      fetchSubscription();
    }
  }, [user?.tenantId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceApi.getInvoicesByTenantId(user!.tenantId);
      if (response.success) {
        setInvoices(response.data || []);
      } else {
        setError(response.message || '获取账单列表失败');
      }
    } catch (err: any) {
      console.error('获取账单列表失败:', err);
      setError(err.message || '获取账单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionApi.getActiveSubscription(user!.tenantId);
      if (response.success && response.data) {
        setSubscription(response.data);
      }
    } catch (err: any) {
      console.error('获取订阅信息失败:', err);
    }
  };

  const handleChangeBillingCycle = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmChangeBillingCycle = async () => {
    if (!subscription) return;

    const newCycle = subscription.billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY';

    try {
      setChangingBillingCycle(true);
      setConfirmDialogOpen(false);
      const response = await subscriptionApi.changeBillingCycle(subscription.id, newCycle);

      if (response.success) {
        // 刷新订阅信息和账单列表
        await fetchSubscription();
        await fetchInvoices();
      } else {
        setError(response.message || '修改计费周期失败');
      }
    } catch (err: any) {
      console.error('修改计费周期失败:', err);
      setError(err.message || '修改计费周期失败');
    } finally {
      setChangingBillingCycle(false);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'default';
      case 'REFUNDED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return t('billing.status.paid');
      case 'PENDING':
        return t('billing.status.pending');
      case 'CANCELLED':
        return t('billing.status.cancelled');
      case 'REFUNDED':
        return t('billing.status.refunded');
      default:
        return status;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return { bgcolor: '#3B82F6', color: '#FFFFFF', border: '1px solid #2563EB' };
      case 'ACTIVE':
        return { bgcolor: '#10B981', color: '#FFFFFF', border: '1px solid #059669' };
      case 'PAST_DUE':
        return { bgcolor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'CANCELLED':
      case 'EXPIRED':
        return { bgcolor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
      default:
        return { bgcolor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
    }
  };

  const getSubscriptionStatusText = (status: string) => {
    return t(`subscription.status.${status.toLowerCase()}`);
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    // 延迟清空selectedInvoice，避免关闭动画时显示空内容
    setTimeout(() => {
      setSelectedInvoice(null);
    }, 200);
  };

  const handlePay = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentDialogOpen(false);
    const paidInvoiceId = payingInvoice?.id;
    setPayingInvoice(null);

    // 显示成功消息
    enqueueSnackbar(t('payment.paymentSuccessful'), {
      variant: 'success',
      autoHideDuration: 4000,
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      content: (key, message) => (
        <Alert
          severity="success"
          onClose={() => closeSnackbar(key)}
          sx={{
            width: '100%',
            minWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {message}
        </Alert>
      ),
    });

    // 等待2秒让webhook处理完成，然后只刷新支付的账单
    setTimeout(async () => {
      if (paidInvoiceId) {
        try {
          // 只获取更新后的账单数据
          const response = await invoiceApi.getInvoiceById(paidInvoiceId);
          if (response.success && response.data) {
            // 更新 invoices 列表中的这条账单
            setInvoices(prevInvoices =>
              prevInvoices.map(inv =>
                inv.id === paidInvoiceId ? response.data : inv
              )
            );
          }

          // 刷新订阅状态（如果订阅从 PAST_DUE 恢复为 ACTIVE）
          await fetchSubscription();

          // 触发未支付订单浮框刷新
          window.dispatchEvent(new CustomEvent('invoice-paid'));
        } catch (err) {
          console.error('刷新账单数据失败:', err);
        }
      }
    }, 2000);
  };

  const handlePaymentClose = () => {
    setPaymentDialogOpen(false);
    // 延迟清空支付账单，避免关闭动画时显示空内容
    setTimeout(() => {
      setPayingInvoice(null);
    }, 200);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {/* 订阅计划信息卡片 */}
      {subscription && subscription.plan && (
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* 单行展示所有信息 */}
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                {/* 左侧：计划名称和日期 */}
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                    {i18n.language === 'zh-CN' ? subscription.plan.planNameZh : subscription.plan.planNameEn}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {subscription.status === 'TRIAL' && subscription.trialEndDate
                      ? `${t('billing.trialPeriod')} · ${t('billing.endsOn')} ${subscription.trialEndDate}`
                      : `${subscription.currentPeriodStart} ~ ${subscription.currentPeriodEnd}`}
                  </Typography>
                </Box>

                {/* 中间：配额信息 */}
                <Box display="flex" gap={3} alignItems="center">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {t('billing.maxUsers')}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                      {subscription.plan.maxUsers === -1 ? t('billing.unlimited') : subscription.plan.maxUsers}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {t('billing.maxStaff')}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                      {subscription.plan.maxStaff === -1 ? t('billing.unlimited') : subscription.plan.maxStaff}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {t('billing.maxAppointments')}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                      {subscription.plan.maxAppointmentsPerMonth === -1
                        ? t('billing.unlimited')
                        : `${subscription.plan.maxAppointmentsPerMonth}/${t('billing.month')}`}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                      {t('billing.billingCycle')}:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>
                      {subscription.billingCycle === 'MONTHLY' ? t('billing.monthly') : t('billing.yearly')}
                    </Typography>
                    {subscription.status === 'ACTIVE' && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleChangeBillingCycle}
                        disabled={changingBillingCycle}
                        sx={{
                          textTransform: 'none',
                          fontSize: '0.7rem',
                          py: 0.25,
                          px: 1,
                          ml: 1,
                          minWidth: 'auto',
                          height: '22px',
                          borderColor: '#D1D5DB',
                          color: '#6B7280',
                          '&:hover': {
                            borderColor: '#9CA3AF',
                            bgcolor: '#F9FAFB',
                          }
                        }}
                      >
                        {changingBillingCycle
                          ? t('common.loading')
                          : t('billing.switchTo') + ' ' + (subscription.billingCycle === 'MONTHLY' ? t('billing.yearly') : t('billing.monthly'))}
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* 分隔线 */}
                <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#E5E7EB' }} />

                {/* 右侧：状态 */}
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Chip
                    label={getSubscriptionStatusText(subscription.status)}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      height: 20,
                      fontSize: '0.7rem',
                      ...getSubscriptionStatusColor(subscription.status)
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha('#10B981', 0.1),
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  mr: 2,
                }}
              >
                <ReceiptIcon sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('billing.title')}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('billing.invoiceNumber')}</TableCell>
                  <TableCell>{t('billing.billingPeriod')}</TableCell>
                  <TableCell align="right">{t('billing.amount')}</TableCell>
                  <TableCell>{t('billing.statusLabel')}</TableCell>
                  <TableCell>{t('billing.paymentDate')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        {t('billing.noInvoices')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.billingPeriodStart} ~ {invoice.billingPeriodEnd}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          ${invoice.amount.toFixed(2)} {invoice.currency}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(invoice.status)}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.paymentDate || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            {t('common.viewDetails')}
                          </Button>
                          {invoice.status === 'PENDING' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<PaymentIcon />}
                              onClick={() => handlePay(invoice)}
                            >
                              {t('billing.pay')}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* 账单详情弹窗 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('billing.invoiceDetails')}
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.invoiceNumber')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedInvoice.invoiceNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.statusLabel')}
                </Typography>
                <Chip
                  label={getStatusText(selectedInvoice.status)}
                  color={getStatusColor(selectedInvoice.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.billingPeriod')}
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.billingPeriodStart} ~ {selectedInvoice.billingPeriodEnd}
                </Typography>
              </Grid>
              <Grid item xs={selectedInvoice.taxAmount !== undefined ? 6 : 12}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.subtotal')}
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  ${(selectedInvoice.subtotal || selectedInvoice.amount).toFixed(2)} {selectedInvoice.currency}
                </Typography>
              </Grid>
              {selectedInvoice.taxAmount !== undefined && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('billing.tax')} {selectedInvoice.taxRegion && `(${selectedInvoice.taxRegion})`}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    ${selectedInvoice.taxAmount.toFixed(2)} {selectedInvoice.currency}
                    {selectedInvoice.taxRate !== undefined && selectedInvoice.taxRate > 0 && ` (${(selectedInvoice.taxRate * 100).toFixed(2)}%)`}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 1.5,
                  mt: 0.5
                }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('billing.totalAmount')}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    ${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.paymentMethod')}
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.paymentMethod || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t('billing.paymentDate')}
                </Typography>
                <Typography variant="body1">
                  {selectedInvoice.paymentDate || '-'}
                </Typography>
              </Grid>
              {selectedInvoice.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {t('billing.description')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.close')}
          </Button>
          {selectedInvoice?.status === 'PENDING' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={() => {
                handleCloseDialog();
                handlePay(selectedInvoice);
              }}
            >
              {t('billing.pay')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 确认切换计费周期对话框 */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t('billing.confirmChangeCycle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {subscription?.billingCycle === 'MONTHLY'
              ? t('billing.confirmChangeToYearly')
              : t('billing.confirmChangeToMonthly')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmChangeBillingCycle}
            disabled={changingBillingCycle}
          >
            {changingBillingCycle ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stripe支付对话框 */}
      <StripePaymentDialog
        open={paymentDialogOpen}
        invoice={payingInvoice}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
      />
    </Grid>
  );
};

export default BillingTab;
