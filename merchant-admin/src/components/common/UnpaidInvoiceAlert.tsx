import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Button,
  Fade,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceApi } from '../../services/api';

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  currency: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
}

const UnpaidInvoiceAlert: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // 生成固定的 session key（不包含时间戳）
  const sessionKey = `unpaid-invoice-alert-closed-${user?.id}`;

  useEffect(() => {
    if (user?.tenantId) {
      fetchUnpaidInvoices();
    }
  }, [user?.tenantId]);

  // 监听支付成功事件
  useEffect(() => {
    const handleInvoicePaid = () => {
      if (user?.tenantId) {
        fetchUnpaidInvoices();
      }
    };

    window.addEventListener('invoice-paid', handleInvoicePaid);
    return () => {
      window.removeEventListener('invoice-paid', handleInvoicePaid);
    };
  }, [user?.tenantId]);

  const fetchUnpaidInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getInvoicesByTenantId(user!.tenantId);
      if (response.success && response.data) {
        const pending = response.data.filter((inv: Invoice) => inv.status === 'PENDING');
        setUnpaidInvoices(pending);

        // 如果有未支付账单，且用户本次会话没有关闭过提醒，则显示
        if (pending.length > 0) {
          const isClosed = sessionStorage.getItem(sessionKey);
          if (!isClosed) {
            setVisible(true);
          }
        } else {
          // 如果没有未支付账单，隐藏提醒并清除sessionStorage标记
          setVisible(false);
          sessionStorage.removeItem(sessionKey);
        }
      }
    } catch (error) {
      console.error('获取未支付账单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    // 在当前会话中记住用户已关闭（使用 sessionStorage，浏览器关闭后会清除）
    sessionStorage.setItem(sessionKey, 'true');
  };

  const handleViewInvoices = () => {
    setVisible(false);
    navigate('/settings?tab=billing');
  };

  if (loading || unpaidInvoices.length === 0 || !visible) {
    return null;
  }

  const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <Fade in={visible}>
      <Card
        sx={{
          position: 'fixed',
          top: 72,
          right: 24,
          width: 300,
          maxWidth: 'calc(100vw - 48px)',
          zIndex: 1300,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
          border: '1px solid #D1D5DB',
          background: '#FFFFFF',
          borderRadius: 3,
          animation: 'slideIn 0.3s ease-out',
          '@keyframes slideIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(-10px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {/* 关闭按钮 */}
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#9CA3AF',
            width: 28,
            height: 28,
            '&:hover': {
              backgroundColor: '#F3F4F6',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Box sx={{ p: 2.5, pr: 5 }}>
          {/* 标题 */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#111827',
              fontSize: '0.875rem',
              mb: 1.25,
            }}
          >
            {t('billing.unpaidInvoiceAlert')}
          </Typography>

          {/* 账单信息 */}
          <Box sx={{ mb: 2, '& > *:not(:last-child)': { mb: 0.75 } }}>
            <Typography
              variant="caption"
              sx={{
                color: '#DC2626',
                fontSize: '0.75rem',
                display: 'block',
                lineHeight: 1.5,
              }}
            >
              {t('billing.paymentWarning')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  fontSize: '0.75rem',
                }}
              >
                {t('billing.unpaidInvoiceCount')}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#111827',
                  fontWeight: 600,
                  fontSize: '0.813rem',
                }}
              >
                {unpaidInvoices.length} {t('billing.invoices')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#6B7280',
                  fontSize: '0.75rem',
                }}
              >
                {t('billing.totalAmount')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#F59E0B',
                  fontWeight: 700,
                  fontSize: '0.938rem',
                }}
              >
                ${totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* 操作按钮 */}
          <Button
            variant="text"
            onClick={handleViewInvoices}
            endIcon={<span style={{ fontSize: '1.1em' }}>→</span>}
            sx={{
              width: '100%',
              color: '#10B981',
              fontSize: '0.813rem',
              fontWeight: 600,
              textTransform: 'none',
              py: 0.75,
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: alpha('#10B981', 0.06),
              },
            }}
          >
            {t('billing.viewAndPay')}
          </Button>
        </Box>
      </Card>
    </Fade>
  );
};

export default UnpaidInvoiceAlert;
