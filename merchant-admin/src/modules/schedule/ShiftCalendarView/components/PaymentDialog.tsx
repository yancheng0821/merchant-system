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
  InputLabel,
  Chip,
  alpha,
  IconButton,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  TextField,
  Tabs,
  Tab,
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
  Style as GiftCardIcon,
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
  // 服务实际应付金额（混合支付模式下）
  serviceAmount?: number;
  // 礼品卡支付相关字段
  giftCardAmount?: number;
  giftCardNumber?: string;
  // 混合支付：当礼品卡金额不足时使用的补充支付方式
  additionalPaymentMethod?: string;
  additionalPaymentAmount?: number;
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
      tipPaymentMethod?: string;
    },
    // Notes信息
    notes?: string,
    // 礼品卡支付信息
    giftCardAmount?: number,
    giftCardNumber?: string,
    additionalPaymentMethod?: string,
    additionalPaymentAmount?: number,
    // 支付模式：single(单服务), unified(多服务统一), mixed(多服务混合)
    paymentMode?: 'single' | 'unified' | 'mixed'
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

  /**
   * 渲染支付方式选择器（可复用组件）
   * @param currentValue - 当前选中的支付方式
   * @param onValueChange - 值改变时的回调
   * @param checkPackageAvailability - 是否检查套餐可用性（单服务不需要检查所有服务）
   */
  const renderPaymentMethodSelector = (
    currentValue: string,
    onValueChange: (value: string) => void,
    checkPackageAvailability: boolean = false
  ) => {
    return (
      <RadioGroup value={currentValue} onChange={(e) => onValueChange(e.target.value)}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = currentValue === method.value;
            let isDisabled = method.disabled || false;
            let description = method.description;

            // 套餐可用性检查
            if (method.value === 'PACKAGE' && !loadingPackages && checkPackageAvailability && services && services.length > 1) {
              const availablePackages = customerPackages.filter(
                pkg => services.every(service =>
                  ((pkg as any).service_remaining_map?.[service.id] || 0) > 0
                )
              ).length;

              if (availablePackages === 0) {
                isDisabled = true;
                description = t('payment.noPackagesAvailableForAllServices');
              } else {
                description = t('payment.packageDescription', { count: availablePackages });
              }
            }

            return (
              <Box
                key={method.value}
                onClick={() => !isDisabled && onValueChange(method.value)}
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
                    <Radio sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#10b981' } }} />
                  }
                  disabled={isDisabled}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, pr: 0.5, width: '100%' }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          bgcolor: isSelected ? alpha('#10b981', 0.12) : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 16, color: isSelected ? '#10b981' : '#64748b' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a0f1a', fontSize: '0.8125rem' }}>
                          {method.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontSize: 16,
                      color: '#10b981',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </RadioGroup>
    );
  };

  /**
   * 渲染套餐选择器（可复用组件）
   * @param currentValue - 当前选中的套餐ID
   * @param onValueChange - 值改变时的回调
   * @param forService - 针对特定服务（混合支付模式用）
   */
  const renderPackageSelector = (
    currentValue: number | null,
    onValueChange: (value: number) => void,
    forService?: { id: number; name: string; price: number }
  ) => {
    const filteredPackages = customerPackages.filter(pkg => {
      if (forService) {
        // 混合支付模式：检查特定服务的剩余次数
        return ((pkg as any).service_remaining_map?.[forService.id] || 0) > 0;
      } else if (!services) {
        // 单服务场景：检查 service_remaining
        return pkg.service_remaining > 0;
      } else {
        // 多服务统一支付：检查每个服务的剩余次数
        return services.every(service =>
          ((pkg as any).service_remaining_map?.[service.id] || 0) > 0
        );
      }
    });

    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: '#475569',
            display: 'block',
            mb: 0.5,
            fontSize: '0.6875rem',
          }}
        >
          {t('payment.selectPackage')}
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={currentValue || ''}
            onChange={(e) => onValueChange(e.target.value as number)}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return (
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                    {t('payment.choosePackage')}
                  </Typography>
                );
              }
              const selectedPkg = customerPackages.find(pkg => pkg.id === selected);
              if (!selectedPkg) return null;

              const showRemaining = forService || !services; // 混合支付或单服务时显示剩余
              const remaining = forService
                ? (selectedPkg as any).service_remaining_map?.[forService.id] || 0
                : selectedPkg.service_remaining;

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pr: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981', flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      color: '#0f172a',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {selectedPkg.package_name}
                  </Typography>
                  {showRemaining && (
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#10b981',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {remaining} {t('common.remaining')}
                    </Typography>
                  )}
                </Box>
              );
            }}
            MenuProps={{
              disablePortal: false,
              container: container || document.body,
              sx: {
                zIndex: 10001,
                '& .MuiPaper-root': {
                  borderRadius: 1.5,
                  mt: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }
              }
            }}
            sx={{
              height: 36,
              borderRadius: 1.5,
              bgcolor: '#f8fafc',
              fontSize: '0.8125rem',
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
                py: 1,
              }
            }}
          >
            <MenuItem value="" disabled>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                {t('payment.choosePackage')}
              </Typography>
            </MenuItem>
            {filteredPackages.map((pkg) => {
              return (
                <MenuItem
                  key={pkg.id}
                  value={pkg.id}
                  sx={{
                    py: 1.25,
                    px: 2,
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha('#10b981', 0.06),
                      '&:hover': {
                        bgcolor: alpha('#10b981', 0.1),
                      }
                    }
                  }}
                >
                  <Box width="100%">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: (services && !forService) ? 0.5 : 0 }}>
                      <Typography sx={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>
                        {pkg.package_name}
                      </Typography>
                      {(forService || !services) && (
                        <Typography sx={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600, ml: 2 }}>
                          {forService
                            ? `${(pkg as any).service_remaining_map?.[forService.id] || 0} ${t('common.remaining')}`
                            : `${pkg.service_remaining} ${t('common.remaining')}`
                          }
                        </Typography>
                      )}
                    </Box>
                    {services && !forService && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                        {services.map((service) => {
                          const remaining = (pkg as any).service_remaining_map?.[service.id] || 0;
                          return (
                            <Chip
                              key={service.id}
                              label={
                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#0f172a' }}>
                                    {service.name}:
                                  </Typography>
                                  <Typography component="span" sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#15803d' }}>
                                    {remaining} {t('common.remaining')}
                                  </Typography>
                                </Box>
                              }
                              size="small"
                              sx={{
                                height: 20,
                                backgroundColor: '#dcfce7',
                                borderRadius: 1,
                                '& .MuiChip-label': { px: 1, py: 0 }
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
    );
  };

  /**
   * 渲染SMS验证码输入（可复用组件）
   * @param idPrefix - input元素id前缀，避免id冲突
   */
  const renderSmsVerification = (idPrefix: string = 'verification-code') => {
    return (
      <Box
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: '#ffffff',
          border: '1px solid',
          borderColor: verificationSent && !verificationError ? alpha('#10b981', 0.3) : '#e6eaee',
          transition: 'all 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: alpha('#10b981', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SmsIcon sx={{ fontSize: 16, color: '#10b981' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0a0f1a', lineHeight: 1.2 }}>
                {t('payment.verification')}
              </Typography>
              <Typography sx={{ fontSize: '0.625rem', color: '#64748b', mt: 0.25 }}>
                {verificationSent ? t('payment.enterVerificationCode') : t('payment.sendCode')}
              </Typography>
            </Box>
          </Box>

          <Button
            onClick={handleSendVerificationCode}
            disabled={sendingCode || countdown > 0 || loading}
            variant="contained"
            size="small"
            sx={{
              minWidth: 80,
              height: 28,
              px: 1.25,
              fontWeight: 600,
              fontSize: '0.6875rem',
              borderRadius: 1.5,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              bgcolor: '#10b981',
              color: '#ffffff',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#059669', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
            }}
          >
            {sendingCode ? (
              <CircularProgress size={12} sx={{ color: '#ffffff' }} />
            ) : countdown > 0 ? (
              `${t('payment.resend')} (${countdown}s)`
            ) : verificationSent ? (
              t('payment.resend')
            ) : (
              t('payment.sendCode')
            )}
          </Button>
        </Box>

        {/* 6位验证码输入框 */}
        <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', mb: verificationError ? 1.5 : 0 }}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextField
              key={index}
              id={`${idPrefix}-${index}`}
              value={verificationCode[index] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 1) {
                  const newCode = verificationCode.split('');
                  newCode[index] = value;
                  const finalCode = newCode.join('').slice(0, 6);
                  setVerificationCode(finalCode);
                  setVerificationError(null);
                  if (value && index < 5) {
                    const nextInput = document.getElementById(`${idPrefix}-${index + 1}`);
                    nextInput?.focus();
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                  const prevInput = document.getElementById(`${idPrefix}-${index - 1}`);
                  prevInput?.focus();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                setVerificationCode(pastedData);
                setVerificationError(null);
                const lastIndex = Math.min(pastedData.length, 5);
                const lastInput = document.getElementById(`${idPrefix}-${lastIndex}`);
                lastInput?.focus();
              }}
              disabled={!verificationSent || loading}
              inputProps={{
                maxLength: 1,
                style: { textAlign: 'center', fontSize: '1rem', fontWeight: 600, padding: '8px 0' },
              }}
              sx={{
                width: 40,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: verificationSent ? '#ffffff' : '#f8fafc',
                  '& fieldset': {
                    borderColor: verificationError ? '#ef4444' : (verificationCode[index] ? '#10b981' : '#e2e8f0'),
                    borderWidth: verificationCode[index] ? '1.5px' : '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: verificationError ? '#ef4444' : (verificationCode[index] ? '#10b981' : '#cbd5e1'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: verificationError ? '#ef4444' : '#10b981',
                    borderWidth: '1.5px',
                  },
                  '&.Mui-disabled': { bgcolor: '#f8fafc' },
                },
              }}
            />
          ))}
        </Box>

        {verificationError && (
          <Alert severity="error" sx={{ mt: 1.5, py: 0.5, fontSize: '0.6875rem' }}>
            {verificationError}
          </Alert>
        )}

        {verificationSent && !verificationError && verificationCode.length < 6 && (
          <Alert severity="success" sx={{ mt: 1.5, py: 0.5, fontSize: '0.6875rem' }}>
            {t('payment.codeSent')}
          </Alert>
        )}
      </Box>
    );
  };

  /**
   * 渲染礼品卡输入（可复用组件）
   * @param currentAmount - 当前金额
   * @param onAmountChange - 金额改变回调
   * @param maxAmount - 最大金额（通常是服务价格）
   * @param bgColor - 背景色（统一支付用灰色，混合支付用白色）
   */
  const renderGiftCardInput = (
    currentAmount: string,
    onAmountChange: (value: string) => void,
    maxAmount?: number,
    bgColor: string = '#f8fafc'
  ) => {
    return (
      <Box sx={{ mt: 1.5 }}>
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
          {t('payment.giftCardAmount')}
        </Typography>
        <TextField
          fullWidth
          type="text"
          value={currentAmount}
          onChange={(e) => {
            const value = e.target.value;
            // 只允许数字和小数点，最多两位小数
            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
              onAmountChange(value);
            }
          }}
          placeholder="0.00"
          InputProps={{
            startAdornment: <Typography sx={{ mr: 0.5, color: '#64748b', fontSize: '0.875rem' }}>$</Typography>,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 1.5,
              bgcolor: bgColor,
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: '#e2e8f0',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: '#cbd5e1',
              },
              '&.Mui-focused': {
                bgcolor: '#ffffff',
                '& fieldset': {
                  borderColor: '#10b981',
                  borderWidth: '1.5px',
                },
              },
            },
          }}
        />
        {maxAmount && (parseFloat(currentAmount) - maxAmount) > 0.01 && (
          <Typography key="gift-card-exceeds" sx={{ mt: 0.5, fontSize: '0.6875rem', color: '#ef4444' }}>
            {t('payment.giftCardExceedsAmount', { amount: maxAmount.toFixed(2) })}
          </Typography>
        )}
      </Box>
    );
  };

  // 单服务场景的状态
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [customerPackages, setCustomerPackages] = useState<CustomerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<any>(null);

  // 支付模式：unified（统一支付）或 mixed（混合支付）
  // 默认使用统一支付模式
  const [paymentMode, setPaymentMode] = useState<'unified' | 'mixed'>('unified');

  // 统一支付模式的状态
  const [unifiedPaymentMethod, setUnifiedPaymentMethod] = useState<string>('CREDIT_CARD');
  const [unifiedPackageId, setUnifiedPackageId] = useState<number | null>(null);
  const [unifiedGiftCardAmount, setUnifiedGiftCardAmount] = useState<string>('');
  const [unifiedGiftCardNumber, setUnifiedGiftCardNumber] = useState<string>('');
  const [unifiedAdditionalPaymentMethod, setUnifiedAdditionalPaymentMethod] = useState<string>('');
  const [tipPaymentMethod, setTipPaymentMethod] = useState<string>(''); // 小费支付方式（空表示跟随订单支付方式）

  // 多服务场景的状态：每个服务的支付方式和套餐选择
  const [servicePaymentMethods, setServicePaymentMethods] = useState<Record<number, string>>({});
  const [servicePackageIds, setServicePackageIds] = useState<Record<number, number>>({});
  // 多服务场景：每个服务的礼品卡金额和卡号
  const [serviceGiftCardAmounts, setServiceGiftCardAmounts] = useState<Record<number, string>>({});
  const [serviceGiftCardNumbers, setServiceGiftCardNumbers] = useState<Record<number, string>>({});
  // 多服务场景：每个服务的补充支付方式（当礼品卡金额不足时）
  const [serviceAdditionalPaymentMethods, setServiceAdditionalPaymentMethods] = useState<Record<number, string>>({});
  // 多服务混合支付：每个服务的实际应付金额（含折扣和分摊税费）
  const [serviceActualAmounts, setServiceActualAmounts] = useState<Record<number, number>>({});

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

  // 礼品卡混合支付场景：智能判断小费支付方式
  // 如果补充支付金额 >= 小费金额，则小费使用补充支付方式
  // 如果补充支付金额 < 小费金额，则小费使用礼品卡支付方式
  useEffect(() => {
    const isUnifiedGiftCard = unifiedPaymentMethod === 'GIFT_CARD';
    const isSingleGiftCard = !services && paymentMethod === 'GIFT_CARD';
    const isGiftCardPayment = isUnifiedGiftCard || isSingleGiftCard;

    if (!isGiftCardPayment) return;

    // 计算当前金额
    const amounts = calculateAmounts();
    const currentGiftCardAmount = parseFloat((services ? unifiedGiftCardAmount : giftCardAmount) || '0');
    const additionalMethod = unifiedAdditionalPaymentMethod; // 统一和单服务都使用这个状态

    // 如果有补充支付方式，自动判断小费支付方式
    if (additionalMethod) {
      // 计算补充支付金额（总金额 - 礼品卡金额，包含小费）
      const totalAmountWithTip = amounts.subtotal + amounts.taxAmount + amounts.tipAmount;
      const additionalPaymentAmount = totalAmountWithTip - currentGiftCardAmount;

      // 智能判断小费支付方式
      if (additionalPaymentAmount >= amounts.tipAmount) {
        // 补充支付金额 >= 小费金额：说明补充支付不仅要支付小费，可能还要支付部分服务费税费，所以小费使用补充支付方式
        setTipPaymentMethod(additionalMethod);
      } else {
        // 补充支付金额 < 小费金额：说明补充支付只需要支付部分小费或者剩余部分服务费，礼品卡已覆盖大部分费用，所以小费使用礼品卡
        setTipPaymentMethod('GIFT_CARD');
      }
    } else if (currentGiftCardAmount > 0 && amounts.tipAmount > 0) {
      // 纯礼品卡支付（无补充支付），小费使用礼品卡
      setTipPaymentMethod('GIFT_CARD');
    } else {
      // 清除小费支付方式（让它使用默认值）
      setTipPaymentMethod('');
    }
  }, [unifiedGiftCardAmount, giftCardAmount, unifiedAdditionalPaymentMethod, tipPercentage, customTipAmount, unifiedPaymentMethod, paymentMethod, services]);

  // 当礼品卡支付或套餐支付且有小费时，自动设置小费支付方式默认值为CASH（仅用于套餐支付）
  useEffect(() => {
    const hasTip = (tipPercentage > 0 || (customTipAmount && parseFloat(customTipAmount) > 0));
    const isPackage = paymentMethod === 'PACKAGE' || unifiedPaymentMethod === 'PACKAGE';

    if (isPackage && hasTip && !tipPaymentMethod) {
      setTipPaymentMethod('CASH');
    }
  }, [paymentMethod, unifiedPaymentMethod, tipPercentage, customTipAmount, tipPaymentMethod]);

  // 多服务混合支付模式：不自动设置默认值，让用户主动选择
  // 移除自动设置CASH的逻辑，避免用户忘记修改

  // 计算多服务混合支付模式下每个服务的实际应付金额（含折扣和分摊税费）
  useEffect(() => {
    if (!services || services.length === 0 || paymentMode !== 'mixed') {
      return;
    }

    // 1. 找出所有非套餐支付的服务
    const nonPackageServices = services.filter(
      service => servicePaymentMethods[service.id] !== 'PACKAGE'
    );

    if (nonPackageServices.length === 0) {
      return;
    }

    // 2. 计算非套餐服务的总原价
    const totalNonPackagePrice = nonPackageServices.reduce(
      (sum, service) => sum + Number(service.price),
      0
    );

    // 3. 应用会员折扣
    let discountedTotalPrice = totalNonPackagePrice;
    if (customer?.membershipTier?.discountRate && totalNonPackagePrice > 0) {
      const rate = parseFloat(customer.membershipTier.discountRate);
      discountedTotalPrice = totalNonPackagePrice * (rate / 100);
    }

    // 4. 计算税费（基于折扣后的总价）
    const totalTax = discountedTotalPrice * taxRate;

    // 5. 计算小费
    let tipAmount = 0;
    const tipBaseAmount = discountedTotalPrice; // 小费基于折扣后的价格
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      tipAmount = parseFloat(customTipAmount);
    } else if (tipPercentage > 0 && tipBaseAmount > 0) {
      tipAmount = tipBaseAmount * (tipPercentage / 100);
    }

    // 6. 订单总金额（已包含折扣、税费和小费）
    const orderTotal = discountedTotalPrice + totalTax + tipAmount;

    // 7. 需要分配的金额（总金额 - 小费）= 服务费 + 税费
    const amountToAllocate = orderTotal - tipAmount;

    // 8. 为每个非套餐服务计算实际应付金额
    const newServiceActualAmounts: Record<number, number> = {};
    let allocatedTotal = 0;

    nonPackageServices.forEach((service, index) => {
      const servicePrice = Number(service.price);
      const serviceRatio = servicePrice / totalNonPackagePrice; // 该服务占比

      // 如果是最后一个服务，使用剩余金额避免舍入误差
      if (index === nonPackageServices.length - 1) {
        const actualAmount = amountToAllocate - allocatedTotal;
        newServiceActualAmounts[service.id] = Math.round(actualAmount * 100) / 100;
      } else {
        // 应用会员折扣后的服务价格
        let discountedServicePrice = servicePrice;
        if (customer?.membershipTier?.discountRate) {
          const rate = parseFloat(customer.membershipTier.discountRate);
          discountedServicePrice = servicePrice * (rate / 100);
        }

        // 分摊税费
        const serviceTax = totalTax * serviceRatio;

        // 实际应付金额 = 折扣后价格 + 分摊税费（不包括小费）
        const actualAmount = Math.round((discountedServicePrice + serviceTax) * 100) / 100;

        newServiceActualAmounts[service.id] = actualAmount;
        allocatedTotal += actualAmount;
      }
    });

    setServiceActualAmounts(newServiceActualAmounts);
  }, [services, servicePaymentMethods, paymentMode, customer, taxRate, tipPercentage, customTipAmount]);

  // 当切换支付模式时，重置验证码状态
  useEffect(() => {
    setVerificationCode('');
    setVerificationSent(false);
    setVerificationError(null);
  }, [paymentMode]);

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

        // 单服务场景：service_remaining 是当前 serviceId 的剩余次数
        const serviceRemaining = serviceId ? (serviceRemainingMap[serviceId] || 0) : totalRemaining;

        return {
          ...pkg,
          remaining_count: totalRemaining, // Total remaining
          service_remaining: serviceRemaining, // 当前服务的剩余次数
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
          return pkg.service_remaining > 0;
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
    let packageDiscountAmount = 0; // 套餐抵扣金额

    // 多服务场景：计算套餐抵扣金额
    if (services && services.length > 1) {
      // 检查是否所有服务都有支付方式
      const allServicesHavePaymentMethod = services.every(service =>
        servicePaymentMethods[service.id] !== undefined
      );

      if (allServicesHavePaymentMethod) {
        // 先计算总金额（包含所有服务）
        subtotal = services.reduce((total, service) => total + service.price, 0);
        originalAmount = subtotal;

        // 计算套餐抵扣金额（套餐支付的服务价格总和）
        packageDiscountAmount = services.reduce((total, service) => {
          const payMethod = servicePaymentMethods[service.id];
          if (payMethod === 'PACKAGE') {
            return total + service.price;
          }
          return total;
        }, 0);

        // 从小计中减去套餐抵扣
        subtotal = subtotal - packageDiscountAmount;
      }
    } else if (paymentMethod === 'PACKAGE') {
      // 单服务场景：如果选择套餐支付，套餐抵扣=服务价格
      packageDiscountAmount = amount;
      subtotal = 0;
      originalAmount = amount;
    }

    // 统一支付模式：如果选择套餐支付，所有服务金额使用套餐抵扣
    if (paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE') {
      if (services && services.length > 0) {
        const totalServicePrice = services.reduce((sum, s) => sum + Number(s.price), 0);
        packageDiscountAmount = totalServicePrice;
        subtotal = 0;
        originalAmount = totalServicePrice;
      } else {
        packageDiscountAmount = amount;
        subtotal = 0;
        originalAmount = amount;
      }
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

    // 计算小费金额
    // 套餐支付模式：小费基于服务原价计算（因为服务费用已被套餐抵扣）
    // 非套餐支付：小费基于折扣后的价格计算
    let tipAmount = 0;
    let tipBaseAmount = subtotal; // 默认基于subtotal

    // 判断是否为套餐支付模式
    const isPackagePayment =
      (!services && paymentMethod === 'PACKAGE') || // 单服务套餐支付
      (paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE'); // 多服务统一套餐支付

    const isGiftCardPayment =
      (!services && paymentMethod === 'GIFT_CARD') || // 单服务礼品卡支付
      (paymentMode === 'unified' && unifiedPaymentMethod === 'GIFT_CARD') || // 多服务统一礼品卡支付
      (services && services.some(s => servicePaymentMethods[s.id] === 'GIFT_CARD')); // 多服务混合支付中有礼品卡

    // 套餐支付：小费基于服务原价
    if (isPackagePayment) {
      if (services && services.length > 0) {
        // 多服务场景：累加所有服务原价
        tipBaseAmount = services.reduce((sum, s) => sum + Number(s.price), 0);
      } else {
        // 单服务场景：使用原始金额
        tipBaseAmount = amount;
      }
    }

    // 计算小费：自定义金额优先，否则按百分比计算
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      tipAmount = parseFloat(customTipAmount);
    } else if (tipPercentage > 0 && tipBaseAmount > 0) {
      tipAmount = tipBaseAmount * (tipPercentage / 100);
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
      packageDiscountAmount, // 套餐抵扣金额
      discountAmount, // 折扣金额
      discountPercentage, // 折扣比例
      subtotal: adjustedSubtotal, // 调整后的小计
      taxAmount: adjustedTaxAmount, // 调整后的税额
      tipAmount: adjustedTipAmount, // 调整后的小费
      totalAmount,
      isPackagePayment, // 是否为套餐支付模式
      isGiftCardPayment, // 是否为礼品卡支付模式
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
      // 统一支付模式：使用unifiedPackageId
      // 混合支付模式：收集所有选择了套餐支付的服务的packageId
      // 单服务场景：使用selectedPackageId
      let packageIdToSend;
      let packageNameToSend;
      let serviceNameToSend;

      if (paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE') {
        // 统一支付+套餐模式：使用统一选择的套餐
        packageIdToSend = unifiedPackageId;
        const selectedPkg = customerPackages.find(p => p.id === unifiedPackageId);
        packageNameToSend = selectedPkg?.package_name || 'Package';
        serviceNameToSend = services && services.length > 0
          ? services.map(s => s.name).join(', ')
          : serviceName;
      } else if (services && services.length > 1) {
        // 混合支付模式-多服务场景：将所有套餐ID作为数组发送
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

        // 统一支付模式
        if (paymentMode === 'unified') {
          // 验证统一支付方式
          if (!unifiedPaymentMethod) {
            setError(t('payment.pleaseSelectPaymentMethod'));
            setLoading(false);
            return;
          }

          // 如果是套餐支付，需要验证码和套餐选择
          if (unifiedPaymentMethod === 'PACKAGE') {
            if (!unifiedPackageId) {
              setError(t('payment.pleaseSelectPackage'));
              setLoading(false);
              return;
            }

            if (!verificationSent) {
              setError(t('payment.pleaseVerify'));
              setLoading(false);
              return;
            }

            const verified = await verifyAndProceed();
            if (!verified) {
              setLoading(false);
              return;
            }

            // 为所有服务使用同一个套餐
            for (const service of services) {
              servicePayments.push({
                serviceId: service.id,
                paymentMethod: unifiedPaymentMethod,
                customerPackageId: unifiedPackageId,
                verificationCodeId: verificationId || undefined,
              });
            }
          } else if (unifiedPaymentMethod === 'GIFT_CARD') {
            // 礼品卡支付
            const giftCardAmount = parseFloat(unifiedGiftCardAmount || '0');

            if (giftCardAmount <= 0) {
              setError(t('payment.pleaseEnterGiftCardAmount', { serviceName: '所有服务' }));
              setLoading(false);
              return;
            }

            // 检查礼品卡金额是否超过订单总额
            if ((giftCardAmount - amounts.totalAmount) > 0.01) {
              setError(t('payment.giftCardExceedsAmount', { amount: amounts.totalAmount.toFixed(2) }));
              setLoading(false);
              return;
            }

            // 如果礼品卡金额不足，需要补充支付方式（礼品卡应该覆盖包括税费和小费在内的所有金额）
            if ((amounts.totalAmount - giftCardAmount) > 0.01) {
              if (!unifiedAdditionalPaymentMethod) {
                setError(t('payment.pleaseSelectAdditionalPaymentMethod'));
                setLoading(false);
                return;
              }

              for (const service of services) {
                servicePayments.push({
                  serviceId: service.id,
                  paymentMethod: unifiedPaymentMethod,
                  giftCardAmount: giftCardAmount / services.length, // 平均分配
                  additionalPaymentMethod: unifiedAdditionalPaymentMethod,
                });
              }
            } else {
              // 礼品卡金额足够
              for (const service of services) {
                servicePayments.push({
                  serviceId: service.id,
                  paymentMethod: unifiedPaymentMethod,
                  giftCardAmount: giftCardAmount / services.length, // 平均分配
                });
              }
            }
          } else {
            // 其他支付方式（信用卡、借记卡、现金）
            for (const service of services) {
              servicePayments.push({
                serviceId: service.id,
                paymentMethod: unifiedPaymentMethod,
              });
            }
          }

          // 使用 useEffect 自动设置的小费支付方式
          let finalTipPaymentMethod = tipPaymentMethod;
          if (!finalTipPaymentMethod && amounts.tipAmount > 0) {
            // 如果没有选择小费支付方式，自动使用订单的主要支付方式
            finalTipPaymentMethod = unifiedPaymentMethod;
          }

          // 计算补充支付金额（如果使用礼品卡且有补充支付方式）
          let additionalPaymentAmountValue: number | undefined = undefined;
          if (unifiedPaymentMethod === 'GIFT_CARD' && unifiedAdditionalPaymentMethod) {
            const currentGiftCardAmount = parseFloat(unifiedGiftCardAmount || '0');
            const totalAmountWithTip = amounts.subtotal + amounts.taxAmount + amounts.tipAmount;
            const baseAdditionalAmount = totalAmountWithTip - currentGiftCardAmount;

            // 只有当补充支付金额大于0时才设置，避免负数
            additionalPaymentAmountValue = baseAdditionalAmount > 0 ? baseAdditionalAmount : undefined;
          }

          await onSuccess(unifiedPaymentMethod, undefined, undefined, servicePayments, {
            taxRate,
            taxAmount: amounts.taxAmount,
            tipAmount: amounts.tipAmount,
            tipPercentage,
            subtotal: amounts.subtotal,
            totalAmount: amounts.totalAmount,
            tipPaymentMethod: finalTipPaymentMethod || undefined, // 添加小费支付方式
          }, paymentNotes.trim() || undefined,
          unifiedPaymentMethod === 'GIFT_CARD' ? parseFloat(unifiedGiftCardAmount || '0') : undefined,
          unifiedGiftCardNumber,
          unifiedAdditionalPaymentMethod || undefined,
          additionalPaymentAmountValue,
          'unified'); // 统一支付模式

          // 支付成功，重置表单并关闭对话框
          resetForm();
          onClose();
        } else {
          // 混合支付模式
          // 验证：如果有小费，必须选择小费支付方式
          const hasTip = tipPercentage > 0 || (customTipAmount && parseFloat(customTipAmount) > 0);
          if (hasTip && !tipPaymentMethod) {
            setError(t('payment.pleaseSelectTipPaymentMethod', '请选择小费支付方式'));
            setLoading(false);
            return;
          }

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
              // 使用实际应付金额（包含折扣和分摊税费）
              const actualAmount = serviceActualAmounts[service.id] || Number(service.price);

              if (giftCardAmount <= 0) {
                setError(t('payment.pleaseEnterGiftCardAmount', { serviceName: service.name }));
                setLoading(false);
                return;
              }

              // 检查礼品卡金额是否超过实际应付金额
              if ((giftCardAmount - actualAmount) > 0.01) {
                setError(t('payment.giftCardExceedsAmount', { amount: actualAmount.toFixed(2) }));
                setLoading(false);
                return;
              }

              // 如果礼品卡金额小于实际应付金额，需要选择补充支付方式
              if ((actualAmount - giftCardAmount) > 0.01) {
                const additionalMethod = serviceAdditionalPaymentMethods[service.id];
                if (!additionalMethod) {
                  setError(t('payment.insufficientGiftCardPleaseSelectAdditional', { serviceName: service.name }));
                  setLoading(false);
                  return;
                }

                // 计算补充支付金额 = 实际应付金额 - 礼品卡金额
                const additionalAmount = actualAmount - giftCardAmount;

                servicePayments.push({
                  serviceId: service.id,
                  paymentMethod: payMethod,
                  giftCardAmount: giftCardAmount,
                  giftCardNumber: serviceGiftCardNumbers[service.id] || undefined,
                  additionalPaymentMethod: additionalMethod,
                  additionalPaymentAmount: additionalAmount,
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
              // 其他支付方式（CASH, CREDIT_CARD, DEBIT_CARD等）
              // 在混合支付模式下，传递该服务的实际应付金额
              const serviceAmount = serviceActualAmounts[service.id] || Number(service.price);

              servicePayments.push({
                serviceId: service.id,
                paymentMethod: payMethod,
                serviceAmount: serviceAmount, // 传递服务实际应付金额
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

          // 如果没有选择小费支付方式，自动使用订单的主要支付方式
          let finalTipPaymentMethod = tipPaymentMethod;
          if (!finalTipPaymentMethod && amounts.tipAmount > 0) {
            if (uniquePaymentMethods.size === 1) {
              // 如果所有服务使用同一种支付方式，小费也使用该方式
              finalTipPaymentMethod = servicePayments[0].paymentMethod;
            } else {
              // 混合支付情况下，默认使用现金支付小费
              finalTipPaymentMethod = 'CASH';
            }
          }

          // 调用回调，传递多服务支付信息和税率小费信息
          await onSuccess(overallPaymentMethod, undefined, undefined, servicePayments, {
            taxRate,
            taxAmount: amounts.taxAmount,
            tipAmount: amounts.tipAmount,
            tipPercentage,
            subtotal: amounts.subtotal,
            totalAmount: amounts.totalAmount,
            tipPaymentMethod: finalTipPaymentMethod || undefined, // 添加小费支付方式
          }, paymentNotes.trim() || undefined,
          undefined, undefined, undefined, undefined,
          paymentMode); // 传递支付模式：unified 或 mixed

          // 支付成功，重置表单并关闭对话框
          resetForm();
          onClose();
        }
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

        // 使用 useEffect 自动设置的小费支付方式
        let finalTipPaymentMethod = tipPaymentMethod;
        if (!finalTipPaymentMethod && amounts.tipAmount > 0) {
          finalTipPaymentMethod = paymentMethod;
        }

        // 计算补充支付金额（如果是礼品卡支付且有补充支付方式）
        let additionalPaymentAmountValue: number | undefined = undefined;
        if (paymentMethod === 'GIFT_CARD' && unifiedAdditionalPaymentMethod) {
          const currentGiftCardAmount = parseFloat(giftCardAmount || '0');
          const totalAmountWithTip = amounts.subtotal + amounts.taxAmount + amounts.tipAmount;
          const baseAdditionalAmount = totalAmountWithTip - currentGiftCardAmount;

          // 只有当补充支付金额大于0时才设置，避免负数
          additionalPaymentAmountValue = baseAdditionalAmount > 0 ? baseAdditionalAmount : undefined;
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
            tipPaymentMethod: finalTipPaymentMethod || undefined, // 添加小费支付方式
          },
          paymentNotes.trim() || undefined,
          paymentMethod === 'GIFT_CARD' ? parseFloat(giftCardAmount || '0') : undefined,
          giftCardNumber,
          unifiedAdditionalPaymentMethod || undefined,
          additionalPaymentAmountValue,
          'single' // 单服务支付模式
        );
      }

      // 支付成功，重置表单并关闭对话框
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || t('payment.paymentFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 重置表单状态（不关闭对话框）
  const resetForm = () => {
    setPaymentMethod('CREDIT_CARD');
    setSelectedPackageId(null);
    setServicePaymentMethods({});
    setServicePackageIds({});
    setServiceGiftCardAmounts({});
    setServiceGiftCardNumbers({});
    setServiceAdditionalPaymentMethods({});
    setError(null);
    setVerificationId(null);
    setVerificationCode('');
    setVerificationSent(false);
    setSendingCode(false);
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
    // 重置统一支付模式状态
    setPaymentMode('unified');
    setUnifiedPaymentMethod('CREDIT_CARD');
    setUnifiedPackageId(null);
    setUnifiedGiftCardAmount('');
    setUnifiedGiftCardNumber('');
    setUnifiedAdditionalPaymentMethod('');
    setTipPaymentMethod(''); // 空字符串表示跟随订单支付方式
  };

  const handleClose = () => {
    resetForm();
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
          // Use dynamic width for sliding effect - 统一宽度为700px
          width: {
            xs: '100%',
            sm: '100%',
            md: open ? '700px !important' : '0px !important',
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
            md: '700px', // 统一宽度，单服务和多服务保持一致
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
          width: '700px', // 统一固定宽度，单服务和多服务保持一致
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
              {CurrencyUtils.formatAmount((amounts.packageDiscountAmount > 0 || amounts.discountAmount > 0) ? amounts.originalAmount : amounts.subtotal)}
            </Typography>
          </Box>

          {/* Package Discount */}
          {amounts.packageDiscountAmount > 0 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography
                variant="body2"
                sx={{
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {t('payment.packageDiscount', '套餐抵扣')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                -{CurrencyUtils.formatAmount(amounts.packageDiscountAmount)}
              </Typography>
            </Box>
          )}

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
          {(amounts.packageDiscountAmount > 0 || amounts.discountAmount > 0) && (
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
              <Box display="flex" alignItems="center" gap={1}>
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
                {/* 套餐支付或礼品卡支付或多服务混合支付模式下显示小费支付方式 */}
                {(amounts.isPackagePayment || amounts.isGiftCardPayment || (services && services.length > 1 && paymentMode === 'mixed')) && tipPaymentMethod && (
                  <Chip
                    label={
                      tipPaymentMethod === 'CASH' ? t('payment.cash') :
                      tipPaymentMethod === 'CREDIT_CARD' ? t('payment.creditCard') :
                      tipPaymentMethod === 'DEBIT_CARD' ? t('payment.debitCard') :
                      tipPaymentMethod === 'GIFT_CARD' ? t('payment.giftCard') : ''
                    }
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.625rem',
                      fontWeight: 500,
                      bgcolor: alpha('#7BC68C', 0.1),
                      color: '#7BC68C',
                      border: 'none',
                      '& .MuiChip-label': {
                        px: '6px',
                        py: 0,
                      },
                    }}
                  />
                )}
              </Box>
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
              {[0, 12, 15, 18, 20, 'custom'].map((option) => {
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

            {/* 混合支付模式：选择小费后的醒目提示 */}
            {services && services.length > 1 && paymentMode === 'mixed' && (tipPercentage > 0 || (customTipAmount && parseFloat(customTipAmount) > 0)) && !tipPaymentMethod && (
              <Alert
                severity="warning"
                sx={{
                  mt: 1.5,
                  fontSize: '0.8125rem',
                  '& .MuiAlert-icon': {
                    fontSize: '1.25rem',
                  },
                  bgcolor: alpha('#f59e0b', 0.1),
                  border: '1px solid',
                  borderColor: alpha('#f59e0b', 0.3),
                  color: '#92400e',
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                  {t('payment.pleaseSelectTipPaymentMethodWarning', '请选择小费的支付方式')}
                </Typography>
              </Alert>
            )}

            {/* 小费支付方式 - 套餐支付或礼品卡支付或多服务混合支付且有小费时显示 - 简化为inline选择 */}
            {(amounts.isPackagePayment || amounts.isGiftCardPayment || (services && services.length > 1 && paymentMode === 'mixed')) && (tipPercentage > 0 || (customTipAmount && parseFloat(customTipAmount) > 0)) && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    {t('payment.tipPaymentMethod', '小费支付方式')}
                    {/* 混合支付模式下显示必填标记 */}
                    {services && services.length > 1 && paymentMode === 'mixed' && (
                      <Typography component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Typography>
                    )}:
                  </Typography>
                  <Select
                    value={tipPaymentMethod}
                    onChange={(e) => setTipPaymentMethod(e.target.value)}
                    size="small"
                    error={services && services.length > 1 && paymentMode === 'mixed' && !tipPaymentMethod}
                    renderValue={(value) => {
                      const iconStyle = { fontSize: '1.125rem', mr: 0.75, color: '#64748b' };
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {value === 'CASH' && <CashIcon sx={iconStyle} />}
                          {value === 'CREDIT_CARD' && <CreditCardIcon sx={iconStyle} />}
                          {value === 'DEBIT_CARD' && <DebitCardIcon sx={iconStyle} />}
                          {value === 'GIFT_CARD' && <GiftCardIcon sx={iconStyle} />}
                          <span>
                            {value === 'CASH' && t('payment.cash')}
                            {value === 'CREDIT_CARD' && t('payment.creditCard')}
                            {value === 'DEBIT_CARD' && t('payment.debitCard')}
                            {value === 'GIFT_CARD' && t('payment.giftCard')}
                          </span>
                        </Box>
                      );
                    }}
                    MenuProps={{
                      container: container || undefined,
                      disablePortal: false,
                      sx: {
                        zIndex: (container && container !== document.body) ? 10001 : 1302,
                      },
                      PaperProps: {
                        sx: {
                          mt: 0.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          borderRadius: 1.5,
                        },
                      },
                    }}
                    sx={{
                      fontSize: '0.8125rem',
                      minWidth: 140,
                      flex: 1,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: (services && services.length > 1 && paymentMode === 'mixed' && !tipPaymentMethod) ? '#ef4444' : '#e6eaee',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: (services && services.length > 1 && paymentMode === 'mixed' && !tipPaymentMethod) ? '#ef4444' : '#7BC68C',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: (services && services.length > 1 && paymentMode === 'mixed' && !tipPaymentMethod) ? '#ef4444' : '#7BC68C',
                        borderWidth: '1.5px',
                      },
                      '& .MuiSelect-select': {
                        py: 0.75,
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: '#0a0f1a',
                      },
                    }}
                  >
                    <MenuItem value="CASH" sx={{ fontSize: '0.8125rem', py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CashIcon sx={{ fontSize: '1.125rem', color: '#64748b' }} />
                      {t('payment.cash')}
                    </MenuItem>
                    <MenuItem value="CREDIT_CARD" sx={{ fontSize: '0.8125rem', py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon sx={{ fontSize: '1.125rem', color: '#64748b' }} />
                      {t('payment.creditCard')}
                    </MenuItem>
                    <MenuItem value="DEBIT_CARD" sx={{ fontSize: '0.8125rem', py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DebitCardIcon sx={{ fontSize: '1.125rem', color: '#64748b' }} />
                      {t('payment.debitCard')}
                    </MenuItem>
                    <MenuItem value="GIFT_CARD" sx={{ fontSize: '0.8125rem', py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GiftCardIcon sx={{ fontSize: '1.125rem', color: '#64748b' }} />
                      {t('payment.giftCard')}
                    </MenuItem>
                  </Select>
                </Box>
                {/* 混合支付模式下显示提示文本 */}
                {services && services.length > 1 && paymentMode === 'mixed' && !tipPaymentMethod && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {t('payment.tipPaymentMethodRequired', '请选择小费的支付方式')}
                  </Typography>
                )}
              </Box>
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

        {/* 多服务场景 - 支付模式切换（仅多服务时显示） */}
        {services && services.length > 1 && (
          <Box sx={{ mt: 3, mb: 2.5 }}>
            <Tabs
              value={paymentMode === 'unified' ? 0 : 1}
              onChange={(_, newValue) => {
                setPaymentMode(newValue === 0 ? 'unified' : 'mixed');
                setError(null);
              }}
              sx={{
                minHeight: 48,
                '& .MuiTabs-flexContainer': {
                  gap: 2,
                },
                '& .MuiTab-root': {
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  minHeight: 48,
                  minWidth: 120,
                  color: '#64748b',
                  '&.Mui-selected': {
                    fontWeight: 600,
                    color: '#10b981',
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  backgroundColor: '#10b981',
                },
              }}
            >
              <Tab label={t('payment.unifiedPayment', '统一支付')} />
              <Tab label={t('payment.mixedPayment', '混合支付')} />
            </Tabs>
          </Box>
        )}

        {/* 统一支付模式 - 单服务和多服务统一支付共用 */}
        {(!services || paymentMode === 'unified') && (
          <Box sx={{ mt: 2.5, mb: 3 }}>
            {/* 支付方式选择 */}
            <Box>
              {renderPaymentMethodSelector(
                services ? unifiedPaymentMethod : paymentMethod,
                (value) => {
                  if (services) {
                    setUnifiedPaymentMethod(value);
                  } else {
                    setPaymentMethod(value);
                    setVerificationError(null);
                  }
                  setError(null);
                },
                services && services.length > 1 // 多服务时才需要检查所有服务的套餐可用性
              )}

                {/* 套餐选择 */}
                {(((services && services.length > 0) && paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE') ||
                  (!services && paymentMethod === 'PACKAGE')) &&
                  customerPackages.length > 0 &&
                  renderPackageSelector(
                    services ? unifiedPackageId : selectedPackageId,
                    (value) => {
                      if (services) {
                        setUnifiedPackageId(value);
                      } else {
                        setSelectedPackageId(value);
                      }
                      setError(null);
                    }
                  )
                }

                {/* 套餐验证码 */}
                {((services && paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE' && unifiedPackageId) ||
                  (!services && paymentMethod === 'PACKAGE' && selectedPackageId)) &&
                  renderSmsVerification('unified-verification-code')
                }

                {/* 礼品卡输入 */}
                {((services && unifiedPaymentMethod === 'GIFT_CARD') ||
                  (!services && paymentMethod === 'GIFT_CARD')) && (
                  <Box sx={{ mt: 2 }}>
                    {renderGiftCardInput(
                      services ? unifiedGiftCardAmount : giftCardAmount,
                      (value) => {
                        if (services) {
                          setUnifiedGiftCardAmount(value);
                          const amount = parseFloat(value) || 0;
                          if (amount > 0 && (amounts.totalAmount - amount) > 0.01) {
                            // 金额不足，需要补充支付
                          } else {
                            setUnifiedAdditionalPaymentMethod('');
                          }
                        } else {
                          setGiftCardAmount(value);
                          const amount = parseFloat(value) || 0;
                          const totalAmount = amounts.totalAmount;
                          // 自动检测是否需要混合支付
                          if (amount > 0 && (totalAmount - amount) > 0.01) {
                            setIsMixedPayment(true);
                            setMixedPaymentMethods({ giftCard: amount });
                          } else {
                            setIsMixedPayment(false);
                            setMixedPaymentMethods({});
                          }
                        }
                        setError(null);
                      },
                      amounts.totalAmount,
                      '#f8fafc'
                    )}

                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        display: 'block',
                        mb: 2,
                      }}
                    >
                      {t('payment.orderTotal')}: {CurrencyUtils.formatAmount(amounts.totalAmount)}
                    </Typography>

                    {/* 礼品卡支付金额提示 */}
                    {(() => {
                      const giftAmount = parseFloat((services ? unifiedGiftCardAmount : giftCardAmount) || '0');
                      const remaining = amounts.totalAmount - giftAmount;

                      if (giftAmount <= 0) return null;

                      // 超过订单总额：不显示任何提示（已有红色错误提示）
                      if (giftAmount - amounts.totalAmount > 0.01) return null;

                      // 金额合适（差值在0.01以内）：显示绿色成功
                      if (Math.abs(remaining) <= 0.01) {
                        return (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label={`${t('payment.giftCardPayment')}: ${CurrencyUtils.formatAmount(giftAmount)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#10b981', 0.1),
                              color: '#059669',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                              mb: 1,
                              '& .MuiChip-icon': {
                                color: '#059669',
                              },
                            }}
                          />
                        );
                      }

                      // 金额不足：显示黄色警告和剩余金额
                      return (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={`${t('payment.giftCardPayment')}: ${CurrencyUtils.formatAmount(giftAmount)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#fbbf24', 0.1),
                              color: '#d97706',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                          <Chip
                            label={`${t('payment.remainingAmount')}: ${CurrencyUtils.formatAmount(remaining)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#d97706', 0.1),
                              color: '#d97706',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      );
                    })()}

                    {/* 补充支付方式 */}
                    {parseFloat((services ? unifiedGiftCardAmount : giftCardAmount) || '0') > 0 &&
                     (amounts.totalAmount - parseFloat((services ? unifiedGiftCardAmount : giftCardAmount) || '0')) > 0.01 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: '#64748b',
                            mb: 1,
                            fontSize: '0.75rem',
                            display: 'block',
                          }}
                        >
                          {t('payment.additionalPaymentMethod')}
                        </Typography>
                        <RadioGroup
                          value={unifiedAdditionalPaymentMethod}
                          onChange={(e) => {
                            setUnifiedAdditionalPaymentMethod(e.target.value);
                            setError(null);
                          }}
                          sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
                        >
                          <FormControlLabel
                            value="CREDIT_CARD"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.creditCard')}</Typography>}
                          />
                          <FormControlLabel
                            value="DEBIT_CARD"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.debitCard')}</Typography>}
                          />
                          <FormControlLabel
                            value="CASH"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.cash')}</Typography>}
                          />
                        </RadioGroup>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}

        {/* 混合支付模式 */}
        {paymentMode === 'mixed' && services && (
          <Box sx={{ mt: 2.5 }}>
            <Stack spacing={2}>
            {services.map((service, serviceIndex) => (
              <Box
                key={service.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e6eaee',
                }}
              >
                {/* 服务信息 - 紧凑显示 */}
                <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a0f1a', fontSize: '0.875rem' }}>
                    {service.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {/* 显示实际应付金额（含折扣和分摊税费）或原价 */}
                    {servicePaymentMethods[service.id] === 'PACKAGE' ? (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'line-through' }}>
                        ${service.price}
                      </Typography>
                    ) : serviceActualAmounts[service.id] ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>
                          {CurrencyUtils.formatAmount(serviceActualAmounts[service.id])}
                        </Typography>
                        {customer?.membershipTier?.discountRate && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem' }}>
                            {t('payment.originalPrice', '原价')} ${service.price}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.875rem' }}>
                        ${service.price}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* 支付方式选择 - 使用Grid布局横向展示 */}
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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 1,
                    }}
                  >
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, pr: 0.5, width: '100%' }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1,
                                    bgcolor: isSelected ? alpha('#10b981', 0.12) : '#f8fafc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Icon sx={{ fontSize: 16, color: isSelected ? '#10b981' : '#64748b' }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a0f1a', fontSize: '0.8125rem' }}>
                                    {method.label}
                                  </Typography>
                                  {description && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {description}
                                    </Typography>
                                  )}
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
                  </Box>
                </RadioGroup>

                {/* 如果选择了 PACKAGE，显示套餐选择 */}
                {servicePaymentMethods[service.id] === 'PACKAGE' && customerPackages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {renderPackageSelector(
                      servicePackageIds[service.id] || null,
                      (value) => {
                        setServicePackageIds({
                          ...servicePackageIds,
                          [service.id]: value
                        });
                        setError(null);
                      },
                      service
                    )}
                  </Box>
                )}

                {/* 如果选择了 GIFT_CARD，显示礼品卡金额输入 */}
                {servicePaymentMethods[service.id] === 'GIFT_CARD' && (
                  <Box sx={{ mt: 2 }}>
                    {/* 礼品卡支付金额输入 */}
                    {renderGiftCardInput(
                      serviceGiftCardAmounts[service.id] || '',
                      (value) => {
                        setServiceGiftCardAmounts({
                          ...serviceGiftCardAmounts,
                          [service.id]: value,
                        });
                        const amount = parseFloat(value) || 0;
                        const actualAmount = serviceActualAmounts[service.id] || Number(service.price);

                        // 如果礼品卡金额小于实际应付金额，需要选择补充支付方式
                        if (amount > 0 && (actualAmount - amount) > 0.01) {
                          // 不自动设置，让用户选择（UI已显示选项，无需提示错误）
                        } else {
                          // 清除补充支付方式
                          const newAdditionalMethods = { ...serviceAdditionalPaymentMethods };
                          delete newAdditionalMethods[service.id];
                          setServiceAdditionalPaymentMethods(newAdditionalMethods);
                        }
                      },
                      serviceActualAmounts[service.id] || Number(service.price),
                      '#ffffff'
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        display: 'block',
                        mb: 2,
                      }}
                    >
                      {t('payment.actualAmount', '实际应付')}: {CurrencyUtils.formatAmount(serviceActualAmounts[service.id] || Number(service.price))}
                      {serviceActualAmounts[service.id] && customer?.membershipTier?.discountRate && (
                        <Typography component="span" sx={{ ml: 1, color: '#9ca3af', fontSize: '0.6875rem' }}>
                          ({t('payment.originalPrice', '原价')} ${service.price})
                        </Typography>
                      )}
                    </Typography>

                    {/* 显示支付金额信息 - 简化版 */}
                    {(() => {
                      const giftAmount = parseFloat(serviceGiftCardAmounts[service.id] || '0');
                      const actualAmount = serviceActualAmounts[service.id] || Number(service.price);
                      const remaining = actualAmount - giftAmount;

                      if (giftAmount <= 0) return null;

                      // 超过实际应付金额：不显示任何提示（已有红色错误提示）
                      if (giftAmount - actualAmount > 0.01) return null;

                      // 金额合适（差值在0.01以内）：显示绿色成功
                      if (Math.abs(remaining) <= 0.01) {
                        return (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label={`${t('payment.giftCardPayment')}: ${CurrencyUtils.formatAmount(giftAmount)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#10b981', 0.1),
                              color: '#059669',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                              mb: 1,
                              '& .MuiChip-icon': {
                                color: '#059669',
                              },
                            }}
                          />
                        );
                      }

                      // 金额不足：显示黄色警告和剩余金额
                      return (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            mb: 1,
                          }}
                        >
                          <Chip
                            label={`${t('payment.giftCardPayment')}: ${CurrencyUtils.formatAmount(giftAmount)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#fbbf24', 0.1),
                              color: '#d97706',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                          <Chip
                            label={`${t('payment.remainingAmount')}: ${CurrencyUtils.formatAmount(remaining)}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#d97706', 0.1),
                              color: '#d97706',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </Box>
                      );
                    })()}

                    {/* 混合支付选项 - 当礼品卡金额不足时 */}
                    {parseFloat(serviceGiftCardAmounts[service.id] || '0') > 0 &&
                     ((serviceActualAmounts[service.id] || Number(service.price)) - parseFloat(serviceGiftCardAmounts[service.id] || '0')) > 0.01 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: '#64748b',
                            mb: 1,
                            fontSize: '0.75rem',
                            display: 'block',
                          }}
                        >
                          {t('payment.additionalPaymentMethod')}
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
                          sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}
                        >
                          <FormControlLabel
                            value="CREDIT_CARD"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.creditCard')}</Typography>}
                          />
                          <FormControlLabel
                            value="DEBIT_CARD"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.debitCard')}</Typography>}
                          />
                          <FormControlLabel
                            value="CASH"
                            control={<Radio size="small" sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }} />}
                            label={<Typography sx={{ fontSize: '0.8125rem' }}>{t('payment.cash')}</Typography>}
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
        {services && services.length > 1 && paymentMode === 'mixed' && (() => {
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
                      {t('payment.verification')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.6875rem',
                        color: '#64748b',
                        mt: 0.25,
                      }}
                    >
                      {verificationSent ? t('payment.enterVerificationCode') : t('payment.sendCode')}
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
                    `${t('payment.resend')} (${countdown}s)`
                  ) : verificationSent ? (
                    t('payment.resend')
                  ) : (
                    t('payment.sendCode')
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
              (!services && paymentMethod === 'PACKAGE' && customerPackages.length > 1 && !selectedPackageId) ||
              // 单服务场景：选择了礼品卡但未输入金额
              (!services && paymentMethod === 'GIFT_CARD' && (!giftCardAmount || parseFloat(giftCardAmount) <= 0)) ||
              // 单服务场景：礼品卡金额超过订单总额
              (!services && paymentMethod === 'GIFT_CARD' && (parseFloat(giftCardAmount || '0') - amounts.totalAmount) > 0.01) ||
              // 单服务场景：礼品卡金额不足且未选择补充支付方式
              (!services && paymentMethod === 'GIFT_CARD' &&
                parseFloat(giftCardAmount || '0') > 0 &&
                (amounts.totalAmount - parseFloat(giftCardAmount || '0')) > 0.01 &&
                !unifiedAdditionalPaymentMethod) ||
              // 多服务统一支付：如果选择了PACKAGE但没有选择具体的套餐
              (services && paymentMode === 'unified' && unifiedPaymentMethod === 'PACKAGE' && !unifiedPackageId) ||
              // 多服务统一支付：选择了礼品卡但未输入金额
              (services && paymentMode === 'unified' && unifiedPaymentMethod === 'GIFT_CARD' && (!unifiedGiftCardAmount || parseFloat(unifiedGiftCardAmount) <= 0)) ||
              // 多服务统一支付：礼品卡金额超过订单总额
              (services && unifiedPaymentMethod === 'GIFT_CARD' && (parseFloat(unifiedGiftCardAmount || '0') - amounts.totalAmount) > 0.01) ||
              // 多服务统一支付：礼品卡金额不足且未选择补充支付方式
              (services && paymentMode === 'unified' && unifiedPaymentMethod === 'GIFT_CARD' &&
                parseFloat(unifiedGiftCardAmount || '0') > 0 &&
                (amounts.totalAmount - parseFloat(unifiedGiftCardAmount || '0')) > 0.01 &&
                !unifiedAdditionalPaymentMethod) ||
              // 多服务混合支付：如果选择了PACKAGE但没有选择具体的套餐
              (services && paymentMode === 'mixed' && services.some(service =>
                servicePaymentMethods[service.id] === 'PACKAGE' && !servicePackageIds[service.id]
              )) ||
              // 多服务混合支付：选择了礼品卡但未输入金额
              (services && paymentMode === 'mixed' && services.some(service => {
                const isGiftCard = servicePaymentMethods[service.id] === 'GIFT_CARD';
                const giftAmount = parseFloat(serviceGiftCardAmounts[service.id] || '0');
                return isGiftCard && giftAmount <= 0;
              })) ||
              // 多服务混合支付：礼品卡金额不足且未选择补充支付方式
              (services && paymentMode === 'mixed' && services.some(service => {
                const isGiftCard = servicePaymentMethods[service.id] === 'GIFT_CARD';
                const giftAmount = parseFloat(serviceGiftCardAmounts[service.id] || '0');
                const actualAmount = serviceActualAmounts[service.id] || Number(service.price);
                const needsAdditional = giftAmount > 0 && (actualAmount - giftAmount) > 0.01;
                const hasAdditional = !!serviceAdditionalPaymentMethods[service.id];
                return isGiftCard && needsAdditional && !hasAdditional;
              })) ||
              // 多服务混合支付：检查每个服务的礼品卡金额是否超过实际应付金额
              (services && paymentMode === 'mixed' && services.some(service => {
                const isGiftCard = servicePaymentMethods[service.id] === 'GIFT_CARD';
                const giftAmount = parseFloat(serviceGiftCardAmounts[service.id] || '0');
                const actualAmount = serviceActualAmounts[service.id] || Number(service.price);
                return isGiftCard && giftAmount > 0 && (giftAmount - actualAmount) > 0.01;
              }))
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
