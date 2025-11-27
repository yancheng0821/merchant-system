import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  alpha,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import zhCNLocale from 'date-fns/locale/zh-CN';
import enUSLocale from 'date-fns/locale/en-US';
import { format } from 'date-fns';
import { shiftApi, handleApiError } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getMerchantNow } from '../../../utils/timezoneUtils';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';

interface ShiftDialogProps {
  open: boolean;
  shift?: any | null;
  resourceId?: number;
  onClose: (reload?: boolean) => void;
}

const ShiftDialog: React.FC<ShiftDialogProps> = ({ open, shift, resourceId, onClose }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const themeColor = isMonochrome ? '#1a1a1a' : '#3B82F6';
  const themeColorLight = isMonochrome ? 'rgba(26, 26, 26, 0.1)' : 'rgba(59, 130, 246, 0.15)';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    resourceId: resourceId || '',
    shiftName: '',
    shiftDate: getMerchantNow(),
    startTime: (() => { const d = getMerchantNow(); d.setHours(9, 0, 0, 0); return d; })(),
    endTime: (() => { const d = getMerchantNow(); d.setHours(17, 0, 0, 0); return d; })(),
    breakStart: null as Date | null,
    breakEnd: null as Date | null,
    status: 'SCHEDULED',
    allowOnlineBooking: true,
    maxAppointments: '',
    notes: '',
  });

  const locale = i18n.language === 'zh-CN' ? zhCNLocale : enUSLocale;

  useEffect(() => {
    if (open) {
      loadResources();
      if (shift) {
        setFormData({
          resourceId: shift.resourceId,
          shiftName: shift.shiftName || '',
          shiftDate: new Date(shift.shiftDate),
          startTime: parseTime(shift.startTime),
          endTime: parseTime(shift.endTime),
          breakStart: shift.breakStart ? parseTime(shift.breakStart) : null,
          breakEnd: shift.breakEnd ? parseTime(shift.breakEnd) : null,
          status: shift.status,
          allowOnlineBooking: shift.allowOnlineBooking,
          maxAppointments: shift.maxAppointments || '',
          notes: shift.notes || '',
        });
      }
    }
  }, [open, shift]);

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = getMerchantNow();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date | null): string | null => {
    return date ? format(date, 'HH:mm:ss') : null;
  };

  const loadResources = async () => {
    // 使用模拟数据
    const mockResources = [
      { id: 1, name: 'Emma (发型师)', type: 'STYLIST' },
      { id: 2, name: 'Sophia (美甲师)', type: 'NAIL_TECH' },
      { id: 3, name: 'Olivia (美容师)', type: 'ESTHETICIAN' },
      { id: 4, name: '房间 A', type: 'ROOM' },
      { id: 5, name: '房间 B', type: 'ROOM' },
    ];
    setResources(mockResources);

    // 真实 API（已注释）
    /*
    try {
      const data = await shiftApi.getResourcesByTenant(user?.tenantId || 0);
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
      handleApiError(err);
    }
    */
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 模拟保存
    setTimeout(() => {
      setLoading(false);
      onClose(true);
    }, 500);

    // 真实 API（已注释）
    /*
    try {
      const payload = {
        tenantId: user?.tenantId,
        resourceId: formData.resourceId,
        shiftName: formData.shiftName,
        shiftDate: format(formData.shiftDate, 'yyyy-MM-dd'),
        startTime: formatTime(formData.startTime),
        endTime: formatTime(formData.endTime),
        breakStart: formatTime(formData.breakStart),
        breakEnd: formatTime(formData.breakEnd),
        status: formData.status,
        allowOnlineBooking: formData.allowOnlineBooking,
        maxAppointments: formData.maxAppointments || null,
        notes: formData.notes,
        createdBy: user?.id,
      };

      if (shift) {
        await shiftApi.updateShift(shift.id, payload);
      } else {
        await shiftApi.createShift(payload);
      }

      onClose(true);
    } catch (err: any) {
      setError(t('shift.saveError'));
      handleApiError(err);
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(themeColor, 0.05)}, ${alpha(themeColor, 0.08)})`,
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
                background: themeColorLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: themeColor,
              }}
            >
              <ScheduleIcon sx={{ fontSize: 24 }} />
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
                {shift ? t('shift.editShift') : t('shift.addShift')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {shift ? t('shift.editShiftDescription') : t('shift.addShiftDescription')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => onClose()}
            sx={{
              '&:hover': {
                backgroundColor: alpha(themeColor, 0.1),
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale}>
            {/* Basic Information */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid',
                borderColor: alpha(themeColor, 0.2),
                borderRadius: 2,
                background: alpha(themeColor, 0.02),
              }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: themeColorLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColor,
                  }}
                >
                  <EventIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
                  {t('shift.basicInfo')}
                </Typography>
              </Box>

              <Grid container spacing={2}>
            {!resourceId && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label={t('shift.resource')}
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(themeColor, 0.5),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: themeColor,
                        borderWidth: 2,
                      },
                    },
                  }}
                >
                  {resources.map((resource) => (
                    <MenuItem key={resource.id} value={resource.id}>
                      {resource.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('shift.shiftName')}
                value={formData.shiftName}
                onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                placeholder={t('shift.shiftNamePlaceholder')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(themeColor, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label={t('shift.date')}
                value={formData.shiftDate}
                onChange={(date) => setFormData({ ...formData, shiftDate: date || getMerchantNow() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(themeColor, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                          borderWidth: 2,
                        },
                      },
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label={t('shift.status')}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(themeColor, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                      borderWidth: 2,
                    },
                  },
                }}
              >
                <MenuItem value="SCHEDULED">{t('shift.status.scheduled')}</MenuItem>
                <MenuItem value="COMPLETED">{t('shift.status.completed')}</MenuItem>
                <MenuItem value="CANCELLED">{t('shift.status.cancelled')}</MenuItem>
              </TextField>
            </Grid>
              </Grid>
            </Paper>

            {/* Time Settings */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid',
                borderColor: alpha(themeColor, 0.2),
                borderRadius: 2,
                background: alpha(themeColor, 0.02),
              }}
            >
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: themeColorLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: themeColor,
                  }}
                >
                  <TimeIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
                  {t('shift.timeSettings')}
                </Typography>
              </Box>

              <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TimePicker
                label={t('shift.startTime')}
                value={formData.startTime}
                onChange={(time) => setFormData({ ...formData, startTime: time || getMerchantNow() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(themeColor, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                          borderWidth: 2,
                        },
                      },
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label={t('shift.endTime')}
                value={formData.endTime}
                onChange={(time) => setFormData({ ...formData, endTime: time || getMerchantNow() })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(themeColor, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                          borderWidth: 2,
                        },
                      },
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label={t('shift.breakStart')}
                value={formData.breakStart}
                onChange={(time) => setFormData({ ...formData, breakStart: time })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(themeColor, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                          borderWidth: 2,
                        },
                      },
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TimePicker
                label={t('shift.breakEnd')}
                value={formData.breakEnd}
                onChange={(time) => setFormData({ ...formData, breakEnd: time })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(themeColor, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                          borderWidth: 2,
                        },
                      },
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={t('shift.maxAppointments')}
                value={formData.maxAppointments}
                onChange={(e) => setFormData({ ...formData, maxAppointments: e.target.value })}
                placeholder={t('shift.maxAppointmentsPlaceholder')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(themeColor, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" height="100%">
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowOnlineBooking}
                      onChange={(e) => setFormData({ ...formData, allowOnlineBooking: e.target.checked })}
                    />
                  }
                  label={t('shift.allowOnlineBooking')}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('shift.notes')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('shift.notesPlaceholder')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(themeColor, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: themeColor,
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Grid>
              </Grid>
            </Paper>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: alpha(themeColor, 0.02),
        }}
      >
        <Button
          onClick={() => onClose()}
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            color: 'text.secondary',
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.resourceId}
          startIcon={loading && <CircularProgress size={20} />}
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
            '&.Mui-disabled': {
              background: alpha(themeColor, 0.1),
              color: alpha(themeColor, 0.5),
            },
          }}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftDialog;
