import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
  alpha,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  // 会员等级相关图标
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
  ShowChart as ShowChartIcon,
  Insights as InsightsIcon,
  Loyalty as LoyaltyIcon,
  LocalOffer as OfferIcon,
  Redeem as RedeemIcon,
  Favorite as HeartIcon,
  FavoriteBorder as HeartOutlineIcon,
  Celebration as CelebrationIcon,
  AutoAwesome as SparkleIcon,
  Whatshot as FireIcon,
  Brightness7 as SunIcon,
  Bedtime as MoonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { membershipTierApi, MembershipTier } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../contexts/AuthContext';

const MembershipTiers: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [formData, setFormData] = useState<Partial<MembershipTier>>({
    name: '',
    code: '',
    requiredPoints: 0,
    discountRate: 100,
    color: '#FF6B6B',
    icon: 'star',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTier, setMenuTier] = useState<MembershipTier | null>(null);

  const tenantId = user?.tenantId;

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const data = await membershipTierApi.getAllTiers(tenantId);
      // 按所需积分从低到高排序
      const sortedData = data.sort((a, b) => a.requiredPoints - b.requiredPoints);
      setTiers(sortedData);
    } catch (error) {
      console.error('Failed to load membership levels:', error);
      showSnackbar(t('membershipTiers.loadFailed', 'Failed to load membership levels'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // 搜索过滤
  const filteredTiers = useMemo(() => {
    if (!searchTerm) return tiers;
    const term = searchTerm.toLowerCase();
    return tiers.filter(tier =>
      tier.name.toLowerCase().includes(term) ||
      tier.code.toLowerCase().includes(term)
    );
  }, [tiers, searchTerm]);

  const handleOpenDialog = (tier?: MembershipTier) => {
    if (tier) {
      setSelectedTier(tier);
      // 编辑时保持原有的激活状态
      setFormData({
        ...tier,
        isActive: tier.isActive ?? true,
      });
    } else {
      setSelectedTier(null);
      // 新建时默认为激活状态
      setFormData({
        name: '',
        code: '',
        requiredPoints: 0,
        discountRate: 100,
        color: '#FF6B6B',
        icon: 'star',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // selectedTier 会在弹框动画结束后清空，防止关闭时闪现 "add level"
  };

  const handleDialogExited = () => {
    // 弹框完全关闭后才清空状态
    setSelectedTier(null);
  };

  const handleSave = async () => {
    if (!tenantId) return;

    // Validation
    if (!formData.name?.trim()) {
      showSnackbar(t('membershipTiers.nameRequired', 'Tier name is required'), 'error');
      return;
    }
    if (!formData.code?.trim()) {
      showSnackbar(t('membershipTiers.codeRequired', 'Tier code is required'), 'error');
      return;
    }
    if (formData.requiredPoints === undefined || formData.requiredPoints < 0) {
      showSnackbar(t('membershipTiers.pointsInvalid', 'Required points must be >= 0'), 'error');
      return;
    }
    if (formData.discountRate === undefined || formData.discountRate < 0 || formData.discountRate > 100) {
      showSnackbar(t('membershipTiers.discountInvalid', 'Discount rate must be between 0-100'), 'error');
      return;
    }

    try {
      const tierData: MembershipTier = {
        ...formData,
        tenantId,
        name: formData.name!,
        code: formData.code!,
        requiredPoints: formData.requiredPoints!,
        discountRate: formData.discountRate!,
        isActive: formData.isActive!,
      };

      if (selectedTier) {
        await membershipTierApi.updateTier(selectedTier.id!, tierData);
        showSnackbar(t('membershipTiers.updateSuccess', 'Tier updated successfully'), 'success');
      } else {
        await membershipTierApi.createTier(tierData);
        showSnackbar(t('membershipTiers.createSuccess', 'Tier created successfully'), 'success');
      }

      handleCloseDialog();
      loadTiers();
    } catch (error: any) {
      console.error('Failed to save tier:', error);
      const message = error.message || t('membershipTiers.saveFailed', 'Failed to save tier');
      showSnackbar(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedTier) return;

    try {
      await membershipTierApi.deleteTier(selectedTier.id!);
      showSnackbar(t('membershipTiers.deleteSuccess', 'Tier deleted successfully'), 'success');
      setOpenDeleteDialog(false);
      setSelectedTier(null);
      loadTiers();
    } catch (error: any) {
      console.error('Failed to delete tier:', error);
      const message = error.message || t('membershipTiers.deleteFailed', 'Failed to delete tier');
      showSnackbar(message, 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tier: MembershipTier) => {
    setAnchorEl(event.currentTarget);
    setMenuTier(tier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTier(null);
  };

  const handleEditFromMenu = () => {
    if (menuTier) {
      handleOpenDialog(menuTier);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (menuTier) {
      setSelectedTier(menuTier);
      setOpenDeleteDialog(true);
    }
    handleMenuClose();
  };

  const getDiscountDisplay = (rate: number) => {
    if (rate >= 100) return t('membershipTiers.noDiscount', 'No discount');
    return `${rate}% (${100 - rate}% ${t('membershipTiers.off', 'off')})`;
  };

  // 获取等级图标
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
      case 'showchart': return <ShowChartIcon />;
      case 'insights': return <InsightsIcon />;
      case 'loyalty': return <LoyaltyIcon />;
      case 'offer': return <OfferIcon />;
      case 'redeem': return <RedeemIcon />;
      case 'heart': return <HeartIcon />;
      case 'heartoutline': return <HeartOutlineIcon />;
      case 'celebration': return <CelebrationIcon />;
      case 'sparkle': return <SparkleIcon />;
      case 'fire': return <FireIcon />;
      case 'sun': return <SunIcon />;
      case 'moon': return <MoonIcon />;
      default: return <StarIcon />;
    }
  };

  // 图标选项 - 专为会员等级设计
  const iconOptions = [
    { value: 'star', label: t('membershipTiers.icons.star', 'Star'), icon: <StarIcon /> },
    { value: 'stars', label: t('membershipTiers.icons.stars', 'Stars'), icon: <StarsIcon /> },
    { value: 'starrate', label: t('membershipTiers.icons.starRate', 'Star Rate'), icon: <StarRateIcon /> },
    { value: 'grade', label: t('membershipTiers.icons.grade', 'Grade'), icon: <GradeIcon /> },
    { value: 'trophy', label: t('membershipTiers.icons.trophy', 'Trophy'), icon: <TrophyIcon /> },
    { value: 'medal', label: t('membershipTiers.icons.medal', 'Medal'), icon: <MedalIcon /> },
    { value: 'diamond', label: t('membershipTiers.icons.diamond', 'Diamond'), icon: <DiamondIcon /> },
    { value: 'premium', label: t('membershipTiers.icons.premium', 'Premium'), icon: <PremiumIcon /> },
    { value: 'verified', label: t('membershipTiers.icons.verified', 'Verified'), icon: <VerifiedIcon /> },
    { value: 'membership', label: t('membershipTiers.icons.membership', 'Membership'), icon: <MembershipIcon /> },
    { value: 'trendingup', label: t('membershipTiers.icons.trendingUp', 'Trending Up'), icon: <TrendingUpIcon /> },
    { value: 'loyalty', label: t('membershipTiers.icons.loyalty', 'Loyalty'), icon: <LoyaltyIcon /> },
    { value: 'gift', label: t('membershipTiers.icons.gift', 'Gift'), icon: <GiftIcon /> },
    { value: 'redeem', label: t('membershipTiers.icons.redeem', 'Redeem'), icon: <RedeemIcon /> },
    { value: 'heart', label: t('membershipTiers.icons.heart', 'Heart'), icon: <HeartIcon /> },
    { value: 'sparkle', label: t('membershipTiers.icons.sparkle', 'Sparkle'), icon: <SparkleIcon /> },
    { value: 'fire', label: t('membershipTiers.icons.fire', 'Fire'), icon: <FireIcon /> },
    { value: 'celebration', label: t('membershipTiers.icons.celebration', 'Celebration'), icon: <CelebrationIcon /> },
  ];

  // 颜色选项 - 会员等级配色方案
  const colorOptions = [
    // 金色系 - 高级会员
    '#FFD700', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FFCA28',
    // 银色系 - 中级会员
    '#C0C0C0', '#9E9E9E', '#757575', '#607D8B', '#78909C',
    // 铜色系 - 基础会员
    '#CD7F32', '#A0522D', '#8B4513', '#D2691E', '#B87333',
    // 钻石蓝 - VIP会员
    '#00BCD4', '#0097A7', '#006064', '#4DD0E1', '#26C6DA',
    // 紫色系 - 尊贵会员
    '#9C27B0', '#7B1FA2', '#6A1B9A', '#4A148C', '#AB47BC',
    // 红色系 - 特别会员
    '#F44336', '#E91E63', '#D32F2F', '#C2185B', '#B71C1C',
    // 绿色系 - 成长会员
    '#4CAF50', '#388E3C', '#2E7D32', '#1B5E20', '#66BB6A',
    // 橙色系 - 活跃会员
    '#FF9800', '#F57C00', '#E65100', '#FB8C00', '#FFA726',
    // 粉色系 - 新会员
    '#FF69B4', '#FF1493', '#EC4899', '#DB2777', '#FCE4EC',
    // 靛蓝系 - 精英会员
    '#3F51B5', '#303F9F', '#1A237E', '#536DFE', '#5C6BC0',
    // 青绿系 - 环保会员
    '#009688', '#00796B', '#004D40', '#26A69A', '#80CBC4',
  ];


  return (
    <Box>
      {/* 现代化搜索和操作区域 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('membershipTiers.searchPlaceholder', 'Search by name or code...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                {hasPermission('membership_tiers:create') && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.75,
                      px: 2,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      bgcolor: '#EC4899',
                      boxShadow: 'none',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#DB2777',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {t('membershipTiers.addTier', 'Add Tier')}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 现代化表格 */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('membershipTiers.name', 'Name')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('membershipTiers.code', 'Code')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('membershipTiers.requiredPoints', 'Required Points')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('membershipTiers.discountRate', 'Discount Rate')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
                  {t('membershipTiers.status', 'Status')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }} align="right">
                  {t('common.actions', 'Actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: '#EC4899' }} />
                  </TableCell>
                </TableRow>
              ) : filteredTiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm
                        ? t('membershipTiers.noSearchResults', 'No levels match your search')
                        : t('membershipTiers.noTiers', 'No membership levels found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTiers.map((tier) => (
                  <TableRow
                    key={tier.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha('#EC4899', 0.04),
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${tier.color || '#9CA3AF'}, ${tier.color || '#9CA3AF'}80)`,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getTierIcon(tier.icon || 'star')}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tier.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tier.code}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha(tier.color || '#EC4899', 0.1),
                          color: tier.color || '#EC4899',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ fontSize: 18, color: '#FCD34D' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{tier.requiredPoints.toLocaleString()}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: tier.discountRate < 100 ? '#10B981' : 'text.secondary',
                        }}
                      >
                        {getDiscountDisplay(tier.discountRate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tier.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        size="small"
                        sx={{
                          bgcolor: tier.isActive ? alpha('#10B981', 0.1) : alpha('#6B7280', 0.1),
                          color: tier.isActive ? '#10B981' : '#6B7280',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tier)}
                        sx={{
                          color: '#6B7280',
                          '&:hover': {
                            bgcolor: alpha('#6B7280', 0.1),
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
            mt: 1,
          },
        }}
      >
        {hasPermission('membership_tiers:update') && (
          <MenuItem
            onClick={handleEditFromMenu}
            sx={{ '&:hover': { backgroundColor: alpha('#EC4899', 0.08) } }}
          >
            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#EC4899' }} />
            {t('membershipTiers.actions.edit', 'Edit')}
          </MenuItem>
        )}
        {hasPermission('membership_tiers:delete') && (
          <MenuItem
            onClick={handleDeleteFromMenu}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
            {t('membershipTiers.actions.delete', 'Delete')}
          </MenuItem>
        )}
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
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
                <MembershipIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {selectedTier
                    ? t('membershipTiers.editTier', 'Edit Membership Level')
                    : t('membershipTiers.addTier', 'Add Membership Level')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTier
                    ? t('membershipTiers.editTierSubtitle', 'Update level information and settings')
                    : t('membershipTiers.addTierSubtitle', 'Create new membership level')}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha('#EC4899', 0.08) },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
            {/* Row 1: Name and Code */}
            <Grid item xs={12} md={6}>
              <TextField
                label={t('membershipTiers.name', 'Name')}
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                helperText={t('membershipTiers.nameHelper', 'e.g., Regular, Silver, Gold, Platinum')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC4899',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('membershipTiers.code', 'Code')}
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
                fullWidth
                helperText={t('membershipTiers.codeHelper', 'Unique code in UPPERCASE')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC4899',
                  },
                }}
              />
            </Grid>

            {/* Row 2: Required Points and Discount Rate */}
            <Grid item xs={12} md={6}>
              <TextField
                label={t('membershipTiers.requiredPoints', 'Required Points')}
                type="number"
                value={formData.requiredPoints ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    requiredPoints: value === '' ? undefined : parseInt(value)
                  });
                }}
                required
                fullWidth
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC4899',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('membershipTiers.discountRate', 'Discount Rate (%)')}
                type="number"
                value={formData.discountRate ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    discountRate: value === '' ? undefined : parseFloat(value)
                  });
                }}
                required
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText={t('membershipTiers.discountHelper', '100 = no discount, 95 = 5% off, 90 = 10% off')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC4899',
                  },
                }}
              />
            </Grid>

            {/* Row 3: Icon Selector */}
            <Grid item xs={12}>
            {/* 图标选择器 */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {t('membershipTiers.icon', 'Icon')}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  maxHeight: 180,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#EC4899',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#DB2777',
                    },
                  },
                }}
              >
                <Grid container spacing={1}>
                  {iconOptions.map((option) => (
                    <Grid item key={option.value}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: formData.icon === option.value
                            ? '2px solid #EC4899'
                            : '1px solid #e2e8f0',
                          backgroundColor: formData.icon === option.value
                            ? alpha('#EC4899', 0.1)
                            : 'white',
                          color: formData.icon === option.value
                            ? '#EC4899'
                            : '#6B7280',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            backgroundColor: alpha('#EC4899', 0.08),
                            color: '#EC4899',
                          },
                        }}
                        onClick={() => setFormData({ ...formData, icon: option.value })}
                        title={option.label}
                      >
                        {option.icon}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
            </Grid>

            {/* Row 4: Color Selector */}
            <Grid item xs={12}>
            {/* 颜色选择器 */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                {t('membershipTiers.color', 'Color')}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  maxHeight: 200,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#EC4899',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#DB2777',
                    },
                  },
                }}
              >
                <Grid container spacing={1}>
                  {colorOptions.map((color) => (
                    <Grid item key={color} xs="auto">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: color,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: formData.color === color
                            ? '3px solid #EC4899'
                            : '1px solid #e2e8f0',
                          boxShadow: formData.color === color
                            ? `0 0 0 2px ${alpha('#EC4899', 0.3)}`
                            : 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          '&:hover': {
                            transform: 'scale(1.15)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            zIndex: 1,
                          },
                          '&:after': formData.color === color ? {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '10px',
                            height: '10px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          } : {},
                        }}
                        onClick={() => setFormData({ ...formData, color })}
                        title={color}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
            </Grid>

            {/* Row 5: Benefits */}
            <Grid item xs={12}>
              <TextField
                label={t('membershipTiers.benefits', 'Benefits (Optional)')}
                value={formData.benefits || ''}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                multiline
                rows={3}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#EC4899',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#EC4899',
                  },
                }}
              />
            </Grid>
          </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              px: 3,
              color: 'text.secondary',
            }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DB2777, #BE185D)',
              },
            }}
          >
            {t('common.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, color: '#EF4444' }}>
          {t('membershipTiers.confirmDelete', 'Confirm Delete')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('membershipTiers.deleteMessage', 'Are you sure you want to delete this tier?')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
            disabled={loading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : t('common.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MembershipTiers;
