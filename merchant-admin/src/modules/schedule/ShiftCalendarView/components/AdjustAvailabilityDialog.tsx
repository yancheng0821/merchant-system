import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  DialogContentText,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  Email as EmailIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { staffAttendanceApi } from '../../../../services/api';
import { usePermission } from '../../../../hooks/usePermission';
import { useTheme } from '../../../../contexts/ThemeContext';

// 根据主题模式获取TimePicker样式
const getTimePickerStyles = (themeColor: string) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    bgcolor: '#fafafa',
    '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
    '&.Mui-focused fieldset': { borderColor: themeColor, borderWidth: '1px' },
    '&.Mui-focused': { bgcolor: '#fff' },
  },
  '& .MuiInputLabel-root': {
    color: '#888',
    '&.Mui-focused': { color: themeColor },
  },
});

// 时间字符串转Date对象 (如 "09:00" -> Date)
const timeStringToDate = (timeStr: string): Date | null => {
  if (!timeStr) return null;
  try {
    return parse(timeStr, 'HH:mm', new Date());
  } catch {
    return null;
  }
};

// Date对象转时间字符串 (如 Date -> "09:00")
const dateToTimeString = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'HH:mm');
};

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
  const { themeMode } = useTheme();
  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;
  const [startTime, setStartTime] = useState(actualStart || scheduledStart);
  const [endTime, setEndTime] = useState(actualEnd || scheduledEnd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [showConfirmSendDialog, setShowConfirmSendDialog] = useState(false);

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#3B82F6';
  const THEME_COLOR_HOVER = isMonochrome ? '#333' : '#2563EB';
  // send summary按钮颜色 - monochrome模式下使用主题色
  const SUCCESS_COLOR = isMonochrome ? '#1a1a1a' : '#10B981';
  const SUCCESS_COLOR_HOVER = isMonochrome ? '#333' : '#059669';
  const timePickerStyles = getTimePickerStyles(THEME_COLOR);

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
      PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
    >
      {/* 简约标题 */}
      <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: alpha(THEME_COLOR, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: THEME_COLOR,
            }}>
              <AccessTimeIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
                {t('schedule.staffCheckInOut')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#888' }}>
                {staffName} - {format(date, i18n.language === 'zh-CN' ? 'M月d日' : 'MMMM d', { locale })}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {/* 发送工作汇总按钮 - 仅在有权限时显示 */}
            {hasPermission('schedule:send_summary') && (
              <Button
                onClick={handleSendSummaryClick}
                disabled={sendingSummary || saving}
                startIcon={<EmailIcon sx={{ fontSize: 16 }} />}
                size="small"
                sx={{
                  borderRadius: 1.5, px: 1.5, py: 0.5,
                  color: SUCCESS_COLOR, borderColor: SUCCESS_COLOR, border: '1px solid',
                  fontWeight: 500, fontSize: '0.75rem', whiteSpace: 'nowrap', textTransform: 'none',
                  '&:hover': { bgcolor: alpha(SUCCESS_COLOR, 0.08) },
                }}
              >
                {sendingSummary ? t('schedule.sendingSummary') : t('schedule.sendWorkSummary')}
              </Button>
            )}
            <IconButton size="small" onClick={onClose} sx={{ color: '#999' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* 原始排班时间 */}
        <Box sx={{ mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <ScheduleIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('schedule.scheduledTime')}
            </Typography>
          </Box>
          <Box sx={{
            p: 1.5, bgcolor: alpha(THEME_COLOR, 0.04), borderRadius: 1.5,
            border: '1px solid', borderColor: alpha(THEME_COLOR, 0.1),
          }}>
            {scheduledTimeSlots && scheduledTimeSlots.length > 1 ? (
              <Box>
                <Typography variant="body2" fontWeight={600} color="#1a1a1a" sx={{ mb: 0.5 }}>
                  {scheduledTimeSlots.join(', ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({t('schedule.multipleTimeSlots', '共{{count}}个时间段', { count: scheduledTimeSlots.length })})
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" fontWeight={600} color="#1a1a1a">
                {scheduledStart} - {scheduledEnd}
              </Typography>
            )}
          </Box>
        </Box>

        {/* 多时间槽提示 */}
        {scheduledTimeSlots && scheduledTimeSlots.length > 1 && (
          <Alert
            severity="info"
            sx={{
              mb: 2.5,
              borderRadius: 1.5,
              bgcolor: isMonochrome ? 'rgba(26, 26, 26, 0.05)' : undefined,
              color: isMonochrome ? '#333' : undefined,
              '& .MuiAlert-icon': {
                color: isMonochrome ? '#1a1a1a' : undefined,
              },
            }}
          >
            {t('schedule.multipleTimeSlotsInfo', '原排班有多个时间段（含休息时间）。修改签到时间仅影响第一个时段的开始，修改签退时间仅影响最后一个时段的结束，中间的休息时间将保留。')}
          </Alert>
        )}

        {/* 实际签到签退时间 */}
        <Box sx={{ mb: 2.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <AccessTimeIcon sx={{ fontSize: 18, color: THEME_COLOR }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              {t('schedule.actualWorkTime')} {t('schedule.today')}
            </Typography>
          </Box>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label={t('schedule.checkInTime')}
                value={timeStringToDate(startTime)}
                onChange={(newValue) => setStartTime(dateToTimeString(newValue))}
                minutesStep={5}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: timePickerStyles,
                  },
                  popper: {
                    container: container || undefined,
                    sx: {
                      zIndex: container ? 10002 : 1400,
                      '& .MuiPickersLayout-root': {
                        bgcolor: '#fff',
                      },
                      '& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiClockNumber-root.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiDigitalClock-item.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiMultiSectionDigitalClockSection-item.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                    },
                  },
                }}
              />
              <TimePicker
                label={t('schedule.checkOutTime')}
                value={timeStringToDate(endTime)}
                onChange={(newValue) => setEndTime(dateToTimeString(newValue))}
                minutesStep={5}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: timePickerStyles,
                  },
                  popper: {
                    container: container || undefined,
                    sx: {
                      zIndex: container ? 10002 : 1400,
                      '& .MuiPickersLayout-root': {
                        bgcolor: '#fff',
                      },
                      '& .MuiClock-pin, & .MuiClockPointer-root, & .MuiClockPointer-thumb': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiClockNumber-root.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiPickersDay-root.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiDigitalClock-item.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                      '& .MuiMultiSectionDigitalClockSection-item.Mui-selected': {
                        bgcolor: THEME_COLOR,
                      },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {hasChanges && (
          <Button size="small" onClick={handleReset} disabled={saving} sx={{
            borderRadius: 1.5, px: 2, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
            color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}>
            {t('schedule.resetToScheduled')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={onClose} disabled={saving} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
        }}>
          {t('common.cancel')}
        </Button>
        <Button size="small" variant="contained" onClick={handleSave} disabled={saving || !hasChanges} sx={{
          borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
          bgcolor: THEME_COLOR, boxShadow: 'none', textTransform: 'none',
          '&:hover': { bgcolor: THEME_COLOR_HOVER, boxShadow: 'none' },
        }}>
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
        PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              bgcolor: alpha(SUCCESS_COLOR, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: SUCCESS_COLOR,
            }}>
              <EmailIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#1a1a1a' }}>
              {t('schedule.confirmSendSummary')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <DialogContentText sx={{ color: '#666' }}>
            {t('schedule.confirmSendSummaryMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button size="small" onClick={handleCancelSendSummary} sx={{
            borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
            color: '#666', textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}>
            {t('common.cancel')}
          </Button>
          <Button size="small" variant="contained" onClick={handleConfirmSendSummary} sx={{
            borderRadius: 1.5, px: 2.5, py: 0.75, fontSize: '0.8125rem', fontWeight: 500,
            bgcolor: SUCCESS_COLOR, boxShadow: 'none', textTransform: 'none',
            '&:hover': { bgcolor: SUCCESS_COLOR_HOVER, boxShadow: 'none' },
          }}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdjustAvailabilityDialog;
