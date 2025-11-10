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
          borderRadius: 3,
          overflow: 'visible',
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${packageData.color || '#06B6D4'}, ${alpha(packageData.color || '#06B6D4', 0.7)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 28,
              }}
            >
              {getPackageIconComponent(packageData.icon)}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {packageData.name}
              </Typography>
              {packageData.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {packageData.description}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2 }}>
        <Grid container spacing={3}>
          {/* Status and Basic Info */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              <Chip
                label={packageData.status === 'ACTIVE' ? t('packages.active') : t('packages.inactive')}
                sx={{
                  bgcolor: packageData.status === 'ACTIVE' ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                  color: packageData.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                  fontWeight: 600,
                }}
              />
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {t('packages.validFor')} {packageData.validity_days} {t('packages.days')}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">
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
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('packages.pricing')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('packages.originalPrice')}
                  </Typography>
                  <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                    {CurrencyUtils.formatAmount(packageData.original_price)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('packages.packagePrice')}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#0891B2' }}>
                    {CurrencyUtils.formatAmount(packageData.package_price)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('packages.savings')}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" fontWeight={600} sx={{ color: '#10B981' }}>
                      {CurrencyUtils.formatAmount(savingsAmount)}
                    </Typography>
                    {packageData.discount_percentage && packageData.discount_percentage > 0 && (
                      <Chip
                        label={`-${packageData.discount_percentage.toFixed(0)}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha('#10B981', 0.1),
                          color: '#10B981',
                          fontWeight: 600,
                          height: 24,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Included Services */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('packages.includedServices')} ({totalServicesCount} {t('products.sessions')})
            </Typography>
            <Box sx={{ mt: 2 }}>
              {packageServices.map((ps, index) => {
                const service = getServiceDetails(ps.service_id);
                const totalValue = service.price * ps.count;

                return (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#06B6D4', 0.04),
                      border: `1px solid ${alpha('#06B6D4', 0.1)}`,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={`${ps.count}x`}
                          size="small"
                          sx={{
                            bgcolor: alpha('#06B6D4', 0.1),
                            color: '#0891B2',
                            fontWeight: 600,
                          }}
                        />
                        <Typography variant="body1" fontWeight={500}>
                          {service.name}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" color="text.secondary">
                          {CurrencyUtils.formatAmount(service.price)} × {ps.count}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
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
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('packages.termsAndConditions')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {packageData.terms}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha('#06B6D4', 0.02),
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 3,
            borderColor: alpha('#06B6D4', 0.5),
            color: '#06B6D4',
            '&:hover': {
              borderColor: '#06B6D4',
              backgroundColor: alpha('#06B6D4', 0.08),
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