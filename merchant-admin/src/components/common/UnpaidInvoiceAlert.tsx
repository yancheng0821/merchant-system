import React, { useState, useEffect } from 'react';
import { Box, IconButton, Fade } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { themeMode } = useTheme();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const isColorful = themeMode === 'colorful';
  const accentColor = isColorful ? '#F59E0B' : '#18181B';

  const sessionKey = `unpaid-invoice-alert-closed-${user?.id}`;

  useEffect(() => {
    if (user?.tenantId) {
      fetchUnpaidInvoices();
    }
  }, [user?.tenantId]);

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

        if (pending.length > 0) {
          const isClosed = sessionStorage.getItem(sessionKey);
          if (!isClosed) {
            setVisible(true);
          }
        } else {
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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
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
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 1300,
          width: 220,
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
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
            width: 20,
            height: 20,
            color: '#D4D4D8',
            '&:hover': { color: '#A1A1AA', bgcolor: 'transparent' },
          }}
        >
          <CloseIcon sx={{ fontSize: 12 }} />
        </IconButton>

        <Box sx={{ p: 2.5 }}>
          {/* 标题 */}
          <Box
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#A1A1AA',
              mb: 1.5,
              letterSpacing: '0.02em',
            }}
          >
            {t('billing.unpaidInvoiceAlert')}
          </Box>

          {/* 金额 */}
          <Box
            sx={{
              fontSize: '2rem',
              fontWeight: 600,
              color: '#18181B',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              mb: 0.5,
              fontFeatureSettings: '"tnum"',
            }}
          >
            ${totalAmount.toFixed(2)}
          </Box>

          {/* 账单数量 */}
          <Box
            sx={{
              fontSize: '0.8125rem',
              color: '#71717A',
              mb: 2,
            }}
          >
            {unpaidInvoices.length} {t('billing.invoices')}
          </Box>

          {/* 提示信息 */}
          <Box
            sx={{
              fontSize: '0.75rem',
              color: '#A1A1AA',
              lineHeight: 1.6,
              mb: 2,
            }}
          >
            {t('billing.paymentWarning')}
          </Box>

          {/* 按钮 */}
          <Box
            onClick={handleViewInvoices}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: accentColor,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.7 },
            }}
          >
            {t('billing.viewAndPay')}
            <span style={{ fontSize: '1rem', marginLeft: 2 }}>→</span>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default UnpaidInvoiceAlert;
