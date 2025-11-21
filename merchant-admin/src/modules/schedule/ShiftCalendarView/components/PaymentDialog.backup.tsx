import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
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
  Check as CheckIcon,
  Edit as EditIcon,
  CardGiftcard as GiftCardIcon,
  // Membership tier icons
  Star as StarIcon,
  StarHalf as StarHalfIcon,
  StarRate as StarRateIcon,
  Grade as GradeIcon,
  Stars as StarsIcon,
  EmojiEvents as TrophyIcon,
  MilitaryTech as MedalIcon,
  CardGiftcard as GiftIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  CardMembership as MembershipIcon,
  TrendingUp as TrendingUpIcon,
  Loyalty as LoyaltyIcon,
  Redeem as RedeemIcon,
  Favorite as HeartIcon,
  AutoAwesome as SparkleIcon,
  Whatshot as FireIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../contexts/AuthContext';
import { usePermission } from '../../../../hooks/usePermission';
import { customerApi, verificationApi, merchantConfigApi } from '../../../../services/api';
import { CurrencyUtils } from '../../../../config/constants';
import { SCHEDULE_PERMISSIONS } from '../../../../config/permissions';

interface ServicePayment {
  serviceId: number;
  paymentMethod: string;
  customerPackageId?: number;
  verificationCodeId?: number;
  // 礼品卡支付相关字段
  giftCardAmount?: number;
  giftCardNumber?: string;
  // 混合支付：当礼品卡金额不足时使用的补充支付方式
  additionalPaymentMethod?: string;
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
    },
    // Notes信息
    notes?: string
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
  const { hasPermission } = usePermission();

  // 获取会员等级图标
  const getTierIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <StarIcon />;
      case 'starhalf': return <StarHalfIcon />;
      case 'starrate': return <StarRateIcon />;
      case 'grade': return <GradeIcon />;
      case 'stars': return <StarsIcon />;
      case 'trophy': return <TrophyIcon />;
      case 'medal': return <MedalIcon />;
      case 'gift': return <GiftIcon />;
      case 'diamond': return <DiamondIcon />;
      case 'premium': return <PremiumIcon />;
      case 'verified': return <VerifiedIcon />;
      case 'membership': return <MembershipIcon />;
      case 'trendingup': return <TrendingUpIcon />;
      case 'loyalty': return <LoyaltyIcon />;
      case 'redeem': return <RedeemIcon />;
      case 'heart': return <HeartIcon />;
      case 'sparkle': return <SparkleIcon />;
      case 'fire': return <FireIcon />;
      case 'celebration': return <CelebrationIcon />;
      default: return <StarIcon />;
    }
  };

  // 单服务场景的状态
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  // 多服务场景的状态：每个服务的支付方式和套餐选择
  const [servicePaymentMethods, setServicePaymentMethods] = useState<Record<number, string>>({});
  const [servicePackageIds, setServicePackageIds] = useState<Record<number, number>>({});
  // 多服务场景：每个服务的礼品卡金额和卡号
  const [serviceGiftCardAmounts, setServiceGiftCardAmounts] = useState<Record<number, string>>({});
  const [serviceGiftCardNumbers, setServiceGiftCardNumbers] = useState<Record<number, string>>({});
  // 多服务场景：每个服务的补充支付方式（当礼品卡金额不足时）
  const [serviceAdditionalPaymentMethods, setServiceAdditionalPaymentMethods] = useState<Record<number, string>>({});

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

  // 商户名称
  const [merchantName, setMerchantName] = useState<string>('');

  // 订单金额编辑相关状态
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editedTotalAmount, setEditedTotalAmount] = useState<string>('');
  const [originalTotalAmount, setOriginalTotalAmount] = useState<number>(0);
  const [amountModified, setAmountModified] = useState(false);

  // Notes相关状态
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // 礼品卡相关状态 - 简化版：只记录金额，礼品卡由POS系统管理
  const [giftCardAmount, setGiftCardAmount] = useState<string>('');
  const [giftCardNumber, setGiftCardNumber] = useState<string>(''); // 可选参考号

  // 混合支付相关状态
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [mixedPaymentMethods, setMixedPaymentMethods] = useState<{
    giftCard?: number;
    cash?: number;
    creditCard?: number;
    debitCard?: number;
  }>({});
  const [tipPaymentMethod, setTipPaymentMethod] = useState<string>(''); // 小费的支付方式

  // Refs for auto-scrolling
  const packageSelectionRef = useRef<HTMLDivElement>(null);
  const verificationSectionRef = useRef<HTMLDivElement>(null);
  const multiServiceVerificationRef = useRef<HTMLDivElement>(null);
  const giftCardSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && customerId && user?.tenantId) {
      loadCustomer();
      loadCustomerPackages();
      loadTaxRate();
      loadMerchantName();
      // 多服务场景：初始化每个服务的支付方式为默认值
      if (services && services.length > 1) {
        const initialMethods: Record<number, string> = {};
        services.forEach(service => {
          initialMethods[service.id] = 'CREDIT_CARD';
        });
        setServicePaymentMethods(initialMethods);
      }
      // 不在这里初始化originalTotalAmount，将在计算后的useEffect中设置
      // setOriginalTotalAmount(amount); // 移除这行，因为amount不包含税费
      setIsEditingAmount(false);
      setEditedTotalAmount('');
      setAmountModified(false);
      setPaymentNotes('');
    }
  }, [open, customerId, user?.tenantId, services, amount]);

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

  const loadCustomer = async () => {
    if (!customerId) return;

    try {
      const customerData = await customerApi.getCustomerById(customerId.toString());
      setCustomer(customerData);
    } catch (err) {
      console.error('Failed to load customer:', err);
    }
  };

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

  // 加载商户名称
  const loadMerchantName = async () => {
    if (!user?.tenantId) {
      return;
    }

    try {
      const merchantInfo = await merchantConfigApi.getMerchantBasicInfo(user.tenantId);
      if (merchantInfo && merchantInfo.merchantName) {
        setMerchantName(merchantInfo.merchantName);
      }
    } catch (err) {
      console.error('Failed to load merchant name:', err);
      // 失败时使用默认值
      setMerchantName('');
    }
  };

  // 计算金额
  const calculateAmounts = () => {
    let originalAmount = amount; // 原始金额
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
        originalAmount = subtotal; // 记录原始金额
      }
    } else if (paymentMethod === 'PACKAGE') {
      // 单服务场景：如果选择套餐支付，金额为0
      subtotal = 0;
      originalAmount = 0;
    }

    // 应用会员折扣
    // discountRate存储的是折后价格的百分比，例如90表示9折（支付原价的90%）
    let discountAmount = 0;
    let discountPercentage = 0;
    if (customer?.membershipTier?.discountRate && subtotal > 0) {
      const rate = parseFloat(customer.membershipTier.discountRate);
      // 计算折扣后的价格
      const discountedPrice = subtotal * (rate / 100);
      // 折扣金额 = 原价 - 折扣后价格
      discountAmount = subtotal - discountedPrice;
      // 显示的折扣百分比 = 100 - rate（例如：90 -> 显示10%折扣）
      discountPercentage = 100 - rate;
      // 折扣后的小计
      subtotal = discountedPrice;
    }

    // 只有当subtotal > 0时才计算税费（package支付时subtotal为0，不计税）
    const taxAmount = subtotal > 0 ? subtotal * taxRate : 0;

    // 计算小费金额（基于折扣后的价格计算）
    let tipAmount = 0;
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      tipAmount = parseFloat(customTipAmount);
    } else if (tipPercentage > 0) {
      tipAmount = subtotal * (tipPercentage / 100);
    }

    let totalAmount = subtotal + taxAmount + tipAmount; // 总金额 = 折扣后小计 + 税额 + 小费
    let adjustedSubtotal = subtotal;
    let adjustedTaxAmount = taxAmount;
    let adjustedTipAmount = tipAmount;

    // 如果用户编辑了总金额,反向计算各项金额
    if (amountModified && editedTotalAmount) {
      const parsedAmount = parseFloat(editedTotalAmount);
      if (!isNaN(parsedAmount) && parsedAmount >= 0) {
        totalAmount = parsedAmount;

        // 根据原始subtotal判断支付类型
        if (originalAmount === 0 || subtotal === 0) {
          // Package支付：编辑的金额全部算作小费
          adjustedSubtotal = 0;
          adjustedTaxAmount = 0;
          adjustedTipAmount = totalAmount;
        } else {
          // 正常支付：需要反向计算
          // 计算小费率（基于原始subtotal）
          const tipRate = tipAmount > 0 ? tipAmount / subtotal : 0;

          // 反向计算：totalAmount = subtotal * (1 + taxRate + tipRate)
          // 因此：subtotal = totalAmount / (1 + taxRate + tipRate)
          const totalRate = 1 + taxRate + tipRate;
          adjustedSubtotal = totalAmount / totalRate;
          adjustedTaxAmount = adjustedSubtotal * taxRate;
          adjustedTipAmount = adjustedSubtotal * tipRate;
        }
      }
    }

    return {
      originalAmount, // 原始金额（折扣前）
      discountAmount, // 折扣金额
      discountPercentage, // 折扣比例
      subtotal: adjustedSubtotal, // 调整后的小计
      taxAmount: adjustedTaxAmount, // 调整后的税额
      tipAmount: adjustedTipAmount, // 调整后的小费
      totalAmount,
    };
  };

  const amounts = calculateAmounts();

  // 初始化originalTotalAmount为计算后的总额（包含税费和小费）
  useEffect(() => {
    if (open && !amountModified && !isEditingAmount) {
      // 只在对话框打开且用户还未修改金额时，更新原始总额
      const calculatedTotal = amounts.subtotal + amounts.taxAmount + amounts.tipAmount;
      if (calculatedTotal > 0 && Math.abs(originalTotalAmount - calculatedTotal) > 0.01) {
        setOriginalTotalAmount(calculatedTotal);
      }
    }
  }, [open, amounts.subtotal, amounts.taxAmount, amounts.tipAmount, amountModified, isEditingAmount]);

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

      // 构建完整手机号（国际码 + 手机号）
      let fullPhoneNumber = customer.phone;
      if (customer.countryCode) {
        // 提取国际码中的数字部分（去掉国家后缀，如 +1-CA 变成 +1）
        const dialCode = customer.countryCode.replace(/-[A-Z]{2}$/, '').trim();
        fullPhoneNumber = dialCode + customer.phone.trim();
      } else if (!customer.phone.startsWith('+')) {
        // 如果没有国家码且手机号不以+开头，默认使用 +1（北美）
        fullPhoneNumber = '+1' + customer.phone.trim();
      }

      const response = await verificationApi.sendCode({
        tenantId: user.tenantId,
        businessType: 'PACKAGE_PAYMENT',
        businessId: appointmentId.toString(),
        recipientType: 'PHONE',
        recipient: fullPhoneNumber,
        metadata: JSON.stringify({
          customerId,
          appointmentId,
          packageId: packageIdToSend,
          servicePackageIds: services && services.length > 1 ? servicePackageIds : undefined,
          merchantName: merchantName || 'Merchant',
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

    // 验证：如果金额被修改，必须填写notes
    if (amountModified && !paymentNotes.trim()) {
      setError(t('payment.notesRequiredWhenAmountModified', 'Notes are required when the payment amount is modified'));
      setLoading(false);
      return;
    }

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
          } else if (payMethod === 'GIFT_CARD') {
            // 礼品卡支付，检查是否输入了金额
            const giftCardAmount = parseFloat(serviceGiftCardAmounts[service.id] || '0');
            const servicePrice = Number(service.price);

            if (giftCardAmount <= 0) {
              setError(`请为服务 "${service.name}" 输入礼品卡支付金额`);
              setLoading(false);
              return;
            }

            // 如果礼品卡金额小于服务价格，需要选择补充支付方式
            if (giftCardAmount < servicePrice) {
              const additionalMethod = serviceAdditionalPaymentMethods[service.id];
              if (!additionalMethod) {
                setError(`服务 "${service.name}" 的礼品卡金额不足，请选择补充支付方式`);
                setLoading(false);
                return;
              }

              servicePayments.push({
                serviceId: service.id,
                paymentMethod: payMethod,
                giftCardAmount: giftCardAmount,
                giftCardNumber: serviceGiftCardNumbers[service.id] || undefined,
                additionalPaymentMethod: additionalMethod,
              });
            } else {
              // 礼品卡金额足够支付
              servicePayments.push({
                serviceId: service.id,
                paymentMethod: payMethod,
                giftCardAmount: giftCardAmount,
                giftCardNumber: serviceGiftCardNumbers[service.id] || undefined,
              });
            }
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
        }, paymentNotes.trim() || undefined);
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
          },
          paymentNotes.trim() || undefined
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
    setIsEditingAmount(false);
    setEditedTotalAmount('');
    setAmountModified(false);
    setPaymentNotes('');
    setOriginalTotalAmount(0); // 重置原始金额
    // 重置礼品卡状态
    setGiftCardAmount('');
    setGiftCardNumber('');
    setIsMixedPayment(false);
    setMixedPaymentMethods({});
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
        value: 'GIFT_CARD',
        label: t('payment.giftCard'),
        icon: GiftCardIcon,
        description: t('payment.giftCardDescription'),
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
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        // Fixed higher zIndex to ensure it's always clickable
        // Fullscreen mode: 10000 (higher than AppointmentDrawer's 9999)
        // Normal mode: 1301 (higher than AppointmentDrawer's 1300)
        zIndex: (container && container !== document.body) ? 10000 : 1301,
        // Override MUI Drawer's default animation
        '& .MuiDrawer-paper': {
          // Desktop: always at final position (left of appointment drawer)
          right: {
            xs: 0,
            sm: 0,
            md: '400px !important',
          },
          // Use dynamic width for sliding effect - increased to 480px
          width: {
            xs: '100%',
            sm: '100%',
            md: open ? '480px !important' : '0px !important', // Animate width from 0 to 480px
          },
          // No transform on desktop
          transform: {
            xs: open ? 'translateX(0)' : 'translateX(100%)',
            sm: open ? 'translateX(0)' : 'translateX(100%)',
            md: 'translateX(0) !important', // No transform, use width animation instead
          },
          // Keep opacity at 1
          opacity: 1,
          // Add overflow hidden
          overflow: 'hidden',
          // Smooth width transition for sliding drawer effect
          transition: {
            xs: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1) !important',
            sm: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1) !important',
            md: 'width 350ms cubic-bezier(0.4, 0, 0.2, 1) !important',
          },
          // Disable pointer events when closed
          pointerEvents: open ? 'auto' : 'none',
        }
      }}
      container={container}
      disablePortal={!!(container && container !== document.body)}
      hideBackdrop={false}
      PaperProps={{
        sx: {
          width: {
            xs: '100%',
            sm: '100%',
            md: '480px', // Desktop: increased width for better data display
          },
          maxWidth: '100vw',
          height: '100%',
          position: 'fixed',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12), -2px 0 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: '1px solid #e2e8f0',
        }
      }}
      slotProps={{
        backdrop: {
          sx: {
            position: (container && container !== document.body) ? 'absolute' : 'fixed',
            // Make backdrop semi-transparent to see both drawers
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }
        }
      }}
      ModalProps={{
        container: container,
        style: { position: (container && container !== document.body) ? 'absolute' : 'fixed' },
        keepMounted: true, // Keep mounted to ensure animation works
      }}
    >
      {/* Inner container to maintain fixed width during animation */}
      <Box
        sx={{
          width: '480px', // Fixed width to prevent content reflow during animation - increased to 480px
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header - Title only */}
        <Box
          sx={{
            px: 4,
            pt: 3,
            pb: 2.5,
            background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
            borderBottom: '1px solid #e6eaee',
            flexShrink: 0,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#0a0f1a',
                  mb: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('payment.completePayment')}
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
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ px: 4, pt: 3, pb: 3, overflow: 'auto', flex: 1 }}>
          {/* Amount Card */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px solid #e6eaee',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          {/* Service Info */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
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
              {CurrencyUtils.formatAmount(amounts.discountAmount > 0 ? amounts.originalAmount : amounts.subtotal)}
            </Typography>
          </Box>

          {/* Member Discount */}
          {amounts.discountAmount > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#10b981',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {t('payment.memberDiscount', 'Member Discount')} ({amounts.discountPercentage}%)
                </Typography>
                {customer?.membershipTier && (
                  <Chip
                    icon={getTierIcon(customer.membershipTier.icon || 'star')}
                    label={customer.membershipTier.name}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      bgcolor: alpha(customer.membershipTier.color || '#9CA3AF', 0.1),
                      color: customer.membershipTier.color || '#9CA3AF',
                      border: 'none',
                      '& .MuiChip-icon': {
                        fontSize: 14,
                        color: customer.membershipTier.color || '#9CA3AF',
                      },
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                -{CurrencyUtils.formatAmount(amounts.discountAmount)}
              </Typography>
            </Box>
          )}

          {/* Subtotal after discount */}
          {amounts.discountAmount > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.875rem',
                }}
              >
                {t('payment.subtotal', 'Subtotal')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#0a0f1a',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {CurrencyUtils.formatAmount(amounts.subtotal)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Tax - 始终显示，subtotal为0时显示$0.00 */}
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
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
            <Box display="flex" alignItems="center" gap={1}>
              {isEditingAmount ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    value={editedTotalAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setEditedTotalAmount(value);
                      }
                    }}
                    placeholder="0.00"
                    size="small"
                    autoFocus
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 0.5, color: '#64748b' }}>$</Typography>,
                    }}
                    sx={{
                      width: 120,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        borderRadius: 1.5,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const parsedAmount = parseFloat(editedTotalAmount);
                      const calculatedTotal = amounts.subtotal + amounts.taxAmount + amounts.tipAmount;

                      if (!editedTotalAmount || isNaN(parsedAmount) || parsedAmount < 0) {
                        setError(t('payment.invalidAmount', 'Please enter a valid amount'));
                        return;
                      }

                      // 检查金额是否被修改（与初始金额比较，而不是与计算金额比较）
                      if (Math.abs(parsedAmount - originalTotalAmount) > 0.01) {
                        setAmountModified(true);
                        // 不要更新originalTotalAmount，它应该保持为初始值
                      } else {
                        setAmountModified(false);
                        setEditedTotalAmount(''); // 如果金额未修改，清空编辑值
                      }

                      setIsEditingAmount(false);
                    }}
                    sx={{ color: '#10b981' }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIsEditingAmount(false);
                      setEditedTotalAmount('');
                      setAmountModified(false);
                      setPaymentNotes('');
                    }}
                    sx={{ color: '#64748b' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: amountModified ? '#f59e0b' : '#10b981',
                      fontSize: '1.5rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {CurrencyUtils.formatAmount(amounts.totalAmount)}
                  </Typography>
                  {hasPermission(SCHEDULE_PERMISSIONS.EDIT_AMOUNT) && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsEditingAmount(true);
                        setEditedTotalAmount(amounts.totalAmount.toFixed(2));
                      }}
                      sx={{
                        color: '#64748b',
                        '&:hover': { color: '#10b981' },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* 金额修改提示 */}
          {amountModified && (
            <Alert
              severity="warning"
              sx={{
                mb: 1.5,
                borderRadius: 2,
                fontSize: '0.875rem',
                py: 0.5,
              }}
            >
              {t('payment.amountModifiedWarning', 'Amount has been modified from')} {CurrencyUtils.formatAmount(originalTotalAmount)} {t('to', 'to')} {CurrencyUtils.formatAmount(amounts.totalAmount)}. {t('payment.noteRequired', 'Notes are required.')}
            </Alert>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* 小费选择 - 紧凑设计 */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#0a0f1a',
                mb: 1,
                fontSize: '0.875rem',
              }}
            >
              {t('payment.addTip', 'Add Tip (Optional)')}
            </Typography>

            {/* 快捷选项按钮 */}
            <Stack direction="row" spacing={1.5} mb={showCustomTip ? 1 : 0}>
              {[0, 10, 15, 20, 'custom'].map((option) => {
                const isCustom = option === 'custom';
                const isSelected = isCustom
                  ? showCustomTip
                  : (tipPercentage === option && !customTipAmount);

                return (
                  <Button
                    key={option}
                    variant="outlined"
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
                      borderRadius: 2,
                      py: 1.25,
                      px: 1,
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 500,
                      textTransform: 'none',
                      minWidth: 0,
                      border: '1.5px solid',
                      borderColor: isSelected ? '#7BC68C' : '#e6eaee',
                      bgcolor: isSelected ? '#7BC68C' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#475569',
                      boxShadow: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        borderColor: '#7BC68C',
                        bgcolor: isSelected ? '#5EAA6F' : alpha('#7BC68C', 0.08),
                        color: isSelected ? '#ffffff' : '#0a0f1a',
                        transform: 'translateY(-1px)',
                        boxShadow: isSelected
                          ? '0 2px 8px rgba(123, 198, 140, 0.25)'
                          : '0 2px 8px rgba(123, 198, 140, 0.12)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
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

          <Divider sx={{ my: 1.5 }} />

          {/* Notes输入框 */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#0a0f1a',
                mb: 1,
                fontSize: '0.875rem',
              }}
            >
              {t('payment.notes', 'Notes')}
              {amountModified && (
                <Typography
                  component="span"
                  sx={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    ml: 0.5,
                  }}
                >
                  *
                </Typography>
              )}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={
                amountModified
                  ? t('payment.notesRequiredPlaceholder', 'Please explain why the amount was modified (required)')
                  : t('payment.notesPlaceholder', 'Add notes about this payment (optional)')
              }
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              error={amountModified && !paymentNotes.trim()}
              helperText={
                amountModified && !paymentNotes.trim()
                  ? t('payment.notesRequired', 'Notes are required when amount is modified')
                  : ''
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  bgcolor: amountModified && !paymentNotes.trim() ? alpha('#ef4444', 0.05) : '#f8fafc',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: amountModified ? '#ef4444' : '#cbd5e1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: amountModified ? '#ef4444' : '#10b981',
                  },
                  '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ef4444',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '0.75rem',
                  mt: 0.75,
                },
              }}
            />
          </Box>
        </Box>

        {/* Payment Method Selection */}
        {/* 单服务场景 - 显示原来的支付方式选择 */}
        {(!services || services.length <= 1) && (
          <Box sx={{ mb: 3, mt: 3 }}>
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
                            disablePortal: false,
                            container: container || document.body,
                            sx: {
                              zIndex: 10001,
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

                  {/* 如果选择了 GIFT_CARD，显示礼品卡金额输入 */}
                  {servicePaymentMethods[service.id] === 'GIFT_CARD' && (
                    <Box sx={{ mt: 2 }}>
                      {/* 礼品卡支付金额输入 */}
                      <TextField
                        fullWidth
                        label="礼品卡支付金额"
                        type="number"
                        value={serviceGiftCardAmounts[service.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setServiceGiftCardAmounts({
                            ...serviceGiftCardAmounts,
                            [service.id]: value,
                          });
                          const amount = parseFloat(value) || 0;
                          const servicePrice = Number(service.price);

                          // 如果礼品卡金额小于服务价格，需要选择补充支付方式
                          if (amount > 0 && amount < servicePrice) {
                            // 不自动设置，让用户选择
                            if (!serviceAdditionalPaymentMethods[service.id]) {
                              setError('请选择补充支付方式');
                            }
                          } else {
                            // 清除补充支付方式
                            const newAdditionalMethods = { ...serviceAdditionalPaymentMethods };
                            delete newAdditionalMethods[service.id];
                            setServiceAdditionalPaymentMethods(newAdditionalMethods);
                            setError(null);
                          }
                        }}
                        placeholder="请输入礼品卡支付金额"
                        size="small"
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>$</Typography>,
                        }}
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                          },
                        }}
                        helperText={`服务价格: ${CurrencyUtils.formatAmount(Number(service.price))}`}
                      />

                      {/* 显示支付金额信息 */}
                      {parseFloat(serviceGiftCardAmounts[service.id] || '0') > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: parseFloat(serviceGiftCardAmounts[service.id] || '0') >= Number(service.price)
                              ? alpha('#10b981', 0.08)
                              : alpha('#fbbf24', 0.08),
                            border: '1px solid',
                            borderColor: parseFloat(serviceGiftCardAmounts[service.id] || '0') >= Number(service.price)
                              ? alpha('#10b981', 0.3)
                              : alpha('#fbbf24', 0.3),
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: parseFloat(serviceGiftCardAmounts[service.id] || '0') >= Number(service.price) ? '#059669' : '#d97706',
                              fontSize: '0.875rem',
                              mb: 1,
                            }}
                          >
                            礼品卡支付: {CurrencyUtils.formatAmount(parseFloat(serviceGiftCardAmounts[service.id] || '0'))}
                          </Typography>
                          {parseFloat(serviceGiftCardAmounts[service.id] || '0') < Number(service.price) && (
                            <Typography
                              sx={{
                                color: '#d97706',
                                fontSize: '0.8125rem',
                              }}
                            >
                              还需支付: {CurrencyUtils.formatAmount(Number(service.price) - parseFloat(serviceGiftCardAmounts[service.id] || '0'))}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* 混合支付选项 - 当礼品卡金额不足时 */}
                      {parseFloat(serviceGiftCardAmounts[service.id] || '0') > 0 &&
                       parseFloat(serviceGiftCardAmounts[service.id] || '0') < Number(service.price) && (
                        <Box sx={{ mt: 3 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: '#0a0f1a',
                              mb: 2,
                              fontSize: '0.9375rem',
                            }}
                          >
                            选择补充支付方式
                          </Typography>
                          <RadioGroup
                            value={serviceAdditionalPaymentMethods[service.id] || ''}
                            onChange={(e) => {
                              setServiceAdditionalPaymentMethods({
                                ...serviceAdditionalPaymentMethods,
                                [service.id]: e.target.value,
                              });
                              setError(null);
                            }}
                          >
                            <FormControlLabel
                              value="CREDIT_CARD"
                              control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                              label={t('payment.creditCard')}
                            />
                            <FormControlLabel
                              value="DEBIT_CARD"
                              control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                              label={t('payment.debitCard')}
                            />
                            <FormControlLabel
                              value="CASH"
                              control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                              label={t('payment.cash')}
                            />
                          </RadioGroup>
                        </Box>
                      )}
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

        {/* Gift Card Input - 简化版 (礼品卡由POS系统管理) */}
        {paymentMethod === 'GIFT_CARD' && (!services || services.length <= 1) && (
          <Box
            ref={giftCardSectionRef}
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
              {t('payment.giftCardDetails')}
            </Typography>

            {/* 礼品卡支付金额输入 */}
            <TextField
              fullWidth
              label="礼品卡支付金额"
              type="number"
              value={giftCardAmount}
              onChange={(e) => {
                const value = e.target.value;
                setGiftCardAmount(value);
                const amount = parseFloat(value) || 0;
                const totalAmount = amounts.totalAmount;

                // 自动检测是否需要混合支付
                if (amount > 0 && amount < totalAmount) {
                  setIsMixedPayment(true);
                  setMixedPaymentMethods({
                    giftCard: amount,
                  });
                } else {
                  setIsMixedPayment(false);
                  setMixedPaymentMethods({});
                }
              }}
              placeholder="请输入礼品卡支付金额"
              size="small"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: '#64748b' }}>$</Typography>,
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
              helperText={`订单总额: ${CurrencyUtils.formatAmount(amounts.totalAmount)}`}
            />

            {/* 显示支付金额信息 */}
            {parseFloat(giftCardAmount) > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: parseFloat(giftCardAmount) >= amounts.totalAmount
                    ? alpha('#10b981', 0.08)
                    : alpha('#fbbf24', 0.08),
                  border: '1px solid',
                  borderColor: parseFloat(giftCardAmount) >= amounts.totalAmount
                    ? alpha('#10b981', 0.3)
                    : alpha('#fbbf24', 0.3),
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: parseFloat(giftCardAmount) >= amounts.totalAmount ? '#059669' : '#d97706',
                    fontSize: '0.875rem',
                    mb: 1,
                  }}
                >
                  礼品卡支付: {CurrencyUtils.formatAmount(parseFloat(giftCardAmount))}
                </Typography>
                {parseFloat(giftCardAmount) < amounts.totalAmount && (
                  <Typography
                    sx={{
                      color: '#d97706',
                      fontSize: '0.8125rem',
                    }}
                  >
                    还需支付: {CurrencyUtils.formatAmount(amounts.totalAmount - parseFloat(giftCardAmount))}
                  </Typography>
                )}
              </Box>
            )}

            {/* 混合支付选项 */}
            {isMixedPayment && parseFloat(giftCardAmount) > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: '#0a0f1a',
                    mb: 2,
                    fontSize: '0.9375rem',
                  }}
                >
                  选择补充支付方式
                </Typography>
                <RadioGroup
                  value={Object.keys(mixedPaymentMethods).find(k => k !== 'giftCard') || ''}
                  onChange={(e) => {
                    const additionalMethod = e.target.value;
                    const remainingAmount = amounts.totalAmount - parseFloat(giftCardAmount);
                    setMixedPaymentMethods({
                      giftCard: parseFloat(giftCardAmount),
                      [additionalMethod]: remainingAmount,
                    });
                  }}
                >
                  <FormControlLabel
                    value="creditCard"
                    control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                    label={t('payment.creditCard')}
                  />
                  <FormControlLabel
                    value="debitCard"
                    control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                    label={t('payment.debitCard')}
                  />
                  <FormControlLabel
                    value="cash"
                    control={<Radio sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                    label={t('payment.cash')}
                  />
                </RadioGroup>
              </Box>
            )}
          </Box>
        )}

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
                      disablePortal: false,
                      container: container || document.body,
                      sx: {
                        zIndex: 10001,
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
        </Box>
        {/* End of Scrollable Content Area */}

        {/* Fixed Footer - Action Buttons */}
        <Box
          sx={{
            px: 4,
            pt: 2.5,
            pb: 3,
            borderTop: '1px solid #e6eaee',
            flexShrink: 0,
            background: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
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
        {/* End of Fixed Footer */}
      </Box>
      {/* End of inner container */}
    </Drawer>
  );
};

export default PaymentDialog;
export type { ServicePayment };
