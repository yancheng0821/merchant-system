import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Divider,
  Alert,
  alpha,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as OrderIcon,
  Person as PersonIcon,
  LocalOffer as ServiceIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Order, OrderService } from '../OrderManagement';

interface AddOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (order: Partial<Order>) => void;
}

// 模拟服务项目数据
const mockServices = [
  { id: 's1', name: 'Hair Cut', category: 'Hair Care', price: 65.00, duration: 60 },
  { id: 's2', name: 'Hair Color', category: 'Hair Care', price: 120.00, duration: 120 },
  { id: 's3', name: 'Full Body Massage', category: 'Spa Package', price: 150.00, duration: 90 },
  { id: 's4', name: 'Facial Treatment', category: 'Facial', price: 80.00, duration: 60 },
  { id: 's5', name: 'Manicure', category: 'Nail Care', price: 45.00, duration: 45 },
  { id: 's6', name: 'Pedicure', category: 'Nail Care', price: 55.00, duration: 60 },
  { id: 's7', name: 'Beard Trim', category: 'Hair Care', price: 25.00, duration: 15 },
  { id: 's8', name: 'Deep Cleansing Facial', category: 'Facial', price: 95.00, duration: 75 },
];

// 模拟客户数据
const mockCustomers = [
  { id: '1', name: 'Emily Johnson', phone: '+1-555-0123', email: 'emily@example.com' },
  { id: '2', name: 'Michael Chen', phone: '+1-555-0234', email: 'michael@example.com' },
  { id: '3', name: 'Sarah Thompson', phone: '+1-555-0345', email: 'sarah@example.com' },
  { id: '4', name: 'David Wilson', phone: '+1-555-0456', email: 'david@example.com' },
  { id: '5', name: 'Lisa Wang', phone: '+1-555-0567', email: 'lisa@example.com' },
];

