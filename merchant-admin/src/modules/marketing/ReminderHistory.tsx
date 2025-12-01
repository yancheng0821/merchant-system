import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  alpha,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Button,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { marketingApi, MarketingSendLog } from '../../services/api';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';

const ReminderHistory: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeMode } = useTheme();
  const { user } = useAuth();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const isMonochrome = themeMode === 'monochrome';
  const THEME_COLOR = isMonochrome ? '#1a1a1a' : '#059669';

  const [logs, setLogs] = useState<MarketingSendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // 防抖搜索
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, statusFilter, debouncedKeyword]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await marketingApi.getSendLogs({
        tenantId: user?.tenantId || 0,
        page,
        size: rowsPerPage,
        status: statusFilter || undefined,
        keyword: debouncedKeyword || undefined,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <Chip
            label={t('marketing.status.sent')}
            size="small"
            sx={{
              bgcolor: alpha('#10B981', 0.1),
              color: '#10B981',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        );
      case 'FAILED':
        return (
          <Chip
            label={t('marketing.status.failed')}
            size="small"
            sx={{
              bgcolor: alpha('#ef4444', 0.1),
              color: '#dc2626',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        );
      case 'PENDING':
        return (
          <Chip
            label={t('marketing.status.pending')}
            size="small"
            sx={{
              bgcolor: alpha('#f59e0b', 0.1),
              color: '#d97706',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <EmailIcon fontSize="small" sx={{ color: THEME_COLOR }} />;
      case 'SMS':
        return <SmsIcon fontSize="small" sx={{ color: THEME_COLOR }} />;
      default:
        return null;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress sx={{ color: THEME_COLOR }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 筛选栏 */}
      {isMobile ? (
        /* 移动端筛选布局 */
        <Box sx={{ mb: 2 }}>
          <Box display="flex" gap={1} mb={1.5}>
            <IconButton
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              sx={{
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 1.5,
                width: 40,
                height: 40,
                color: filtersExpanded ? THEME_COLOR : '#666',
                bgcolor: filtersExpanded ? alpha(THEME_COLOR, 0.08) : 'transparent',
              }}
            >
              <FilterListIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
          <Collapse in={filtersExpanded}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', mb: 1.5 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('marketing.searchPlaceholder')}
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    if (page !== 0) setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.75rem',
                    },
                  }}
                />
                <FormControl size="small" fullWidth>
                  <Select
                    value={statusFilter}
                    displayEmpty
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(0);
                    }}
                    sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>{t('common.all')}</MenuItem>
                    <MenuItem value="SENT" sx={{ fontSize: '0.75rem' }}>{t('marketing.status.sent')}</MenuItem>
                    <MenuItem value="FAILED" sx={{ fontSize: '0.75rem' }}>{t('marketing.status.failed')}</MenuItem>
                    <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>{t('marketing.status.pending')}</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      ) : (
        /* 桌面端筛选布局 */
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={3}>
          <TextField
            size="small"
            placeholder={t('marketing.searchPlaceholder')}
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              if (page !== 0) {
                setPage(0);
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: '#fff',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: THEME_COLOR,
                },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={statusFilter}
              displayEmpty
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{
                borderRadius: 1,
                bgcolor: '#fff',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: THEME_COLOR,
                },
              }}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="SENT">{t('marketing.status.sent')}</MenuItem>
              <MenuItem value="FAILED">{t('marketing.status.failed')}</MenuItem>
              <MenuItem value="PENDING">{t('marketing.status.pending')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* 记录列表 */}
      {logs.length === 0 ? (
        <Box
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            bgcolor: '#fff',
            textAlign: 'center',
            py: isMobile ? 6 : 8,
          }}
        >
          <Box sx={{ color: alpha(THEME_COLOR, 0.3), mb: 2 }}>
            <EmailIcon sx={{ fontSize: isMobile ? 40 : 48 }} />
          </Box>
          <Typography color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
            {t('marketing.noLogs')}
          </Typography>
        </Box>
      ) : isMobile ? (
        /* 移动端卡片视图 */
        <Box>
          {logs.map((log) => (
            <Card
              key={log.id}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* 第一行：规则名称 + 状态 */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.75}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a1a1a', flex: 1 }} noWrap>
                    {log.ruleName}
                  </Typography>
                  {getStatusChip(log.status)}
                </Box>
                {/* 第二行：客户信息 + 联系方式 */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#1a1a1a' }}>
                    {log.customerName}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {getNotificationTypeIcon(log.notificationType)}
                    <Typography sx={{ fontSize: '0.65rem', color: '#888' }} noWrap>
                      {log.notificationType === 'EMAIL' ? log.customerEmail : log.customerPhone}
                    </Typography>
                  </Box>
                </Box>
                {/* 第三行：发送时间 */}
                <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                  {formatUtcToMerchantTime(log.sentAt, 'yyyy-MM-dd HH:mm')}
                </Typography>
                {/* 错误信息（如果有） */}
                {log.errorMessage && (
                  <Typography sx={{ fontSize: '0.65rem', color: '#ef4444', mt: 0.5 }} noWrap>
                    {log.errorMessage}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
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
              {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, total)} / {total}
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem', color: '#666', borderRadius: 1 }}
              >
                {t('common.previousPage')}
              </Button>
              <Button
                size="small"
                disabled={(page + 1) * rowsPerPage >= total}
                onClick={() => setPage(page + 1)}
                sx={{ minWidth: 'auto', px: 1.5, py: 0.5, fontSize: '0.75rem', color: THEME_COLOR, borderRadius: 1 }}
              >
                {t('common.nextPage')}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        /* 桌面端表格视图 */
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
              <TableHead>
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.sendTime')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.ruleName')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.customer')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.contact')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.type')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('common.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.875rem', py: 1.5 }}>{t('marketing.errorMessage')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatUtcToMerchantTime(log.sentAt, 'yyyy-MM-dd HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {log.ruleName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.notificationType === 'EMAIL' ? log.customerEmail : log.customerPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getNotificationTypeIcon(log.notificationType)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(log.status)}
                    </TableCell>
                    <TableCell>
                      {log.errorMessage && (
                        <Typography variant="body2" color="error" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage={t('common.rowsPerPage')}
          />
        </Box>
      )}
    </Box>
  );
};

export default ReminderHistory;
