import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  DialogContentText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Schedule as ScheduleIcon,
  EventAvailable as EventAvailableIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import { staffAttendanceApi } from '../../../../services/api';
import { usePermission } from '../../../../hooks/usePermission';

interface AdjustAvailabilityDialogProps {
  open: boolean;
  onClose: () => void;
  staffId: number;
  staffName: string;
  date: Date;
  scheduledStart: string; // 原始排班开始时间，如 "11:00"
  scheduledEnd: string; // 原始排班结束时间，如 "19:00"
  scheduledTimeSlots?: string[]; // 原始排班的所有时间槽，如 ["09:00-12:00", "14:00-20:00"]
  actualStart?: string; // 实际开始时间（如果有临时调整）
  actualEnd?: string; // 实际结束时间（如果有临时调整）
  onSave: (startTime: string, endTime: string) => Promise<void>;
  onShowMessage: (message: string, severity: 'success' | 'error') => void;
  // 全屏模式支持
  container?: HTMLElement | null;
}

const AdjustAvailabilityDialog: React.FC<AdjustAvailabilityDialogProps> = ({
  open,
  onClose,
  staffId,
  staffName,
  date,
  scheduledStart,
  scheduledEnd,
  scheduledTimeSlots,
  actualStart,
  actualEnd,
  onSave,
  onShowMessage,
  container,
}) => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermission();
  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;
  const [startTime, setStartTime] = useState(actualStart || scheduledStart);
  const [endTime, setEndTime] = useState(actualEnd || scheduledEnd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState(false);

  // Theme colors matching AppointmentDialog
  const themeColor = '#3B82F6';
  const themeColorLight = 'rgba(59, 130, 246, 0.15)';

  // 当对话框打开或数据变化时，重置状态
  useEffect(() => {
    if (open) {
      setStartTime(actualStart || scheduledStart);
      setEndTime(actualEnd || scheduledEnd);
      setError(null);
    }
  }, [open, actualStart, actualEnd, scheduledStart, scheduledEnd]);

  const handleSave = async () => {
    // 验证时间
    if (!startTime || !endTime) {
      setError(t('schedule.pleaseSelectTime'));
      return;
    }

    // 验证结束时间晚于开始时间
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setError(t('schedule.endTimeMustAfterStart'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(startTime, endTime);
      // 延迟关闭对话框，确保 snackbar 提示能够显示
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      setError(err.message || t('schedule.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStartTime(scheduledStart);
    setEndTime(scheduledEnd);
  };

  const handleSendSummaryClick = () => {
    // 检查权限 - 没有权限时静默返回，不显示提示
    if (!hasPermission('schedule:send_summary')) {
      return;
    }

    // 显示确认对话框
    setShowConfirmSendDialog(true);
  };

  const handleConfirmSendSummary = async () => {
    // 关闭确认对话框
    setShowConfirmSendDialog(false);

    try {
      setSendingSummary(true);

      // 格式化日期为 YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');

      // 发送单个员工的汇总
      await staffAttendanceApi.sendSingleStaffDailySummary(staffId, dateStr);

      // 显示成功消息
      onShowMessage(t('schedule.summaryEmailSent'), 'success');

      // 延迟关闭对话框，确保 snackbar 提示能够显示
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      // 显示错误消息，但不关闭对话框
      onShowMessage(err.message || t('schedule.sendSummaryFailed'), 'error');
    } finally {
      setSendingSummary(false);
    }
  };

  const handleCancelSendSummary = () => {
    setShowConfirmSendDialog(false);
  };

  const hasChanges = startTime !== scheduledStart || endTime !== scheduledEnd;

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      container={container || undefined}
      disablePortal={!!container}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          pb: 2,
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
          <EventAvailableIcon sx={{ fontSize: 28, color: '#1976D2' }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {t('schedule.staffCheckInOut')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {staffName} - {format(date, i18n.language === 'zh-CN' ? 'M月d日' : 'MMMM d', { locale })}
            </Typography>
          </Box>
        </Box>
        {/* 发送工作汇总按钮 - 仅在有权限时显示 */}
        {hasPermission('schedule:send_summary') && (
          <Button
            onClick={handleSendSummaryClick}
            disabled={sendingSummary || saving}
            startIcon={<EmailIcon />}
            size="small"
            sx={{
              borderRadius: 2,
              px: 2,
              py: 0.75,
              color: '#10B981',
              borderColor: '#10B981',
              border: '1px solid',
              fontWeight: 600,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: alpha('#10B981', 0.08),
                borderColor: '#10B981',
              },
            }}
          >
            {sendingSummary ? t('schedule.sendingSummary') : t('schedule.sendWorkSummary')}
          </Button>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* 原始排班时间 */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: alpha('#1976D2', 0.05),
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: alpha('#1976D2', 0.15),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: '#1976D2' }} />
            <Typography variant="body2" fontWeight={600} color="#1976D2">
              {t('schedule.scheduledTime')}
            </Typography>
          </Box>
          {/* 如果有多个时间槽，显示所有时间槽 */}
          {scheduledTimeSlots && scheduledTimeSlots.length > 1 ? (
            <Box>
              <Typography variant="body1" fontWeight={600} color="#111827" sx={{ mb: 0.5 }}>
                {scheduledTimeSlots.join(', ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({t('schedule.multipleTimeSlots', '共{{count}}个时间段', { count: scheduledTimeSlots.length })})
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" fontWeight={600} color="#111827">
              {scheduledStart} - {scheduledEnd}
            </Typography>
          )}
        </Box>

        {/* 多时间槽提示 */}
        {scheduledTimeSlots && scheduledTimeSlots.length > 1 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('schedule.multipleTimeSlotsInfo', '原排班有多个时间段（含休息时间）。修改签到时间仅影响第一个时段的开始，修改签退时间仅影响最后一个时段的结束，中间的休息时间将保留。')}
          </Alert>
        )}

        {/* 实际签到签退时间 */}
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
          {t('schedule.actualWorkTime')} {t('schedule.today')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label={t('schedule.checkInTime')}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }} // 5分钟间隔
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1976D2',
                },
              },
            }}
          />
          <TextField
            label={t('schedule.checkOutTime')}
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }} // 5分钟间隔
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1976D2',
                },
              },
            }}
          />
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha(themeColor, 0.02),
        }}
      >
        {hasChanges && (
          <Button
            onClick={handleReset}
            disabled={saving}
            sx={{
              borderRadius: 2,
              px: 3,
              color: 'text.secondary',
            }}
          >
            {t('schedule.resetToScheduled')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            borderRadius: 2,
            px: 3,
            color: 'text.secondary',
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || !hasChanges}
          sx={{
            borderRadius: 2,
            px: 3,
            background: themeColorLight,
            color: themeColor,
            fontWeight: 600,
            boxShadow: `0 2px 8px ${alpha(themeColor, 0.2)}`,
            '&:hover': {
              background: alpha(themeColor, 0.2),
              boxShadow: `0 4px 12px ${alpha(themeColor, 0.3)}`,
            },
          }}
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>

      {/* 确认发送汇总对话框 */}
      <Dialog
        open={showConfirmSendDialog}
        onClose={handleCancelSendSummary}
        container={container || undefined}
        disablePortal={!!container}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmailIcon sx={{ fontSize: 28, color: '#10B981' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('schedule.confirmSendSummary')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('schedule.confirmSendSummaryMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={handleCancelSendSummary}
            sx={{
              borderRadius: 2,
              px: 3,
              color: 'text.secondary',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmSendSummary}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: '#10B981',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#059669',
              },
            }}
          >
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdjustAvailabilityDialog;
