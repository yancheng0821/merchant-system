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
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Customer, Package, packageApi, customerApi, serviceApi, Service, merchantConfigApi } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';
  const THEME_COLOR_HOVER = isMonochrome ? '#333' : '#DB2777';
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
    if (!user?.tenantId) return;

    try {
      const [gstConfig, pstConfig] = await Promise.all([
        merchantConfigApi.getConfigByKey(user.tenantId, 'gst_rate'),
        merchantConfigApi.getConfigByKey(user.tenantId, 'pst_rate'),
      ]);

      let gstRate = 0;
      let pstRate = 0;

      if (gstConfig && gstConfig.configValue) {
        let rate = parseFloat(gstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          if (rate <= 1) rate = rate * 100;
          gstRate = rate;
        }
      }

      if (pstConfig && pstConfig.configValue) {
        let rate = parseFloat(pstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          if (rate <= 1) rate = rate * 100;
          pstRate = rate;
        }
      }

      setGstRate(gstRate);
      setPstRate(pstRate);
    } catch (err) {
      console.error('Failed to load tax rates:', err);
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

      const customerId = typeof customer.id === 'string' ? parseInt(customer.id) : customer.id;

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

  // 输入框样式
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#fff',
      '& fieldset': { borderColor: '#d0d0d0' },
      '&:hover fieldset': { borderColor: '#bbb' },
      '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
    },
    '& .MuiInputLabel-root': {
      color: '#999',
      '&.Mui-focused': { color: '#1a1a1a' },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }
      }}
    >
      {/* 简约标题 */}
      <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(THEME_COLOR, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME_COLOR,
              }}
            >
              <PackageIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
                {t('customers.purchasePackage')}
              </Typography>
              {customer && (
                <Typography variant="caption" sx={{ color: '#888' }}>
                  {customer.firstName} {customer.lastName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: '#999' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} sx={{ color: THEME_COLOR }} />
          </Box>
        ) : (
          <>
            {/* 套餐选择 */}
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
              {t('customers.selectPackage')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {packages.map((pkg) => {
                const services = getPackageServices(pkg);
                const isSelected = selectedPackage?.id === pkg.id;

                return (
                  <Grid item xs={12} md={6} key={pkg.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? THEME_COLOR : 'rgba(0,0,0,0.06)',
                        borderRadius: 2,
                        boxShadow: isSelected ? `0 0 0 1px ${THEME_COLOR}` : 'none',
                        bgcolor: isSelected ? alpha(THEME_COLOR, 0.02) : '#fff',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isSelected ? THEME_COLOR : 'rgba(0,0,0,0.12)',
                        }
                      }}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* 名称和选中图标 */}
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {pkg.name}
                          </Typography>
                          {isSelected && (
                            <CheckIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
                          )}
                        </Box>

                        {/* 描述 */}
                        {pkg.description && (
                          <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                            {pkg.description}
                          </Typography>
                        )}

                        {/* 价格 */}
                        <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
                          <Typography variant="h6" sx={{ color: THEME_COLOR, fontWeight: 600 }}>
                            {CurrencyUtils.formatAmount(pkg.package_price)}
                          </Typography>
                          {pkg.original_price > pkg.package_price && (
                            <Typography variant="caption" sx={{ color: '#999', textDecoration: 'line-through' }}>
                              {CurrencyUtils.formatAmount(pkg.original_price)}
                            </Typography>
                          )}
                          {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                            <Chip
                              label={`-${pkg.discount_percentage.toFixed(0)}%`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: alpha('#10B981', 0.1),
                                color: '#10B981',
                              }}
                            />
                          )}
                        </Box>

                        {/* 详情 */}
                        <Box display="flex" gap={2}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <CalendarIcon sx={{ fontSize: 14, color: '#999' }} />
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {pkg.validity_days} {t('packages.days')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {services.length} {t('products.services')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {selectedPackage && (
              <>
                <Divider sx={{ my: 2.5 }} />

                {/* 包含服务 */}
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                  {t('packages.includedServices', 'Included Services')}
                </Typography>
                <Box sx={{ mb: 2.5 }}>
                  {getPackageServices(selectedPackage).map((service: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: index < getPackageServices(selectedPackage).length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                        {service.serviceName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography variant="body2" sx={{ color: THEME_COLOR, fontWeight: 500 }}>
                          ×{service.quantity}
                        </Typography>
                        {service.duration && (
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            {service.duration} min
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2.5 }} />

                {/* 支付方式 */}
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                  {t('customers.paymentMethod')}
                </Typography>
                <FormControl fullWidth sx={{ ...inputStyles, mb: 2.5 }}>
                  <InputLabel>{t('customers.selectPaymentMethod')}</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label={t('customers.selectPaymentMethod')}
                  >
                    <MenuItem value="CREDIT_CARD">{t('customers.creditCard')}</MenuItem>
                    <MenuItem value="DEBIT_CARD">{t('customers.debitCard')}</MenuItem>
                    <MenuItem value="CASH">{t('customers.cash')}</MenuItem>
                  </Select>
                </FormControl>

                {/* 备注 */}
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                  {t('customers.purchaseNotes')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('customers.purchaseNotesPlaceholder')}
                  sx={{ ...inputStyles, mb: 2.5 }}
                />

                {/* 支付汇总 */}
                <Box sx={{
                  p: 2,
                  bgcolor: '#fafafa',
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
                    {t('customers.paymentSummary', 'Payment Summary')}
                  </Typography>

                  {/* 小计 */}
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {t('customers.subtotal', 'Subtotal')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                      {CurrencyUtils.formatAmount(subtotal)}
                    </Typography>
                  </Box>

                  {/* 税费 */}
                  {gstRate > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        GST ({gstRate.toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {CurrencyUtils.formatAmount(subtotal * (gstRate / 100))}
                      </Typography>
                    </Box>
                  )}
                  {pstRate > 0 && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        PST ({pstRate.toFixed(1)}%)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {CurrencyUtils.formatAmount(subtotal * (pstRate / 100))}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* 总计 */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {t('customers.totalAmount')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: THEME_COLOR, fontWeight: 600 }}>
                      {CurrencyUtils.formatAmount(totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Button
          size="small"
          onClick={handleClose}
          disabled={purchasing}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            py: 0.75,
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: '#666',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          size="small"
          onClick={handlePurchase}
          variant="contained"
          disabled={!selectedPackage || purchasing}
          sx={{
            borderRadius: 1.5,
            px: 2.5,
            py: 0.75,
            fontSize: '0.8125rem',
            fontWeight: 500,
            bgcolor: THEME_COLOR,
            boxShadow: 'none',
            textTransform: 'none',
            '&:hover': { bgcolor: THEME_COLOR_HOVER, boxShadow: 'none' },
            '&:disabled': { bgcolor: '#e0e0e0' },
          }}
        >
          {purchasing ? <CircularProgress size={18} color="inherit" /> : t('customers.confirmPurchase')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackagePurchase;
