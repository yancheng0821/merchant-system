import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/icons-material';
import { notificationApi } from '../../services/api';

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

  // 加深的粉色主题色，提高可读性
  const themeColor = '#E91E63';

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
    { value: 'APPOINTMENT_CONFIRMED', label: t('notifications.templateCodes.appointmentConfirmed') },
    { value: 'APPOINTMENT_CANCELLED', label: t('notifications.templateCodes.appointmentCancelled') },
    { value: 'APPOINTMENT_COMPLETED', label: t('notifications.templateCodes.appointmentCompleted') },
    { value: 'APPOINTMENT_REMINDER', label: t('notifications.templateCodes.appointmentReminder') }
  ];

  useEffect(() => {
    fetchTemplates();
  }, [tenantId]);

  const fetchTemplates = async () => {
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
  };

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
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    try {
      const templateData = { ...formData, tenantId };
      
      if (editingTemplate) {
        await notificationApi.updateTemplate(editingTemplate.id, templateData);
      } else {
        await notificationApi.createTemplate(templateData);
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
      await notificationApi.initDefaultTemplates(tenantId);
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
                    {new Date(template.updatedAt).toLocaleString()}
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
              <Button
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
                  background: `linear-gradient(135deg, ${themeColor}, #C2185B)`,
                  boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
                  fontWeight: 600,
                  '&:hover': {
                    background: `linear-gradient(135deg, #C2185B, #AD1457)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {t('notifications.addTemplate')}
              </Button>
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
            background: `linear-gradient(135deg, ${alpha(themeColor, 0.08)}, ${alpha('#C2185B', 0.08)})`,
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
                  background: `linear-gradient(135deg, ${themeColor}, #C2185B)`,
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
                    background: `linear-gradient(135deg, ${themeColor}, #C2185B)`,
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
                  <FormControl fullWidth>
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
                  <FormControl fullWidth>
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
                  <FormControl fullWidth>
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
                    background: `linear-gradient(135deg, ${themeColor}, #C2185B)`,
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
          }}
        >
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: 'text.secondary',
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
              background: `linear-gradient(135deg, ${themeColor}, #C2185B)`,
              boxShadow: `0 4px 15px ${alpha(themeColor, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, #C2185B, #AD1457)`,
                boxShadow: `0 6px 20px ${alpha(themeColor, 0.4)}`,
              },
            }}
          >
            {t('notifications.save')}
          </Button>
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
      </Menu>
    </Box>
  );
};

export default NotificationTemplateManagement;