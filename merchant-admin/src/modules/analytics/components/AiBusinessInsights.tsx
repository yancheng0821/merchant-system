import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Business as AiIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  BookOnline as BookIcon,
  AutoAwesome as InsightsIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Campaign as CampaignIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { aiApi } from '../../../services/api';

interface AppointmentRecommendation {
  serviceId: string;
  serviceName: string;
  recommendedDate: string;
  recommendedTime: string;
  confidence: number;
  reason: string;
}



interface PricingRecommendation {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  strategy: string;
  reasoning: string[];
  expectedImpact: { revenue: string; customers: string; profit_margin: string };
  confidence: number;
}

interface MarketingCampaign {
  campaignName: string;
  campaignType: string;
  description: string;
  targetAudience: string[];
  duration: string;
  expectedROI: string;
  implementation: string[];
  budget: string;
}

interface MarketingRecommendation {
  campaigns: MarketingCampaign[];
  priority: string[];
  expectedOutcomes: { [key: string]: string };
  timeline: string;
}

const AiBusinessInsights: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AppointmentRecommendation[]>([]);

  const [pricingRecommendation, setPricingRecommendation] = useState<PricingRecommendation | null>(null);
  const [marketingRecommendation, setMarketingRecommendation] = useState<MarketingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 定价建议对话框状态
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    serviceId: '',
    serviceName: '',
    currentPrice: 0,
    category: '',
    duration: 60,
    cost: 0,
    competitorPrices: [0],
    marketDemand: 'medium',
    seasonality: 'normal',
    customerSegment: 'standard',
    businessGoals: 'maintain_quality'
  });

  // 营销建议对话框状态
  const [marketingDialogOpen, setMarketingDialogOpen] = useState(false);
  const [marketingForm, setMarketingForm] = useState({
    businessType: 'salon',
    targetAudience: ['young_professionals'],
    location: 'urban',
    currentPromotions: [],
    targetGoals: ['increase_customers'],
    budget: 'medium',
    timeframe: 'medium_term'
  });

  const fetchAiInsights = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      // 只获取市场洞察数据
      const marketInsights = await aiApi.getMarketInsights();
      if (marketInsights.success && marketInsights.data) {
        // 可以在这里处理市场洞察数据
      }
    } catch (err: any) {
      console.error('Failed to fetch AI insights:', err);
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingRecommendation = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    try {
      const result = await aiApi.getPricingRecommendation(
        user.tenantId,
        {
          serviceId: pricingForm.serviceId,
          serviceName: pricingForm.serviceName,
          currentPrice: pricingForm.currentPrice,
          category: pricingForm.category,
          duration: pricingForm.duration,
          cost: pricingForm.cost
        },
        {
          competitorPrices: pricingForm.competitorPrices,
          marketDemand: pricingForm.marketDemand,
          seasonality: pricingForm.seasonality,
          customerSegment: pricingForm.customerSegment
        },
        pricingForm.businessGoals
      );

      if (result.success && result.data) {
        setPricingRecommendation(result.data);
        setPricingDialogOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to get pricing recommendation:', err);
      setError(err.message || 'Failed to get pricing recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketingRecommendation = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    try {
      const result = await aiApi.getMarketingRecommendation(
        user.tenantId,
        {
          businessType: marketingForm.businessType,
          targetAudience: marketingForm.targetAudience,
          location: marketingForm.location,
          currentPromotions: marketingForm.currentPromotions
        },
        marketingForm.targetGoals,
        marketingForm.budget,
        marketingForm.timeframe
      );

      if (result.success && result.data) {
        setMarketingRecommendation(result.data);
        setMarketingDialogOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to get marketing recommendation:', err);
      setError(err.message || 'Failed to get marketing recommendation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, [user?.tenantId]);

  const handleRefresh = () => {
    fetchAiInsights();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10B981';
    if (confidence >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return t('ai.confidence.high');
    if (confidence >= 0.6) return t('ai.confidence.medium');
    return t('ai.confidence.low');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ color: '#6366F1' }} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            {t('ai.loading')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* 页面标题和刷新按钮 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 6,
              height: 24,
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              borderRadius: 1,
              mr: 2,
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('ai.businessInsights.title')}
          </Typography>
          <AiIcon sx={{ 
            ml: 1, 
            color: '#6366F1',
            fontSize: 28,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }} />
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            borderColor: '#6366F1',
            color: '#6366F1',
            '&:hover': {
              borderColor: '#4F46E5',
              backgroundColor: alpha('#6366F1', 0.04),
            },
          }}
        >
          {t('common.refresh')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>


        {/* 定价建议卡片 */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#F59E0B', 0.1),
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                  {t('ai.pricingRecommendation.title')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('ai.pricingRecommendation.description')}
              </Typography>

              {pricingRecommendation ? (
                <Box>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#F59E0B', 0.1),
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                          ¥{pricingRecommendation.recommendedPrice}
                        </Typography>
                        <Chip
                          label={pricingRecommendation.strategy}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#F59E0B', 0.1),
                            color: '#F59E0B',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        价格范围: ¥{pricingRecommendation.priceRange.min} - ¥{pricingRecommendation.priceRange.max}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          预期影响:
                        </Typography>
                        <Box display="flex" gap={2}>
                          <Chip label={`收入 ${pricingRecommendation.expectedImpact.revenue}`} size="small" />
                          <Chip label={`客户 ${pricingRecommendation.expectedImpact.customers}`} size="small" />
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StarIcon sx={{ fontSize: 14, color: getConfidenceColor(pricingRecommendation.confidence) }} />
                        <Typography variant="caption" sx={{ color: getConfidenceColor(pricingRecommendation.confidence), fontWeight: 600 }}>
                          {t('ai.confidence.label')}: {(pricingRecommendation.confidence * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <PsychologyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('ai.noPricingRecommendation')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    onClick={() => setPricingDialogOpen(true)}
                    sx={{
                      backgroundColor: '#F59E0B',
                      '&:hover': { backgroundColor: '#D97706' },
                    }}
                  >
                    {t('ai.actions.getPricingRecommendation')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 营销建议卡片 */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#EC4899', 0.1),
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <CampaignIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#EC4899' }}>
                  {t('ai.marketingRecommendation.title')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('ai.marketingRecommendation.description')}
              </Typography>

              {marketingRecommendation ? (
                <Box>
                  {marketingRecommendation.campaigns.slice(0, 2).map((campaign, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        border: '1px solid',
                        borderColor: alpha('#EC4899', 0.1),
                        borderRadius: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {campaign.campaignName}
                          </Typography>
                          <Chip
                            label={campaign.expectedROI}
                            size="small"
                            sx={{
                              backgroundColor: alpha('#EC4899', 0.1),
                              color: '#EC4899',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {campaign.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CampaignIcon />}
                    sx={{
                      borderColor: '#EC4899',
                      color: '#EC4899',
                      '&:hover': {
                        borderColor: '#DB2777',
                        backgroundColor: alpha('#EC4899', 0.04),
                      },
                      textTransform: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    {t('ai.actions.viewAllCampaigns')}
                  </Button>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <CampaignIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('ai.noMarketingRecommendation')}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CampaignIcon />}
                    onClick={() => setMarketingDialogOpen(true)}
                    sx={{
                      backgroundColor: '#EC4899',
                      '&:hover': { backgroundColor: '#DB2777' },
                    }}
                  >
                    {t('ai.actions.getMarketingRecommendation')}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 定价建议对话框 */}
      <Dialog open={pricingDialogOpen} onClose={() => setPricingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>获取定价建议</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="服务名称"
                value={pricingForm.serviceName}
                onChange={(e) => setPricingForm({ ...pricingForm, serviceName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="服务分类"
                value={pricingForm.category}
                onChange={(e) => setPricingForm({ ...pricingForm, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="当前价格"
                value={pricingForm.currentPrice}
                onChange={(e) => setPricingForm({ ...pricingForm, currentPrice: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="成本"
                value={pricingForm.cost}
                onChange={(e) => setPricingForm({ ...pricingForm, cost: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>市场需求</InputLabel>
                <Select
                  value={pricingForm.marketDemand}
                  onChange={(e) => setPricingForm({ ...pricingForm, marketDemand: e.target.value })}
                >
                  <MenuItem value="high">高</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="low">低</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>季节性</InputLabel>
                <Select
                  value={pricingForm.seasonality}
                  onChange={(e) => setPricingForm({ ...pricingForm, seasonality: e.target.value })}
                >
                  <MenuItem value="peak">旺季</MenuItem>
                  <MenuItem value="normal">正常</MenuItem>
                  <MenuItem value="low">淡季</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>业务目标</InputLabel>
                <Select
                  value={pricingForm.businessGoals}
                  onChange={(e) => setPricingForm({ ...pricingForm, businessGoals: e.target.value })}
                >
                  <MenuItem value="maximize_profit">最大化利润</MenuItem>
                  <MenuItem value="increase_market_share">增加市场份额</MenuItem>
                  <MenuItem value="maintain_quality">保持质量</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingDialogOpen(false)}>取消</Button>
          <Button onClick={handlePricingRecommendation} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '获取建议'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 营销建议对话框 */}
      <Dialog open={marketingDialogOpen} onClose={() => setMarketingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>获取营销建议</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>业务类型</InputLabel>
                <Select
                  value={marketingForm.businessType}
                  onChange={(e) => setMarketingForm({ ...marketingForm, businessType: e.target.value })}
                >
                  <MenuItem value="salon">美容院</MenuItem>
                  <MenuItem value="spa">水疗中心</MenuItem>
                  <MenuItem value="clinic">诊所</MenuItem>
                  <MenuItem value="fitness">健身房</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>位置</InputLabel>
                <Select
                  value={marketingForm.location}
                  onChange={(e) => setMarketingForm({ ...marketingForm, location: e.target.value })}
                >
                  <MenuItem value="urban">城市</MenuItem>
                  <MenuItem value="suburban">郊区</MenuItem>
                  <MenuItem value="rural">农村</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['young_professionals', 'students', 'families', 'seniors']}
                value={marketingForm.targetAudience}
                onChange={(_, newValue) => setMarketingForm({ ...marketingForm, targetAudience: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="目标受众" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['increase_customers', 'boost_revenue', 'improve_retention']}
                value={marketingForm.targetGoals}
                onChange={(_, newValue) => setMarketingForm({ ...marketingForm, targetGoals: newValue })}
                renderInput={(params) => (
                  <TextField {...params} label="目标" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>预算</InputLabel>
                <Select
                  value={marketingForm.budget}
                  onChange={(e) => setMarketingForm({ ...marketingForm, budget: e.target.value })}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>时间框架</InputLabel>
                <Select
                  value={marketingForm.timeframe}
                  onChange={(e) => setMarketingForm({ ...marketingForm, timeframe: e.target.value })}
                >
                  <MenuItem value="short_term">短期</MenuItem>
                  <MenuItem value="medium_term">中期</MenuItem>
                  <MenuItem value="long_term">长期</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarketingDialogOpen(false)}>取消</Button>
          <Button onClick={handleMarketingRecommendation} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '获取建议'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI 提示信息 */}
      <Box mt={3}>
        <Alert
          severity="info"
          icon={<AiIcon />}
          sx={{
            borderRadius: 2,
            backgroundColor: alpha('#6366F1', 0.04),
            borderColor: alpha('#6366F1', 0.2),
            '& .MuiAlert-icon': {
              color: '#6366F1',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t('ai.disclaimer')}
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default AiBusinessInsights;