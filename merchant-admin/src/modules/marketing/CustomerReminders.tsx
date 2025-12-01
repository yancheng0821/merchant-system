import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  alpha,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  Menu,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Campaign as CampaignIcon,
  MoreVert as MoreVertIcon,
  PowerSettingsNew as ToggleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { marketingApi, MarketingRule, MatchedCustomer } from '../../services/api';

interface RuleFormData {
  name: string;
  triggerType: 'INACTIVE_DAYS' | 'LAST_VISIT_DAYS' | 'NO_BOOKING_DAYS';
  triggerDays: string;
  notificationType: 'EMAIL' | 'SMS' | 'BOTH';
  customSubject: string;
  customContent: string;
  scheduleType: 'MANUAL' | 'DAILY' | 'WEEKLY';
  scheduleTime: string;
  scheduleDayOfWeek: number;
  cooldownDays: string;
}

const defaultFormData: RuleFormData = {
  name: '',
  triggerType: 'LAST_VISIT_DAYS',
  triggerDays: '30',
  notificationType: 'EMAIL',
  customSubject: '',
  customContent: '',
  scheduleType: 'MANUAL',
  scheduleTime: '09:00',
  scheduleDayOfWeek: 1,
  cooldownDays: '30',
};

const CustomerReminders: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const { user } = useAuth();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#059669';

  const [rules, setRules] = useState<MarketingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MarketingRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<MarketingRule | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [matchedCustomersOpen, setMatchedCustomersOpen] = useState(false);
  const [matchedCustomers, setMatchedCustomers] = useState<MatchedCustomer[]>([]);
  const [loadingMatchedCustomers, setLoadingMatchedCustomers] = useState(false);
  const [selectedRuleForCustomers, setSelectedRuleForCustomers] = useState<MarketingRule | null>(null);

  // 菜单状态
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRule, setSelectedRule] = useState<MarketingRule | null>(null);

  const canManage = hasPermission('marketing:manage_rules');
  const canSend = hasPermission('marketing:send');

  useEffect(() => {
    if (user?.tenantId) {
      loadRules();
    }
  }, [user?.tenantId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const rules = await marketingApi.getRules(user?.tenantId || 0);
      setRules(rules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rule?: MarketingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        triggerType: rule.triggerType,
        triggerDays: String(rule.triggerDays),
        notificationType: rule.notificationType,
        customSubject: rule.customSubject || '',
        customContent: rule.customContent || '',
        scheduleType: rule.scheduleType,
        scheduleTime: rule.scheduleTime ? `${rule.scheduleTime.substring(0, 2)}:00` : '09:00',
        scheduleDayOfWeek: rule.scheduleDayOfWeek || 1,
        cooldownDays: String(rule.cooldownDays),
      });
    } else {
      setEditingRule(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRule(null);
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: t('marketing.errors.nameRequired'), severity: 'error' });
      return;
    }

    try {
      setSaving(true);
      // Convert string values to numbers for API
      const payload = {
        name: formData.name,
        triggerType: formData.triggerType,
        triggerDays: parseInt(formData.triggerDays) || 0,
        notificationType: formData.notificationType,
        customSubject: formData.customSubject || undefined,
        customContent: formData.customContent || undefined,
        scheduleType: formData.scheduleType,
        scheduleTime: formData.scheduleTime,
        scheduleDayOfWeek: formData.scheduleDayOfWeek,
        cooldownDays: parseInt(formData.cooldownDays) || 0,
        tenantId: user?.tenantId,
      };

      if (editingRule) {
        await marketingApi.updateRule(editingRule.id, payload);
      } else {
        await marketingApi.createRule(payload);
      }

      setSnackbar({
        open: true,
        message: editingRule ? t('marketing.messages.ruleUpdated') : t('marketing.messages.ruleCreated'),
        severity: 'success',
      });
      handleCloseDialog();
      loadRules();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || t('common.error'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (rule: MarketingRule) => {
    try {
      await marketingApi.toggleRuleEnabled(rule.id, !rule.enabled);
      loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await marketingApi.deleteRule(ruleToDelete.id);
      setSnackbar({ open: true, message: t('marketing.messages.ruleDeleted'), severity: 'success' });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      loadRules();
    } catch (error) {
      setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
    }
  };

  const handleSendNow = async (rule: MarketingRule) => {
    setMenuAnchorEl(null);
    try {
      setSending(rule.id);
      const result = await marketingApi.sendNow(rule.id);
      setSnackbar({
        open: true,
        message: t('marketing.messages.sendSuccess', { count: result?.sentCount || 0 }),
        severity: 'success',
      });
      loadRules();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || t('common.error'), severity: 'error' });
    } finally {
      setSending(null);
    }
  };

  const handleViewMatchedCustomers = async (rule: MarketingRule) => {
    setSelectedRuleForCustomers(rule);
    setMatchedCustomersOpen(true);
    setLoadingMatchedCustomers(true);
    try {
      const customers = await marketingApi.getMatchedCustomers(rule.id);
      setMatchedCustomers(customers);
    } catch (error) {
      console.error('Failed to load matched customers:', error);
      setMatchedCustomers([]);
    } finally {
      setLoadingMatchedCustomers(false);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'INACTIVE_DAYS': return t('marketing.triggerTypes.inactiveDays');
      case 'LAST_VISIT_DAYS': return t('marketing.triggerTypes.lastVisitDays');
      case 'NO_BOOKING_DAYS': return t('marketing.triggerTypes.noBookingDays');
      default: return type;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL': return t('marketing.notificationTypes.email');
      case 'SMS': return t('marketing.notificationTypes.sms');
      case 'BOTH': return t('marketing.notificationTypes.both');
      default: return type;
    }
  };

  const getScheduleLabel = (rule: MarketingRule) => {
    // 只显示小时部分
    const timeDisplay = rule.scheduleTime ? rule.scheduleTime.substring(0, 5) : '';
    switch (rule.scheduleType) {
      case 'MANUAL': return t('marketing.scheduleTypes.manual');
      case 'DAILY': return `${t('marketing.scheduleTypes.daily')} ${timeDisplay}`;
      case 'WEEKLY': {
        const dayOfWeek = rule.scheduleDayOfWeek ? t(`common.weekdays.${rule.scheduleDayOfWeek}`) : '';
        return `${t('marketing.scheduleTypes.weekly')} ${dayOfWeek} ${timeDisplay}`.trim();
      }
      default: return rule.scheduleType;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: THEME_COLOR }} size={32} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 操作栏 */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
            sx={{
              bgcolor: THEME_COLOR,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2,
              py: 0.75,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(THEME_COLOR, 0.9),
                boxShadow: 'none',
              },
            }}
          >
            {t('marketing.addRule')}
          </Button>
        )}
      </Box>

      {/* 规则列表 */}
      {rules.length === 0 ? (
        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#fff',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ color: alpha(THEME_COLOR, 0.3), mb: 2 }}>
              <CampaignIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography sx={{ color: '#888', fontSize: '0.875rem', mb: 3 }}>
              {t('marketing.noRules')}
            </Typography>
            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                size="small"
                sx={{
                  bgcolor: THEME_COLOR,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 2.5,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: alpha(THEME_COLOR, 0.9),
                    boxShadow: 'none',
                  },
                }}
              >
                {t('marketing.createFirstRule')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* 移动端卡片视图 */
        <Box>
          {rules.map((rule) => (
            <Card
              key={rule.id}
              onClick={(e) => {
                if (canManage || canSend) {
                  setMenuAnchorEl(e.currentTarget);
                  setSelectedRule(rule);
                }
              }}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: (canManage || canSend) ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
                '&:active': { bgcolor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* 第一行：规则名称 + 状态 */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', flex: 1 }} noWrap>
                    {rule.name}
                  </Typography>
                  <Chip
                    label={rule.enabled ? t('common.enabled') : t('common.disabled')}
                    size="small"
                    sx={{
                      backgroundColor: rule.enabled
                        ? (isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#10B981', 0.1))
                        : 'rgba(0,0,0,0.06)',
                      color: rule.enabled ? (isMonochrome ? '#1a1a1a' : '#10B981') : '#888',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      height: 20,
                      ml: 1,
                    }}
                  />
                </Box>
                {/* 第二行：触发条件 + 通知类型 */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                    {getTriggerTypeLabel(rule.triggerType)} ≥ {rule.triggerDays} {t('common.days')}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {(rule.notificationType === 'EMAIL' || rule.notificationType === 'BOTH') && (
                      <EmailIcon sx={{ fontSize: 14, color: THEME_COLOR }} />
                    )}
                    {(rule.notificationType === 'SMS' || rule.notificationType === 'BOTH') && (
                      <SmsIcon sx={{ fontSize: 14, color: THEME_COLOR }} />
                    )}
                  </Box>
                </Box>
                {/* 第三行：调度 + 匹配客户数 */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ScheduleIcon sx={{ fontSize: 12, color: '#999' }} />
                    <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                      {getScheduleLabel(rule)}
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    onClick={(e) => {
                      e.stopPropagation();
                      rule.matchedCustomerCount && rule.matchedCustomerCount > 0 && handleViewMatchedCustomers(rule);
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 12, color: THEME_COLOR }} />
                    <Typography sx={{ fontSize: '0.65rem', color: THEME_COLOR }}>
                      {rule.matchedCustomerCount ?? '-'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        /* 桌面端表格视图 */
        <Card
          sx={{
            borderRadius: 2.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#fafafa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('marketing.ruleName')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('marketing.triggerCondition')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('marketing.notificationType')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('marketing.schedule')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('marketing.matchedCustomers')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5 }}>
                    {t('common.status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#666', py: 1.5, textAlign: 'center' }}>
                    {t('common.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                      '& td': { py: 1.5, fontSize: '0.875rem' },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#1a1a1a' }}>
                        {rule.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {getTriggerTypeLabel(rule.triggerType)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                          {`≥ ${rule.triggerDays} ${t('common.days')}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {(rule.notificationType === 'EMAIL' || rule.notificationType === 'BOTH') && (
                          <EmailIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                        )}
                        {(rule.notificationType === 'SMS' || rule.notificationType === 'BOTH') && (
                          <SmsIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                        )}
                        <Typography sx={{ fontSize: '0.875rem', color: THEME_COLOR, ml: 0.5 }}>
                          {getNotificationTypeLabel(rule.notificationType)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#888' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: '#1a1a1a' }}>
                          {getScheduleLabel(rule)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        onClick={() => rule.matchedCustomerCount && rule.matchedCustomerCount > 0 && handleViewMatchedCustomers(rule)}
                        sx={{
                          cursor: rule.matchedCustomerCount && rule.matchedCustomerCount > 0 ? 'pointer' : 'default',
                        }}
                      >
                        <PeopleIcon sx={{ fontSize: 16, color: THEME_COLOR }} />
                        <Typography sx={{ fontSize: '0.875rem', color: THEME_COLOR }}>
                          {rule.matchedCustomerCount ?? '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.enabled ? t('common.enabled') : t('common.disabled')}
                        size="small"
                        sx={{
                          backgroundColor: rule.enabled
                            ? (isMonochrome ? 'rgba(26, 26, 26, 0.08)' : alpha('#10B981', 0.1))
                            : 'rgba(0,0,0,0.06)',
                          color: rule.enabled
                            ? (isMonochrome ? '#1a1a1a' : '#10B981')
                            : '#888',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" justifyContent="center">
                        {(canManage || canSend) && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setMenuAnchorEl(e.currentTarget);
                              setSelectedRule(rule);
                            }}
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
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
            mt: 0.5,
            minWidth: 160,
          }
        }}
      >
        {canSend && selectedRule?.enabled && (
          <MenuItem
            onClick={() => selectedRule && handleSendNow(selectedRule)}
            disabled={sending === selectedRule?.id}
            sx={{ fontSize: '0.875rem', py: 1, '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.08) } }}
          >
            {sending === selectedRule?.id ? (
              <CircularProgress size={16} sx={{ mr: 1.5, color: THEME_COLOR }} />
            ) : (
              <SendIcon sx={{ mr: 1.5, fontSize: 18, color: THEME_COLOR }} />
            )}
            {t('marketing.sendNow')}
          </MenuItem>
        )}
        {canManage && (
          <MenuItem
            onClick={() => {
              if (selectedRule) {
                handleToggleEnabled(selectedRule);
              }
              setMenuAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem', py: 1, '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.08) } }}
          >
            <ToggleIcon sx={{ mr: 1.5, fontSize: 18, color: selectedRule?.enabled ? '#888' : THEME_COLOR }} />
            {selectedRule?.enabled ? t('common.disable') : t('common.enable')}
          </MenuItem>
        )}
        {canManage && (
          <MenuItem
            onClick={() => {
              if (selectedRule) {
                handleOpenDialog(selectedRule);
              }
              setMenuAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem', py: 1, '&:hover': { backgroundColor: alpha(THEME_COLOR, 0.08) } }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 18, color: THEME_COLOR }} />
            {t('common.edit')}
          </MenuItem>
        )}
        {canManage && (
          <MenuItem
            onClick={() => {
              if (selectedRule) {
                setRuleToDelete(selectedRule);
                setDeleteDialogOpen(true);
              }
              setMenuAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem', py: 1, '&:hover': { backgroundColor: alpha('#ef4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 18, color: '#ef4444' }} />
            {t('common.delete')}
          </MenuItem>
        )}
      </Menu>

      {/* 创建/编辑规则对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxWidth: isMobile ? '100%' : 720,
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          pt: 2.5,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(THEME_COLOR, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CampaignIcon sx={{ color: THEME_COLOR, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
              {editingRule ? t('marketing.editRule') : t('marketing.addRule')}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
              {t('marketing.ruleFormDescription')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          {/* 规则名称 */}
          <TextField
            label={t('marketing.ruleName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            size="small"
            placeholder={t('marketing.ruleNamePlaceholder')}
            sx={{
              mt: 2,
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                fontSize: '0.875rem',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: THEME_COLOR,
                },
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                '&.Mui-focused': { color: THEME_COLOR },
              },
            }}
          />

          {/* 两栏布局（移动端单栏） */}
          <Box display="grid" gridTemplateColumns={isMobile ? '1fr' : '1fr 1fr'} gap={isMobile ? 2 : 3}>
            {/* 左栏：触发条件 + 调度设置 */}
            <Box>
              {/* 触发条件卡片 */}
              <Box sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.08)',
                bgcolor: '#fafafa',
                mb: 2,
              }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {t('marketing.triggerCondition')}
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
                    {t('marketing.triggerTypes.lastVisitDays')}
                  </Typography>
                  <TextField
                    label={t('marketing.triggerDays')}
                    value={formData.triggerDays}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, triggerDays: value });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{t('common.days')}</InputAdornment>,
                    }}
                    inputProps={{ inputMode: 'numeric' }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                      },
                      '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } },
                    }}
                  />
                </Box>
              </Box>

              {/* 调度设置卡片 */}
              <Box sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.08)',
                bgcolor: '#fafafa',
              }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ScheduleIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {t('marketing.scheduleSettings')}
                  </Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>{t('marketing.scheduleType')}</InputLabel>
                    <Select
                      value={formData.scheduleType}
                      label={t('marketing.scheduleType')}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as any })}
                      sx={{
                        borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                      }}
                    >
                      <MenuItem value="MANUAL" sx={{ fontSize: '0.875rem' }}>{t('marketing.scheduleTypes.manual')}</MenuItem>
                      <MenuItem value="DAILY" sx={{ fontSize: '0.875rem' }}>{t('marketing.scheduleTypes.daily')}</MenuItem>
                      <MenuItem value="WEEKLY" sx={{ fontSize: '0.875rem' }}>{t('marketing.scheduleTypes.weekly')}</MenuItem>
                    </Select>
                  </FormControl>
                  {formData.scheduleType !== 'MANUAL' && (
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel sx={{ fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>{t('marketing.scheduleTime')}</InputLabel>
                      <Select
                        value={formData.scheduleTime}
                        label={t('marketing.scheduleTime')}
                        onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                        sx={{
                          borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: { maxHeight: 200 }
                          }
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <MenuItem key={i} value={`${hour}:00`} sx={{ fontSize: '0.875rem' }}>
                              {`${hour}:00`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  )}
                  {formData.scheduleType === 'WEEKLY' && (
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } }}>{t('marketing.scheduleDayOfWeek')}</InputLabel>
                      <Select
                        value={formData.scheduleDayOfWeek}
                        label={t('marketing.scheduleDayOfWeek')}
                        onChange={(e) => setFormData({ ...formData, scheduleDayOfWeek: e.target.value as number })}
                        sx={{
                          borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <MenuItem key={day} value={day} sx={{ fontSize: '0.875rem' }}>{t(`common.weekdays.${day}`)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <TextField
                    label={t('marketing.cooldownDays')}
                    value={formData.cooldownDays}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, cooldownDays: value });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{t('common.days')}</InputAdornment>,
                    }}
                    inputProps={{ inputMode: 'numeric' }}
                    fullWidth
                    size="small"
                    helperText={t('marketing.cooldownDaysHelp')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                      },
                      '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } },
                      '& .MuiFormHelperText-root': { fontSize: '0.7rem', mt: 0.5 },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* 右栏：通知内容 */}
            <Box sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.08)',
              bgcolor: '#fafafa',
              height: 'fit-content',
            }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EmailIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {t('marketing.notificationSettings')}
                </Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label={t('marketing.emailSubject')}
                  value={formData.customSubject}
                  onChange={(e) => setFormData({ ...formData, customSubject: e.target.value })}
                  fullWidth
                  size="small"
                  placeholder={t('marketing.subjectPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } },
                  }}
                />

                <TextField
                  label={t('marketing.emailContent')}
                  value={formData.customContent}
                  onChange={(e) => setFormData({ ...formData, customContent: e.target.value })}
                  multiline
                  rows={6}
                  fullWidth
                  size="small"
                  placeholder={t('marketing.contentPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5, fontSize: '0.875rem', bgcolor: '#fff',
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR },
                    },
                    '& .MuiInputLabel-root': { fontSize: '0.875rem', '&.Mui-focused': { color: THEME_COLOR } },
                  }}
                />

                {/* 预览按钮 */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!formData.customSubject && !formData.customContent}
                  sx={{
                    borderColor: alpha(THEME_COLOR, 0.5),
                    color: THEME_COLOR,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    '&:hover': {
                      borderColor: THEME_COLOR,
                      bgcolor: alpha(THEME_COLOR, 0.05),
                    },
                  }}
                >
                  {t('marketing.previewEmail')}
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#666',
              fontSize: '0.875rem',
              textTransform: 'none',
              px: 2,
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: THEME_COLOR,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(THEME_COLOR, 0.9),
                boxShadow: 'none',
              },
            }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          {t('marketing.deleteRuleConfirm')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#666' }}>
            {t('marketing.deleteRuleMessage', { name: ruleToDelete?.name })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#666',
              fontSize: '0.875rem',
              textTransform: 'none',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            sx={{
              bgcolor: '#ef4444',
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 2.5,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#dc2626',
                boxShadow: 'none',
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 邮件预览对话框 */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2.5,
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}>
          <EmailIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {t('marketing.emailPreview')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#fff',
          }}>
            {/* 邮件头部 */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fafafa' }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 0.5 }}>
                {t('marketing.emailSubject')}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#1a1a1a' }}>
                {formData.customSubject || t('marketing.noSubject')}
              </Typography>
            </Box>
            {/* 邮件内容 */}
            <Box sx={{ p: 2, minHeight: 200 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {formData.customContent || t('marketing.noContent')}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPreviewOpen(false)}
            variant="contained"
            sx={{
              bgcolor: THEME_COLOR,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(THEME_COLOR, 0.9),
                boxShadow: 'none',
              },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 匹配客户列表对话框 */}
      <Dialog
        open={matchedCustomersOpen}
        onClose={() => setMatchedCustomersOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            mx: isMobile ? 2 : 0,
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}>
          <PeopleIcon sx={{ color: THEME_COLOR, fontSize: 20 }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {t('marketing.matchedCustomers')}
          </Typography>
          {selectedRuleForCustomers && (
            <Chip
              label={selectedRuleForCustomers.name}
              size="small"
              sx={{
                ml: 1,
                bgcolor: alpha(THEME_COLOR, 0.1),
                color: THEME_COLOR,
                fontSize: '0.75rem',
              }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {loadingMatchedCustomers ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={32} sx={{ color: THEME_COLOR }} />
            </Box>
          ) : matchedCustomers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PeopleIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {t('marketing.noMatchedCustomers')}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', bgcolor: '#fafafa' }}>{t('customers.customer')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', bgcolor: '#fafafa' }}>{t('customers.email')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', bgcolor: '#fafafa' }}>{t('customers.phone')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', bgcolor: '#fafafa' }}>{t('common.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchedCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#666' }}>
                        {customer.email || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#666' }}>
                        {customer.phone || '-'}
                      </TableCell>
                      <TableCell>
                        {customer.sent ? (
                          <Chip
                            label={t('marketing.status.sent')}
                            size="small"
                            sx={{
                              bgcolor: alpha(THEME_COLOR, 0.1),
                              color: THEME_COLOR,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        ) : (
                          <Chip
                            label={t('marketing.status.pending')}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(0,0,0,0.06)',
                              color: '#888',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setMatchedCustomersOpen(false)}
            variant="contained"
            sx={{
              bgcolor: THEME_COLOR,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: alpha(THEME_COLOR, 0.9),
                boxShadow: 'none',
              },
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{
            borderRadius: isMobile ? 1.5 : 2,
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerReminders;
