import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Avatar,
    InputAdornment,
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Divider,
    alpha,
    Menu,
    ListItemIcon,
    Alert,
    Snackbar,
    Popover,
    Card,
    CardContent,
    Collapse,
    useMediaQuery,
    useTheme as useMuiTheme,
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    AttachMoney as MoneyIcon,
    CreditCard as CreditCardIcon,
    Payment as PaymentIcon,
    AccountBalance as DebitCardIcon,
    AccountBalanceWallet as WalletIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    EventNote as EventNoteIcon,
    Undo as RefundIcon,
    MoreVert as MoreVertIcon,
    CardGiftcard as PackageIcon,
    Style as GiftCardIcon,
    Event as EventIcon,
    CompareArrows as MixedPaymentIcon,
    // Membership tier icons
    Star as StarIcon,
    StarHalf as StarHalfIcon,
    StarRate as StarRateIcon,
    Grade as GradeIcon,
    Stars as StarsIcon,
    EmojiEvents as TrophyIcon,
    MilitaryTech as MedalIcon,
    Diamond as DiamondIcon,
    WorkspacePremium as PremiumIcon,
    Verified as VerifiedIcon,
    CardMembership as MembershipIcon,
    TrendingUp as TrendingUpIcon,
    Loyalty as LoyaltyIcon,
    Favorite as HeartIcon,
    AutoAwesome as SparkleIcon,
    Whatshot as FireIcon,
    Celebration as CelebrationIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';
import { formatUtcToMerchantTime, getMerchantNow } from '../../../utils/timezoneUtils';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';

interface MembershipTier {
    id: number;
    name: string;
    code: string;
    requiredPoints: number;
    discountRate: number;
    color?: string;
    icon?: string;
    benefits?: string;
    isActive: boolean;
}

interface Order {
    id: number;
    orderNumber: string;
    customerId: number;
    customerName: string;
    customerPhone: string;
    customerMembershipTier?: MembershipTier;
    appointmentId?: number;
    resourceId?: number;
    resourceName?: string;
    resourceType?: string;
    services?: any[];
    subtotal: number;
    taxAmount: number;
    tipAmount: number;
    tipPaymentMethod?: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    completedAt?: string;
    notes?: string;
    refundAmount?: number;
    refundReason?: string;
}

interface RefundReason {
    value: string;
    translationKey: string;
    stripe_value: string;
}

const OrderHistory: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { hasPermission } = usePermission();
    const navigate = useNavigate();
    const { themeMode } = useTheme();
    const muiTheme = useMuiTheme();

    // 移动端检测
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    // Theme-aware colors
    const isMonochrome = themeMode === 'monochrome';
    const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#10B981';
    const THEME_COLOR_DARK = isMonochrome ? '#333' : '#059669';

    // Get locale for date picker
    const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;

    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const [detailsDialog, setDetailsDialog] = useState(false);
    const [refundDialog, setRefundDialog] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundReasons, setRefundReasons] = useState<RefundReason[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOrder, setMenuOrder] = useState<Order | null>(null);
    const [refundError, setRefundError] = useState<string | null>(null);
    const [refundSuccess, setRefundSuccess] = useState(false);

    // Update payment method dialog states
    const [updatePaymentMethodDialog, setUpdatePaymentMethodDialog] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [updateReason, setUpdateReason] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Date picker popover states
    const [startDateAnchorEl, setStartDateAnchorEl] = useState<null | HTMLElement>(null);
    const [endDateAnchorEl, setEndDateAnchorEl] = useState<null | HTMLElement>(null);

    // 移动端筛选面板展开状态
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
        const today = getMerchantNow();
        return {
            start: today,
            end: today,
        };
    });

    // Get membership tier icon
    const getTierIcon = (iconName: string) => {
        switch (iconName) {
            case 'star': return <StarIcon />;
            case 'starhalf': return <StarHalfIcon />;
            case 'starrate': return <StarRateIcon />;
            case 'grade': return <GradeIcon />;
            case 'stars': return <StarsIcon />;
            case 'trophy': return <TrophyIcon />;
            case 'medal': return <MedalIcon />;
            case 'diamond': return <DiamondIcon />;
            case 'premium': return <PremiumIcon />;
            case 'verified': return <VerifiedIcon />;
            case 'membership': return <MembershipIcon />;
            case 'trendingup': return <TrendingUpIcon />;
            case 'loyalty': return <LoyaltyIcon />;
            case 'redeem': return <GiftCardIcon />;
            case 'heart': return <HeartIcon />;
            case 'sparkle': return <SparkleIcon />;
            case 'fire': return <FireIcon />;
            case 'celebration': return <CelebrationIcon />;
            default: return <StarIcon />;
        }
    };

    const fetchOrders = useCallback(async () => {
        try {
            // 后端会处理时区转换，前端只需发送商户本地日期
            const params = {
                tenantId: user?.tenantId || 0,
                page: page,
                size: rowsPerPage,
                searchTerm: searchTerm || undefined,
                paymentStatus: paymentStatusFilter || undefined,
                orderStatus: orderStatusFilter || undefined,
                paymentMethod: paymentMethodFilter || undefined,
                startDate: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined,
                endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined,
            };

            const response = await api.getOrders(params);
            setOrders(response?.content || []);
            setTotalElements(response?.totalElements || 0);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, paymentMethodFilter, dateRange]);

    useEffect(() => {
        if (user?.tenantId) {
            fetchOrders();
        }
    }, [user, page, rowsPerPage, searchTerm, paymentStatusFilter, orderStatusFilter, paymentMethodFilter, dateRange, fetchOrders]);

    // 获取退款原因选项
    useEffect(() => {
        // 使用国际化的退款原因选项
        setRefundReasons([
            { value: 'DUPLICATE_CHARGE', translationKey: 'orders.refundReasons.duplicateCharge', stripe_value: 'duplicate' },
            { value: 'FRAUDULENT', translationKey: 'orders.refundReasons.fraudulent', stripe_value: 'fraudulent' },
            { value: 'CUSTOMER_REQUEST', translationKey: 'orders.refundReasons.customerRequest', stripe_value: 'requested_by_customer' },
            { value: 'PRODUCT_UNACCEPTABLE', translationKey: 'orders.refundReasons.productUnacceptable', stripe_value: 'product_unacceptable' },
            { value: 'SERVICE_UNSATISFACTORY', translationKey: 'orders.refundReasons.serviceUnsatisfactory', stripe_value: 'service_unsatisfactory' },
            { value: 'ORDER_CANCELLED', translationKey: 'orders.refundReasons.orderCancelled', stripe_value: 'order_cancelled' },
            { value: 'OTHER', translationKey: 'orders.refundReasons.other', stripe_value: 'other' }
        ]);
    }, []);

    const handlePageChange = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusChip = (status: string) => {
        // Payment status colors - paid uses theme color in monochrome mode
        const paidColor = isMonochrome ? '#1a1a1a' : '#10B981';
        const statusConfig = {
            pending: { color: isMonochrome ? '#6a6a6a' : '#F59E0B', bg: isMonochrome ? 'rgba(106, 106, 106, 0.1)' : alpha('#F59E0B', 0.1), label: t('orders.pending') },
            paid: { color: paidColor, bg: isMonochrome ? 'rgba(26, 26, 26, 0.1)' : alpha('#10B981', 0.1), label: t('orders.paid') },
            refunded: { color: isMonochrome ? '#4a4a4a' : '#EF4444', bg: isMonochrome ? 'rgba(74, 74, 74, 0.1)' : alpha('#EF4444', 0.1), label: t('orders.refunded') },
            failed: { color: isMonochrome ? '#4a4a4a' : '#EF4444', bg: isMonochrome ? 'rgba(74, 74, 74, 0.1)' : alpha('#EF4444', 0.1), label: t('orders.failed') },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

        return (
            <Chip
                label={config.label}
                sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                }}
            />
        );
    };

    const getOrderStatusChip = (status: string) => {
        // Order status colors - completed uses theme color in monochrome mode
        const completedColor = isMonochrome ? '#1a1a1a' : '#10B981';
        const statusConfig = {
            draft: { color: isMonochrome ? '#6a6a6a' : '#6B7280', bg: isMonochrome ? 'rgba(106, 106, 106, 0.1)' : alpha('#6B7280', 0.1), label: t('orders.draft') },
            confirmed: { color: isMonochrome ? '#4a4a4a' : '#3B82F6', bg: isMonochrome ? 'rgba(74, 74, 74, 0.1)' : alpha('#3B82F6', 0.1), label: t('orders.confirmed') },
            in_progress: { color: isMonochrome ? '#6a6a6a' : '#F59E0B', bg: isMonochrome ? 'rgba(106, 106, 106, 0.1)' : alpha('#F59E0B', 0.1), label: t('orders.inProgress') },
            completed: { color: completedColor, bg: isMonochrome ? 'rgba(26, 26, 26, 0.1)' : alpha('#10B981', 0.1), label: t('orders.completed') },
            cancelled: { color: isMonochrome ? '#4a4a4a' : '#EF4444', bg: isMonochrome ? 'rgba(74, 74, 74, 0.1)' : alpha('#EF4444', 0.1), label: t('orders.cancelled') },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

        return (
            <Chip
                label={config.label}
                sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                }}
            />
        );
    };

    const getPaymentMethodIcon = (method: string) => {
        const iconColor = isMonochrome ? '#1a1a1a' : '#6B7280';
        switch (method) {
            case 'cash': return <MoneyIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'credit_card': return <CreditCardIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'debit_card': return <DebitCardIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'mobile_pay': return <WalletIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'package': return <PackageIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'gift_card': return <GiftCardIcon sx={{ fontSize: 16, color: iconColor }} />;
            case 'mixed': return <MixedPaymentIcon sx={{ fontSize: 16, color: iconColor }} />;
            default: return <PaymentIcon sx={{ fontSize: 16, color: iconColor }} />;
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsDialog(true);
    };

    const handleRefund = (order: Order) => {
        setSelectedOrder(order);
        setRefundAmount(order.totalAmount.toString());
        setRefundReason('');
        setRefundDialog(true);
    };

    const processRefund = async () => {
        if (!selectedOrder || !refundAmount || !refundReason) {
            setRefundError(t('orders.refundValidationError'));
            return;
        }

        // 验证退款金额
        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0 || amount > selectedOrder.totalAmount) {
            setRefundError(t('orders.invalidRefundAmount'));
            return;
        }

        setRefundLoading(true);
        setRefundError(null);

        try {
            const response = await api.processRefund({
                orderId: selectedOrder.id,
                amount: amount,
                reason: refundReason,
            });

            // 检查响应是否成功
            if (response && response.success !== false) {
                // 刷新订单列表
                await fetchOrders();

                // 显示成功提示
                setRefundSuccess(true);

                // 关闭对话框
                setRefundDialog(false);
                setRefundAmount('');
                setRefundReason('');
                setSelectedOrder(null);
            } else {
                setRefundError(response?.message || t('orders.refundFailed'));
            }
        } catch (error: any) {
            console.error('Failed to process refund:', error);

            // 提取错误信息
            let errorMessage = t('orders.refundFailed');
            if (error.responseData?.message) {
                errorMessage = error.responseData.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setRefundError(errorMessage);
        } finally {
            setRefundLoading(false);
        }
    };

    const canRefund = (order: Order) => {
        return order.paymentStatus === 'paid' && order.orderStatus === 'completed';
    };

    // Update payment method handlers
    const handleUpdatePaymentMethod = (order: Order) => {
        setSelectedOrder(order);
        setNewPaymentMethod('');
        setUpdateReason('');
        setUpdateError(null);
        setUpdatePaymentMethodDialog(true);
    };

    const processUpdatePaymentMethod = async () => {
        if (!selectedOrder || !newPaymentMethod || !updateReason) {
            setUpdateError(t('orders.updateReasonRequired'));
            return;
        }

        // 验证新支付方式与当前不同
        if (newPaymentMethod === selectedOrder.tipPaymentMethod) {
            setUpdateError(t('orders.newPaymentMethodRequired'));
            return;
        }

        setUpdateLoading(true);
        setUpdateError(null);

        try {
            const response = await api.updateTipPaymentMethod({
                orderId: selectedOrder.id,
                newPaymentMethod: newPaymentMethod,
                reason: updateReason,
            });

            // 检查响应是否成功
            if (response && response.success !== false) {
                // 刷新订单列表
                await fetchOrders();

                // 显示成功提示
                setUpdateSuccess(true);

                // 关闭对话框
                setUpdatePaymentMethodDialog(false);
                setNewPaymentMethod('');
                setUpdateReason('');
                setSelectedOrder(null);
            } else {
                setUpdateError(response?.message || t('orders.paymentMethodUpdateFailed'));
            }
        } catch (error: any) {
            console.error('Failed to update payment method:', error);

            // 提取错误信息
            let errorMessage = t('orders.paymentMethodUpdateFailed');
            if (error.responseData?.message) {
                errorMessage = error.responseData.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setUpdateError(errorMessage);
        } finally {
            setUpdateLoading(false);
        }
    };

    const canUpdatePaymentMethod = (order: Order) => {
        // 只能修改已完成且已支付的订单
        if (order.orderStatus !== 'completed' || order.paymentStatus !== 'paid') {
            return false;
        }
        // 不能修改已退款的订单
        if (order.refundAmount && order.refundAmount > 0) {
            return false;
        }
        // 只有有小费的订单才能修改小费支付方式
        if (!order.tipAmount || order.tipAmount <= 0) {
            return false;
        }
        return true;
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
        setAnchorEl(event.currentTarget);
        setMenuOrder(order);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuOrder(null);
    };

    const handleMenuViewDetails = () => {
        if (menuOrder) {
            handleViewDetails(menuOrder);
        }
        handleMenuClose();
    };

    const handleMenuRefund = () => {
        if (menuOrder) {
            handleRefund(menuOrder);
        }
        handleMenuClose();
    };

    const handleMenuUpdatePaymentMethod = () => {
        if (menuOrder) {
            handleUpdatePaymentMethod(menuOrder);
        }
        handleMenuClose();
    };

    const formatDateTime = (dateString: string) => {
        // 将 UTC 时间转换为商户本地时区
        const fullDateTime = formatUtcToMerchantTime(dateString, 'yyyy-MM-dd HH:mm:ss');
        const [date, time] = fullDateTime.split(' ');
        return { date, time };
    };

    return (
        <Box>
            {/* Search and Filter Section - 响应式设计 */}
            {isMobile ? (
                /* 移动端筛选布局 */
                <Box sx={{ mb: 1.5 }}>
                    {/* 搜索栏 + 筛选按钮 */}
                    <Box display="flex" gap={1} mb={1.5} alignItems="stretch">
                        <TextField
                            placeholder={t('orders.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    bgcolor: '#fafafa',
                                    fontSize: '0.8rem',
                                    height: 40,
                                    '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                    '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                                },
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <IconButton
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            sx={{
                                border: '1px solid rgba(0,0,0,0.12)',
                                borderRadius: 1.5,
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                color: filtersExpanded ? THEME_COLOR : '#666',
                                bgcolor: filtersExpanded ? alpha(THEME_COLOR, 0.08) : 'transparent',
                            }}
                        >
                            <FilterListIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* 可折叠筛选面板 */}
                    <Collapse in={filtersExpanded}>
                        <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                                        {t('orders.paymentMethod')}
                                    </InputLabel>
                                    <Select
                                        value={paymentMethodFilter}
                                        label={t('orders.paymentMethod')}
                                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                        sx={{
                                            borderRadius: 1.5,
                                            bgcolor: '#fafafa',
                                            fontSize: '0.75rem',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('orders.allMethods')}</MenuItem>
                                        <MenuItem value="cash" sx={{ fontSize: '0.75rem' }}>{t('orders.cash')}</MenuItem>
                                        <MenuItem value="credit_card" sx={{ fontSize: '0.75rem' }}>{t('orders.credit_card')}</MenuItem>
                                        <MenuItem value="debit_card" sx={{ fontSize: '0.75rem' }}>{t('orders.debit_card')}</MenuItem>
                                        <MenuItem value="package" sx={{ fontSize: '0.75rem' }}>{t('orders.package')}</MenuItem>
                                        <MenuItem value="gift_card" sx={{ fontSize: '0.75rem' }}>{t('orders.gift_card')}</MenuItem>
                                        <MenuItem value="mixed" sx={{ fontSize: '0.75rem' }}>{t('orders.mixed')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontSize: '0.75rem', '&.Mui-focused': { color: THEME_COLOR } }}>
                                        {t('orders.paymentStatus')}
                                    </InputLabel>
                                    <Select
                                        value={paymentStatusFilter}
                                        label={t('orders.paymentStatus')}
                                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                        sx={{
                                            borderRadius: 1.5,
                                            bgcolor: '#fafafa',
                                            fontSize: '0.75rem',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('orders.allPayments')}</MenuItem>
                                        <MenuItem value="pending" sx={{ fontSize: '0.75rem' }}>{t('orders.pending')}</MenuItem>
                                        <MenuItem value="paid" sx={{ fontSize: '0.75rem' }}>{t('orders.paid')}</MenuItem>
                                        <MenuItem value="refunded" sx={{ fontSize: '0.75rem' }}>{t('orders.refunded')}</MenuItem>
                                        <MenuItem value="failed" sx={{ fontSize: '0.75rem' }}>{t('orders.failed')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    size="small"
                                    label={t('orders.startDate')}
                                    value={format(dateRange.start, 'MM-dd')}
                                    onClick={(e) => setStartDateAnchorEl(e.currentTarget)}
                                    fullWidth
                                    sx={{
                                        WebkitTapHighlightColor: 'transparent',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            bgcolor: '#fafafa',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                            '&.Mui-focused fieldset': { borderColor: THEME_COLOR },
                                        },
                                        '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                                    }}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <EventIcon sx={{ fontSize: 16, color: '#999' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    size="small"
                                    label={t('orders.endDate')}
                                    value={format(dateRange.end, 'MM-dd')}
                                    onClick={(e) => setEndDateAnchorEl(e.currentTarget)}
                                    fullWidth
                                    sx={{
                                        WebkitTapHighlightColor: 'transparent',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1.5,
                                            bgcolor: '#fafafa',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                            '&.Mui-focused fieldset': { borderColor: THEME_COLOR },
                                        },
                                        '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                                    }}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <EventIcon sx={{ fontSize: 16, color: '#999' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Collapse>
                </Box>
            ) : (
                /* 桌面端筛选布局 */
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 2.5,
                        alignItems: 'center',
                    }}
                >
                    <TextField
                        placeholder={t('orders.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        sx={{
                            minWidth: 280,
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#fafafa',
                                '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                                '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel sx={{ '&.Mui-focused': { color: THEME_COLOR } }}>
                            {t('orders.paymentMethod')}
                        </InputLabel>
                        <Select
                            value={paymentMethodFilter}
                            label={t('orders.paymentMethod')}
                            onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            sx={{
                                borderRadius: 2,
                                bgcolor: '#fafafa',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.15)' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: 1 },
                            }}
                        >
                            <MenuItem value="">{t('orders.allMethods')}</MenuItem>
                            <MenuItem value="cash">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('cash')}
                                    {t('orders.cash')}
                                </Box>
                            </MenuItem>
                            <MenuItem value="credit_card">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('credit_card')}
                                    {t('orders.credit_card')}
                                </Box>
                            </MenuItem>
                            <MenuItem value="debit_card">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('debit_card')}
                                    {t('orders.debit_card')}
                                </Box>
                            </MenuItem>
                            <MenuItem value="package">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('package')}
                                    {t('orders.package')}
                                </Box>
                            </MenuItem>
                            <MenuItem value="gift_card">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('gift_card')}
                                    {t('orders.gift_card')}
                                </Box>
                            </MenuItem>
                            <MenuItem value="mixed">
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getPaymentMethodIcon('mixed')}
                                    {t('orders.mixed')}
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ '&.Mui-focused': { color: THEME_COLOR } }}>
                            {t('orders.paymentStatus')}
                        </InputLabel>
                        <Select
                            value={paymentStatusFilter}
                            label={t('orders.paymentStatus')}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            sx={{
                                borderRadius: 2,
                                bgcolor: '#fafafa',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.15)' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR, borderWidth: 1 },
                            }}
                        >
                            <MenuItem value="">{t('orders.allPayments')}</MenuItem>
                            <MenuItem value="pending">{t('orders.pending')}</MenuItem>
                            <MenuItem value="paid">{t('orders.paid')}</MenuItem>
                            <MenuItem value="refunded">{t('orders.refunded')}</MenuItem>
                            <MenuItem value="failed">{t('orders.failed')}</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label={t('orders.startDate')}
                        value={format(dateRange.start, 'yyyy-MM-dd')}
                        onClick={(e) => setStartDateAnchorEl(e.currentTarget)}
                        sx={{
                            minWidth: 140,
                            WebkitTapHighlightColor: 'transparent',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#fafafa',
                                cursor: 'pointer',
                                '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                                '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                        }}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <EventIcon sx={{ fontSize: 18, color: '#999' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        size="small"
                        label={t('orders.endDate')}
                        value={format(dateRange.end, 'yyyy-MM-dd')}
                        onClick={(e) => setEndDateAnchorEl(e.currentTarget)}
                        sx={{
                            minWidth: 140,
                            WebkitTapHighlightColor: 'transparent',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#fafafa',
                                cursor: 'pointer',
                                '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                                '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                                '&.Mui-focused fieldset': { borderColor: THEME_COLOR, borderWidth: 1 },
                            },
                            '& .MuiInputLabel-root.Mui-focused': { color: THEME_COLOR },
                        }}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <EventIcon sx={{ fontSize: 18, color: '#999' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            )}

            {/* Orders List - 移动端卡片视图 / 桌面端表格视图 */}
            {isMobile ? (
                /* 移动端卡片列表 */
                <Box>
                    {orders && orders.length === 0 ? (
                        <Box
                            sx={{
                                py: 4,
                                textAlign: 'center',
                                bgcolor: '#fff',
                                borderRadius: 1.5,
                                border: '1px solid rgba(0,0,0,0.08)',
                            }}
                        >
                            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                {t('orders.noOrders')}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {orders && orders.map((order) => {
                                const dateTime = formatDateTime(order.createdAt);
                                return (
                                    <Card
                                        key={order.id}
                                        sx={{
                                            mb: 1.5,
                                            borderRadius: 1.5,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            border: '1px solid rgba(0,0,0,0.06)',
                                        }}
                                        onClick={() => handleViewDetails(order)}
                                    >
                                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                            {/* 第一行：订单号、日期、操作按钮 */}
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: THEME_COLOR }}>
                                                        {order.orderNumber}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                                                        {dateTime.date} {dateTime.time}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMenuOpen(e, order);
                                                        }}
                                                        sx={{ color: '#999', p: 0.5 }}
                                                    >
                                                        <MoreVertIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            {/* 第二行：客户信息 */}
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                <Typography sx={{ fontWeight: 500, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                    {order.customerName}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: '#888' }}>
                                                    {order.services?.length || 0} {t('orders.items')}
                                                </Typography>
                                            </Box>

                                            {/* 第三行：支付方式、状态、金额 */}
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    {getPaymentMethodIcon(order.paymentMethod)}
                                                    {getStatusChip(order.paymentStatus)}
                                                </Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: THEME_COLOR }}>
                                                    {CurrencyUtils.formatAmount(order.totalAmount)}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* 移动端简化分页 */}
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    bgcolor: '#fff',
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(0,0,0,0.08)',
                                }}
                            >
                                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                                    {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalElements)} / {totalElements}
                                </Typography>
                                <Box display="flex" gap={1}>
                                    <Button
                                        size="small"
                                        disabled={page === 0}
                                        onClick={() => setPage(page - 1)}
                                        sx={{
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            fontSize: '0.75rem',
                                            color: '#666',
                                            borderRadius: 1,
                                        }}
                                    >
                                        {t('common.previousPage')}
                                    </Button>
                                    <Button
                                        size="small"
                                        disabled={(page + 1) * rowsPerPage >= totalElements}
                                        onClick={() => setPage(page + 1)}
                                        sx={{
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            fontSize: '0.75rem',
                                            color: THEME_COLOR,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {t('common.nextPage')}
                                    </Button>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            ) : (
                /* 桌面端表格 */
                <Box
                    sx={{
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        bgcolor: '#fff',
                    }}
                >
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.orderNumber')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.customer')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.services')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.subtotal')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.tax')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.tip')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.total')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.payment')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.paymentStatus')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.date')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{t('orders.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders && orders.map((order) => {
                                    const dateTime = formatDateTime(order.createdAt);
                                    return (
                                        <TableRow
                                            key={order.id}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: alpha(THEME_COLOR, 0.04),
                                                },
                                                transition: 'background-color 0.2s ease',
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                                    {order.orderNumber}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            bgcolor: isMonochrome ? '#1a1a1a' : '#6366F1',
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {order.customerName.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {order.customerName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {order.customerPhone}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {order.services?.length || 0} {t('orders.items')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {CurrencyUtils.formatAmount(order.subtotal)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {CurrencyUtils.formatAmount(order.taxAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {CurrencyUtils.formatAmount(order.tipAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: THEME_COLOR }}>
                                                    {CurrencyUtils.formatAmount(order.totalAmount)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {getPaymentMethodIcon(order.paymentMethod)}
                                                    {getStatusChip(order.paymentStatus)}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {getOrderStatusChip(order.orderStatus)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{dateTime.date}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {dateTime.time}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => handleMenuOpen(event, order)}
                                                    sx={{
                                                        color: '#999',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(0,0,0,0.04)',
                                                            color: '#666',
                                                        },
                                                    }}
                                                >
                                                    <MoreVertIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={totalElements}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        labelRowsPerPage={t('common.rowsPerPage')}
                        sx={{
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            backgroundColor: '#f8fafc',
                        }}
                    />
                </Box>
            )}

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            minWidth: 180,
                            mt: 0.5,
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem
                    onClick={handleMenuViewDetails}
                    sx={{
                        '&:hover': {
                            backgroundColor: alpha(THEME_COLOR, 0.08),
                        },
                    }}
                >
                    <ListItemIcon>
                        <VisibilityIcon sx={{ fontSize: 18, color: isMonochrome ? '#6a6a6a' : '#6366F1' }} />
                    </ListItemIcon>
                    <Typography variant="body2">{t('orders.viewDetails')}</Typography>
                </MenuItem>
                {hasPermission('orders:update_payment_method') && menuOrder && canUpdatePaymentMethod(menuOrder) && (
                    <MenuItem
                        onClick={handleMenuUpdatePaymentMethod}
                        sx={{
                            '&:hover': {
                                backgroundColor: alpha(THEME_COLOR, 0.08),
                            },
                        }}
                    >
                        <ListItemIcon>
                            <CreditCardIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                        </ListItemIcon>
                        <Typography variant="body2">{t('orders.updatePaymentMethod')}</Typography>
                    </MenuItem>
                )}
                {/* Refund functionality temporarily disabled */}
                {/* {hasPermission('orders:refund') && menuOrder && canRefund(menuOrder) && (
          <MenuItem onClick={handleMenuRefund}>
            <ListItemIcon>
              <RefundIcon sx={{ fontSize: 20, color: '#EF4444' }} />
            </ListItemIcon>
            <Typography variant="body2">{t('orders.processRefund')}</Typography>
          </MenuItem>
        )} */}
            </Menu>

            {/* Order Details Dialog */}
            <Dialog
                open={detailsDialog}
                onClose={() => setDetailsDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 2, sm: 2.5 },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        m: { xs: 1, sm: 'auto' },
                        width: { xs: 'calc(100% - 16px)', sm: '100%' },
                        maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100% - 64px)' },
                    }
                }}
            >
                {/* 简约对话框头部 */}
                <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' }, color: THEME_COLOR }}>
                            {t('orders.orderDetails')}
                        </Typography>
                        <IconButton onClick={() => setDetailsDialog(false)} size="small" sx={{ color: '#999' }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </Box>
                <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: { xs: 2, sm: 3 } }}>
                    {selectedOrder && (
                        <Box>
                            {/* Order Header */}
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={{ xs: 1.5, sm: 2.5 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: 0.5 }}>
                                        {t('orders.orderNumber')}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: THEME_COLOR, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                                        {selectedOrder.orderNumber}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: 0.5 }}>
                                        {formatDateTime(selectedOrder.createdAt).date}
                                    </Typography>
                                    <Typography sx={{ color: '#666', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                        {formatDateTime(selectedOrder.createdAt).time}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

                            {/* Customer & Order Info */}
                            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: { xs: 1, sm: 1.5 } }}>
                                        {t('orders.customer')}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                                        <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: THEME_COLOR }} />
                                        <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                            {selectedOrder.customerName}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                                        <PhoneIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#999' }} />
                                        <Typography color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                            {selectedOrder.customerPhone}
                                        </Typography>
                                    </Box>
                                    {selectedOrder.customerMembershipTier && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    fontSize: { xs: 16, sm: 18 },
                                                    color: selectedOrder.customerMembershipTier.color || '#9CA3AF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {getTierIcon(selectedOrder.customerMembershipTier.icon || 'star')}
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 500, color: selectedOrder.customerMembershipTier.color || '#9CA3AF', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                    {selectedOrder.customerMembershipTier.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                                                    {t('orders.memberPrice')}: {selectedOrder.customerMembershipTier.discountRate}% ({(100 - selectedOrder.customerMembershipTier.discountRate).toFixed(0)}% {t('orders.off')})
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: { xs: 1, sm: 1.5 } }}>
                                        {t('orders.orderInfo')}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                                        <Box sx={{ color: THEME_COLOR }}>
                                            {getPaymentMethodIcon(selectedOrder.paymentMethod)}
                                        </Box>
                                        <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t(`orders.${selectedOrder.paymentMethod}`)}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                        {getStatusChip(selectedOrder.paymentStatus)}
                                        {getOrderStatusChip(selectedOrder.orderStatus)}
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* 显示退款信息 - Temporarily Disabled */}
                            {/* {selectedOrder.paymentStatus === 'refunded' && selectedOrder.refundAmount && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#EF4444' }}>
                      {t('orders.refundInfo')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('orders.refundAmount')}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
                        {CurrencyUtils.formatAmount(selectedOrder.refundAmount)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t('orders.refundReason')}:
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.refundReason || t('orders.notSpecified')}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )} */}

                            {/* Appointment & Staff Info */}
                            {(selectedOrder.appointmentId || selectedOrder.resourceId) && (
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem', display: 'block', mb: 1.5 }}>
                                        {t('orders.appointmentInfo')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {selectedOrder.appointmentId && (
                                            <Grid item xs={12} sm={6}>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <EventNoteIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                                                            {t('orders.relatedAppointment')}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontFamily: 'monospace',
                                                                fontWeight: 600,
                                                                color: 'text.primary',
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            #{selectedOrder.appointmentId}
                                                        </Typography>
                                                        {/* 移动端隐藏查看预约按钮 */}
                                                        {!isMobile && (
                                                            <Button
                                                                onClick={() => {
                                                                    setDetailsDialog(false);
                                                                    navigate(`/appointments?appointmentId=${selectedOrder.appointmentId}`);
                                                                }}
                                                                sx={{
                                                                    minWidth: 'auto',
                                                                    padding: 0,
                                                                    textTransform: 'none',
                                                                    color: THEME_COLOR,
                                                                    fontWeight: 500,
                                                                    fontSize: '0.875rem',
                                                                    '&:hover': {
                                                                        backgroundColor: 'transparent',
                                                                        textDecoration: 'underline',
                                                                    },
                                                                }}
                                                            >
                                                                {t('orders.viewAppointment')}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        )}
                                        {selectedOrder.resourceId && (
                                            <Grid item xs={12} sm={6}>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <PersonIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                                                            {selectedOrder.resourceType}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {selectedOrder.resourceName || `#${selectedOrder.resourceId}`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                    <Divider sx={{ mt: 2.5 }} />
                                </Box>
                            )}

                            {/* Services */}
                            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: { xs: 1.5, sm: 2 } }}>
                                    {t('orders.services')}
                                </Typography>
                                {selectedOrder.services && selectedOrder.services.length > 0 ? (
                                    <Box>
                                        {selectedOrder.services.map((service, index) => (
                                            <Box
                                                key={index}
                                                display="flex"
                                                justifyContent="space-between"
                                                alignItems="flex-start"
                                                sx={{ mb: 1.5 }}
                                            >
                                                <Box flex={1} sx={{ minWidth: 0 }}>
                                                    <Box display="flex" alignItems="center" gap={0.5} mb={0.3} flexWrap="wrap">
                                                        <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                            {service.serviceName}
                                                        </Typography>
                                                        {service.paymentMethod && (
                                                            <Box
                                                                display="flex"
                                                                alignItems="center"
                                                                gap={0.5}
                                                                sx={{
                                                                    px: 0.75,
                                                                    py: 0.25,
                                                                    borderRadius: 1,
                                                                    bgcolor: alpha(THEME_COLOR, 0.1),
                                                                    color: THEME_COLOR,
                                                                }}
                                                            >
                                                                {getPaymentMethodIcon(service.paymentMethod)}
                                                                <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, fontWeight: 500 }}>
                                                                    {t(`orders.${service.paymentMethod}`)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                        {service.quantity} x {CurrencyUtils.formatAmount(service.price)}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' }, flexShrink: 0, ml: 1 }}>
                                                    {CurrencyUtils.formatAmount(service.quantity * service.price)}
                                                </Typography>
                                            </Box>
                                        ))}

                                        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

                                        {/* Subtotals */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                {t('orders.subtotal')}
                                            </Typography>
                                            <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {CurrencyUtils.formatAmount(selectedOrder.subtotal)}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                                            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                {t('orders.tax')}
                                            </Typography>
                                            <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {CurrencyUtils.formatAmount(selectedOrder.taxAmount)}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 1.5, sm: 2 }}>
                                            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                                                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                    {t('orders.tip')}
                                                </Typography>
                                                {selectedOrder.tipPaymentMethod && (
                                                    <Chip
                                                        label={t(`orders.${selectedOrder.tipPaymentMethod}`)}
                                                        size="small"
                                                        sx={{
                                                            height: { xs: 18, sm: 20 },
                                                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                                            bgcolor: alpha(THEME_COLOR, 0.1),
                                                            color: THEME_COLOR,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                                {CurrencyUtils.formatAmount(selectedOrder.tipAmount)}
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />

                                        {/* Total */}
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                                {t('orders.total')}
                                            </Typography>
                                            <Typography sx={{ fontWeight: 700, color: THEME_COLOR, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                                {CurrencyUtils.formatAmount(selectedOrder.totalAmount)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                        {t('orders.noServiceDetails')}
                                    </Typography>
                                )}
                            </Box>

                            {selectedOrder.notes && (
                                <Box>
                                    <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block', mb: { xs: 1, sm: 1.5 } }}>
                                        {t('orders.notes')}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                        {selectedOrder.notes}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Refund Dialog - Temporarily Disabled */}
            {/* <Dialog
        open={refundDialog}
        onClose={() => setRefundDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#EF4444' }}>
              {t('orders.processRefund')}
            </Typography>
            <IconButton onClick={() => setRefundDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('orders.refundOrderInfo', { orderNumber: selectedOrder.orderNumber })}
              </Typography>

              {refundError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {refundError}
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('orders.refundAmount')}
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={t('orders.maxRefundAmount', { amount: CurrencyUtils.formatAmount(selectedOrder.totalAmount) })}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('orders.refundReason')}</InputLabel>
                    <Select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      label={t('orders.refundReason')}
                    >
                      {refundReasons.map((reason) => (
                        <MenuItem key={reason.value} value={reason.value}>
                          {t(reason.translationKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setRefundDialog(false)}
            sx={{ mr: 1 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={processRefund}
            disabled={refundLoading || !refundAmount || !refundReason}
            sx={{
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {refundLoading ? t('orders.processing') : t('orders.processRefund')}
          </Button>
        </DialogActions>
      </Dialog> */}

            {/* Update Payment Method Dialog */}
            <Dialog
                open={updatePaymentMethodDialog}
                onClose={() => setUpdatePaymentMethodDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 2, sm: 2.5 },
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        m: { xs: 2, sm: 'auto' },
                        width: { xs: 'calc(100% - 32px)', sm: '100%' },
                        maxHeight: { xs: 'calc(100vh - 32px)', sm: 'none' },
                    }
                }}
            >
                {/* 简约对话框头部 */}
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: THEME_COLOR }}>
                            {t('orders.updatePaymentMethodTitle')}
                        </Typography>
                        <IconButton onClick={() => setUpdatePaymentMethodDialog(false)} size="small" sx={{ color: '#999' }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </Box>
                <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
                    {selectedOrder && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                                {t('orders.updatePaymentMethodInfo', { orderNumber: selectedOrder.orderNumber })}
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {t('orders.currentPaymentMethod')}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                                        {selectedOrder.tipPaymentMethod && getPaymentMethodIcon(selectedOrder.tipPaymentMethod)}
                                        <Chip
                                            label={selectedOrder.tipPaymentMethod ? t(`orders.${selectedOrder.tipPaymentMethod}`) : t('orders.notSet')}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(THEME_COLOR, 0.1),
                                                color: THEME_COLOR,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ '&.Mui-focused': { color: THEME_COLOR } }}>
                                            {t('orders.newPaymentMethod')}
                                        </InputLabel>
                                        <Select
                                            value={newPaymentMethod}
                                            onChange={(e) => {
                                                setNewPaymentMethod(e.target.value);
                                                setUpdateError(null);
                                            }}
                                            label={t('orders.newPaymentMethod')}
                                            error={Boolean(updateError)}
                                            sx={{
                                                borderRadius: 2,
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: THEME_COLOR,
                                                },
                                            }}
                                        >
                                            <MenuItem value="cash">{t('orders.cash')}</MenuItem>
                                            <MenuItem value="credit_card">{t('orders.credit_card')}</MenuItem>
                                            <MenuItem value="debit_card">{t('orders.debit_card')}</MenuItem>
                                            <MenuItem value="gift_card">{t('orders.gift_card')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label={t('orders.updateReason')}
                                        value={updateReason}
                                        onChange={(e) => {
                                            setUpdateReason(e.target.value);
                                            setUpdateError(null);
                                        }}
                                        placeholder={t('orders.updateReasonPlaceholder')}
                                        error={Boolean(updateError)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                            },
                                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: THEME_COLOR,
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: THEME_COLOR,
                                            },
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {updateError && (
                                <Box mt={2}>
                                    <Alert severity="error" onClose={() => setUpdateError(null)}>
                                        {updateError}
                                    </Alert>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <Button
                        size="small"
                        onClick={() => setUpdatePaymentMethodDialog(false)}
                        sx={{
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 0.75,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#666',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.04)',
                            },
                        }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        size="small"
                        onClick={processUpdatePaymentMethod}
                        variant="contained"
                        disabled={updateLoading || !newPaymentMethod || !updateReason}
                        sx={{
                            borderRadius: 1.5,
                            px: 2.5,
                            py: 0.75,
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            bgcolor: THEME_COLOR,
                            boxShadow: 'none',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: THEME_COLOR_DARK,
                                boxShadow: 'none',
                            },
                            '&:disabled': {
                                bgcolor: alpha(THEME_COLOR, 0.3),
                                color: alpha('#fff', 0.5),
                            },
                        }}
                    >
                        {updateLoading ? t('orders.processing') : t('common.update')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Update Payment Method Success Snackbar */}
            <Snackbar
                open={updateSuccess}
                autoHideDuration={6000}
                onClose={() => setUpdateSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: isMobile ? 'center' : 'right' }}
                sx={isMobile ? { top: 70 } : undefined}
            >
                <Alert
                    onClose={() => setUpdateSuccess(false)}
                    severity="success"
                    sx={{
                        width: '100%',
                        borderRadius: isMobile ? 1.5 : 2,
                        fontSize: isMobile ? '0.8rem' : undefined,
                        py: isMobile ? 0.5 : undefined,
                        '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
                    }}
                >
                    {t('orders.paymentMethodUpdateSuccess')}
                </Alert>
            </Snackbar>

            {/* Success Snackbar - Temporarily Disabled */}
            {/* <Snackbar
        open={refundSuccess}
        autoHideDuration={6000}
        onClose={() => setRefundSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setRefundSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {t('orders.refundSuccessMessage')}
        </Alert>
      </Snackbar> */}

            {/* Start Date Picker Popover */}
            <Popover
                open={Boolean(startDateAnchorEl)}
                anchorEl={startDateAnchorEl}
                onClose={() => setStartDateAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            '& .MuiPickersDay-root.Mui-selected': {
                                bgcolor: THEME_COLOR,
                                '&:hover': { bgcolor: THEME_COLOR_DARK },
                            },
                            '& .MuiPickersDay-root:focus.Mui-selected': {
                                bgcolor: THEME_COLOR,
                            },
                        }
                    }
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
                    <StaticDatePicker
                        displayStaticWrapperAs="desktop"
                        value={dateRange.start}
                        onChange={(newDate) => {
                            if (newDate) {
                                setDateRange({ ...dateRange, start: newDate });
                                setStartDateAnchorEl(null);
                            }
                        }}
                        slotProps={{
                            actionBar: {
                                actions: []
                            }
                        }}
                    />
                </LocalizationProvider>
            </Popover>

            {/* End Date Picker Popover */}
            <Popover
                open={Boolean(endDateAnchorEl)}
                anchorEl={endDateAnchorEl}
                onClose={() => setEndDateAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            '& .MuiPickersDay-root.Mui-selected': {
                                bgcolor: THEME_COLOR,
                                '&:hover': { bgcolor: THEME_COLOR_DARK },
                            },
                            '& .MuiPickersDay-root:focus.Mui-selected': {
                                bgcolor: THEME_COLOR,
                            },
                        }
                    }
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
                    <StaticDatePicker
                        displayStaticWrapperAs="desktop"
                        value={dateRange.end}
                        onChange={(newDate) => {
                            if (newDate) {
                                setDateRange({ ...dateRange, end: newDate });
                                setEndDateAnchorEl(null);
                            }
                        }}
                        slotProps={{
                            actionBar: {
                                actions: []
                            }
                        }}
                    />
                </LocalizationProvider>
            </Popover>
        </Box>
    );
};

export default OrderHistory;