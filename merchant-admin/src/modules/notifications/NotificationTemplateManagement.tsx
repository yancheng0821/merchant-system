import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  alpha,
  CircularProgress,
  Menu,
  Paper,
  Grid,
  InputAdornment,
  Snackbar,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Code as CodeIcon,
  Subject as SubjectIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { notificationApi } from '../../services/api';
import { usePermission } from '../../hooks/usePermission';
import { useTheme } from '../../contexts/ThemeContext';
import { formatUtcToMerchantTime } from '../../utils/timezoneUtils';

interface NotificationTemplate {
  id: number;
  tenantId: number;
  templateCode: string;
  templateName: string;
  type: 'SMS' | 'EMAIL';
  subject?: string;
  content: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps & { isMobile?: boolean }) {
  const { children, value, index, isMobile, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: isMobile ? 1 : 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationTemplateManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  // 移动端检测
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInitDialog, setOpenInitDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 根据主题模式动态设置主题色
  const isMonochrome = themeMode === 'monochrome';
  const themeColor = isMonochrome ? '#1a1a1a' : '#F97316';
  const themeColorDark = isMonochrome ? '#333' : '#EA580C';

  // 获取租户ID
  const tenantId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return Number(user.tenantId || 1);
  }, []);

  const [formData, setFormData] = useState({
    templateCode: '',
    templateName: '',
    type: 'SMS' as 'SMS' | 'EMAIL',
    subject: '',
    content: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const templateCodes = [
    { value: 'APPOINTMENT_CONFIRMATION', label: t('notifications.templateCodes.appointmentConfirmed') },
    { value: 'APPOINTMENT_CANCELLATION', label: t('notifications.templateCodes.appointmentCancelled') },
    { value: 'APPOINTMENT_COMPLETION', label: t('notifications.templateCodes.appointmentCompleted') },
    { value: 'APPOINTMENT_REMINDER', label: t('notifications.templateCodes.appointmentReminder') },
    { value: 'PACKAGE_VERIFICATION', label: t('notifications.templateCodes.packageVerification') },
    { value: 'PACKAGE_PURCHASE_SUCCESS', label: t('notifications.templateCodes.packagePurchaseSuccess') }
  ];

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const templates = await notificationApi.getTemplates(tenantId);
      setTemplates(templates);
      setError(null);
    } catch (err) {
      setError(t('notifications.fetchTemplatesFailed'));
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenDialog = (template?: NotificationTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        templateCode: template.templateCode,
        templateName: template.templateName,
        type: template.type,
        subject: template.subject || '',
        content: template.content,
        status: template.status
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        templateCode: '',
        templateName: '',
        type: 'SMS',
        subject: '',
        content: '',
        status: 'ACTIVE'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDialogExited = () => {
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    try {
      const templateData = { ...formData, tenantId };

      if (editingTemplate) {
        await notificationApi.updateTemplate(editingTemplate.id, templateData);
        setSuccessMessage(t('notifications.updateTemplateSuccess'));
      } else {
        await notificationApi.createTemplate(templateData);
        setSuccessMessage(t('notifications.createTemplateSuccess'));
      }

      await fetchTemplates();
      handleCloseDialog();
    } catch (err) {
      setError(t('notifications.saveTemplateFailed'));
      console.error('Error saving template:', err);
    }
  };

  const handleDelete = (id: number) => {
    setDeletingTemplateId(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTemplateId) {
      try {
        await notificationApi.deleteTemplate(deletingTemplateId);
        setSuccessMessage(t('notifications.deleteTemplateSuccess'));
        await fetchTemplates();
        setOpenDeleteDialog(false);
        setDeletingTemplateId(null);
      } catch (err) {
        setError(t('notifications.deleteTemplateFailed'));
        console.error('Error deleting template:', err);
      }
    }
  };

  const handleInitDefaultTemplates = () => {
    setOpenInitDialog(true);
  };

  const handleConfirmInit = async () => {
    try {
      // 获取当前用户的语言设置
      const currentLanguage = localStorage.getItem('language') || 'zh-CN';
      // 转换为简单的语言代码 (en-US -> en, zh-CN -> zh)
      const languageCode = currentLanguage.split('-')[0];
      await notificationApi.initDefaultTemplates(tenantId, languageCode);
      setSuccessMessage(t('notifications.initDefaultTemplatesSuccess'));
      await fetchTemplates();
      setOpenInitDialog(false);
    } catch (err) {
      setError(t('notifications.initDefaultTemplatesFailed'));
      console.error('Error initializing default templates:', err);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreview = () => {
    // 替换模板变量为示例数据
    const sampleData = {
      customerName: 'John Smith',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      serviceName: 'Haircut Service',
      staffName: 'Sarah',
      duration: '60',
      totalAmount: '$88.00',
      businessName: 'Beauty Salon',
      businessAddress: '123 Main Street',
      businessPhone: '(604) 123-4567',
      confirmationCode: 'ABC12345',
      googleCalendarUrl: '#',
      outlookUrl: '#',
      cancelUrl: '#',
    };

    let processedContent = formData.content;

    // 替换所有变量（支持 ${var} 和 {var} 两种格式）
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex1 = new RegExp(`\\$\\{${key}\\}`, 'g');
      const regex2 = new RegExp(`\\{${key}\\}`, 'g');
      processedContent = processedContent.replace(regex1, value);
      processedContent = processedContent.replace(regex2, value);
    });

    // 如果是 EMAIL 类型
    if (formData.type === 'EMAIL') {
      // 检查内容是否已经包含完整的HTML结构
      const hasHtmlStructure = processedContent.toLowerCase().includes('<html') ||
                               processedContent.toLowerCase().includes('<!doctype');

      if (hasHtmlStructure) {
        // 模板已经包含完整HTML，直接使用
        setPreviewHtml(processedContent);
      } else {
        // 简单的文本内容，包装成简洁的HTML
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 20px;
                }
                .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  padding: 30px;
                }
                .email-subject {
                  font-size: 18px;
                  font-weight: 600;
                  color: #1a1a1a;
                  margin-bottom: 20px;
                  padding-bottom: 15px;
                  border-bottom: 1px solid #eee;
                }
                .email-body p {
                  margin: 0 0 15px 0;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="email-subject">${formData.subject || 'Email Subject'}</div>
                <div class="email-body">
                  ${processedContent.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
                </div>
              </div>
            </body>
          </html>
        `;
        setPreviewHtml(html);
      }
    } else {
      // SMS 类型，简单显示
      setPreviewHtml(processedContent);
    }

    setOpenPreviewDialog(true);
  };

  const getFilteredTemplates = (type: 'SMS' | 'EMAIL') => {
    return templates.filter(template => template.type === type);
  };

  const renderTemplateTable = (templateList: NotificationTemplate[]) => {
    // 移动端卡片视图
    if (isMobile) {
      return (
        <Box>
          {templateList.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {t('notifications.noTemplates')}
              </Typography>
            </Box>
          ) : (
            templateList.map((template) => (
              <Card
                key={template.id}
                onClick={(e) => {
                  setMenuAnchorEl(e.currentTarget);
                  setSelectedTemplate(template);
                }}
                sx={{
                  mb: 1,
                  borderRadius: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  '&:active': { bgcolor: 'rgba(0,0,0,0.02)' },
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {/* 第一行：模板名称 + 状态 */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }} noWrap>
                        {template.templateName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#888' }} noWrap>
                        {template.templateCode}
                      </Typography>
                    </Box>
                    <Chip
                      label={template.status === 'ACTIVE' ? t('notifications.active') : t('notifications.inactive')}
                      size="small"
                      sx={{
                        backgroundColor: template.status === 'ACTIVE'
                          ? alpha('#10B981', 0.1)
                          : alpha('#6B7280', 0.1),
                        color: template.status === 'ACTIVE' ? '#10B981' : '#6B7280',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 20,
                        ml: 1,
                      }}
                    />
                  </Box>
                  {/* 第二行：更新时间 */}
                  <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                    {t('notifications.updatedAt')}: {formatUtcToMerchantTime(template.updatedAt, 'yyyy-MM-dd HH:mm')}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      );
    }

    // 桌面端表格视图
    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
              <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem', py: 1.5 }}>
                {t('notifications.templateCode')}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>
                {t('notifications.templateName')}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>
                {t('notifications.status')}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>
                {t('notifications.updatedAt')}
              </TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#666', fontSize: '0.8125rem' }}>
                {t('notifications.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templateList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('notifications.noTemplates')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              templateList.map((template) => (
                <TableRow
                  key={template.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(themeColor, 0.04),
                    },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {template.templateCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {template.templateName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={template.status === 'ACTIVE' ? t('notifications.active') : t('notifications.inactive')}
                      sx={{
                        backgroundColor: template.status === 'ACTIVE'
                          ? alpha('#10B981', 0.1)
                          : alpha('#6B7280', 0.1),
                        color: template.status === 'ACTIVE' ? '#10B981' : '#6B7280',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        '& .MuiChip-label': {
                          px: 2,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatUtcToMerchantTime(template.updatedAt, 'yyyy-MM-dd HH:mm:ss')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchorEl(e.currentTarget);
                        setSelectedTemplate(template);
                      }}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: alpha(themeColor, 0.1),
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: themeColor }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 操作按钮区域 */}
      <Card
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('notifications.templateManagement')}
            </Typography>
            <Box>
              {/* 暂时注释掉初始化模板和新增模板按钮 */}
              {/* <Button
                variant="outlined"
                onClick={handleInitDefaultTemplates}
                sx={{
                  mr: 2,
                  borderRadius: 2,
                  borderColor: themeColor,
                  color: themeColor,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: themeColor,
                    backgroundColor: alpha(themeColor, 0.08),
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.initDefaultTemplates')}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  borderRadius: 2,
                  background: isMonochrome ? themeColor : `linear-gradient(135deg, ${themeColor}, ${themeColorDark})`,
                  boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                  fontWeight: 600,
                  '&:hover': {
                    background: isMonochrome ? themeColorDark : `linear-gradient(135deg, ${themeColorDark}, #C2410C)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.addTemplate')}
              </Button> */}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#EF4444',
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* 模板表格 */}
      <Card
        sx={{
          borderRadius: isMobile ? 2 : 2.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              backgroundColor: '#fafafa',
              '& .MuiTab-root': {
                color: '#666',
                fontWeight: 500,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textTransform: 'none',
                py: isMobile ? 1 : 1.5,
                minHeight: isMobile ? 40 : 48,
                '&.Mui-selected': {
                  color: themeColor,
                  fontWeight: 600,
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: themeColor,
                height: 3,
              }
            }}
          >
            <Tab label={t('notifications.smsTemplate')} />
            <Tab label={t('notifications.emailTemplate')} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0} isMobile={isMobile}>
          {renderTemplateTable(getFilteredTemplates('SMS'))}
        </TabPanel>

        <TabPanel value={tabValue} index={1} isMobile={isMobile}>
          {renderTemplateTable(getFilteredTemplates('EMAIL'))}
        </TabPanel>
      </Card>

      {/* 编辑/新增模板弹窗 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          onExited: handleDialogExited,
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 2 : 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            m: isMobile ? 2 : 3,
          }
        }}
      >
        {/* 简化对话框标题 */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <EmailIcon sx={{ color: themeColor, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {editingTemplate ? t('notifications.editTemplate') : t('notifications.addTemplate')}
              </Typography>
            </Box>
            <IconButton
              onClick={handleCloseDialog}
              size="small"
              sx={{
                color: '#999',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  color: '#666',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* 基本信息 */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 2,
                background: '#fafafa',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem',
                }}
              >
                <CodeIcon sx={{ fontSize: 16, color: themeColor }} />
                {t('notifications.basicInfo')}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled>
                    <InputLabel>{t('notifications.templateCode')}</InputLabel>
                    <Select
                      value={formData.templateCode}
                      onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
                      label={t('notifications.templateCode')}
                      sx={{
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      }}
                    >
                      {templateCodes.map((code) => (
                        <MenuItem key={code.value} value={code.value}>
                          {code.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    label={t('notifications.templateName')}
                    value={formData.templateName}
                    onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled>
                    <InputLabel>{t('notifications.type')}</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'SMS' | 'EMAIL' })}
                      label={t('notifications.type')}
                      sx={{
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      }}
                    >
                      <MenuItem value="SMS">
                        <Box display="flex" alignItems="center" gap={1}>
                          <SmsIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
                          {t('notifications.sms')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="EMAIL">
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon sx={{ fontSize: 16, color: '#10B981' }} />
                          {t('notifications.email')}
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled>
                    <InputLabel>{t('notifications.status')}</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      label={t('notifications.status')}
                      sx={{
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      }}
                    >
                      <MenuItem value="ACTIVE">{t('notifications.active')}</MenuItem>
                      <MenuItem value="INACTIVE">{t('notifications.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* 内容配置 */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 2,
                background: '#fafafa',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem',
                }}
              >
                <DescriptionIcon sx={{ fontSize: 16, color: themeColor }} />
                {t('notifications.contentConfiguration')}
              </Typography>

              <Grid container spacing={2}>
                {formData.type === 'EMAIL' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('notifications.subject')}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={t('notifications.placeholders.emailSubject')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SubjectIcon sx={{ color: themeColor }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: themeColor,
                          },
                        },
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('notifications.content')}
                    multiline
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={t('notifications.placeholders.templateContent')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: themeColor,
                        },
                      },
                    }}
                  />
                </Grid>

                {/* HTML 渲染预览 - 仅当内容包含HTML标签时显示 */}
                {formData.type === 'EMAIL' && formData.content && formData.content.includes('<') && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: alpha(themeColor, 0.2),
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          backgroundColor: alpha(themeColor, 0.05),
                          borderBottom: '1px solid',
                          borderColor: alpha(themeColor, 0.2),
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 18, color: themeColor }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: themeColor }}>
                          {t('notifications.htmlPreview')}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: '#ffffff',
                          maxHeight: 400,
                          overflowY: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={handlePreview}
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            disabled={!formData.content}
            sx={{
              borderRadius: 1.5,
              px: 2,
              borderColor: themeColor,
              color: themeColor,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.8125rem',
              '&:hover': {
                borderColor: themeColor,
                backgroundColor: alpha(themeColor, 0.08),
              },
            }}
          >
            {t('notifications.preview')}
          </Button>
          <Box>
            <Button
              onClick={handleCloseDialog}
              size="small"
              sx={{
                borderRadius: 1.5,
                px: 2,
                color: '#666',
                mr: 1.5,
                textTransform: 'none',
                fontSize: '0.8125rem',
              }}
            >
              {t('notifications.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              size="small"
              sx={{
                borderRadius: 1.5,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                bgcolor: themeColor,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: themeColorDark,
                  boxShadow: 'none',
                },
              }}
            >
              {t('notifications.save')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('notifications.confirmDelete')}
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('notifications.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            size="small"
            sx={{ color: '#666', borderRadius: 1.5, textTransform: 'none', fontSize: '0.8125rem' }}
          >
            {t('notifications.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            size="small"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.8125rem',
              bgcolor: '#EF4444',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#DC2626',
                boxShadow: 'none',
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 初始化默认模板弹窗 */}
      <Dialog
        open={openInitDialog}
        onClose={() => setOpenInitDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
            {t('notifications.confirmInit')}
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" gutterBottom>
            {t('notifications.initConfirmMessage')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('notifications.initDefaultTemplatesDescription')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button
            onClick={() => setOpenInitDialog(false)}
            size="small"
            sx={{ color: '#666', borderRadius: 1.5, textTransform: 'none', fontSize: '0.8125rem' }}
          >
            {t('notifications.cancel')}
          </Button>
          <Button
            onClick={handleConfirmInit}
            variant="contained"
            size="small"
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: '0.8125rem',
              bgcolor: themeColor,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: themeColorDark,
                boxShadow: 'none',
              }
            }}
          >
            {t('notifications.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 2 : 2.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: isMobile ? 'calc(100vh - 32px)' : '90vh',
            m: isMobile ? 2 : 3,
          }
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <VisibilityIcon sx={{ color: themeColor, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#1a1a1a' }}>
                {t('notifications.templatePreview')}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpenPreviewDialog(false)}
              size="small"
              sx={{
                color: '#999',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  color: '#666',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {formData.type === 'EMAIL' ? (
            <Box
              sx={{
                minHeight: 400,
                backgroundColor: '#f5f5f5',
              }}
            >
              <iframe
                srcDoc={previewHtml}
                style={{
                  width: '100%',
                  height: '500px',
                  border: 'none',
                }}
                title="Email Preview"
              />
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 2,
                  background: '#fafafa',
                  minHeight: 200,
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SmsIcon sx={{ color: themeColor, fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.875rem' }}>
                    {t('notifications.smsContent')}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                    fontSize: '0.95rem',
                  }}
                >
                  {previewHtml}
                </Typography>
                <Box mt={3} pt={2} borderTop="1px solid" borderColor="divider">
                  <Typography variant="caption" color="text.secondary">
                    {t('notifications.smsLength')}: {previewHtml.length} {t('notifications.characters')}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Button
            onClick={() => setOpenPreviewDialog(false)}
            variant="contained"
            size="small"
            sx={{
              borderRadius: 1.5,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.8125rem',
              bgcolor: themeColor,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: themeColorDark,
                boxShadow: 'none',
              },
            }}
          >
            {t('notifications.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.06)',
            minWidth: 150,
            mt: 1,
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedTemplate) {
              handleOpenDialog(selectedTemplate);
            }
            setMenuAnchorEl(null);
          }}
          sx={{ '&:hover': { backgroundColor: alpha(themeColor, 0.08) } }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18, color: themeColor }} />
          {t('notifications.editTemplate')}
        </MenuItem>
        {/* 删除模板 - 只有 SUPER_ADMIN 才能删除 */}
        {hasPermission('notifications:delete_template') && (
          <MenuItem
            onClick={() => {
              if (selectedTemplate) {
                handleDelete(selectedTemplate.id);
              }
              setMenuAnchorEl(null);
            }}
            sx={{ '&:hover': { backgroundColor: alpha('#EF4444', 0.08) } }}
          >
            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
            {t('notifications.deleteTemplate')}
          </MenuItem>
        )}
      </Menu>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={isMobile ? { top: 70 } : undefined}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: isMobile ? 1.5 : 2,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
            fontSize: isMobile ? '0.8rem' : undefined,
            py: isMobile ? 0.5 : undefined,
            '& .MuiAlert-icon': isMobile ? { fontSize: 18 } : undefined,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationTemplateManagement;