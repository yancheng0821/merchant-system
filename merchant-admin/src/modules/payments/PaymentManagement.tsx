import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  CardContent,
  alpha,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  ShoppingCart as OrdersIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { CurrencyUtils } from '../../config/constants';
// 支付功能已迁移，暂时注释
// import PaymentProcess from './components/PaymentProcess';
import OrderHistory from './components/OrderHistory';

interface PaymentManagementProps {
  onNavigate?: (item: string) => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // 支付功能已迁移，不再需要 tab 切换
  // const [tabValue, setTabValue] = useState(0);
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

  // 支付功能已迁移，不再需要 tab 切换
  // const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  //   setTabValue(newValue);
  // };

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 600,
                color: '#10B981',
                mb: 0.5,
              }}
            >
              {t('payments.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {t('payments.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: alpha('#10B981', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    flexShrink: 0,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                    {t('payments.todayRevenue')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(stats.todayRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: alpha('#6366F1', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366F1',
                    flexShrink: 0,
                  }}
                >
                  <OrdersIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                    {t('payments.todayOrders')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {stats.todayOrders}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: alpha('#F59E0B', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B',
                    flexShrink: 0,
                  }}
                >
                  <CreditCardIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                    {t('payments.pendingPayments')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {stats.pendingPayments}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.06)',
              bgcolor: '#fff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={2.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: alpha('#EC4899', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EC4899',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mb: 0.5 }}>
                    {t('payments.avgOrderValue')}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {CurrencyUtils.formatAmountWithCommas(Math.round(stats.avgOrderValue))}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 订单历史 - 支付功能已迁移到其他模块 */}
      <Box>
        <OrderHistory />
      </Box>
    </Box>
  );
};

export default PaymentManagement;