import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  Grid,
  CardContent,
  alpha,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  ShoppingCart as OrdersIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { CurrencyUtils } from '../../config/constants';
import PaymentProcess from './components/PaymentProcess';
import OrderHistory from './components/OrderHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface PaymentManagementProps {
  onNavigate?: (item: string) => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingPayments: 0,
    avgOrderValue: 0,
  });

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.tenantId) return;
      
      try {
        // 使用我们的api服务
        const { api } = await import('../../services/api');
        const data = await api.getOrderStats(user.tenantId);
        
        // 计算平均订单金额时，只考虑已支付的订单
        // 如果后端返回了paidRevenue和paidOrders，使用它们；否则使用总数据
        const paidRevenue = data.paidRevenue || data.todayRevenue || 0;
        const paidOrders = data.paidOrders || data.todayOrders || 0;
        
        setStats({
          todayRevenue: data.todayRevenue || 0,
          todayOrders: data.todayOrders || 0,
          pendingPayments: data.pendingOrders || 0,
          avgOrderValue: paidOrders > 0 ? paidRevenue / paidOrders : 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    // 每分钟刷新一次统计数据
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #059669, #10B981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('payments.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('payments.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                  {CurrencyUtils.formatAmountWithCommas(stats.todayRevenue)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('payments.todayRevenue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#6366F1', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <OrdersIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
                  {stats.todayOrders}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('payments.todayOrders')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#F59E0B', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CreditCardIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  {stats.pendingPayments}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('payments.pendingPayments')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.1),
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(236, 72, 153, 0.15)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC4899' }}>
                  {CurrencyUtils.formatAmountWithCommas(Math.round(stats.avgOrderValue))}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('payments.avgOrderValue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 标签页 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minWidth: 180,
                '&.Mui-selected': {
                  color: '#10B981',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#10B981',
                height: 3,
              },
            }}
          >
            <Tab 
              icon={<PaymentIcon sx={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label={t('payments.paymentProcess')} 
            />
            <Tab 
              icon={<ReceiptIcon sx={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label={t('payments.orderHistory')} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <PaymentProcess onNavigate={onNavigate} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <OrderHistory />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default PaymentManagement;