// 模拟员工数据
const mockStaff = [
  'Sarah Johnson',
  'Jennifer Wong', 
  'Maria Lopez',
  'Alex Chen',
  'Emily Davis',
];

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ open, onClose, onSave }) => {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<OrderService[]>([]);
  const [staff, setStaff] = useState('');
  const [tipPercentage, setTipPercentage] = useState(15);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const taxRate = 0.13; // 13% HST (Ontario)

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setCustomer('');
      setNewCustomerName('');
      setNewCustomerPhone('');
      setSelectedServices([]);
      setStaff('');
      setTipPercentage(15);
      setNotes('');
      setErrors({});
    }
  }, [open]);

  const addService = () => {
    const newService: OrderService = {
      id: `temp_${Date.now()}`,
      name: '',
      category: '',
      price: 0,
      quantity: 1,
      staff: '',
      duration: 0,
    };
    setSelectedServices([...selectedServices, newService]);
  };

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof OrderService, value: any) => {
    const updatedServices = [...selectedServices];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    // Auto-fill service details when service name is selected
    if (field === 'name') {
      const serviceData = mockServices.find(s => s.name === value);
      if (serviceData) {
        updatedServices[index] = {
          ...updatedServices[index],
          category: serviceData.category,
          price: serviceData.price,
          duration: serviceData.duration,
        };
      }
    }
    
    setSelectedServices(updatedServices);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!customer && !newCustomerName.trim()) {
      newErrors.customer = t('orders.customerRequired');
    }

    if (newCustomerName.trim() && !/^\+?[1-9]\d{1,14}$/.test(newCustomerPhone.replace(/[-\s()]/g, ''))) {
      newErrors.phone = t('orders.invalidPhone');
    }

    if (selectedServices.length === 0) {
      newErrors.services = t('orders.servicesRequired');
    }

    selectedServices.forEach((service, index) => {
      if (!service.name.trim()) {
        newErrors[`service_${index}_name`] = t('orders.serviceNameRequired');
      }
      if (!service.staff || !service.staff.trim()) {
        newErrors[`service_${index}_staff`] = t('orders.serviceStaffRequired');
      }
      if (service.price <= 0) {
        newErrors[`service_${index}_price`] = t('orders.servicePriceRequired');
      }
    });

    if (!staff.trim()) {
      newErrors.staff = t('orders.staffRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const subtotal = selectedServices.reduce((sum, service) => sum + service.price * service.quantity, 0);
      const taxAmount = subtotal * taxRate;
      const tipAmount = subtotal * (tipPercentage / 100);
      const totalAmount = subtotal + taxAmount + tipAmount;

      const order: Partial<Order> = {
        orderNumber: `ORD-${Date.now()}`,
        customerId: customer || 'new',
        customerName: customer ? mockCustomers.find(c => c.id === customer)?.name || '' : newCustomerName,
        customerPhone: customer ? mockCustomers.find(c => c.id === customer)?.phone || '' : newCustomerPhone,
        services: selectedServices,
        subtotal,
        taxRate,
        taxAmount,
        tipAmount,
        tipPercentage,
        totalAmount,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        orderStatus: 'draft',
        staff,
        notes,
        createdAt: new Date().toISOString(),
      };

      onSave(order);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const subtotal = selectedServices.reduce((sum, service) => sum + service.price * service.quantity, 0);
  const taxAmount = subtotal * taxRate;
  const tipAmount = subtotal * (tipPercentage / 100);
  const totalAmount = subtotal + taxAmount + tipAmount;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.08))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 3,
          pt: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <OrderIcon sx={{ fontSize: 24 }} />
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
              {t('orders.addOrder')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              创建新的服务订单
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {errors.customer && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errors.customer}
            </Alert>
          )}

          {/* 客户信息部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
              borderRadius: 2,
              background: alpha('#10B981', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                {t('orders.customerInfo')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('orders.selectExistingCustomer')}</InputLabel>
                  <Select
                    value={customer}
                    label={t('orders.selectExistingCustomer')}
                    onChange={(e) => setCustomer(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    }}
                  >
                    <MenuItem value="">选择客户</MenuItem>
                    {mockCustomers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.phone} | {c.email}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {!customer && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('orders.newCustomerName')}
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    error={!!errors.customer}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981',
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('orders.newCustomerPhone')}
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10B981',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* 服务项目部分 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
              borderRadius: 2,
              background: alpha('#10B981', 0.02),
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <ServiceIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                  {t('orders.services')}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addService}
                sx={{
                  borderRadius: 2,
                  borderColor: '#10B981',
                  color: '#10B981',
                  '&:hover': {
                    borderColor: '#059669',
                    backgroundColor: alpha('#10B981', 0.1),
                  },
                }}
              >
                {t('orders.addService')}
              </Button>
            </Box>

            {errors.services && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errors.services}
              </Alert>
            )}

            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orders.serviceName')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orders.category')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">{t('orders.quantity')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">{t('orders.price')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orders.staff')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">{t('orders.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          value={service.name}
                          onChange={(_, value) => updateService(index, 'name', value || '')}
                          options={mockServices.map(s => s.name)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="outlined"
                              error={!!errors[`service_${index}_name`]}
                              size="small"
                              sx={{
                                minWidth: 120,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10B981',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#10B981',
                                  },
                                },
                              }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={service.category} 
                          size="small"
                          sx={{
                            backgroundColor: alpha('#10B981', 0.1),
                            color: '#10B981',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{
                            width: 70,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          variant="outlined"
                          size="small"
                          value={service.price}
                          onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01, style: { textAlign: 'center' } }}
                          error={!!errors[`service_${index}_price`]}
                          sx={{
                            width: 100,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={service.staff}
                            onChange={(e) => updateService(index, 'staff', e.target.value)}
                            error={!!errors[`service_${index}_staff`]}
                            sx={{
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#10B981',
                              },
                            }}
                          >
                            {mockStaff.map((staff) => (
                              <MenuItem key={staff} value={staff}>
                                {staff}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => removeService(index)}
                          color="error"
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha('#EF4444', 0.1),
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          {/* 订单设置 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
              borderRadius: 2,
              background: alpha('#10B981', 0.02),
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981', mb: 3 }}>
              {t('orders.orderSettings')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>{t('orders.primaryStaff')}</InputLabel>
                  <Select
                    value={staff}
                    label={t('orders.primaryStaff')}
                    onChange={(e) => setStaff(e.target.value)}
                    error={!!errors.staff}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    }}
                  >
                    {mockStaff.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('orders.tipPercentage')}
                  value={tipPercentage}
                  onChange={(e) => setTipPercentage(parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('orders.notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('orders.notesPlaceholder')}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 订单汇总 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
              borderRadius: 2,
              background: alpha('#10B981', 0.02),
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981', mb: 3 }}>
              {t('orders.orderSummary')}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">{t('orders.subtotal')}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">
                    {t('orders.tax')} ({(taxRate * 100).toFixed(1)}%):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(taxAmount)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">
                    {t('orders.tip')} ({tipPercentage}%):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(tipAmount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{t('orders.total')}:</Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#10B981',
                    }}
                  >
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
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
          background: alpha('#10B981', 0.02),
        }}
      >
        <Button 
          onClick={onClose}
          sx={{ 
            borderRadius: 2,
            px: 3,
            color: 'text.secondary',
          }}
        >
          {t('orders.cancel')}
        </Button>
        <Button 
          variant="contained"
          onClick={handleSubmit}
          sx={{
            borderRadius: 2,
            px: 3,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669, #047857)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
            },
          }}
        >
          {t('orders.createOrder')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrderDialog; 