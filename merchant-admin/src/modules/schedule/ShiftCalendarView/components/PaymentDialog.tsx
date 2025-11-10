import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Chip,
  alpha,
  IconButton,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as DebitCardIcon,
  AttachMoney as CashIcon,
  CardGiftcard as PackageIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { customerApi, verificationApi, merchantConfigApi } from '../../../../services/api';
import { CurrencyUtils } from '../../../../config/constants';

interface ServicePayment {
  serviceId: number;
  paymentMethod: string;
  customerPackageId?: number;
  verificationCodeId?: number;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (
    // 单服务场景：保持原有参数
    paymentMethod: string,
    customerPackageId?: number,
    verificationCodeId?: number,
    // 多服务场景：传递服务支付数组
    servicePayments?: ServicePayment[],
    // 税率和小费信息
    taxInfo?: {
      taxRate: number;
      taxAmount: number;
      tipAmount: number;
      tipPercentage: number;
      subtotal: number;
      totalAmount: number;
    }
  ) => void;
  appointmentId: number;
  customerId: number;
  serviceId?: number; // 保留用于向后兼容
  services?: Array<{ id: number; name: string; price: number; }>; // 多服务支持
  amount: number;
  serviceName: string;
  container?: HTMLElement | null;
}

interface CustomerPackage {
  id: number;
  package_id: number;
  package_name: string;
  remaining_count: number;
  service_remaining: number;
  service_remaining_map?: Record<number, number>; // 每个服务的剩余次数映射
  services: any[];
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  appointmentId,
  customerId,
  serviceId,
  services,
  amount,
  serviceName,
  container,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // 单服务场景的状态
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  // 多服务场景的状态：每个服务的支付方式和套餐选择
  const [servicePaymentMethods, setServicePaymentMethods] = useState<Record<number, string>>({});
  const [servicePackageIds, setServicePackageIds] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 税率和小费状态
  const [taxRate, setTaxRate] = useState<number>(0.12); // 默认12% (BC省GST+PST)
  const [tipPercentage, setTipPercentage] = useState<number>(0); // 小费百分比
  const [customTipAmount, setCustomTipAmount] = useState<string>(''); // 自定义小费金额
  const [showCustomTip, setShowCustomTip] = useState<boolean>(false); // 是否显示自定义小费输入框

  // 验证码相关状态
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Refs for auto-scrolling
  const packageSelectionRef = useRef<HTMLDivElement>(null);
  const verificationSectionRef = useRef<HTMLDivElement>(null);
  const multiServiceVerificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && customerId && user?.tenantId) {
      loadCustomerPackages();
      loadTaxRate();
      // 多服务场景：初始化每个服务的支付方式为默认值
      if (services && services.length > 1) {
        const initialMethods: Record<number, string> = {};
        services.forEach(service => {
          initialMethods[service.id] = 'CREDIT_CARD';
        });
        setServicePaymentMethods(initialMethods);
      }
    }
  }, [open, customerId, user?.tenantId, services]);

  // 确保 servicePaymentMethods 在渲染时有值
  useEffect(() => {
    if (open && services && services.length > 1) {
      // 检查是否需要重新初始化
      const needsInit = services.some(service => !servicePaymentMethods[service.id]);
      if (needsInit) {
        const initialMethods: Record<number, string> = {};
        services.forEach(service => {
          initialMethods[service.id] = servicePaymentMethods[service.id] || 'CREDIT_CARD';
        });
        setServicePaymentMethods(initialMethods);
      }
    }
  }, [open, services, servicePaymentMethods]);

  // 当选择PACKAGE支付方式时，自动滚动到套餐选择区域
  useEffect(() => {
    if (paymentMethod === 'PACKAGE' && customerPackages.length > 0 && packageSelectionRef.current) {
      setTimeout(() => {
        packageSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [paymentMethod, customerPackages]);

  // 当选择套餐后，自动滚动到验证码区域
  useEffect(() => {
    if (selectedPackageId && verificationSectionRef.current) {
      setTimeout(() => {
        verificationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [selectedPackageId]);

  // 当验证码发送成功后，自动滚动到验证码输入区域
  useEffect(() => {
    if (verificationSent && verificationSectionRef.current) {
      setTimeout(() => {
        verificationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [verificationSent]);

  // 多服务场景：当验证码发送成功后，滚动到成功提示区域
  useEffect(() => {
    if (services && services.length > 1 && verificationSent && multiServiceVerificationRef.current) {
      setTimeout(() => {
        multiServiceVerificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [services, verificationSent]);

  // 错误提示自动消失
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000); // 4秒后自动消失
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 验证码错误提示自动消失
  useEffect(() => {
    if (verificationError) {
      const timer = setTimeout(() => {
        setVerificationError(null);
      }, 4000); // 4秒后自动消失
      return () => clearTimeout(timer);
    }
  }, [verificationError]);

  const loadCustomerPackages = async () => {
    if (!user?.tenantId) return;

    try {
      setLoadingPackages(true);
      setError(null);
      const packages = await customerApi.getCustomerActivePackages(customerId, user.tenantId);

      // Map packages to include remaining_count from usage_details
      const packagesWithCount = packages.map((pkg: any) => {
        // Calculate total remaining count and build service-specific map
        let totalRemaining = 0;
        const serviceRemainingMap: Record<number, number> = {};

        pkg.usage_details?.forEach((detail: any) => {
          const serviceId = detail.service_id;
          const remaining = detail.remaining || 0;

          if (serviceId && remaining > 0) {
            serviceRemainingMap[serviceId] = remaining;
            totalRemaining += remaining;
          }
        });

        return {
          ...pkg,
          remaining_count: totalRemaining, // Total remaining
          service_remaining_map: serviceRemainingMap, // Map of service_id -> remaining
        };
      });

      // Filter active packages with remaining count
      const activePackages = packagesWithCount.filter((pkg: any) => {
        return pkg.status === 'ACTIVE' && pkg.remaining_count > 0;
      });

      setCustomerPackages(activePackages);

      // 单服务场景：自动选择唯一可用套餐
      if (serviceId && !services) {
        const suitablePackages = activePackages.filter((pkg: any) => {
          return pkg.service_remaining_map[serviceId] > 0;
        });
        if (suitablePackages.length === 1) {
          setSelectedPackageId(suitablePackages[0].id);
          setPaymentMethod('PACKAGE');
        }
      }
    } catch (err) {
      console.error('Failed to load customer packages:', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  // 加载税率配置（GST + PST）
  const loadTaxRate = async () => {
    if (!user?.tenantId) {
      console.log('No tenantId, cannot load tax rate');
      return;
    }

    try {
      console.log('Loading tax rate for tenant:', user.tenantId);

      // 获取GST和PST税率
      const [gstConfig, pstConfig] = await Promise.all([
        merchantConfigApi.getConfigByKey(user.tenantId, 'gst_rate'),
        merchantConfigApi.getConfigByKey(user.tenantId, 'pst_rate'),
      ]);

      console.log('GST Config:', gstConfig);
      console.log('PST Config:', pstConfig);

      let gstRate = 0.05; // 默认GST 5%
      let pstRate = 0.07; // 默认PST 7%

      // MerchantConfigMapper将setting_value别名为configValue
      if (gstConfig && gstConfig.configValue) {
        let rate = parseFloat(gstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          // 如果值大于1，认为是百分比形式（如13表示13%），需要除以100
          if (rate > 1) {
            rate = rate / 100;
          }
          // 确保税率不超过100%
          if (rate <= 1) {
            gstRate = rate;
            console.log('Using GST rate from config:', gstRate);
          }
        }
      } else {
        console.log('Using default GST rate:', gstRate);
      }

      if (pstConfig && pstConfig.configValue) {
        let rate = parseFloat(pstConfig.configValue);
        if (!isNaN(rate) && rate >= 0) {
          // 如果值大于1，认为是百分比形式（如7表示7%），需要除以100
          if (rate > 1) {
            rate = rate / 100;
          }
          // 确保税率不超过100%
          if (rate <= 1) {
            pstRate = rate;
            console.log('Using PST rate from config:', pstRate);
          }
        }
      } else {
        console.log('Using default PST rate:', pstRate);
      }

      // 总税率 = GST + PST
      const totalRate = gstRate + pstRate;
      console.log('Total tax rate:', totalRate);
      setTaxRate(totalRate);
    } catch (err) {
      console.error('Failed to load tax rate config:', err);
      // 使用默认值0.12 (5% GST + 7% PST)
      setTaxRate(0.12);
    }
  };

  // 计算金额
  const calculateAmounts = () => {
    let subtotal = amount; // 默认使用原始金额

    // 多服务场景：只计算非套餐支付的服务金额
    if (services && services.length > 1) {
      // 检查是否所有服务都有支付方式
      const allServicesHavePaymentMethod = services.every(service =>
        servicePaymentMethods[service.id] !== undefined
      );

      if (allServicesHavePaymentMethod) {
        subtotal = services.reduce((total, service) => {
          const payMethod = servicePaymentMethods[service.id];
          // 如果是套餐支付，金额为0；否则累加服务价格
          if (payMethod === 'PACKAGE') {
            return total;
          }
          return total + service.price;
        }, 0);
      }
    } else if (paymentMethod === 'PACKAGE') {
      // 单服务场景：如果选择套餐支付，金额为0
      subtotal = 0;
    }

    const taxAmount = subtotal * taxRate; // 税额

    // 计算小费金额
    let tipAmount = 0;
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      tipAmount = parseFloat(customTipAmount);
    } else if (tipPercentage > 0) {
      tipAmount = subtotal * (tipPercentage / 100);
    }

    const totalAmount = subtotal + taxAmount + tipAmount; // 总金额 = 小计 + 税额 + 小费

    return {
      subtotal,
      taxAmount,
      tipAmount,
      totalAmount,
    };
  };

  const amounts = calculateAmounts();

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!user?.tenantId || !customerId) return;

    setSendingCode(true);
    setVerificationError(null);
    setError(null); // 清除主错误提示

    try {
      // 获取客户信息以获取手机号
      const customer = await customerApi.getCustomerById(customerId.toString());

      if (!customer.phone) {
        setVerificationError(t('verification.noPhoneNumber'));
        return;
      }

      // 确定要发送的packageId和packageName
      // 多服务场景：收集所有选择了套餐支付的服务的packageId
      // 单服务场景：使用selectedPackageId
      let packageIdToSend;
      let packageNameToSend;
      let serviceNameToSend;

      if (services && services.length > 1) {
        // 多服务场景：将所有套餐ID作为数组发送
        const packageIds = services
          .filter(service => servicePaymentMethods[service.id] === 'PACKAGE')
          .map(service => servicePackageIds[service.id])
          .filter(id => id); // 过滤掉未选择的
        packageIdToSend = packageIds.length > 0 ? packageIds : null;

        // 获取所有套餐名称和对应服务，格式: "套餐1(服务1), 套餐2(服务2)"
        const packageServicePairs = services
          .filter(service => servicePaymentMethods[service.id] === 'PACKAGE')
          .map(service => {
            const pkgId = servicePackageIds[service.id];
            const pkg = customerPackages.find(p => p.id === pkgId);
            return pkg ? `${pkg.package_name} (${service.name})` : null;
          })
          .filter(pair => pair)
          .join(', ');

        packageNameToSend = packageServicePairs || 'Multiple Packages';
        serviceNameToSend = services
          .filter(service => servicePaymentMethods[service.id] === 'PACKAGE')
          .map(s => s.name)
          .join(', ');
      } else {
        // 单服务场景
        packageIdToSend = selectedPackageId;
        const selectedPkg = customerPackages.find(p => p.id === selectedPackageId);
        packageNameToSend = selectedPkg?.package_name || 'Package';
        serviceNameToSend = serviceName;
      }

      const response = await verificationApi.sendCode({
        tenantId: user.tenantId,
        businessType: 'PACKAGE_PAYMENT',
        businessId: appointmentId.toString(),
        recipientType: 'PHONE',
        recipient: customer.phone,
        metadata: JSON.stringify({
          customerId,
          appointmentId,
          packageId: packageIdToSend,
          servicePackageIds: services && services.length > 1 ? servicePackageIds : undefined,
          merchantName: user.tenantName || user.username || 'Merchant',
          packageName: packageNameToSend,
        }),
      });

      if (response.success) {
        setVerificationId(response.verificationId);
        setVerificationSent(true);
        setCountdown(60); // 60秒倒计时
        setVerificationError(null);
      } else {
        setVerificationError(response.message);
      }
    } catch (err: any) {
      console.error('Failed to send verification code:', err);
      setVerificationError(err.message || t('verification.sendFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  // 验证验证码
  const verifyAndProceed = async (): Promise<boolean> => {
    if (!verificationId || !verificationCode) {
      setVerificationError(t('verification.pleaseEnterCode'));
      return false;
    }

    try {
      const response = await verificationApi.verifyCode({
        verificationId,
        code: verificationCode,
      });

      if (response.success) {
        setVerificationError(null);
        return true;
      } else {
        setVerificationError(response.message);
        return false;
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
      setVerificationError(err.message || t('verification.verifyFailed'));
      return false;
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // 多服务场景
      if (services && services.length > 1) {
        const servicePayments: ServicePayment[] = [];

        // 检查是否有服务需要套餐支付和验证码
        const hasPackagePayment = services.some(
          service => servicePaymentMethods[service.id] === 'PACKAGE'
        );

        // 如果有套餐支付，统一验证一次验证码（避免重复验证）
        if (hasPackagePayment) {
          if (!verificationSent) {
            setError(t('payment.pleaseVerify'));
            setLoading(false);
            return;
          }

          // 只验证一次验证码
          const verified = await verifyAndProceed();
          if (!verified) {
            setLoading(false);
            return;
          }
        }

        // 为每个服务构建支付信息
        for (const service of services) {
          const payMethod = servicePaymentMethods[service.id];

          if (!payMethod) {
            setError(t('payment.pleaseSelectPaymentMethod', `请为服务 "${service.name}" 选择支付方式`));
            setLoading(false);
            return;
          }

          // 如果是套餐支付，检查是否选择了套餐
          if (payMethod === 'PACKAGE') {
            const packageId = servicePackageIds[service.id];

            if (!packageId) {
              setError(t('payment.pleaseSelectPackageForService', `请为服务 "${service.name}" 选择套餐`));
              setLoading(false);
              return;
            }

            servicePayments.push({
              serviceId: service.id,
              paymentMethod: payMethod,
              customerPackageId: packageId,
              verificationCodeId: verificationId || undefined,
            });
          } else {
            // 其他支付方式
            servicePayments.push({
              serviceId: service.id,
              paymentMethod: payMethod,
            });
          }
        }

        // 确定整体支付方式
        // 如果所有服务都使用同一种支付方式，使用该方式；否则使用 MIXED
        const uniquePaymentMethods = new Set(servicePayments.map(sp => sp.paymentMethod));

        let overallPaymentMethod = 'MIXED';
        if (uniquePaymentMethods.size === 1) {
          // 所有服务使用同一种支付方式
          overallPaymentMethod = servicePayments[0].paymentMethod;
        }

        // 调用回调，传递多服务支付信息和税率小费信息
        await onSuccess(overallPaymentMethod, undefined, undefined, servicePayments, {
          taxRate,
          taxAmount: amounts.taxAmount,
          tipAmount: amounts.tipAmount,
          tipPercentage,
          subtotal: amounts.subtotal,
          totalAmount: amounts.totalAmount,
        });
      } else {
        // 单服务场景 - 保持原有逻辑
        let packageIdToUse = selectedPackageId;

        if (paymentMethod === 'PACKAGE') {
          // If only one package available, use it even if selectedPackageId is not set yet
          if (customerPackages.length === 1) {
            packageIdToUse = customerPackages[0].id;
          } else if (!selectedPackageId) {
            // Multiple packages but none selected
            setError(t('payment.pleaseSelectPackage'));
            setLoading(false);
            return;
          }

          // 套餐支付需要验证码
          if (!verificationSent) {
            setError(t('payment.pleaseVerify'));
            setLoading(false);
            return;
          }

          // 验证验证码
          const verified = await verifyAndProceed();
          if (!verified) {
            setLoading(false);
            return;
          }
        }

        await onSuccess(
          paymentMethod,
          paymentMethod === 'PACKAGE' ? packageIdToUse || undefined : undefined,
          verificationId || undefined,
          undefined,
          {
            taxRate,
            taxAmount: amounts.taxAmount,
            tipAmount: amounts.tipAmount,
            tipPercentage,
            subtotal: amounts.subtotal,
            totalAmount: amounts.totalAmount,
          }
        );
      }

      handleClose();
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || t('payment.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentMethod('CREDIT_CARD');
    setSelectedPackageId(null);
    setServicePaymentMethods({});
    setServicePackageIds({});
    setError(null);
    setVerificationId(null);
    setVerificationCode('');
    setVerificationSent(false);
    setVerificationError(null);
    setCountdown(0);
    setTipPercentage(0);
    setCustomTipAmount('');
    setShowCustomTip(false);
    onClose();
  };

  const paymentMethods = React.useMemo(() => {
    // 计算可用套餐数量
    const getAvailablePackageCount = () => {
      if (loadingPackages || customerPackages.length === 0) {
        return 0;
      }

      // 多服务场景：计算至少有一个服务可用的套餐数
      if (services && services.length > 1) {
        return customerPackages.filter(pkg => {
          // 检查这个套餐是否至少对一个服务有剩余次数
          return services.some(service =>
            ((pkg as any).service_remaining_map?.[service.id] || 0) > 0
          );
        }).length;
      }

      // 单服务场景：如果有 serviceId，统计该服务可用的套餐数
      if (serviceId) {
        return customerPackages.filter(
          pkg => ((pkg as any).service_remaining_map?.[serviceId] || 0) > 0
        ).length;
      }

      // 默认：返回总套餐数
      return customerPackages.length;
    };

    // 在多服务场景下，计算每个服务可用的套餐数量
    const getPackageDescription = () => {
      if (loadingPackages) {
        return t('payment.loadingPackages');
      }

      const availableCount = getAvailablePackageCount();

      if (availableCount === 0) {
        return t('payment.noPackagesAvailable');
      }

      return t('payment.packageDescription', { count: availableCount });
    };

    const availablePackageCount = getAvailablePackageCount();

    return [
      {
        value: 'CREDIT_CARD',
        label: t('payment.creditCard'),
        icon: CreditCardIcon,
        description: t('payment.creditCardDescription'),
      },
      {
        value: 'DEBIT_CARD',
        label: t('payment.debitCard'),
        icon: DebitCardIcon,
        description: t('payment.debitCardDescription'),
      },
      {
        value: 'CASH',
        label: t('payment.cash'),
        icon: CashIcon,
        description: t('payment.cashDescription'),
      },
      {
        value: 'PACKAGE',
        label: t('payment.package'),
        icon: PackageIcon,
        description: getPackageDescription(),
        disabled: loadingPackages || availablePackageCount === 0,
      },
    ];
  }, [t, customerPackages, loadingPackages, services, serviceId]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: 9999,
      }}
      container={container}
      disablePortal={!!container}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25), 0 8px 32px -8px rgba(0,0,0,0.15)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            position: container ? 'absolute' : 'fixed',
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 4,
          pt: 4,
          pb: 3,
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          borderBottom: '1px solid #e6eaee',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#0a0f1a',
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              {t('payment.completePayment')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
              {serviceName}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: '#64748b',
              bgcolor: '#f1f5f9',
              '&:hover': {
                bgcolor: '#e2e8f0',
                color: '#475569',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Amount Card */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px solid #e6eaee',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {/* Service Info */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: '#0a0f1a',
                fontSize: '0.9375rem',
              }}
            >
              {serviceName}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: '#0a0f1a',
                fontSize: '0.9375rem',
              }}
            >
              {CurrencyUtils.formatAmount(amounts.subtotal)}
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Tax */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              {t('payment.tax', 'Tax')} ({(taxRate * 100).toFixed(1)}%)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.875rem',
              }}
            >
              {CurrencyUtils.formatAmount(amounts.taxAmount)}
            </Typography>
          </Box>

          {/* Tip */}
          {amounts.tipAmount > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                }}
              >
                {t('payment.tip', 'Tip')}
                {tipPercentage > 0 && ` (${tipPercentage}%)`}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                }}
              >
                {CurrencyUtils.formatAmount(amounts.tipAmount)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Total */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: '#0a0f1a',
                fontSize: '1.125rem',
              }}
            >
              {t('payment.total')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#10b981',
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              {CurrencyUtils.formatAmount(amounts.totalAmount)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 小费选择 - 紧凑设计 */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#0a0f1a',
                mb: 1.5,
                fontSize: '0.875rem',
              }}
            >
              {t('payment.addTip', 'Add Tip (Optional)')}
            </Typography>

            {/* 快捷选项按钮 */}
            <Stack direction="row" spacing={1} mb={showCustomTip ? 1.5 : 0}>
              {[0, 10, 15, 20, 'custom'].map((option) => {
                const isCustom = option === 'custom';
                const isSelected = isCustom
                  ? showCustomTip
                  : (tipPercentage === option && !customTipAmount);

                return (
                  <Button
                    key={option}
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={() => {
                      if (isCustom) {
                        setShowCustomTip(!showCustomTip);
                        if (!showCustomTip) {
                          setTipPercentage(0);
                          setCustomTipAmount('');
                        }
                      } else {
                        setTipPercentage(option as number);
                        setCustomTipAmount('');
                        setShowCustomTip(false);
                      }
                    }}
                    sx={{
                      flex: 1,
                      borderRadius: 1.5,
                      py: 1,
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      minWidth: 0,
                      borderColor: isSelected ? '#7BC68C' : '#e6eaee',
                      bgcolor: isSelected ? '#7BC68C' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#0a0f1a',
                      '&:hover': {
                        borderColor: '#7BC68C',
                        bgcolor: isSelected ? '#5EAA6F' : alpha('#A8D5BA', 0.15),
                      },
                    }}
                  >
                    {isCustom
                      ? t('payment.custom', 'Custom')
                      : (option === 0
                          ? t('payment.noTip', 'No Tip')
                          : `${option}%`
                        )
                    }
                  </Button>
                );
              })}
            </Stack>

            {/* 自定义小费金额输入框 - 仅在点击Custom时显示 */}
            {showCustomTip && (
              <TextField
                fullWidth
                size="small"
                placeholder="0.00"
                value={customTipAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setCustomTipAmount(value);
                    setTipPercentage(0);
                  }
                }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5, color: '#64748b', fontSize: '0.875rem' }}>$</Typography>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '0.875rem',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7BC68C',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#7BC68C',
                    },
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 4, py: 4, overflow: 'auto', flex: 1 }}>
        {/* 单服务场景 - 显示原来的支付方式选择 */}
        {(!services || services.length <= 1) && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#0a0f1a',
                mb: 2.5,
                fontSize: '0.9375rem',
              }}
            >
              {t('payment.paymentMethod')}
            </Typography>

            <RadioGroup
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setError(null);
                setVerificationError(null);
              }}
            >
              <Stack spacing={1.5}>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.value;
                  const isDisabled = method.disabled || false;

                  return (
                    <Box
                      key={method.value}
                      onClick={() => {
                        if (!isDisabled) {
                          setPaymentMethod(method.value);
                          setError(null);
                          setVerificationError(null);
                        }
                      }}
                      sx={{
                        position: 'relative',
                        borderRadius: 2.5,
                        border: '2px solid',
                        borderColor: isSelected ? '#10b981' : '#e6eaee',
                        bgcolor: isSelected ? alpha('#10b981', 0.04) : '#ffffff',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': !isDisabled ? {
                          borderColor: isSelected ? '#10b981' : '#cbd5e1',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        } : {},
                      }}
                    >
                      <FormControlLabel
                        value={method.value}
                        control={
                          <Radio
                            sx={{
                              color: '#cbd5e1',
                              '&.Mui-checked': {
                                color: '#10b981',
                              },
                            }}
                          />
                        }
                        disabled={isDisabled}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              py: 1.5,
                              pr: 2,
                              width: '100%',
                            }}
                          >
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 2,
                                bgcolor: isSelected ? alpha('#10b981', 0.12) : '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Icon
                                sx={{
                                  fontSize: 22,
                                  color: isSelected ? '#10b981' : '#64748b',
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: '#0a0f1a',
                                  fontSize: '0.9375rem',
                                }}
                              >
                                {method.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#64748b',
                                  fontSize: '0.8125rem',
                                  display: 'block',
                                  mt: 0.25,
                                }}
                              >
                                {method.description}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{
                          m: 0,
                          width: '100%',
                          '& .MuiFormControlLabel-label': {
                            width: '100%',
                          },
                        }}
                      />
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                          }}
                        >
                          <CheckCircleIcon
                            sx={{
                              fontSize: 20,
                              color: '#10b981',
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </RadioGroup>
          </Box>
        )}

        {/* 多服务场景 - 为每个服务选择支付方式 */}
        {services && services.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#0a0f1a',
                mb: 2.5,
                fontSize: '0.9375rem',
              }}
            >
              {t('payment.selectPaymentForEachService', '为每个服务选择支付方式')}
            </Typography>

            <Stack spacing={3}>
              {services.map((service, serviceIndex) => (
                <Box
                  key={service.id}
                  sx={{
                    p: 3,
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e6eaee',
                  }}
                >
                  {/* 服务信息 */}
                  <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0a0f1a' }}>
                      {service.name}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#10b981' }}>
                      ${service.price}
                    </Typography>
                  </Box>

                  {/* 支付方式选择 */}
                  <RadioGroup
                    value={servicePaymentMethods[service.id] || 'CREDIT_CARD'}
                    onChange={(e) => {
                      setServicePaymentMethods({
                        ...servicePaymentMethods,
                        [service.id]: e.target.value
                      });
                      setError(null);
                    }}
                  >
                    <Stack spacing={1.5}>
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = servicePaymentMethods[service.id] === method.value;
                        let isDisabled = method.disabled || false;
                        let description = method.description;

                        // 为 PACKAGE 方式计算该服务特定的可用套餐数
                        if (method.value === 'PACKAGE' && !loadingPackages) {
                          const availableForThisService = customerPackages.filter(
                            pkg => ((pkg as any).service_remaining_map?.[service.id] || 0) > 0
                          ).length;

                          if (availableForThisService === 0) {
                            isDisabled = true;
                            description = t('payment.noPackagesAvailable');
                          } else {
                            description = t('payment.packageDescription', { count: availableForThisService });
                          }
                        }

                        return (
                          <Box
                            key={method.value}
                            onClick={() => {
                              if (!isDisabled) {
                                setServicePaymentMethods({
                                  ...servicePaymentMethods,
                                  [service.id]: method.value
                                });
                                setError(null);
                              }
                            }}
                            sx={{
                              position: 'relative',
                              borderRadius: 2,
                              border: '1.5px solid',
                              borderColor: isSelected ? '#10b981' : '#e6eaee',
                              bgcolor: isSelected ? alpha('#10b981', 0.04) : '#ffffff',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.5 : 1,
                              transition: 'all 0.2s',
                              '&:hover': !isDisabled ? {
                                borderColor: isSelected ? '#10b981' : '#cbd5e1',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              } : {},
                            }}
                          >
                            <FormControlLabel
                              value={method.value}
                              control={
                                <Radio
                                  sx={{
                                    color: '#cbd5e1',
                                    '&.Mui-checked': { color: '#10b981' },
                                  }}
                                />
                              }
                              disabled={isDisabled}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5, pr: 1, width: '100%' }}>
                                  <Box
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 1.5,
                                      bgcolor: isSelected ? alpha('#10b981', 0.12) : '#f8fafc',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon sx={{ fontSize: 18, color: isSelected ? '#10b981' : '#64748b' }} />
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a0f1a', fontSize: '0.875rem' }}>
                                      {method.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                      {description}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                              sx={{
                                m: 0,
                                width: '100%',
                                '& .MuiFormControlLabel-label': { width: '100%' },
                              }}
                            />
                            {isSelected && (
                              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </RadioGroup>

                  {/* 如果选择了 PACKAGE，显示套餐选择 */}
                  {servicePaymentMethods[service.id] === 'PACKAGE' && customerPackages.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: '#475569',
                          display: 'block',
                          mb: 0.75,
                          fontSize: '0.75rem',
                        }}
                      >
                        Select Package
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={servicePackageIds[service.id] || ''}
                          onChange={(e) => {
                            setServicePackageIds({
                              ...servicePackageIds,
                              [service.id]: Number(e.target.value)
                            });
                            setError(null);
                          }}
                          displayEmpty
                          MenuProps={{
                            disablePortal: !!container,
                            container: container,
                            sx: {
                              zIndex: 10000,
                              '& .MuiPaper-root': {
                                borderRadius: 2,
                                mt: 0.5,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                              }
                            }
                          }}
                          sx={{
                            height: 40,
                            borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                            fontSize: '0.875rem',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#e2e8f0',
                              borderWidth: '1px',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#cbd5e1',
                            },
                            '&.Mui-focused': {
                              bgcolor: '#ffffff',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981',
                              borderWidth: '1.5px',
                            },
                            '& .MuiSelect-select': {
                              py: 1.25,
                            }
                          }}
                        >
                          <MenuItem value="" disabled>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                              Choose a package...
                            </Typography>
                          </MenuItem>
                          {customerPackages
                            .filter(pkg => {
                              // 检查此套餐是否包含当前服务且有剩余次数
                              const serviceRemaining = (pkg as any).service_remaining_map?.[service.id] || 0;
                              return serviceRemaining > 0;
                            })
                            .map((pkg) => {
                              const serviceRemaining = (pkg as any).service_remaining_map?.[service.id] || 0;
                              return (
                                <MenuItem
                                  key={pkg.id}
                                  value={pkg.id}
                                  sx={{
                                    py: 1.25,
                                    px: 2,
                                    '&:hover': {
                                      bgcolor: alpha('#10b981', 0.04),
                                    },
                                    '&.Mui-selected': {
                                      bgcolor: alpha('#10b981', 0.08),
                                      '&:hover': {
                                        bgcolor: alpha('#10b981', 0.12),
                                      }
                                    }
                                  }}
                                >
                                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                    <Typography sx={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                                      {pkg.package_name}
                                    </Typography>
                                    <Chip
                                      label={`${serviceRemaining} ${t('remaining')}`}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        backgroundColor: '#dcfce7',
                                        color: '#15803d',
                                        fontWeight: 600,
                                        fontSize: '0.6875rem',
                                        borderRadius: 1.5,
                                        '& .MuiChip-label': { px: 1.25, py: 0 }
                                      }}
                                    />
                                  </Box>
                                </MenuItem>
                              );
                            })}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* 多服务场景 - 验证码输入区域 */}
        {services && services.length > 1 && (() => {
          // 检查是否有服务选择了套餐支付
          const hasPackagePayment = services.some(
            service => servicePaymentMethods[service.id] === 'PACKAGE' && servicePackageIds[service.id]
          );

          if (!hasPackagePayment) return null;

          return (
            <Box
              ref={multiServiceVerificationRef}
              sx={{
                mt: 3,
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: '#ffffff',
                border: '1px solid',
                borderColor: verificationSent && !verificationError ? alpha('#10b981', 0.3) : '#e6eaee',
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: alpha('#10b981', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SmsIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#0a0f1a',
                        lineHeight: 1.2,
                      }}
                    >
                      SMS Verification
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        color: '#64748b',
                        mt: 0.25,
                      }}
                    >
                      {verificationSent ? 'Enter 6-digit code' : 'Click to receive code'}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  onClick={handleSendVerificationCode}
                  disabled={sendingCode || countdown > 0 || loading}
                  variant="contained"
                  size="small"
                  sx={{
                    minWidth: 85,
                    height: 32,
                    px: 1.5,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    borderRadius: 1.5,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    bgcolor: '#10b981',
                    color: '#ffffff',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#059669',
                      boxShadow: 'none',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#e2e8f0',
                      color: '#94a3b8',
                    },
                  }}
                >
                  {sendingCode ? (
                    <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                  ) : countdown > 0 ? (
                    `Resend (${countdown}s)`
                  ) : verificationSent ? (
                    'Resend'
                  ) : (
                    'Send Code'
                  )}
                </Button>
              </Box>

              {/* 6位验证码输入框 */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'center',
                  mb: verificationError ? 1.5 : 0,
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextField
                    key={index}
                    id={`multi-service-verification-code-${index}`}
                    value={verificationCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 1) {
                        const newCode = verificationCode.split('');
                        newCode[index] = value;
                        const finalCode = newCode.join('').slice(0, 6);
                        setVerificationCode(finalCode);
                        setVerificationError(null);

                        // 自动聚焦到下一个输入框
                        if (value && index < 5) {
                          const nextInput = document.getElementById(`multi-service-verification-code-${index + 1}`);
                          nextInput?.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // 按退格键时回到上一个输入框
                      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                        const prevInput = document.getElementById(`multi-service-verification-code-${index - 1}`);
                        prevInput?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(pastedData);
                      setVerificationError(null);
                      // 聚焦到最后一个有值的输入框
                      const lastIndex = Math.min(pastedData.length, 5);
                      const lastInput = document.getElementById(`multi-service-verification-code-${lastIndex}`);
                      lastInput?.focus();
                    }}
                    disabled={!verificationSent || loading}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        padding: 0,
                      },
                    }}
                    sx={{
                      width: 42,
                      '& .MuiOutlinedInput-root': {
                        height: 48,
                        borderRadius: 1.5,
                        bgcolor: verificationCode[index] ? alpha('#10b981', 0.04) : '#f8fafc',
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: verificationError ? '#ef4444' : verificationCode[index] ? '#10b981' : '#e2e8f0',
                          borderWidth: '1.5px',
                        },
                        '&:hover fieldset': {
                          borderColor: verificationError ? '#ef4444' : verificationCode[index] ? '#10b981' : '#cbd5e1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: verificationError ? '#ef4444' : '#10b981',
                          borderWidth: '2px',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#f8fafc',
                          '& fieldset': {
                            borderColor: '#e6eaee',
                          },
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              {/* 成功提示 */}
              {verificationSent && !verificationError && verificationCode.length < 6 && (
                <Box
                  sx={{
                    mt: 2,
                    px: 2,
                    py: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha('#10b981', 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      color: '#059669',
                      fontWeight: 500,
                    }}
                  >
                    {t('payment.codeSent')}
                  </Typography>
                </Box>
              )}

              {/* 错误提示 */}
              {verificationError && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontSize: '0.8125rem',
                    },
                  }}
                >
                  {verificationError}
                </Alert>
              )}
            </Box>
          );
        })()}

        {/* Package Selection - 仅在单服务场景显示 */}
        {paymentMethod === 'PACKAGE' && customerPackages.length > 0 && (!services || services.length <= 1) && (
          <Box
            ref={packageSelectionRef}
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 2.5,
              bgcolor: '#fafbfc',
              border: '1px solid #e6eaee',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: '#0a0f1a',
                mb: 2,
                fontSize: '0.9375rem',
              }}
            >
              {customerPackages.length === 1
                ? t('payment.selectedPackage')
                : t('payment.selectPackage')}
            </Typography>
            {loadingPackages ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} sx={{ color: '#10b981' }} />
              </Box>
            ) : (() => {
              // Filter packages based on serviceId availability
              const availablePackages = customerPackages.filter((pkg) => {
                if (serviceId) {
                  const remaining = (pkg as any).service_remaining_map?.[serviceId] || 0;
                  return remaining > 0;
                }
                return pkg.remaining_count > 0;
              });

              return availablePackages.length === 1 ? (
                // Single package - show as selected card
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
                    <Typography sx={{ fontWeight: 600, color: '#0a0f1a', fontSize: '0.9375rem' }}>
                      {availablePackages[0].package_name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${serviceId ? ((availablePackages[0] as any).service_remaining_map?.[serviceId] || 0) : availablePackages[0].remaining_count} ${t('common.remaining')}`}
                    size="small"
                    sx={{
                      height: 24,
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>
              ) : (
                // Multiple packages - show dropdown
                <FormControl fullWidth>
                  <Select
                    value={selectedPackageId || ''}
                    onChange={(e) => {
                      setSelectedPackageId(Number(e.target.value));
                      setError(null); // 选择套餐时清除错误
                      setVerificationError(null); // 选择套餐时清除验证码错误
                    }}
                    displayEmpty
                    MenuProps={{
                      disablePortal: !!container,
                      container: container,
                      sx: {
                        zIndex: 10000,
                        '& .MuiPaper-root': {
                          borderRadius: 2,
                          mt: 0.5,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        }
                      }
                    }}
                    sx={{
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: '#f8fafc',
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                        borderWidth: '1px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused': {
                        bgcolor: '#ffffff',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10b981',
                        borderWidth: '1.5px',
                      },
                      '& .MuiSelect-select': {
                        py: 1.25,
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {t('payment.choosePackage')}
                      </Typography>
                    </MenuItem>
                    {customerPackages
                      .filter((pkg) => {
                        // 如果有 serviceId，只显示该服务有剩余次数的套餐
                        if (serviceId) {
                          const remaining = (pkg as any).service_remaining_map?.[serviceId] || 0;
                          return remaining > 0;
                        }
                        // 否则显示所有有剩余次数的套餐
                        return pkg.remaining_count > 0;
                      })
                      .map((pkg) => {
                        const remaining = serviceId
                          ? ((pkg as any).service_remaining_map?.[serviceId] || 0)
                          : pkg.remaining_count;

                        return (
                          <MenuItem
                            key={pkg.id}
                            value={pkg.id}
                            sx={{
                              py: 1.25,
                              px: 2,
                              '&:hover': {
                                bgcolor: alpha('#10b981', 0.04),
                              },
                              '&.Mui-selected': {
                                bgcolor: alpha('#10b981', 0.08),
                                '&:hover': {
                                  bgcolor: alpha('#10b981', 0.12),
                                }
                              }
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              width="100%"
                            >
                              <Typography sx={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                                {pkg.package_name}
                              </Typography>
                              <Chip
                                label={`${remaining} ${t('common.remaining')}`}
                                size="small"
                                sx={{
                                  height: 22,
                                  backgroundColor: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 600,
                                  fontSize: '0.6875rem',
                                  borderRadius: 1.5,
                                  '& .MuiChip-label': { px: 1.25, py: 0 }
                                }}
                              />
                            </Box>
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>
              );
            })()}
          </Box>
        )}

        {/* 验证码输入区域 - 仅在单服务 + PACKAGE 场景显示 */}
        {paymentMethod === 'PACKAGE' && (!services || services.length <= 1) && (selectedPackageId || customerPackages.length === 1) && (
          <Box
            ref={verificationSectionRef}
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: '#ffffff',
              border: '1px solid',
              borderColor: verificationSent && !verificationError ? alpha('#10b981', 0.3) : '#e6eaee',
              transition: 'all 0.3s ease',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha('#10b981', 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SmsIcon sx={{ fontSize: 18, color: '#10b981' }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#0a0f1a',
                      lineHeight: 1.2,
                    }}
                  >
                    SMS Verification
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.6875rem',
                      color: '#64748b',
                      mt: 0.25,
                    }}
                  >
                    {verificationSent ? 'Enter 6-digit code' : 'Click to receive code'}
                  </Typography>
                </Box>
              </Box>

              <Button
                onClick={handleSendVerificationCode}
                disabled={sendingCode || countdown > 0 || loading}
                variant="contained"
                size="small"
                sx={{
                  minWidth: 85,
                  height: 32,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  bgcolor: '#10b981',
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#059669',
                    boxShadow: 'none',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e2e8f0',
                    color: '#94a3b8',
                  },
                }}
              >
                {sendingCode ? (
                  <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                ) : countdown > 0 ? (
                  `Resend (${countdown}s)`
                ) : verificationSent ? (
                  'Resend'
                ) : (
                  'Send Code'
                )}
              </Button>
            </Box>

            {/* 6位验证码输入框 */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: 'center',
                mb: verificationError ? 2 : 0,
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextField
                  key={index}
                  id={`verification-code-${index}`}
                  value={verificationCode[index] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 1) {
                      const newCode = verificationCode.split('');
                      newCode[index] = value;
                      const finalCode = newCode.join('').slice(0, 6);
                      setVerificationCode(finalCode);
                      setVerificationError(null);

                      // 自动聚焦到下一个输入框
                      if (value && index < 5) {
                        const nextInput = document.getElementById(`verification-code-${index + 1}`);
                        nextInput?.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // 按退格键时回到上一个输入框
                    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                      const prevInput = document.getElementById(`verification-code-${index - 1}`);
                      prevInput?.focus();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(pastedData);
                    setVerificationError(null);
                    // 聚焦到最后一个有值的输入框
                    const lastIndex = Math.min(pastedData.length, 5);
                    const lastInput = document.getElementById(`verification-code-${lastIndex}`);
                    lastInput?.focus();
                  }}
                  disabled={!verificationSent || loading}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      padding: 0,
                    },
                  }}
                  sx={{
                    width: 42,
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      borderRadius: 1.5,
                      bgcolor: verificationCode[index] ? alpha('#10b981', 0.04) : '#f8fafc',
                      transition: 'all 0.2s ease',
                      '& fieldset': {
                        borderColor: verificationError ? '#ef4444' : verificationCode[index] ? '#10b981' : '#e2e8f0',
                        borderWidth: verificationCode[index] ? '1.5px' : '1px',
                      },
                      '&:hover fieldset': {
                        borderColor: verificationError ? '#ef4444' : verificationCode[index] ? '#10b981' : '#cbd5e1',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: verificationError ? '#ef4444' : '#10b981',
                        borderWidth: '1.5px',
                      },
                      '&.Mui-disabled': {
                        bgcolor: '#f8fafc',
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                      },
                    },
                  }}
                />
              ))}
            </Box>

            {/* 成功提示 */}
            {verificationSent && !verificationError && verificationCode.length < 6 && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha('#10b981', 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    color: '#059669',
                    fontWeight: 500,
                  }}
                >
                  {t('payment.codeSent')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: '#e6eaee' }} />

      {/* Actions */}
      <Box
        sx={{
          px: 4,
          py: 3,
          bgcolor: '#fafbfc',
          flexShrink: 0,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        {/* 错误提示 - 放在按钮上方 */}
        {(error || verificationError) && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#fee2e2',
              bgcolor: '#fef2f2',
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
              '& .MuiAlert-icon': {
                color: '#ef4444',
              },
            }}
          >
            {error || verificationError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              flex: 1,
              height: 44,
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 1.5,
              borderWidth: '1px',
              borderColor: '#e2e8f0',
              color: '#64748b',
              textTransform: 'none',
              bgcolor: '#ffffff',
              boxShadow: 'none',
              '&:hover': {
                borderWidth: '1px',
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                borderColor: '#e2e8f0',
                color: '#cbd5e1',
              },
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={
              loading ||
              // 单服务场景：如果选择了PACKAGE且有多个套餐可选，必须选择一个
              ((!services || services.length <= 1) && paymentMethod === 'PACKAGE' && customerPackages.length > 1 && !selectedPackageId)
            }
            sx={{
              flex: 1,
              height: 44,
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 1.5,
              bgcolor: '#10b981',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#059669',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                bgcolor: '#e2e8f0',
                color: '#94a3b8',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={18} color="inherit" sx={{ mr: 0.5 }} />
            ) : (
              t('payment.confirmPayment')
            )}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PaymentDialog;
export type { ServicePayment };
