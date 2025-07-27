import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as CashIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { serviceApi, customerApi, api, Customer as ApiCustomer } from '../../../services/api';
import { CurrencyUtils } from '../../../config/constants';

interface Service {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  duration: number;
  tenantId: number;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

type Customer = ApiCustomer;

interface OrderItem {
  serviceId: number;
  serviceName: string;
  price: number;
  quantity: number;
  assignedResourceId?: number;
  assignedResourceType?: string;
}

const PaymentProcess: React.FC = () => {
  // const { t } = useTranslation();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [taxRate] = useState(0.13); // 13% default tax
  const [tipPercentage, setTipPercentage] = useState(15); // 15% default tip
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const response = await serviceApi.getServices(String(user?.tenantId || 0));
      // 确保response是数组
      const servicesArray = Array.isArray(response) ? response : [];
      setServices(servicesArray);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]); // 确保在错误时设置为空数组
    }
  }, [user]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerApi.getCustomers({ 
        tenantId: user?.tenantId || 0,
        page: 0,
        size: 100
      });
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  }, [user]);

  // Fetch services and customers on mount
  useEffect(() => {
    if (user?.tenantId) {
      fetchServices();
      fetchCustomers();
    }
  }, [user, fetchServices, fetchCustomers]);

  const handleAddService = (service: Service) => {
    const existingItem = orderItems.find(item => item.serviceId === service.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.serviceId === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        quantity: 1,
      }]);
    }
  };

  const handleRemoveService = (serviceId: number) => {
    setOrderItems(orderItems.filter(item => item.serviceId !== serviceId));
  };

  const handleQuantityChange = (serviceId: number, change: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.serviceId === serviceId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * taxRate;
  };

  const calculateTip = () => {
    return calculateSubtotal() * (tipPercentage / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateTip();
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      setPaymentError('Please select a customer and add at least one service');
      return;
    }

    setPaymentDialog(true);
    setPaymentStatus('idle');
    setPaymentError(null);
  };

  const handleProcessPayment = async () => {
    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      // Create order
      const orderData = {
        tenantId: user?.tenantId || 0,
        customerId: Number(selectedCustomer!.id),
        resourceId: user?.id,
        resourceType: 'staff',
        taxRate: taxRate,
        tipPercentage: tipPercentage,
        notes: notes,
        services: orderItems.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          assignedResourceId: user?.id,
          assignedResourceType: 'staff',
        })),
      };

      const orderResponse = await api.createOrder(orderData);
      const order = orderResponse.data;

      // Process payment
      const paymentData = {
        orderId: order.id,
        paymentMethod: paymentMethod,
        amount: calculateTotal(),
        tipAmount: calculateTip(),
      };

      if (paymentMethod === 'cash') {
        // Cash payment - mark as paid immediately
        const paymentResponse = await api.processCashPayment(paymentData);
        setOrderResult(paymentResponse.data);
        setPaymentStatus('success');
      } else {
        // Card payment - initiate POS transaction
        const paymentResponse = await api.initiatePayment(paymentData);
        
        // In real implementation, this would poll for payment status
        // For now, simulate success after 3 seconds
        setTimeout(() => {
          setOrderResult(paymentResponse.data);
          setPaymentStatus('success');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setPaymentError(error.response?.data?.message || 'Payment failed. Please try again.');
      setPaymentStatus('failed');
    }
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setSelectedCustomer(null);
    setTipPercentage(15);
    setNotes('');
    setPaymentMethod('credit_card');
    setPaymentDialog(false);
    setPaymentStatus('idle');
    setPaymentError(null);
    setOrderResult(null);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left Panel - Service Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Select Services
              </Typography>
              
              <Grid container spacing={2}>
                {Array.isArray(services) && services.map((service) => (
                  <Grid item xs={12} sm={6} key={service.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        },
                      }}
                      onClick={() => handleAddService(service)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Service ID: {service.id}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                            {CurrencyUtils.formatAmount(service.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.duration} min
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Order Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Order Summary
              </Typography>

              {/* Customer Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={selectedCustomer?.id ? Number(selectedCustomer.id) : ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id && Number(c.id) === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  }
                >
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id ? Number(customer.id) : ''}>
                      {customer.firstName} {customer.lastName} - {customer.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Order Items */}
              <List sx={{ mb: 2 }}>
                {orderItems.map((item) => (
                  <ListItem key={item.serviceId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.serviceName}
                      secondary={`${CurrencyUtils.formatAmount(item.price)} x ${item.quantity}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.serviceId, -1)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Chip label={item.quantity} size="small" sx={{ mx: 1 }} />
                      <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(item.serviceId, 1)}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveService(item.serviceId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {orderItems.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No services selected. Please add services to continue.
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Pricing Details */}
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(calculateSubtotal())}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tax ({(taxRate * 100).toFixed(0)}%)</Typography>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(calculateTax())}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Tip</Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={tipPercentage}
                      onChange={(e) => setTipPercentage(Number(e.target.value))}
                      sx={{ width: 60 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Box>
                  <Typography variant="body2">{CurrencyUtils.formatAmount(calculateTip())}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {CurrencyUtils.formatAmount(calculateTotal())}
                  </Typography>
                </Box>
              </Box>

              {/* Payment Method */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="cash">
                    <Box display="flex" alignItems="center" gap={1}>
                      <CashIcon /> Cash
                    </Box>
                  </MenuItem>
                  <MenuItem value="credit_card">
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCardIcon /> Credit Card
                    </Box>
                  </MenuItem>
                  <MenuItem value="debit_card">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PaymentIcon /> Debit Card
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Create Order Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PaymentIcon />}
                onClick={handleCreateOrder}
                disabled={!selectedCustomer || orderItems.length === 0}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                  },
                }}
              >
                Process Payment
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => paymentStatus === 'processing' ? null : setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {paymentStatus === 'idle' && 'Confirm Payment'}
            {paymentStatus === 'processing' && 'Processing Payment...'}
            {paymentStatus === 'success' && 'Payment Successful'}
            {paymentStatus === 'failed' && 'Payment Failed'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {paymentStatus === 'idle' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please confirm the payment details before processing.
              </Alert>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Customer: {selectedCustomer?.firstName} {selectedCustomer?.lastName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Total Amount: {CurrencyUtils.formatAmount(calculateTotal())}
              </Typography>
              <Typography variant="body2">
                Payment Method: {paymentMethod.replace('_', ' ').toUpperCase()}
              </Typography>
            </Box>
          )}

          {paymentStatus === 'processing' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body1">
                {paymentMethod === 'cash' ? 'Processing cash payment...' : 'Waiting for card payment...'}
              </Typography>
              {paymentMethod !== 'cash' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please complete the payment on the POS terminal
                </Typography>
              )}
            </Box>
          )}

          {paymentStatus === 'success' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Payment Completed Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order #{orderResult?.orderNumber}
              </Typography>
            </Box>
          )}

          {paymentStatus === 'failed' && (
            <Box>
              <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Payment Failed
                </Typography>
              </Box>
              <Alert severity="error">
                {paymentError || 'An unknown error occurred'}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {paymentStatus === 'idle' && (
            <>
              <Button onClick={() => setPaymentDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleProcessPayment}
                sx={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                  },
                }}
              >
                Confirm Payment
              </Button>
            </>
          )}

          {paymentStatus === 'success' && (
            <Button
              variant="contained"
              onClick={handleNewOrder}
              sx={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                },
              }}
            >
              New Order
            </Button>
          )}

          {paymentStatus === 'failed' && (
            <>
              <Button onClick={() => setPaymentDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleProcessPayment}
                color="primary"
              >
                Retry Payment
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentProcess;