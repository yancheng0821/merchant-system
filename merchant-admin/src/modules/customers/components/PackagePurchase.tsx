import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  CardGiftcard as PackageIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  LocalOffer as DiscountIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer, Package, packageApi, customerApi, serviceApi, Service, merchantConfigApi } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { useAuth } from '../../../contexts/AuthContext';

interface PackagePurchaseProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

const PackagePurchase: React.FC<PackagePurchaseProps> = ({
  open,
  onClose,
  customer,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceMap, setServiceMap] = useState<Map<number, Service>>(new Map());

  // Tax calculation state
  const [gstRate, setGstRate] = useState<number>(0);
  const [pstRate, setPstRate] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    if (open && user?.tenantId) {
      loadPackages();
      loadServices();
      loadTaxRates();
    }
  }, [open, user?.tenantId]);

  // Load tax rates from merchant config
  const loadTaxRates = async () => {
    if (!user?.tenantId) {
      console.log('No tenantId, cannot load tax rate');
      return;
    }

    try {
      console.log('Loading tax rate for tenant:', user.tenantId);

      // 获取GST和PST税率 - 使用getConfigByKey而不是getMerchantConfig
      const [gstConfig, pstConfig] = await Promise.all([
        merchantConfigApi.getConfigByKey(user.tenantId, 'gst_rate'),
        merchantConfigApi.getConfigByKey(user.tenantId, 'pst_rate'),
      ]);

      console.log('GST Config:', gstConfig);
      console.log('PST Config:', pstConfig);

      let gstRate = 0; // 默认GST 0%
      let pstRate = 0; // 默认PST 0%

      // MerchantConfigMapper将setting_value别名为configValue
      if (gstConfig && gstConfig.configValue) {
        let rate = parseFloat(gstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          // 如果值大于1，认为是百分比形式（如5表示5%），保持原值
          // 如果值小于等于1，认为是小数形式（如0.05表示5%），转换为百分比
          if (rate <= 1) {
            rate = rate * 100;
          }
          gstRate = rate;
          console.log('Using GST rate from config:', gstRate);
        }
      } else {
        console.log('Using default GST rate:', gstRate);
      }

      if (pstConfig && pstConfig.configValue) {
        let rate = parseFloat(pstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          // 同样的逻辑处理PST
          if (rate <= 1) {
            rate = rate * 100;
          }
          pstRate = rate;
          console.log('Using PST rate from config:', pstRate);
        }
      } else {
        console.log('Using default PST rate:', pstRate);
      }

      setGstRate(gstRate);
      setPstRate(pstRate);
    } catch (err) {
      console.error('Failed to load tax rates:', err);
      // Default to 0 if failed to load
      setGstRate(0);
      setPstRate(0);
    }
  };

  // Calculate amounts when selected package changes
  useEffect(() => {
    if (selectedPackage) {
      const packagePrice = selectedPackage.package_price || 0;
      const totalTaxRate = (gstRate + pstRate) / 100;
      const calculatedTax = packagePrice * totalTaxRate;
      const calculatedTotal = packagePrice + calculatedTax;

      console.log('Calculating amounts:', {
        packagePrice,
        gstRate,
        pstRate,
        totalTaxRate,
        calculatedTax,
        calculatedTotal
      });

      setSubtotal(packagePrice);
      setTaxAmount(calculatedTax);
      setTotalAmount(calculatedTotal);
    } else {
      setSubtotal(0);
      setTaxAmount(0);
      setTotalAmount(0);
    }
  }, [selectedPackage, gstRate, pstRate]);

  const loadServices = async () => {
    if (!user?.tenantId) return;

    try {
      const servicesData = await serviceApi.getServices(user.tenantId.toString());
      setServices(servicesData);

      // Create a map for quick lookup
      const map = new Map<number, Service>();
      servicesData.forEach(service => {
        map.set(service.id, service);
      });
      setServiceMap(map);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  const loadPackages = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await packageApi.getPackages(user.tenantId);
      // Only show active packages
      setPackages(response.filter(pkg => pkg.status === 'ACTIVE'));
    } catch (err) {
      setError('Failed to load packages');
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !customer?.id || !user?.tenantId) return;

    try {
      setPurchasing(true);
      setError(null);

      // 直接给客户添加套餐，不接入真实支付
      // Direct package assignment without actual payment processing
      const customerId = typeof customer.id === 'string' ? parseInt(customer.id) : customer.id;

      // Pass calculated amounts to backend
      await customerApi.purchasePackage(customerId, {
        packageId: selectedPackage.id,
        paymentMethod,
        notes,
        tenantId: user.tenantId,
        subtotal: subtotal,
        taxRate: gstRate + pstRate,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        merchantName: user.tenantName || 'Your Service Team',
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(t('customers.packagePurchaseFailed'));
      console.error('Failed to purchase package:', err);
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setPaymentMethod('CREDIT_CARD');
    setNotes('');
    setError(null);
    onClose();
  };

  const getPackageServices = (pkg: Package) => {
    let packageServices: any[] = [];

    if (typeof pkg.services === 'string') {
      try {
        packageServices = JSON.parse(pkg.services);
      } catch {
        return [];
      }
    } else {
      packageServices = pkg.services || [];
    }

    // Map service IDs to service details
    return packageServices.map(ps => {
      const service = serviceMap.get(ps.service_id);
      return {
        serviceId: ps.service_id,
        serviceName: service?.name || 'Unknown Service',
        quantity: ps.count,
        duration: service?.duration,
        price: service?.price,
      };
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(219, 39, 119, 0.08))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 3,
          pt: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
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
              <PackageIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('customers.purchasePackage')}
              </Typography>
              {customer && (
                <Typography variant="caption" color="text.secondary">
                  {customer.firstName} {customer.lastName} ({customer.phone})
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              '&:hover': {
                bgcolor: alpha('#EC4899', 0.1),
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Package Selection */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('customers.selectPackage')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {packages.map((pkg) => {
                const services = getPackageServices(pkg);
                const isSelected = selectedPackage?.id === pkg.id;

                return (
                  <Grid item xs={12} md={6} key={pkg.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? '2px solid' : '2px solid',
                        borderColor: isSelected ? '#EC4899' : alpha('#000', 0.08),
                        borderRadius: 3,
                        transition: 'all 0.25s ease',
                        bgcolor: 'white',
                        boxShadow: isSelected
                          ? '0 8px 24px rgba(236, 72, 153, 0.15)'
                          : '0 2px 8px rgba(0, 0, 0, 0.06)',
                        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                        '&:hover': {
                          borderColor: '#EC4899',
                          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.15)',
                          transform: 'translateY(-2px)',
                        }
                      }}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {/* Header: Name and Check Icon */}
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem', color: 'text.primary' }}>
                            {pkg.name}
                          </Typography>
                          {isSelected && (
                            <CheckIcon sx={{ color: '#EC4899', fontSize: 24 }} />
                          )}
                        </Box>

                        {/* Description */}
                        {pkg.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.875rem', lineHeight: 1.6 }}>
                            {pkg.description}
                          </Typography>
                        )}

                        {/* Price Section */}
                        <Box sx={{ mb: 2.5 }}>
                          <Box display="flex" alignItems="baseline" gap={1}>
                            <Typography variant="h5" color="#EC4899" fontWeight={700}>
                              {CurrencyUtils.formatAmount(pkg.package_price)}
                            </Typography>
                            {pkg.original_price > pkg.package_price && (
                              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', fontSize: '0.875rem' }}>
                                {CurrencyUtils.formatAmount(pkg.original_price)}
                              </Typography>
                            )}
                            {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                              <Chip
                                label={`-${pkg.discount_percentage.toFixed(0)}%`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  bgcolor: '#10B981',
                                  color: 'white',
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Details Row */}
                        <Box display="flex" gap={2} flexWrap="wrap">
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                              {pkg.validity_days} {t('packages.days')}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PackageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                              {services.length} {t('products.services')}
                            </Typography>
                          </Box>
                          {pkg.max_shared_users > 1 && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                👥 {pkg.max_shared_users} users
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {selectedPackage && (
              <>
                <Divider sx={{ my: 3 }} />

                {/* Package Details - Simplified */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    {t('packages.includedServices', 'Included Services')}
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    bgcolor: alpha('#F9FAFB', 0.5),
                    borderRadius: 2,
                    p: 2,
                  }}>
                    {getPackageServices(selectedPackage).map((service: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          px: 1.5,
                          bgcolor: 'white',
                          borderRadius: 1.5,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha('#EC4899', 0.03),
                          },
                        }}
                      >
                        <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                          {service.serviceName}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${service.quantity}x`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: alpha('#EC4899', 0.1),
                              color: '#EC4899',
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                          {service.duration && (
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                              {service.duration} min
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Payment Method */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    {t('customers.paymentMethod')}
                  </Typography>
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                        '& fieldset': {
                          borderColor: alpha('#000', 0.12),
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                          borderColor: alpha('#EC4899', 0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#EC4899',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'text.secondary',
                        fontWeight: 500,
                        '&.Mui-focused': {
                          color: '#EC4899',
                          fontWeight: 600,
                        },
                      },
                      '& .MuiSelect-select': {
                        py: 1.5,
                      },
                    }}
                  >
                    <InputLabel>{t('customers.selectPaymentMethod')}</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      label={t('customers.selectPaymentMethod')}
                    >
                      <MenuItem value="CREDIT_CARD" sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: paymentMethod === 'CREDIT_CARD' ? '#EC4899' : 'transparent',
                            }}
                          />
                          <Typography variant="body2">{t('customers.creditCard')}</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="DEBIT_CARD" sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: paymentMethod === 'DEBIT_CARD' ? '#EC4899' : 'transparent',
                            }}
                          />
                          <Typography variant="body2">{t('customers.debitCard')}</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="CASH" sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: paymentMethod === 'CASH' ? '#EC4899' : 'transparent',
                            }}
                          />
                          <Typography variant="body2">{t('customers.cash')}</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Notes */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                    {t('customers.purchaseNotes')}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('customers.purchaseNotesPlaceholder')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                        '& fieldset': {
                          borderColor: alpha('#000', 0.12),
                          borderWidth: '2px',
                        },
                        '&:hover fieldset': {
                          borderColor: alpha('#EC4899', 0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#EC4899',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        '&::placeholder': {
                          color: 'text.secondary',
                          opacity: 0.6,
                        },
                      },
                    }}
                  />
                </Box>

                {/* Payment Summary with Tax Breakdown */}
                <Card sx={{
                  bgcolor: alpha('#EC4899', 0.05),
                  border: `1px solid ${alpha('#EC4899', 0.2)}`,
                  borderRadius: 2,
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                      {t('customers.paymentSummary', 'Payment Summary')}
                    </Typography>

                    {/* Subtotal */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('customers.subtotal', 'Subtotal')}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {CurrencyUtils.formatAmount(subtotal)}
                      </Typography>
                    </Box>

                    {/* Tax Breakdown - Always show */}
                    <Box sx={{ mb: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                          GST ({gstRate.toFixed(2)}%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {CurrencyUtils.formatAmount(subtotal * (gstRate / 100))}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                          PST ({pstRate.toFixed(2)}%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {CurrencyUtils.formatAmount(subtotal * (pstRate / 100))}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Total */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        {t('customers.totalAmount')}
                      </Typography>
                      <Typography variant="h5" color="#EC4899" fontWeight={700}>
                        {CurrencyUtils.formatAmount(totalAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha('#EC4899', 0.02),
        }}
      >
        <Button
          onClick={handleClose}
          disabled={purchasing}
          sx={{
            borderRadius: 2,
            px: 3,
            color: '#EC4899',
            '&:hover': {
              bgcolor: alpha('#EC4899', 0.08),
            },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handlePurchase}
          variant="contained"
          disabled={!selectedPackage || purchasing}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #EC4899, #DB2777)',
            boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #DB2777, #BE185D)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {purchasing ? <CircularProgress size={20} color="inherit" /> : t('customers.confirmPurchase')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackagePurchase;