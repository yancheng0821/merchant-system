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

interface ServiceDemandPrediction {
  serviceId: string;
  serviceName: string;
  predictedOrders: number;
  confidence: number;
}

const AiBusinessInsights: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AppointmentRecommendation[]>([]);
  const [predictions, setPredictions] = useState<ServiceDemandPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiInsights = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      // 并行获取推荐和预测数据
      const [recommendationResult, predictionResult] = await Promise.all([
        aiApi.getAppointmentRecommendation(user.tenantId, 'sample-customer'),
        aiApi.predictServiceDemand(user.tenantId)
      ]);

      if (recommendationResult.success && recommendationResult.data) {
        setRecommendations(recommendationResult.data);
      }

      if (predictionResult.success && predictionResult.data) {
        setPredictions(predictionResult.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch AI insights:', err);
      setError(err.message || 'Failed to load AI insights');
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

  if (loading && recommendations.length === 0 && predictions.length === 0) {
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
        {/* 预约推荐卡片 */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#10B981', 0.1),
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
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                  {t('ai.appointmentRecommendations.title')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('ai.appointmentRecommendations.description')}
              </Typography>

              {recommendations.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <InsightsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('ai.noRecommendations')}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recommendations.map((rec, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        border: '1px solid',
                        borderColor: alpha('#10B981', 0.1),
                        borderRadius: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              {rec.serviceName}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {rec.recommendedDate} {rec.recommendedTime}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {rec.reason}
                            </Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                            <Chip
                              label={getConfidenceLabel(rec.confidence)}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getConfidenceColor(rec.confidence), 0.1),
                                color: getConfidenceColor(rec.confidence),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<BookIcon />}
                              sx={{
                                backgroundColor: '#10B981',
                                '&:hover': { backgroundColor: '#059669' },
                                textTransform: 'none',
                                fontSize: '0.75rem',
                              }}
                            >
                              {t('ai.actions.bookAppointment')}
                            </Button>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <StarIcon sx={{ fontSize: 14, color: getConfidenceColor(rec.confidence) }} />
                          <Typography variant="caption" sx={{ color: getConfidenceColor(rec.confidence), fontWeight: 600 }}>
                            {t('ai.confidence.label')}: {(rec.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 需求预测卡片 */}
        <Grid item xs={12} lg={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: alpha('#6366F1', 0.1),
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
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#6366F1' }}>
                  {t('ai.demandPrediction.title')}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('ai.demandPrediction.description')}
              </Typography>

              {predictions.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <AssessmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('ai.noPredictions')}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {predictions.map((pred, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        border: '1px solid',
                        borderColor: alpha('#6366F1', 0.1),
                        borderRadius: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box flex={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              {pred.serviceName}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1', mb: 1 }}>
                              {pred.predictedOrders}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('ai.demandPrediction.ordersNext7Days')}
                            </Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                            <Chip
                              label={getConfidenceLabel(pred.confidence)}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getConfidenceColor(pred.confidence), 0.1),
                                color: getConfidenceColor(pred.confidence),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AssessmentIcon />}
                              sx={{
                                borderColor: '#6366F1',
                                color: '#6366F1',
                                '&:hover': {
                                  borderColor: '#4F46E5',
                                  backgroundColor: alpha('#6366F1', 0.04),
                                },
                                textTransform: 'none',
                                fontSize: '0.75rem',
                              }}
                            >
                              {t('ai.actions.viewDetails')}
                            </Button>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" alignItems="center" gap={1}>
                          <StarIcon sx={{ fontSize: 14, color: getConfidenceColor(pred.confidence) }} />
                          <Typography variant="caption" sx={{ color: getConfidenceColor(pred.confidence), fontWeight: 600 }}>
                            {t('ai.confidence.label')}: {(pred.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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