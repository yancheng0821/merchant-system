import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  alpha,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CardGiftcard as PackageIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Package, PackageService } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { getPackageIconComponent } from '../utils/packageIcons';
import { useTheme } from '../../../contexts/ThemeContext';

interface Service {
  id: number;
  name: string;
  price: number;
}

interface PackageDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  packageData: Package | null;
  services: Service[];
}

const PackageDetailsDialog: React.FC<PackageDetailsDialogProps> = ({
  open,
  onClose,
  packageData,
  services,
}) => {
  const { t } = useTranslation();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#06B6D4';
  const THEME_COLOR_DARK = isMonochrome ? '#333' : '#0891B2';

  if (!packageData) return null;

  const getPackageServices = (): PackageService[] => {
    if (typeof packageData.services === 'string') {
      try {
        return JSON.parse(packageData.services);
      } catch {
        return [];
      }
    }
    return packageData.services || [];
  };

  const getServiceDetails = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service || { name: t('packages.unknownService'), price: 0 };
  };

  const packageServices = getPackageServices();
  const totalServicesCount = packageServices.reduce((sum, ps) => sum + ps.count, 0);
  const savingsAmount = packageData.original_price - packageData.package_price;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 2.5 },
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          m: { xs: 1, sm: 'auto' },
          width: { xs: 'calc(100% - 16px)', sm: '100%' },
          maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100% - 64px)' },
        },
      }}
    >
      <DialogTitle sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                borderRadius: 1.5,
                bgcolor: alpha(packageData.color || '#06B6D4', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: packageData.color || '#06B6D4',
                fontSize: { xs: 16, sm: 20 },
                flexShrink: 0,
              }}
            >
              {getPackageIconComponent(packageData.icon)}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '0.95rem', sm: '1.125rem' } }} noWrap>
                {packageData.name}
              </Typography>
              {packageData.description && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {packageData.description}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#999', flexShrink: 0 }}>
            <CloseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, pt: { xs: 0, sm: 0 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
          {/* Status and Basic Info */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: { xs: 1.5, sm: 0 },
                bgcolor: { xs: '#fafafa', sm: 'transparent' },
                borderRadius: { xs: 1.5, sm: 0 },
                mb: { xs: 0.5, sm: 0 },
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  size="small"
                  label={packageData.status === 'ACTIVE' ? t('packages.active') : t('packages.inactive')}
                  sx={{
                    height: 22,
                    bgcolor: packageData.status === 'ACTIVE' ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                    color: packageData.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarIcon sx={{ fontSize: 14, color: '#999', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                  {t('packages.validFor')} {packageData.validity_days} {t('packages.days')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon sx={{ fontSize: 14, color: '#999', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#666' }}>
                  {packageData.max_shared_users === 1
                    ? t('packages.individual')
                    : `${t('packages.sharedUpTo')} ${packageData.max_shared_users} ${t('packages.people')}`}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Pricing Information */}
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: { xs: 1, sm: 1.5 }, color: '#1a1a1a', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('packages.pricing')}
            </Typography>
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1.5, sm: 3 }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {t('packages.originalPrice')}
                </Typography>
                <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#999', mt: 0.25, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                  {CurrencyUtils.formatAmount(packageData.original_price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {t('packages.packagePrice')}
                </Typography>
                <Typography variant="h6" fontWeight={600} sx={{ color: THEME_COLOR_DARK, mt: 0.25, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {CurrencyUtils.formatAmount(packageData.package_price)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {t('packages.savings')}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.25}>
                  <Typography variant="body1" fontWeight={600} sx={{ color: isMonochrome ? '#1a1a1a' : '#10B981', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                    {CurrencyUtils.formatAmount(savingsAmount)}
                  </Typography>
                  {packageData.discount_percentage && packageData.discount_percentage > 0 && (
                    <Chip
                      label={`-${packageData.discount_percentage.toFixed(0)}%`}
                      size="small"
                      sx={{
                        bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.1)' : alpha('#10B981', 0.1),
                        color: isMonochrome ? '#1a1a1a' : '#10B981',
                        fontWeight: 500,
                        height: { xs: 18, sm: 20 },
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Included Services */}
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: { xs: 1, sm: 1.5 }, color: '#1a1a1a', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {t('packages.includedServices')} ({totalServicesCount} {t('products.sessions')})
            </Typography>
            <Box>
              {packageServices.map((ps, index) => {
                const service = getServiceDetails(ps.service_id);
                const totalValue = service.price * ps.count;

                return (
                  <Box
                    key={index}
                    sx={{
                      p: { xs: 1, sm: 1.5 },
                      mb: 1,
                      borderRadius: 1.5,
                      bgcolor: '#fafafa',
                      border: '1px solid rgba(0,0,0,0.04)',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }} sx={{ minWidth: 0, flex: 1 }}>
                        <Box
                          sx={{
                            minWidth: { xs: 28, sm: 32 },
                            height: { xs: 20, sm: 24 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(THEME_COLOR, 0.1),
                            borderRadius: 1,
                            px: { xs: 0.5, sm: 1 },
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: THEME_COLOR_DARK, fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {ps.count}×
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }} noWrap>
                          {service.name}
                        </Typography>
                      </Box>
                      <Box textAlign="right" sx={{ flexShrink: 0, ml: 1 }}>
                        <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: { xs: 'none', sm: 'block' } }}>
                          {CurrencyUtils.formatAmount(service.price)} × {ps.count}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#1a1a1a', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {CurrencyUtils.formatAmount(totalValue)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          {/* Terms and Conditions */}
          {packageData.terms && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#1a1a1a', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {t('packages.termsAndConditions')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', whiteSpace: 'pre-wrap', fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.6 }}>
                  {packageData.terms}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Button
          size="small"
          onClick={onClose}
          sx={{
            borderRadius: 1.5,
            px: { xs: 2, sm: 2.5 },
            py: 0.75,
            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
            fontWeight: 500,
            color: '#666',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.04)',
            },
          }}
        >
          {t('packages.closeDetails')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackageDetailsDialog;