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
    return new Date(dateTime).toLocaleString('zh-CN');
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
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
          color: 'white',
          borderRadius: 0,
          py: 4,
          px: 5,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={3}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {t('customers.import.historyTitle')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 300 }}>
                {t('customers.import.historySubtitle')}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={fetchImportLogs}
            disabled={loading}
            sx={{
              color: 'white',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              p: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'rotate(180deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 5, background: '#fafbfc' }}>
        <Box sx={{
          background: 'white',
          borderRadius: 3,
          p: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f3f4f6'
        }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: 24,
                }
              }}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={6}>
              <CircularProgress size={48} />
            </Box>
          ) : logs.length === 0 ? (
            <Box textAlign="center" p={6}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {t('customers.import.noRecords')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('customers.import.noRecordsDescription')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.fileName')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.status')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.totalRecords')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.success')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.failed')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.successRate')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.startTime')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.completeTime')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{t('customers.import.tableHeaders.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.totalRecords || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          {log.successRecords || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                          {log.failedRecords || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          color={calculateSuccessRate(log.successRecords || 0, log.totalRecords || 0) >= 80 ? 'success.main' : 'warning.main'}
                          sx={{ fontWeight: 600 }}
                        >
                          {calculateSuccessRate(log.successRecords || 0, log.totalRecords || 0)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDateTime(log.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {log.completedAt ? formatDateTime(log.completedAt) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {log.failedRecords > 0 && (
                          <Tooltip title={t('customers.import.downloadErrorReport')}>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadErrorReport(log.importSessionId)}
                              sx={{
                                color: '#ef4444',
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                },
                              }}
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
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 4,
        gap: 2,
        borderTop: '1px solid #e5e7eb',
        background: '#f9fafb',
        justifyContent: 'flex-end'
      }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            py: 1.5,
            px: 3,
            borderColor: '#34D399',
            color: '#34D399',
            '&:hover': {
              borderColor: '#10B981',
              backgroundColor: 'rgba(52, 211, 153, 0.08)'
            },
            transition: 'all 0.3s ease',
          }}
        >
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};