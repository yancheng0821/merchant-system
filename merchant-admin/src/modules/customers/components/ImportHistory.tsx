import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Download,
  Refresh,
  CheckCircle,
  Error,
  Schedule,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { customerApi } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { smartFormatDateTime } from '../../../utils/timezoneUtils';
import { useTheme } from '../../../contexts/ThemeContext';

interface ImportHistoryProps {
  open: boolean;
  onClose: () => void;
}

interface ImportLog {
  id: number;
  importSessionId: string;
  fileName: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export const ImportHistory: React.FC<ImportHistoryProps> = ({
  open,
  onClose
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { themeMode } = useTheme();

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#EC4899';

  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImportLogs = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await customerApi.getCustomerImportLogs(user.tenantId.toString());
      setLogs(response);
    } catch (err: any) {
      console.error('Error fetching import logs:', err);
      setError(err.responseData?.message || err.message || t('customers.import.fetchLogsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchImportLogs();
    }
  }, [open, user?.tenantId]);

  const handleDownloadErrorReport = (importSessionId: string) => {
    if (!user?.tenantId) return;

    customerApi.downloadCustomerImportErrorReport(user.tenantId.toString(), importSessionId);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Chip
            icon={<CheckCircle />}
            label={t('customers.import.status.completed')}
            color="success"
            size="small"
          />
        );
      case 'FAILED':
        return (
          <Chip
            icon={<Error />}
            label={t('customers.import.status.failed')}
            color="error"
            size="small"
          />
        );
      case 'PROCESSING':
        return (
          <Chip
            icon={<Schedule />}
            label={t('customers.import.status.processing')}
            color="warning"
            size="small"
          />
        );
      default:
        return (
          <Chip
            label={status}
            size="small"
          />
        );
    }
  };

  const formatDateTime = (dateTime: string) => {
    return smartFormatDateTime(dateTime, 'yyyy-MM-dd HH:mm:ss');
  };

  const calculateSuccessRate = (successRecords: number, totalRecords: number) => {
    if (totalRecords === 0) return 0;
    return Math.round((successRecords / totalRecords) * 100);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600, color: THEME_COLOR }}>
            {t('customers.import.historyTitle')}
          </Typography>
          <IconButton
            onClick={fetchImportLogs}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box textAlign="center" p={4}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {t('customers.import.noRecords')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('customers.import.noRecordsDescription')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('customers.import.tableHeaders.fileName')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.status')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.totalRecords')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.success')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.failed')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.successRate')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.startTime')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.completeTime')}</TableCell>
                  <TableCell align="center">{t('customers.import.tableHeaders.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {log.fileName}
                      </Typography>
                      {log.errorMessage && (
                        <Typography variant="caption" color="error" display="block">
                          {log.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(log.status)}
                    </TableCell>
                    <TableCell align="center">
                      {log.totalRecords || 0}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="success.main">
                        {log.successRecords || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="error.main">
                        {log.failedRecords || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={calculateSuccessRate(log.successRecords || 0, log.totalRecords || 0) >= 80 ? 'success.main' : 'warning.main'}
                      >
                        {calculateSuccessRate(log.successRecords || 0, log.totalRecords || 0)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(log.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {log.completedAt ? formatDateTime(log.completedAt) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {log.failedRecords > 0 && (
                        <Tooltip title={t('customers.import.downloadErrorReport')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDownloadErrorReport(log.importSessionId)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};