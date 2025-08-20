import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
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
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  alpha,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Fade,
  Paper,
  Grid,
  Divider,
  LinearProgress,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as TerminalIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Router as RouterIcon,
  AccessTime as TimeIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

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
  serialNumber?: string;
  status: string;
  locationId: string;
  lastSeenAt?: string;
  ipAddress?: string;
}

const ModernTerminalManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
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

  // Canadian provinces list
  const canadianProvinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'YT', label: 'Yukon' }
  ];

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
      line2: '',
      city: '',
      state: '',
      country: 'CA',
      postalCode: '',
    },
  });

  useEffect(() => {
    loadTerminals();
    loadLocations();
  }, [user?.tenantId]);

  // 加载终端列表
  const loadTerminals = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/business/stripe-connect/terminal/list`,
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      setTerminals(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load terminals:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.loadError'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 加载位置列表
  const loadLocations = async () => {
    if (!user?.tenantId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/business/stripe-connect/location/list`,
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      setLocations(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  // 获取设备类型样式
  const getDeviceTypeStyle = (deviceType: string) => {
    const styles: { [key: string]: any } = {
      'stripe_s700': { 
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: '🔮',
        color: '#10b981'
      },
      'stripe_m2': { 
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        icon: '💎',
        color: '#f093fb'
      },
      'bbpos_wisepos_e': { 
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        icon: '🚀',
        color: '#4facfe'
      },
      'bbpos_wisepad_3': { 
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        icon: '✨',
        color: '#43e97b'
      },
      'verifone_p400': { 
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        icon: '⚡',
        color: '#fa709a'
      },
      'simulated_wisepos_e': { 
        gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        icon: '🎯',
        color: '#30cfd0'
      },
    };
    
    return styles[deviceType.toLowerCase()] || {
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: '💳',
      color: '#10b981'
    };
  };

  // 注册Terminal
  const handleRegisterTerminal = async () => {
    if (!user?.tenantId) return;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/terminal/create`,
        newTerminal,
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setTerminals([...terminals, response.data.data]);
        setOpenAddDialog(false);
        setNewTerminal({ label: '', registrationCode: '', locationId: '' });
        setActiveStep(0);
        setSnackbar({
          open: true,
          message: t('settings.terminal.registered'),
          severity: 'success',
        });
        loadTerminals();
      }
    } catch (error) {
      console.error('Failed to register terminal:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.registerError'),
        severity: 'error',
      });
    }
  };

  // 创建Location
  const handleCreateLocation = async () => {
    if (!user?.tenantId) return;
    
    try {
      // Prepare location data, excluding empty line2
      const locationData = {
        displayName: newLocation.displayName,
        address: {
          line1: newLocation.address.line1,
          ...(newLocation.address.line2 && { line2: newLocation.address.line2 }),
          city: newLocation.address.city,
          state: newLocation.address.state,
          country: newLocation.address.country,
          postalCode: newLocation.address.postalCode,
        },
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/location/create`,
        locationData,
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setLocations([...locations, response.data.data]);
        setOpenLocationDialog(false);
        setNewLocation({
          displayName: '',
          address: {
            line1: '',
            line2: '',
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
        loadLocations();
      }
    } catch (error) {
      console.error('Failed to create location:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.createLocationError'),
        severity: 'error',
      });
    }
  };

  // 删除Terminal
  const handleDeleteTerminal = async () => {
    if (!terminalToDelete || !user?.tenantId) return;
    
    try {
      await axios.delete(
        `${API_BASE_URL}/api/business/stripe-connect/terminal/${terminalToDelete}?tenantId=${user.tenantId}`,
        {
          withCredentials: true,
        }
      );
      
      setTerminals(terminals.filter(t => t.terminalId !== terminalToDelete));
      setDeleteConfirmOpen(false);
      setTerminalToDelete(null);
      setSnackbar({
        open: true,
        message: t('settings.terminal.deleteSuccess'),
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to delete terminal:', error);
      setSnackbar({
        open: true,
        message: t('settings.terminal.deleteError'),
        severity: 'error',
      });
    }
  };

  // 删除Location
  const handleDeleteLocation = async () => {
    if (!locationToDelete || !user?.tenantId) return;
    
    try {
      await axios.delete(
        `${API_BASE_URL}/api/business/stripe-connect/location/${locationToDelete}?tenantId=${user.tenantId}`,
        {
          withCredentials: true,
        }
      );
      
      setLocations(locations.filter(l => l.id !== locationToDelete));
      setDeleteLocationConfirmOpen(false);
      setLocationToDelete(null);
      setSnackbar({
        open: true,
        message: t('settings.location.deleteSuccess'),
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to delete location:', error);
      setSnackbar({
        open: true,
        message: t('settings.location.deleteError'),
        severity: 'error',
      });
    }
  };

  // 获取设备显示名称
  const getDeviceDisplayName = (deviceType: string) => {
    const names: { [key: string]: string } = {
      'stripe_s700': 'Stripe S700',
      'stripe_m2': 'Stripe M2',
      'bbpos_wisepos_e': 'WisePOS E',
      'bbpos_wisepad_3': 'WisePad 3',
      'verifone_p400': 'Verifone P400',
      'simulated_wisepos_e': 'Simulated',
    };
    return names[deviceType.toLowerCase()] || deviceType.replace(/_/g, ' ').toUpperCase();
  };

  // 统计数据
  const stats = {
    totalTerminals: terminals.length,
    onlineTerminals: terminals.filter(t => t.status?.toLowerCase() === 'online').length,
    totalLocations: locations.length,
  };

  // 渲染终端卡片（现代风格）
  const renderTerminalCard = (terminal: Terminal) => {
    const style = getDeviceTypeStyle(terminal.deviceType);
    const location = locations.find(l => l.id === terminal.locationId);
    const isOnline = terminal.status?.toLowerCase() === 'online';
    
    return (
      <Card
        key={terminal.id}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'white',
          border: '1px solid',
          borderColor: isOnline ? alpha(style.color, 0.2) : alpha('#94A3B8', 0.1),
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 40px ${alpha(style.color, 0.15)}`,
            borderColor: alpha(style.color, 0.3),
          },
        }}
      >
        {/* 状态指示器 */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isOnline ? '#10B981' : '#EF4444',
            boxShadow: isOnline 
              ? '0 0 0 3px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.4)'
              : '0 0 0 3px rgba(239, 68, 68, 0.2)',
            animation: isOnline ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            },
          }}
        />

        {/* 设备图标和信息 */}
        <Box display="flex" alignItems="flex-start" mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              background: style.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              fontSize: '1.8rem',
              boxShadow: `0 8px 24px ${alpha(style.color, 0.3)}`,
            }}
          >
            {style.icon}
          </Box>
          <Box flex={1}>
            <Typography variant="body1" fontWeight={600} gutterBottom sx={{ fontSize: '1rem' }}>
              {terminal.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              {getDeviceDisplayName(terminal.deviceType)}
            </Typography>
          </Box>
        </Box>

        {/* 详细信息 */}
        <Box sx={{ '& > *:not(:last-child)': { mb: 1.5 } }}>
          {location && (
            <Box display="flex" alignItems="center">
              <LocationIcon sx={{ fontSize: 18, color: style.color, mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {location.displayName}
              </Typography>
            </Box>
          )}
          
          {terminal.serialNumber && (
            <Box display="flex" alignItems="center">
              <RouterIcon sx={{ fontSize: 18, color: style.color, mr: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {terminal.serialNumber}
              </Typography>
            </Box>
          )}
          
          {terminal.lastSeenAt && (
            <Box display="flex" alignItems="center">
              <TimeIcon sx={{ fontSize: 18, color: style.color, mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {new Date(terminal.lastSeenAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 删除按钮 */}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setTerminalToDelete(terminal.terminalId);
              setDeleteConfirmOpen(true);
            }}
            sx={{
              color: alpha('#EF4444', 0.7),
              '&:hover': {
                color: '#EF4444',
                background: alpha('#EF4444', 0.1),
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Card>
    );
  };

  // 渲染位置卡片（地图风格）
  const renderLocationCard = (location: Location) => {
    const terminalsAtLocation = terminals.filter(t => t.locationId === location.id);
    const onlineCount = terminalsAtLocation.filter(t => t.status?.toLowerCase() === 'online').length;
    
    return (
      <Card
        key={location.id}
        sx={{
          p: 2.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 160,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
          },
        }}
      >
        {/* 背景装饰 */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        
        {/* 位置名称和统计 */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
              {location.displayName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={`${terminalsAtLocation.length} ${t('settings.location.terminals')}`}
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
              {onlineCount > 0 && (
                <Chip
                  size="small"
                  icon={<DotIcon sx={{ fontSize: 10, color: 'white' }} />}
                  label={`${onlineCount} ${t('common.online')}`}
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              setLocationToDelete(location.id);
              setDeleteLocationConfirmOpen(true);
            }}
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                color: 'white',
                background: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 地址信息 */}
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.3, display: 'block', fontSize: '0.85rem' }}>
            {location.address.line1}
          </Typography>
          {location.address.line2 && (
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.3, display: 'block', fontSize: '0.85rem' }}>
              {location.address.line2}
            </Typography>
          )}
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
            {[location.address.city, location.address.state, location.address.postalCode]
              .filter(Boolean)
              .join(', ')}
          </Typography>
        </Box>
      </Card>
    );
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        background: 'white',
        overflow: 'hidden',
      }}
    >
      {/* 卡片头部 */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TerminalIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {t('settings.terminal.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('settings.terminal.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 卡片内容 */}
      <Box sx={{ p: 3 }}>
        {/* 标签页 */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden', mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            background: '#f8f9fa',
            borderBottom: '2px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#10b981',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#10b981',
              height: 3,
            },
          }}
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TerminalIcon />
                {t('settings.terminal.terminals')}
                <Chip
                  size="small"
                  label={stats.totalTerminals}
                  sx={{
                    height: 20,
                    background: alpha('#10b981', 0.1),
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                />
              </Box>
            }
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <LocationIcon />
                {t('settings.location.locations')}
                <Chip
                  size="small"
                  label={stats.totalLocations}
                  sx={{
                    height: 20,
                    background: alpha('#10b981', 0.1),
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {/* 终端列表 */}
          <Box
            sx={{
              display: activeTab === 0 ? 'block' : 'none',
              animation: activeTab === 0 ? 'fadeIn 0.3s ease-in-out' : 'none',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
                {/* 操作栏 */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" gap={2}>
                    {locations.map(location => (
                      <Chip
                        key={location.id}
                        label={location.displayName}
                        onClick={() => setSelectedLocation(
                          selectedLocation === location.id ? null : location.id
                        )}
                        sx={{
                          background: selectedLocation === location.id
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'white',
                          color: selectedLocation === location.id ? 'white' : 'text.primary',
                          border: '1px solid',
                          borderColor: selectedLocation === location.id
                            ? 'transparent'
                            : alpha('#10b981', 0.3),
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={loadTerminals}
                      sx={{
                        borderColor: alpha('#10b981', 0.3),
                        color: '#10b981',
                        '&:hover': {
                          borderColor: '#10b981',
                          background: alpha('#10b981', 0.05),
                        },
                      }}
                    >
                      {t('common.refresh')}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenAddDialog(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 30px rgba(16, 185, 129, 0.5)',
                        },
                      }}
                    >
                      {t('settings.terminal.addTerminal')}
                    </Button>
                  </Box>
                </Box>

                {/* 终端网格 */}
                <Grid container spacing={3}>
                  {terminals
                    .filter(t => !selectedLocation || t.locationId === selectedLocation)
                    .map(terminal => (
                      <Grid item xs={12} md={6} lg={4} key={terminal.id}>
                        {renderTerminalCard(terminal)}
                      </Grid>
                    ))}
                </Grid>

                {terminals.length === 0 && (
                  <Box
                    sx={{
                      p: 8,
                      pt: 12,
                      pb: 10,
                      textAlign: 'center',
                      borderRadius: 3,
                      background: '#f8f9fa',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 420,
                    }}
                  >
                    {/* 内容区域 */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <TerminalIcon sx={{ fontSize: 64, mb: 3, color: '#10b981', opacity: 0.8 }} />
                      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#1f2937' }}>
                        {t('settings.terminal.noTerminals')}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 8, color: '#6b7280', maxWidth: 500, mx: 'auto' }}>
                        {t('settings.terminal.noTerminalsDesc')}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAddDialog(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            transform: 'scale(1.05)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                          },
                        }}
                      >
                        {t('settings.terminal.addFirstTerminal')}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

          {/* 位置列表 */}
          <Box
            sx={{
              display: activeTab === 1 ? 'block' : 'none',
              animation: activeTab === 1 ? 'fadeIn 0.3s ease-in-out' : 'none',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
                {/* 操作栏 */}
                <Box display="flex" justifyContent="flex-end" mb={3}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenLocationDialog(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 30px rgba(16, 185, 129, 0.5)',
                      },
                    }}
                  >
                    {t('settings.location.addLocation')}
                  </Button>
                </Box>

                {/* 位置网格 */}
                <Grid container spacing={3}>
                  {locations.map(location => (
                    <Grid item xs={12} md={6} lg={4} key={location.id}>
                      {renderLocationCard(location)}
                    </Grid>
                  ))}
                </Grid>

                {locations.length === 0 && (
                  <Box
                    sx={{
                      p: 8,
                      pt: 12,
                      pb: 10,
                      textAlign: 'center',
                      borderRadius: 3,
                      background: '#f8f9fa',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 420,
                    }}
                  >
                    {/* 内容区域 */}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <LocationIcon sx={{ fontSize: 64, mb: 3, color: '#10b981', opacity: 0.8 }} />
                      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#1f2937' }}>
                        {t('settings.location.noLocations')}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 8, color: '#6b7280', maxWidth: 500, mx: 'auto' }}>
                        {t('settings.location.noLocationsDesc')}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenLocationDialog(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            transform: 'scale(1.05)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                          },
                        }}
                      >
                        {t('settings.location.addFirstLocation')}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
        </Box>
      )}
      </Box>

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
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 添加Terminal对话框 */}
      <Dialog
        open={openAddDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setActiveStep(0);
          setNewTerminal({ label: '', registrationCode: '', locationId: '' });
        }}
        maxWidth="sm"
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            pb: 3,
            pt: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TerminalIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t('settings.terminal.registerTerminal')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {t('settings.terminal.registerSubtitle')}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, px: 3 }}>
          <Box>
            <Stepper 
              activeStep={activeStep} 
              orientation="vertical"
              sx={{
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#10b981',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#10b981',
                },
                '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel': {
                  color: 'text.secondary',
                },
                '& .MuiStepLabel-label.Mui-active': {
                  fontWeight: 600,
                },
              }}
            >
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
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05))',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        {t('settings.terminal.needLocation')}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setOpenAddDialog(false);
                          setOpenLocationDialog(true);
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
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
                      <InputLabel sx={{ '&.Mui-focused': { color: '#10b981' } }}>
                        {t('settings.terminal.selectLocation')}
                      </InputLabel>
                      <Select
                        value={newTerminal.locationId}
                        onChange={(e) => setNewTerminal({ ...newTerminal, locationId: e.target.value })}
                        label={t('settings.terminal.selectLocation')}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'divider',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#10b981',
                          },
                        }}
                      >
                        {locations.map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationIcon sx={{ fontSize: 20, color: '#10b981' }} />
                              {location.displayName}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(1)}
                      disabled={!newTerminal.locationId}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
                        },
                      }}
                    >
                      {t('common.next')}
                    </Button>
                  </Box>
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
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        '&.Mui-focused': {
                          color: '#10b981',
                        },
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label={t('settings.terminal.registrationCode')}
                    value={newTerminal.registrationCode}
                    onChange={(e) => setNewTerminal({ ...newTerminal, registrationCode: e.target.value })}
                    margin="normal"
                    helperText={t('settings.terminal.registrationCodeHelp')}
                    InputProps={{
                      sx: {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        '&.Mui-focused': {
                          color: '#10b981',
                        },
                      }
                    }}
                  />
                  <Box mt={2} display="flex" gap={2}>
                    <Button
                      onClick={() => setActiveStep(0)}
                      sx={{ color: '#6B7280' }}
                    >
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
      </Dialog>

      {/* 添加Location对话框 */}
      <Dialog
        open={openLocationDialog}
        onClose={() => {
          setOpenLocationDialog(false);
          setNewLocation({
            displayName: '',
            address: {
              line1: '',
              line2: '',
              city: '',
              state: '',
              country: 'CA',
              postalCode: '',
            },
          });
        }}
        maxWidth="sm"
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            pb: 3,
            pt: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocationIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t('settings.terminal.createLocation')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {t('settings.location.subtitle')}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3, px: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              {t('common.basicInfo')}
            </Typography>
            <TextField
              fullWidth
              label={t('settings.terminal.locationName')}
              value={newLocation.displayName}
              onChange={(e) => setNewLocation({ ...newLocation, displayName: e.target.value })}
              margin="normal"
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                }
              }}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#10b981',
                  },
                }
              }}
              helperText={t('settings.location.nameHelp')}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
              {t('common.addressInfo')}
            </Typography>
            <TextField
              fullWidth
              label={t('settings.terminal.address')}
              value={newLocation.address.line1}
              onChange={(e) => setNewLocation({
                ...newLocation,
                address: { ...newLocation.address, line1: e.target.value }
              })}
              margin="normal"
              required
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                }
              }}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#10b981',
                  },
                }
              }}
            />
            <TextField
              fullWidth
              label={t('common.addressLine2')}
              value={newLocation.address.line2}
              onChange={(e) => setNewLocation({
                ...newLocation,
                address: { ...newLocation.address, line2: e.target.value }
              })}
              margin="normal"
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                }
              }}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#10b981',
                  },
                }
              }}
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label={t('settings.terminal.city')}
                value={newLocation.address.city}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, city: e.target.value }
                })}
                margin="normal"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10b981',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10b981',
                    },
                  }
                }}
                InputLabelProps={{
                  sx: {
                    '&.Mui-focused': {
                      color: '#10b981',
                    },
                  }
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel 
                  sx={{ 
                    '&.Mui-focused': { 
                      color: '#10b981' 
                    } 
                  }}
                >
                  {t('settings.terminal.state')}
                </InputLabel>
                <Select
                  value={newLocation.address.state}
                  onChange={(e) => setNewLocation({
                    ...newLocation,
                    address: { ...newLocation.address, state: e.target.value }
                  })}
                  label={t('settings.terminal.state')}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10b981',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#10b981',
                    },
                  }}
                >
                  {canadianProvinces.map((province) => (
                    <MenuItem key={province.value} value={province.value}>
                      {province.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label={t('settings.terminal.postalCode')}
              value={newLocation.address.postalCode}
              onChange={(e) => setNewLocation({
                ...newLocation,
                address: { ...newLocation.address, postalCode: e.target.value }
              })}
              margin="normal"
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#10b981',
                  },
                }
              }}
              InputLabelProps={{
                sx: {
                  '&.Mui-focused': {
                    color: '#10b981',
                  },
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, background: '#f8f9fa' }}>
          <Button 
            onClick={() => setOpenLocationDialog(false)} 
            sx={{ 
              color: '#6B7280',
              px: 3,
              '&:hover': {
                background: alpha('#6B7280', 0.08),
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateLocation}
            disabled={!newLocation.displayName || !newLocation.address.line1}
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
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

      {/* 删除Terminal确认对话框 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTerminalToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('settings.terminal.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.terminal.deleteConfirmMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setTerminalToDelete(null);
            }}
            sx={{ color: '#6B7280' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteTerminal} 
            color="error" 
            variant="contained"
            sx={{
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
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('settings.location.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.location.deleteConfirmMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteLocationConfirmOpen(false);
              setLocationToDelete(null);
            }}
            sx={{ color: '#6B7280' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteLocation} 
            color="error" 
            variant="contained"
            sx={{
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
    </Card>
  );
};

export default ModernTerminalManagement;