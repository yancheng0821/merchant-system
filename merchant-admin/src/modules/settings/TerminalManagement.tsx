import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as TerminalIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { stripeApi, handleApiError } from '../../services/api';

interface Location {
  id: string;
  displayName: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface Terminal {
  id: string;
  terminalId: string;
  label: string;
  deviceType: string;
  serialNumber: string;
  locationId: string;
  status: string;
  lastSeenAt?: string;
  ipAddress?: string;
}

const TerminalManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLocationConfirmOpen, setDeleteLocationConfirmOpen] = useState(false);
  const [terminalToDelete, setTerminalToDelete] = useState<string | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // 新Terminal表单数据
  const [newTerminal, setNewTerminal] = useState({
    label: '',
    registrationCode: '',
    locationId: '',
  });

  // 新Location表单数据
  const [newLocation, setNewLocation] = useState({
    displayName: '',
    address: {
      line1: '',
      city: '',
      state: '',
      country: 'CA',
      postalCode: '',
    },
  });

  // 加载Terminals
  const loadTerminals = async () => {
    if (!user?.tenantId) return;

    setLoading(true);
    try {
      const data = await stripeApi.listTerminals(user.tenantId);
      if (data) {
        setTerminals(data);
      }
    } catch (error) {
      console.error('Failed to load terminals:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.loadError'),
        severity: 'error',
      });
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载Locations
  const loadLocations = async () => {
    if (!user?.tenantId) return;

    try {
      const data = await stripeApi.listLocations(user.tenantId);
      if (data) {
        setLocations(data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      // 如果没有Location API，使用默认值
      setLocations([]);
      handleApiError(error);
    }
  };

  useEffect(() => {
    loadTerminals();
    loadLocations();
  }, [user?.tenantId]);

  // 创建Location
  const handleCreateLocation = async () => {
    if (!user?.tenantId) return;

    try {
      const data = await stripeApi.createLocation(user.tenantId, newLocation);

      if (data) {
        setLocations([...locations, data]);
        setOpenLocationDialog(false);
        setNewLocation({
          displayName: '',
          address: {
            line1: '',
            city: '',
            state: '',
            country: 'CA',
            postalCode: '',
          },
        });
        setSnackbar({
          open: true,
          message: t('settings.terminal.locationCreated'),
          severity: 'success',
        });
        // 进入下一步
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Failed to create location:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.createLocationError'),
        severity: 'error',
      });
      handleApiError(error);
    }
  };

  // 注册Terminal
  const handleRegisterTerminal = async () => {
    if (!user?.tenantId) return;

    try {
      const data = await stripeApi.createTerminal(user.tenantId, newTerminal);

      if (data) {
        setTerminals([...terminals, data]);
        setOpenAddDialog(false);
        setNewTerminal({
          label: '',
          registrationCode: '',
          locationId: '',
        });
        setActiveStep(0);
        setSnackbar({
          open: true,
          message: t('settings.terminal.registered'),
          severity: 'success',
        });
        // 重新加载列表
        loadTerminals();
      }
    } catch (error: any) {
      console.error('Failed to register terminal:', error);
      setSnackbar({
        open: true,
        message: error.message || t('settings.terminal.registerError'),
        severity: 'error',
      });
      handleApiError(error);
    }
  };

  // 更新Terminal状态
  const handleUpdateStatus = async (terminalId: string) => {
    if (!user?.tenantId) return;

    try {
      await stripeApi.updateTerminalStatus(user.tenantId, terminalId);

      // 重新加载列表
      loadTerminals();
    } catch (error) {
      console.error('Failed to update terminal status:', error);
      handleApiError(error);
    }
  };

  // 删除Terminal
  const handleDeleteTerminal = async () => {
    if (!user?.tenantId || !terminalToDelete) return;

    try {
      await stripeApi.deleteTerminal(user.tenantId, terminalToDelete);

      setSnackbar({
        open: true,
        message: t('settings.terminal.deleteSuccess'),
        severity: 'success',
      });

      // 重新加载列表
      loadTerminals();
      setDeleteConfirmOpen(false);
      setTerminalToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete terminal:', error);
      setSnackbar({
        open: true,
        message: error.message || t('settings.terminal.deleteError'),
        severity: 'error',
      });
      handleApiError(error);
    }
  };

  // 删除Location
  const handleDeleteLocation = async () => {
    if (!user?.tenantId || !locationToDelete) return;

    try {
      await stripeApi.deleteLocation(user.tenantId, locationToDelete);

      setSnackbar({
        open: true,
        message: t('settings.location.deleteSuccess'),
        severity: 'success',
      });

      // 重新加载列表
      loadLocations();
      setDeleteLocationConfirmOpen(false);
      setLocationToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete location:', error);
      setSnackbar({
        open: true,
        message: error.message || t('settings.location.deleteError'),
        severity: 'error',
      });
      handleApiError(error);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const lowerStatus = status?.toLowerCase() || '';
    switch (lowerStatus) {
      case 'online':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'offline':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      default:
        // Log unexpected status for debugging
        console.log('Unexpected terminal status:', status);
        return <WarningIcon sx={{ fontSize: 16 }} />;
    }
  };

  // 获取设备类型样式
  const getDeviceTypeStyle = (deviceType: string) => {
    const deviceStyles: { [key: string]: { background: string, icon: string } } = {
      'stripe_s700': { 
        background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', 
        icon: 'S7'
      },
      'stripe_m2': { 
        background: 'linear-gradient(135deg, #3B82F6, #1E40AF)', 
        icon: 'M2'
      },
      'bbpos_wisepos_e': { 
        background: 'linear-gradient(135deg, #EC4899, #BE185D)', 
        icon: 'WE'
      },
      'bbpos_wisepad_3': { 
        background: 'linear-gradient(135deg, #F59E0B, #D97706)', 
        icon: 'W3'
      },
      'verifone_p400': { 
        background: 'linear-gradient(135deg, #14B8A6, #0D9488)', 
        icon: 'P4'
      },
      'simulated_wisepos_e': { 
        background: 'linear-gradient(135deg, #64748B, #475569)', 
        icon: 'SIM'
      },
    };
    
    return deviceStyles[deviceType.toLowerCase()] || {
      background: 'linear-gradient(135deg, #10B981, #059669)',
      icon: 'POS'
    };
  };

  // 获取设备类型显示名称
  const getDeviceDisplayName = (deviceType: string) => {
    const deviceNames: { [key: string]: string } = {
      'bbpos_wisepos_e': 'WisePOS E',
      'bbpos_wisepad_3': 'WisePad 3',
      'verifone_p400': 'Verifone P400',
      'stripe_m2': 'Stripe M2',
      'stripe_s700': 'Stripe S700',
      'simulated_wisepos_e': 'Simulated WisePOS E',
    };
    
    return deviceNames[deviceType.toLowerCase()] || deviceType.replace(/_/g, ' ').toUpperCase();
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Card
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: alpha('#10B981', 0.1),
        }}
      >
        {/* 顶部标题栏 */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            p: 2.5,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 背景装饰 */}
          <Box
            sx={{
              position: 'absolute',
              top: '-30%',
              right: '-5%',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TerminalIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.terminal.title')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {t('settings.terminal.subtitle')}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadTerminals}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {t('common.refresh')}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {t('settings.terminal.addTerminal')}
              </Button>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress sx={{ color: '#10B981' }} />
            </Box>
          ) : terminals.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                background: alpha('#10B981', 0.02),
                borderRadius: 2,
                border: '1px dashed',
                borderColor: alpha('#10B981', 0.2),
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto',
                  mb: 3,
                  borderRadius: '50%',
                  background: alpha('#10B981', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TerminalIcon sx={{ fontSize: 40, color: '#10B981' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.terminal.noTerminals')}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {t('settings.terminal.noTerminalsDesc')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                  },
                }}
              >
                {t('settings.terminal.addFirstTerminal')}
              </Button>
            </Box>
        ) : (
            <Grid container spacing={3}>
              {terminals.map((terminal) => (
                <Grid item xs={12} md={6} lg={4} key={terminal.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: terminal.status?.toLowerCase() === 'online' 
                        ? alpha('#10B981', 0.2)
                        : alpha('#94A3B8', 0.15),
                      background: terminal.status?.toLowerCase() === 'online'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.02), rgba(16, 185, 129, 0.04))'
                        : 'white',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: terminal.status?.toLowerCase() === 'online'
                          ? '0 12px 32px rgba(16, 185, 129, 0.15)'
                          : '0 12px 32px rgba(0, 0, 0, 0.08)',
                        borderColor: terminal.status?.toLowerCase() === 'online' 
                          ? alpha('#10B981', 0.4)
                          : alpha('#94A3B8', 0.3),
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    {/* 状态指示条 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: terminal.status?.toLowerCase() === 'online'
                          ? 'linear-gradient(90deg, #10B981, #059669)'
                          : terminal.status?.toLowerCase() === 'offline'
                          ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                          : 'linear-gradient(90deg, #F59E0B, #D97706)',
                      }}
                    />
                    
                    <CardContent sx={{ p: 3 }}>
                      {/* 头部 - 图标、名称和状态 */}
                      <Box display="flex" alignItems="center" mb={3}>
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            background: getDeviceTypeStyle(terminal.deviceType).background,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            position: 'relative',
                            opacity: terminal.status?.toLowerCase() === 'offline' ? 0.6 : 1,
                          }}
                        >
                          <Typography
                            sx={{
                              color: 'white',
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              letterSpacing: '-0.5px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {getDeviceTypeStyle(terminal.deviceType).icon}
                          </Typography>
                          {terminal.status?.toLowerCase() === 'offline' && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: 2,
                              }}
                            />
                          )}
                        </Box>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                            {terminal.label}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(terminal.status)}
                            label={
                              terminal.status?.toLowerCase() === 'online' ? t('common.online') :
                              terminal.status?.toLowerCase() === 'offline' ? t('common.offline') :
                              terminal.status
                            }
                            size="small"
                            sx={{
                              height: 24,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              backgroundColor: terminal.status?.toLowerCase() === 'online' 
                                ? alpha('#10B981', 0.15)
                                : terminal.status?.toLowerCase() === 'offline'
                                ? alpha('#EF4444', 0.15)
                                : alpha('#F59E0B', 0.15),
                              color: terminal.status?.toLowerCase() === 'online'
                                ? '#10B981'
                                : terminal.status?.toLowerCase() === 'offline'
                                ? '#EF4444'
                                : '#F59E0B',
                              '& .MuiChip-icon': {
                                color: 'inherit',
                                fontSize: 16,
                              },
                            }}
                          />
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(terminal.terminalId)}
                            sx={{
                              color: alpha('#10B981', 0.6),
                              '&:hover': {
                                color: '#10B981',
                                background: alpha('#10B981', 0.1),
                              },
                            }}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setTerminalToDelete(terminal.terminalId);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{
                              color: alpha('#EF4444', 0.6),
                              '&:hover': {
                                color: '#EF4444',
                                background: alpha('#EF4444', 0.1),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    
                      {/* 设备信息 */}
                      <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {t('settings.terminal.deviceType')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                            {getDeviceDisplayName(terminal.deviceType)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {t('settings.terminal.serialNumber')}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={600} 
                            sx={{ 
                              mt: 0.5,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              color: '#64748B',
                            }}
                          >
                            {terminal.serialNumber || t('common.notAvailable')}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            <LocationIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                            {t('settings.terminal.location')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                            {locations.find(l => l.id === terminal.locationId)?.displayName || 
                             t('settings.location.defaultLocation')}
                          </Typography>
                        </Box>
                        
                        {terminal.lastSeenAt && (
                          <Box
                            sx={{
                              pt: 2,
                              borderTop: '1px solid',
                              borderColor: alpha('#94A3B8', 0.1),
                            }}
                          >
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {t('settings.terminal.lastSeen')}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                              {new Date(terminal.lastSeenAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Location Management Card */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', mt: 3 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            p: 3,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocationIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {t('settings.location.title')}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {t('settings.location.subtitle')}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadLocations}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {t('common.refresh')}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setOpenLocationDialog(true)}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                {t('settings.location.addLocation')}
              </Button>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {locations.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 4,
                background: alpha('#3B82F6', 0.02),
                borderRadius: 2,
                border: '1px dashed',
                borderColor: alpha('#3B82F6', 0.2),
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto',
                  mb: 3,
                  borderRadius: '50%',
                  background: alpha('#3B82F6', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocationIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('settings.location.noLocations')}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {t('settings.location.noLocationsDesc')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenLocationDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1E40AF, #1E3A8A)',
                  },
                }}
              >
                {t('settings.location.addFirstLocation')}
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {locations.map((location) => (
                <Grid item xs={12} md={6} lg={4} key={location.id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: alpha('#10B981', 0.15),
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.02), rgba(16, 185, 129, 0.04))',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: '0 12px 32px rgba(16, 185, 129, 0.15)',
                        borderColor: alpha('#10B981', 0.3),
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    {/* 顶部状态条 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'linear-gradient(90deg, #10B981, #059669)',
                      }}
                    />
                    
                    <CardContent sx={{ p: 3 }}>
                      {/* 头部 - 图标、名称和删除按钮 */}
                      <Box display="flex" alignItems="center" mb={3}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          <LocationIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>
                            {location.displayName}
                          </Typography>
                          <Chip
                            label={`${terminals.filter(t => t.locationId === location.id).length} ${t('settings.location.terminals')}`}
                            size="small"
                            sx={{
                              mt: 0.5,
                              height: 22,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              backgroundColor: alpha('#10B981', 0.1),
                              color: '#10B981',
                            }}
                          />
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setLocationToDelete(location.id);
                            setDeleteLocationConfirmOpen(true);
                          }}
                          sx={{
                            color: alpha('#EF4444', 0.6),
                            '&:hover': {
                              color: '#EF4444',
                              background: alpha('#EF4444', 0.1),
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {/* 地址信息 */}
                      <Box sx={{ '& > *:not(:last-child)': { mb: 0.5 } }}>
                        {location.address.line1 && (
                          <Typography variant="body2" color="text.secondary">
                            📍 {location.address.line1}
                          </Typography>
                        )}
                        {location.address.line2 && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2.5 }}>
                            {location.address.line2}
                          </Typography>
                        )}
                        {(location.address.city || location.address.state || location.address.postalCode) && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2.5 }}>
                            {[location.address.city, location.address.state, location.address.postalCode]
                              .filter(Boolean)
                              .join(', ')}
                          </Typography>
                        )}
                        {location.address.country && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2.5 }}>
                            {location.address.country}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* 使用此位置的终端列表 */}
                      {terminals.filter(t => t.locationId === location.id).length > 0 && (
                        <Box 
                          sx={{ 
                            mt: 2, 
                            pt: 2, 
                            borderTop: '1px solid',
                            borderColor: alpha('#94A3B8', 0.1),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={500} gutterBottom>
                            {t('settings.location.terminalsAtLocation')}:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                            {terminals
                              .filter(t => t.locationId === location.id)
                              .map(terminal => (
                                <Chip
                                  key={terminal.id}
                                  label={terminal.label}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    borderColor: alpha('#10B981', 0.3),
                                    color: '#10B981',
                                  }}
                                />
                              ))
                            }
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* 添加Terminal对话框 */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TerminalIcon />
            {t('settings.terminal.registerTerminal')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box>
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>{t('settings.terminal.step1')}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('settings.terminal.step1Desc')}
                  </Typography>
                  {locations.length === 0 ? (
                    <Box>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 2,
                          borderRadius: 1.5,
                          '& .MuiAlert-icon': {
                            color: '#10B981',
                          },
                        }}
                      >
                        {t('settings.terminal.needLocation')}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={() => setOpenLocationDialog(true)}
                        startIcon={<LocationIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                          },
                        }}
                      >
                        {t('settings.terminal.createLocation')}
                      </Button>
                    </Box>
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel>{t('settings.terminal.selectLocation')}</InputLabel>
                      <Select
                        value={newTerminal.locationId}
                        onChange={(e) => setNewTerminal({ ...newTerminal, locationId: e.target.value })}
                        label={t('settings.terminal.selectLocation')}
                      >
                        {locations.map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            {location.displayName}
                          </MenuItem>
                        ))}
                      </Select>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(1)}
                        sx={{ 
                          mt: 2,
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669, #047857)',
                          },
                          '&:disabled': {
                            background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                          },
                        }}
                        disabled={!newTerminal.locationId}
                      >
                        {t('common.next')}
                      </Button>
                    </FormControl>
                  )}
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>{t('settings.terminal.step2')}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('settings.terminal.step2Desc')}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t('settings.terminal.terminalLabel')}
                    value={newTerminal.label}
                    onChange={(e) => setNewTerminal({ ...newTerminal, label: e.target.value })}
                    margin="normal"
                    helperText={t('settings.terminal.labelHelp')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: '#10B981',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#10B981',
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('settings.terminal.registrationCode')}
                    value={newTerminal.registrationCode}
                    onChange={(e) => setNewTerminal({ ...newTerminal, registrationCode: e.target.value })}
                    margin="normal"
                    helperText={t('settings.terminal.registrationCodeHelp')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: '#10B981',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10B981',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#10B981',
                      },
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button onClick={() => setActiveStep(0)} sx={{ mr: 1 }}>
                      {t('common.back')}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleRegisterTerminal}
                      disabled={!newTerminal.label || !newTerminal.registrationCode}
                      sx={{
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                        },
                      }}
                    >
                      {t('settings.terminal.register')}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAddDialog(false);
            setActiveStep(0);
            setNewTerminal({
              label: '',
              registrationCode: '',
              locationId: '',
            });
          }}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建Location对话框 */}
      <Dialog
        open={openLocationDialog}
        onClose={() => setOpenLocationDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon />
            {t('settings.terminal.createLocation')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('settings.terminal.locationName')}
            value={newLocation.displayName}
            onChange={(e) => setNewLocation({ ...newLocation, displayName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label={t('settings.terminal.address')}
            value={newLocation.address.line1}
            onChange={(e) => setNewLocation({
              ...newLocation,
              address: { ...newLocation.address, line1: e.target.value }
            })}
            margin="normal"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('settings.terminal.city')}
                value={newLocation.address.city}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, city: e.target.value }
                })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('settings.terminal.state')}</InputLabel>
                <Select
                  value={newLocation.address.state}
                  onChange={(e) => setNewLocation({
                    ...newLocation,
                    address: { ...newLocation.address, state: e.target.value }
                  })}
                  label={t('settings.terminal.state')}
                >
                  <MenuItem value="AB">Alberta</MenuItem>
                  <MenuItem value="BC">British Columbia</MenuItem>
                  <MenuItem value="MB">Manitoba</MenuItem>
                  <MenuItem value="NB">New Brunswick</MenuItem>
                  <MenuItem value="NL">Newfoundland and Labrador</MenuItem>
                  <MenuItem value="NT">Northwest Territories</MenuItem>
                  <MenuItem value="NS">Nova Scotia</MenuItem>
                  <MenuItem value="NU">Nunavut</MenuItem>
                  <MenuItem value="ON">Ontario</MenuItem>
                  <MenuItem value="PE">Prince Edward Island</MenuItem>
                  <MenuItem value="QC">Quebec</MenuItem>
                  <MenuItem value="SK">Saskatchewan</MenuItem>
                  <MenuItem value="YT">Yukon</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label={t('settings.terminal.postalCode')}
            value={newLocation.address.postalCode}
            onChange={(e) => setNewLocation({
              ...newLocation,
              address: { ...newLocation.address, postalCode: e.target.value }
            })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateLocation}
            disabled={!newLocation.displayName || !newLocation.address.line1}
            sx={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
              },
            }}
          >
            {t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            '& .MuiAlert-icon': {
              fontSize: '1.2rem',
            },
            '& .MuiAlert-message': {
              fontSize: '0.9rem',
              fontWeight: 500,
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 删除Terminal确认对话框 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTerminalToDelete(null);
        }}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#EF4444' }}>
          {t('settings.terminal.deleteConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            {t('settings.terminal.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setTerminalToDelete(null);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteTerminal}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              },
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除Location确认对话框 */}
      <Dialog
        open={deleteLocationConfirmOpen}
        onClose={() => {
          setDeleteLocationConfirmOpen(false);
          setLocationToDelete(null);
        }}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#EF4444' }}>
          {t('settings.location.deleteConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            {t('settings.location.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button
            onClick={() => {
              setDeleteLocationConfirmOpen(false);
              setLocationToDelete(null);
            }}
            sx={{ borderRadius: 1.5 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteLocation}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              },
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TerminalManagement;