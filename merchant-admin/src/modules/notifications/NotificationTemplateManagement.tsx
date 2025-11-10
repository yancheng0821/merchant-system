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

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationTemplateManagement: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
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

  // 橙色主题色，提高可读性
  const themeColor = '#F97316';

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
      customerName: '张三',
      appointmentDate: '2024-01-15',
      appointmentTime: '14:30',
      serviceName: '理发服务',
      merchantName: '美发沙龙',
      amount: '¥188.00',
      orderNumber: 'ORD20240115001',
    };

    let processedContent = formData.content;

    // 替换所有变量
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    // 如果是 EMAIL 类型，包装成 HTML
    if (formData.type === 'EMAIL') {
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
                overflow: hidden;
              }
              .email-header {
                background: linear-gradient(135deg, #F97316, #EA580C);
                color: white;
                padding: 30px 20px;
                text-align: center;
              }
              .email-header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
              }
              .email-body {
                padding: 30px 20px;
              }
              .email-body p {
                margin: 0 0 15px 0;
              }
              .email-footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #e9ecef;
              }
              .highlight {
                color: #F97316;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="email-header">
                <h1>${formData.subject || '邮件主题'}</h1>
              </div>
              <div class="email-body">
                ${processedContent.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
              </div>
              <div class="email-footer">
                <p>此邮件由系统自动发送，请勿直接回复</p>
              </div>
            </div>
          </body>
        </html>
      `;
      setPreviewHtml(html);
    } else {
      // SMS 类型，简单显示
      setPreviewHtml(processedContent);
    }

    setOpenPreviewDialog(true);
  };

  const getFilteredTemplates = (type: 'SMS' | 'EMAIL') => {
    return templates.filter(template => template.type === type);
  };

  const renderTemplateTable = (templateList: NotificationTemplate[]) => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f8fafc' }}>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: 2 }}>
              {t('notifications.templateCode')}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
              {t('notifications.templateName')}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
              {t('notifications.status')}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
              {t('notifications.updatedAt')}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
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
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
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
                  background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                  boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                  fontWeight: 600,
                  '&:hover': {
                    background: `linear-gradient(135deg, #EA580C, #C2410C)`,
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
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              backgroundColor: '#f8fafc',
              '& .MuiTab-root': {
                color: 'text.secondary',
                fontWeight: 500,
                py: 2,
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

        <TabPanel value={tabValue} index={0}>
          {renderTemplateTable(getFilteredTemplates('SMS'))}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderTemplateTable(getFilteredTemplates('EMAIL'))}
        </TabPanel>
      </Card>

      {/* 编辑/新增模板弹窗 */}
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
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            bgcolor: 'background.paper',
          }
        }}
      >
        {/* 现代化对话框标题 */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.08)}, ${alpha('#EA580C', 0.08)})`,
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
                  background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <EmailIcon sx={{ fontSize: 24 }} />
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
                  {editingTemplate ? t('notifications.editTemplate') : t('notifications.addTemplate')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingTemplate ? t('dialogs.editTemplateInfo') : t('dialogs.createNewTemplate')}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleCloseDialog}
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
            {/* 基本信息 */}
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
                    background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <CodeIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
                  {t('notifications.basicInfo')}
                </Typography>
              </Box>

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
                p: 3,
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
                    background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
                  {t('notifications.contentConfiguration')}
                </Typography>
              </Box>

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
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: alpha(themeColor, 0.02),
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={handlePreview}
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={!formData.content}
            sx={{
              borderRadius: 2,
              px: 3,
              borderColor: themeColor,
              color: themeColor,
              fontWeight: 600,
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
              sx={{
                borderRadius: 2,
                px: 3,
                color: 'text.secondary',
                mr: 2,
              }}
            >
              {t('notifications.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, #EA580C, #C2410C)`,
                  boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
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
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #EF444420',
          color: '#EF4444',
          fontWeight: 600
        }}>
          {t('notifications.confirmDelete')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            {t('notifications.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #EF444420' }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            {t('notifications.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: '#EF4444',
              '&:hover': {
                backgroundColor: '#DC2626',
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
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${themeColor}20`,
          color: themeColor,
          fontWeight: 600
        }}>
          {t('notifications.confirmInit')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography gutterBottom>
            {t('notifications.initConfirmMessage')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('notifications.initDefaultTemplatesDescription')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColor}20` }}>
          <Button 
            onClick={() => setOpenInitDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            {t('notifications.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmInit}
            variant="contained"
            sx={{
              backgroundColor: themeColor,
              '&:hover': {
                backgroundColor: `${themeColor}dd`,
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
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.08)}, ${alpha('#EA580C', 0.08)})`,
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
                  background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <VisibilityIcon sx={{ fontSize: 24 }} />
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
                  {t('notifications.templatePreview')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.type === 'EMAIL' ? t('notifications.emailPreview') : t('notifications.smsPreview')}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setOpenPreviewDialog(false)}
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
                  p: 3,
                  border: '1px solid',
                  borderColor: alpha(themeColor, 0.2),
                  borderRadius: 2,
                  background: alpha(themeColor, 0.02),
                  minHeight: 200,
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <SmsIcon sx={{ color: themeColor, fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor }}>
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
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: alpha(themeColor, 0.02),
          }}
        >
          <Button
            onClick={() => setOpenPreviewDialog(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: `linear-gradient(135deg, ${themeColor}, #EA580C)`,
              boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, #EA580C, #C2410C)`,
                boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
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
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.08)',
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
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationTemplateManagement;