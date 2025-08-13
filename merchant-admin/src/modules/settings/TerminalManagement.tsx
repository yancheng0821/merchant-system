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
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

interface Location {
  id: string;
  displayName: string;
  address: {
    line1?: string;
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
      const response = await axios.get(
        `${API_BASE_URL}/api/business/stripe-connect/terminal/list`,
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      
      if (response.data?.data) {
        setTerminals(response.data.data);
      }
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

  // 加载Locations
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
      
      if (response.data?.data) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      // 如果没有Location API，使用默认值
      setLocations([]);
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
      const response = await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/location/create`,
        newLocation,
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
    }
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
        message: error.response?.data?.message || t('settings.terminal.registerError'),
        severity: 'error',
      });
    }
  };

  // 更新Terminal状态
  const handleUpdateStatus = async (terminalId: string) => {
    if (!user?.tenantId) return;
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/business/stripe-connect/terminal/${terminalId}/update-status`,
        {},
        {
          params: { tenantId: user.tenantId },
          withCredentials: true,
        }
      );
      
      // 重新加载列表
      loadTerminals();
    } catch (error) {
      console.error('Failed to update terminal status:', error);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'offline':
        return <ErrorIcon sx={{ fontSize: 16 }} />;
      default:
        return <WarningIcon sx={{ fontSize: 16 }} />;
    }
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
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: alpha('#10B981', 0.15),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
                        borderColor: alpha('#10B981', 0.3),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {terminal.label}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(terminal.status)}
                            label={terminal.status}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              backgroundColor: terminal.status === 'online' 
                                ? alpha('#10B981', 0.1)
                                : terminal.status === 'offline'
                                ? alpha('#EF4444', 0.1)
                                : alpha('#F59E0B', 0.1),
                              color: terminal.status === 'online'
                                ? '#10B981'
                                : terminal.status === 'offline'
                                ? '#EF4444'
                                : '#F59E0B',
                              '& .MuiChip-icon': {
                                color: 'inherit',
                              },
                            }}
                          />
                        </Box>
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
                      </Box>
                    
                      <List dense sx={{ '& .MuiListItem-root': { px: 0, py: 0.5 } }}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="caption" color="text.secondary">
                                {t('settings.terminal.deviceType')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" fontWeight={500}>
                                {terminal.deviceType}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="caption" color="text.secondary">
                                {t('settings.terminal.serialNumber')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                                {terminal.serialNumber || '-'}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography variant="caption" color="text.secondary">
                                {t('settings.terminal.location')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" fontWeight={500}>
                                {locations.find(l => l.id === terminal.locationId)?.displayName || 
                                terminal.locationId}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {terminal.lastSeenAt && (
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="caption" color="text.secondary">
                                  {t('settings.terminal.lastSeen')}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" fontWeight={500}>
                                  {new Date(terminal.lastSeenAt).toLocaleString()}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                      </List>
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
    </Box>
  );
};

export default TerminalManagement;