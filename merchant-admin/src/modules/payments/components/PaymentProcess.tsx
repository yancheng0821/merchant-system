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
  Autocomplete,
  Avatar,
  alpha,
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
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  // 美容护理类
  ContentCut as HairIcon,
  Spa as SpaIcon,
  Face as FaceIcon,
  LocalOffer as NailIcon,
  // 健康医疗类
  LocalHospital as MedicalIcon,
  Healing as HealingIcon,
  Psychology as TherapyIcon,
  SelfImprovement as YogaIcon,
  // 运动健身类
  FitnessCenter as GymIcon,
  Pool as SwimmingIcon,
  SportsBasketball as SportsIcon,
  DirectionsRun as RunningIcon,
  SportsKabaddi as MartialArtsIcon,
  // 娱乐休闲类
  MusicNote as MusicIcon,
  Movie as MovieIcon,
  Videocam as VideoIcon,
  PhotoCamera as PhotoIcon,
  Brush as ArtIcon,
  Piano as PianoIcon,
  // 教育培训类
  School as EducationIcon,
  MenuBook as BookIcon,
  Computer as ComputerIcon,
  Language as LanguageIcon,
  // 商务服务类
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  Gavel as LegalIcon,
  Engineering as EngineeringIcon,
  // 生活服务类
  Restaurant as FoodIcon,
  LocalLaundryService as LaundryIcon,
  CleaningServices as CleaningIcon,
  Build as RepairIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  // 交通出行类
  DirectionsCar as CarIcon,
  LocalTaxi as TaxiIcon,
  TwoWheeler as BikeIcon,
  Flight as FlightIcon,
  // 宠物服务类
  Pets as PetIcon,
  // 购物零售类
  ShoppingCart as ShoppingIcon,
  Store as StoreIcon,
  LocalMall as MallIcon,
  // 通用图标
  Star as StarIcon,
  Favorite as HeartIcon,
  Diamond as DiamondIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  LocalFlorist as FlowerIcon,
  WbSunny as SunIcon,
  Nightlight as MoonIcon,
  // 科技数码类
  PhoneAndroid as PhoneAndroidIcon,
  Laptop as LaptopIcon,
  Watch as WatchIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { useTax } from '../../../contexts/TaxContext';
import { serviceApi, customerApi, appointmentApi, api, Customer as ApiCustomer } from '../../../services/api';
import { CurrencyUtils, TimeZoneUtils } from '../../../config/constants';

interface Service {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  duration: number;
  tenantId: number;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  icon?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
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

interface Appointment {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  services: {
    id: number;
    name: string;
    price: number;
    duration: number;
    serviceId?: number;
  }[];
  appointmentDate: string;
  appointmentTime: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalAmount: number;
  appointmentServices?: {
    id: number;
    serviceName: string;
    price: number;
    duration: number;
    serviceId: number;
  }[];
  // 添加资源信息
  resourceId?: number;
  resourceType?: 'STAFF' | 'ROOM';
}

const PaymentProcess: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { calculateTax, taxSettings } = useTax();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isAppointmentBased, setIsAppointmentBased] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'appointments'>('services');
  const [customSubtotal, setCustomSubtotal] = useState<number | null>(null);
  const [isEditingSubtotal, setIsEditingSubtotal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [walkInCustomer, setWalkInCustomer] = useState<Customer | null>(null);

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

  const getOrCreateWalkInCustomer = useCallback(async () => {
    if (!user?.tenantId) {
      return null;
    }

    try {
      // 首先尝试查找现有的walk-in客户
      const response = await customerApi.getCustomers({
        tenantId: user?.tenantId || 0,
        keyword: 'Walk-in Customer',
        page: 0,
        size: 10
      });

      const existingWalkIn = response.customers?.find(customer =>
        customer.firstName === 'Walk-in' && customer.lastName === 'Customer'
      );

      if (existingWalkIn) {
        setWalkInCustomer(existingWalkIn);
        return existingWalkIn;
      }

      // 如果不存在，创建一个新的walk-in客户
      const walkInData = {
        tenantId: user?.tenantId || 0,
        firstName: 'Walk-in',
        lastName: 'Customer',
        phone: '000-000-0000',
        email: 'walkin@placeholder.com',
        address: 'N/A',
        notes: 'System generated customer for walk-in transactions'
      };

      const newWalkIn = await customerApi.createCustomer(walkInData);
      setWalkInCustomer(newWalkIn);
      return newWalkIn;
    } catch (error) {
      console.error('Failed to get or create walk-in customer:', error);
      return null;
    }
  }, [user]);

  const fetchAppointments = useCallback(async () => {
    try {
      if (!user?.tenantId) return;

      // 获取所有预约，然后过滤已确认的
      const response = await appointmentApi.getAllAppointments(user?.tenantId || 0);
      const allAppointments = Array.isArray(response) ? response : [];

      // 获取今天的日期字符串 (YYYY-MM-DD格式，温哥华时区)
      const todayStr = TimeZoneUtils.getTodayVancouverDateString();
      
      console.log('Fetched appointments:', allAppointments.length, 'Today:', todayStr);

      // 格式化所有已确认的预约数据（不限制日期，用于搜索）
      const allConfirmedAppointments = allAppointments
        .filter((apt: any) => apt.status === 'CONFIRMED')
        .map((apt: any) => {
          // 从customer对象获取客户信息
          const customerName = apt.customer
            ? `${apt.customer.firstName || ''} ${apt.customer.lastName || ''}`.trim()
            : 'Unknown Customer';
          const customerPhone = apt.customer?.phone || '';

          // 从appointmentServices获取服务信息
          const services = apt.appointmentServices?.map((service: any) => ({
            id: service.id,
            name: service.serviceName,
            price: service.price,
            duration: service.duration,
          })) || [];

          return {
            id: apt.id,
            customerId: apt.customerId,
            customerName,
            customerPhone,
            services,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.appointmentTime,
            status: apt.status,
            totalAmount: apt.totalAmount || 0,
            appointmentServices: apt.appointmentServices,
            // 添加资源信息
            resourceId: apt.resourceId,
            resourceType: apt.resourceType,
          };
        });

      // 默认显示今天的预约（最多20条）
      const todayAppointments = allConfirmedAppointments
        .filter(apt => apt.appointmentDate === todayStr)
        .sort((a, b) => {
          // 按预约时间倒序排列 (时间最晚的在最上面)
          const timeA = a.appointmentTime.replace(':', '');
          const timeB = b.appointmentTime.replace(':', '');
          return timeB.localeCompare(timeA);
        })
        .slice(0, 20);

      console.log('Confirmed appointments:', allConfirmedAppointments.length, 'Today:', todayAppointments.length);
      
      // 存储所有已确认的预约用于搜索，显示今天的预约作为默认
      setAppointments(allConfirmedAppointments);
      setFilteredAppointments(todayAppointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    }
  }, [user]);

  // 服务搜索过滤
  useEffect(() => {
    if (!serviceSearchTerm.trim()) {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(service =>
        service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
        service.categoryName?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [services, serviceSearchTerm]);

  // 预约搜索过滤
  useEffect(() => {
    if (!appointmentSearchTerm.trim()) {
      // 没有搜索词时，显示今天的预约（默认行为）
      const todayStr = TimeZoneUtils.getTodayVancouverDateString();
      const todayAppointments = appointments
        .filter(apt => apt.appointmentDate === todayStr)
        .sort((a, b) => {
          // 按预约时间倒序排列 (时间最晚的在最上面)
          const timeA = a.appointmentTime.replace(':', '');
          const timeB = b.appointmentTime.replace(':', '');
          return timeB.localeCompare(timeA);
        })
        .slice(0, 20);
      setFilteredAppointments(todayAppointments);
    } else {
      // 有搜索词时，在所有预约中搜索（不限制日期）
      const filtered = appointments
        .filter(appointment =>
          appointment.customerName.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
          appointment.customerPhone.includes(appointmentSearchTerm) ||
          appointment.appointmentDate.includes(appointmentSearchTerm) ||
          appointment.services.some(service =>
            service.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase())
          )
        )
        // 搜索结果按日期和时间排序，最新的在前面，最多20条
        .sort((a, b) => {
          // 先按日期排序（最新日期在前）
          const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
          if (dateCompare !== 0) return dateCompare;
          
          // 同一天内按时间倒序排列
          const timeA = a.appointmentTime.replace(':', '');
          const timeB = b.appointmentTime.replace(':', '');
          return timeB.localeCompare(timeA);
        })
        .slice(0, 20);
      setFilteredAppointments(filtered);
    }
  }, [appointments, appointmentSearchTerm]);

  // 客户搜索过滤
  useEffect(() => {
    if (!customerSearchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone?.includes(customerSearchTerm) ||
        customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, customerSearchTerm]);

  // Fetch services, customers and appointments on mount
  useEffect(() => {
    if (user?.tenantId) {
      fetchServices();
      fetchCustomers();
      fetchAppointments();
      getOrCreateWalkInCustomer();
    }
  }, [user, fetchServices, fetchCustomers, fetchAppointments, getOrCreateWalkInCustomer]);

  const handleAddService = (service: Service) => {
    // 当用户手动添加服务时，表示不再基于预约
    setIsAppointmentBased(false);

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
    const newOrderItems = orderItems.filter(item => item.serviceId !== serviceId);
    setOrderItems(newOrderItems);
    // 如果删除服务后没有任何服务项，则清除预约相关状态
    if (newOrderItems.length === 0) {
      setSelectedAppointment(null);
      setIsAppointmentBased(false);
    }
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

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentBased(true);

    // 找到对应的客户
    const customer = customers.find(c => Number(c.id) === appointment.customerId);
    if (customer) {
      setSelectedCustomer(customer);
    }

    // 将预约的服务添加到订单项目中
    // 使用appointmentServices字段，包含serviceId
    const appointmentOrderItems: OrderItem[] = (appointment.appointmentServices || [])
      .map(service => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        price: service.price,
        quantity: 1,
      }));

    setOrderItems(appointmentOrderItems);

    // 切换到服务选择标签页以显示已选择的服务
    setActiveTab('services');
  };

  const calculateSubtotal = () => {
    if (customSubtotal !== null) {
      return CurrencyUtils.normalizeAmount(customSubtotal);
    }
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return CurrencyUtils.normalizeAmount(subtotal);
  };

  const calculateOrderTax = () => {
    const subtotal = calculateSubtotal();
    const taxResult = calculateTax(subtotal);
    return CurrencyUtils.normalizeAmount(taxResult.totalTax);
  };

  const calculateTotal = () => {
    const total = calculateSubtotal() + calculateOrderTax();
    return CurrencyUtils.normalizeAmount(total);
  };

  const handleSubtotalEdit = () => {
    setIsEditingSubtotal(true);
    setCustomSubtotal(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
  };

  const handleSubtotalSave = () => {
    setIsEditingSubtotal(false);
  };

  const handleSubtotalCancel = () => {
    setIsEditingSubtotal(false);
    setCustomSubtotal(null);
  };

  const handleCreateOrder = async () => {
    if (orderItems.length === 0) {
      setPaymentError(t('payments.selectServices'));
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
      // 确定使用的客户ID：选中的客户或walk-in客户
      const customerToUse = selectedCustomer || walkInCustomer;

      if (!customerToUse) {
        throw new Error('No customer available for order creation. Please ensure walk-in customer is created.');
      }

      // 验证客户ID
      if (!customerToUse.id) {
        throw new Error('Customer ID is missing');
      }

      // Validate required data before creating order
      if (!user?.tenantId) {
        throw new Error('Tenant ID is missing');
      }
      if (!customerToUse.id) {
        throw new Error('Customer ID is missing');
      }
      if (!user?.id) {
        throw new Error('User ID is missing');
      }
      if (orderItems.length === 0) {
        throw new Error('No services selected');
      }

      // Validate all services have valid IDs
      for (const item of orderItems) {
        if (!item.serviceId || item.serviceId <= 0) {
          throw new Error(`Invalid service ID: ${item.serviceId} for service: ${item.serviceName}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity} for service: ${item.serviceName}`);
        }
      }

      // Create order - 根据是否基于预约来设置相关字段
      const orderData = {
        tenantId: Number(user.tenantId),
        customerId: Number(customerToUse.id),
        // 如果是基于预约的订单，添加预约ID和资源信息
        ...(isAppointmentBased && selectedAppointment && {
          appointmentId: Number(selectedAppointment.id),
          ...(selectedAppointment.resourceId && {
            resourceId: Number(selectedAppointment.resourceId),
            resourceType: selectedAppointment.resourceType,
          }),
        }),
        taxRate: (taxSettings.gstRate + taxSettings.pstRate) / 100, // 使用实际的税率设置
        tipPercentage: 0.0,
        paymentMethod: paymentMethod, // 添加支付方式
        notes: notes || '',
        services: orderItems.map(item => ({
          serviceId: Number(item.serviceId),
          quantity: Number(item.quantity),
          // 对于基于预约的订单，从预约中获取资源信息
          // 对于直接选择服务的订单，不指定资源信息
          ...(isAppointmentBased && selectedAppointment?.resourceId && {
            assignedResourceId: Number(selectedAppointment.resourceId),
            assignedResourceType: selectedAppointment.resourceType,
          }),
        })),
      };



      let orderResponse, order;
      try {
        orderResponse = await api.createOrder(orderData);
        order = orderResponse; // 直接使用orderResponse，因为后端直接返回OrderDTO
      } catch (orderError: any) {
        console.error('Order creation failed:', orderError);
        throw orderError;
      }

      // Process payment
      if (!order || !order.id) {
        throw new Error('Order creation failed - order is null or missing ID');
      }

      const paymentData = {
        orderId: order.id,
        paymentMethod: paymentMethod,
        amount: calculateTotal(),
      };

      if (paymentMethod === 'cash') {
        // Cash payment - mark as paid immediately
        const paymentResponse = await api.processCashPayment(paymentData);
        setOrderResult({
          ...paymentResponse.data,
          orderId: order.id,
          orderNumber: order.orderNumber
        });
        setPaymentStatus('success');
      } else {
        // Card payment - initiate POS transaction
        const paymentResponse = await api.initiatePayment(paymentData);

        // Mock POS success after 3 seconds for testing
        setTimeout(() => {
          setOrderResult({
            ...paymentResponse.data,
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: 'completed',
            transactionId: 'MOCK_' + Date.now()
          });
          setPaymentStatus('success');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Payment failed:', error);

      let errorMessage = 'Payment failed. Please try again.';
      if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.responseData?.fieldErrors) {
        const fieldErrors = Object.values(error.responseData.fieldErrors).join(', ');
        errorMessage = `Validation errors: ${fieldErrors}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPaymentError(errorMessage);
      setPaymentStatus('failed');
    }
  };

  const handleNewOrder = () => {
    setOrderItems([]);
    setSelectedCustomer(null);
    setSelectedAppointment(null);
    setIsAppointmentBased(false);
    setNotes('');
    setPaymentMethod('credit_card');
    setPaymentDialog(false);
    setPaymentStatus('idle');
    setPaymentError(null);
    setOrderResult(null);
    setServiceSearchTerm('');
    setAppointmentSearchTerm('');
    setCustomerSearchTerm('');
    setActiveTab('services');
    setCustomSubtotal(null);
    setIsEditingSubtotal(false);
  };

  // 获取服务图标和颜色
  const getServiceIconAndColor = (service: Service) => {
    // 如果服务有自定义图标，使用自定义图标
    if (service.icon) {
      return {
        icon: (
          <img
            src={service.icon}
            alt={service.name}
            style={{ width: 16, height: 16 }}
          />
        ),
        color: service.categoryColor || '#10B981',
        bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#4F46E5'})`,
      };
    }

    // 使用数据库中保存的分类图标标识符
    const categoryIcon = service.categoryIcon?.toLowerCase();
    const iconProps = { sx: { fontSize: 16 } };

    // 根据categoryIcon返回对应的图标组件和颜色
    switch (categoryIcon) {
      // 美容护理类
      case 'hair':
        return {
          icon: <HairIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'spa':
        return {
          icon: <SpaIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      case 'face':
        return {
          icon: <FaceIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      case 'nail':
        return {
          icon: <NailIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      // 健康医疗类
      case 'medical':
        return {
          icon: <MedicalIcon {...iconProps} />,
          color: service.categoryColor || '#EF4444',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EF4444'}, ${service.categoryColor || '#DC2626'})`,
        };
      case 'healing':
        return {
          icon: <HealingIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      case 'therapy':
        return {
          icon: <TherapyIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      case 'yoga':
        return {
          icon: <YogaIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      // 运动健身类
      case 'gym':
        return {
          icon: <GymIcon {...iconProps} />,
          color: service.categoryColor || '#EF4444',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EF4444'}, ${service.categoryColor || '#DC2626'})`,
        };
      case 'swimming':
        return {
          icon: <SwimmingIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      case 'sports':
        return {
          icon: <SportsIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'running':
        return {
          icon: <RunningIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      case 'martialarts':
        return {
          icon: <MartialArtsIcon {...iconProps} />,
          color: service.categoryColor || '#EF4444',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EF4444'}, ${service.categoryColor || '#DC2626'})`,
        };
      // 娱乐休闲类
      case 'music':
        return {
          icon: <MusicIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'movie':
        return {
          icon: <MovieIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      case 'video':
        return {
          icon: <VideoIcon {...iconProps} />,
          color: service.categoryColor || '#EF4444',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EF4444'}, ${service.categoryColor || '#DC2626'})`,
        };
      case 'photo':
        return {
          icon: <PhotoIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      case 'art':
        return {
          icon: <ArtIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      case 'piano':
        return {
          icon: <PianoIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      // 教育培训类
      case 'education':
        return {
          icon: <EducationIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      case 'book':
        return {
          icon: <BookIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      case 'computer':
        return {
          icon: <ComputerIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'language':
        return {
          icon: <LanguageIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      // 商务服务类
      case 'business':
        return {
          icon: <BusinessIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'bank':
        return {
          icon: <BankIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      case 'legal':
        return {
          icon: <LegalIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'engineering':
        return {
          icon: <EngineeringIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      // 生活服务类
      case 'food':
        return {
          icon: <FoodIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'laundry':
        return {
          icon: <LaundryIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      case 'cleaning':
        return {
          icon: <CleaningIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      case 'repair':
        return {
          icon: <RepairIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'electrical':
        return {
          icon: <ElectricalIcon {...iconProps} />,
          color: service.categoryColor || '#EF4444',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EF4444'}, ${service.categoryColor || '#DC2626'})`,
        };
      case 'plumbing':
        return {
          icon: <PlumbingIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      // 交通出行类
      case 'car':
        return {
          icon: <CarIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'taxi':
        return {
          icon: <TaxiIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'bike':
        return {
          icon: <BikeIcon {...iconProps} />,
          color: service.categoryColor || '#10B981',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#10B981'}, ${service.categoryColor || '#059669'})`,
        };
      case 'flight':
        return {
          icon: <FlightIcon {...iconProps} />,
          color: service.categoryColor || '#3B82F6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#3B82F6'}, ${service.categoryColor || '#2563EB'})`,
        };
      // 宠物服务类
      case 'pet':
        return {
          icon: <PetIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      // 购物零售类
      case 'shopping':
        return {
          icon: <ShoppingIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      case 'store':
        return {
          icon: <StoreIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'mall':
        return {
          icon: <MallIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      // 通用图标
      case 'star':
        return {
          icon: <StarIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'heart':
        return {
          icon: <HeartIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      case 'diamond':
        return {
          icon: <DiamondIcon {...iconProps} />,
          color: service.categoryColor || '#8B5CF6',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#8B5CF6'}, ${service.categoryColor || '#7C3AED'})`,
        };
      case 'trophy':
        return {
          icon: <TrophyIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'celebration':
        return {
          icon: <CelebrationIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      case 'flower':
        return {
          icon: <FlowerIcon {...iconProps} />,
          color: service.categoryColor || '#EC4899',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#EC4899'}, ${service.categoryColor || '#DB2777'})`,
        };
      case 'sun':
        return {
          icon: <SunIcon {...iconProps} />,
          color: service.categoryColor || '#F59E0B',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#F59E0B'}, ${service.categoryColor || '#D97706'})`,
        };
      case 'moon':
        return {
          icon: <MoonIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      // 科技数码类
      case 'phone':
        return {
          icon: <PhoneAndroidIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'laptop':
        return {
          icon: <LaptopIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      case 'watch':
        return {
          icon: <WatchIcon {...iconProps} />,
          color: service.categoryColor || '#6B7280',
          bgColor: `linear-gradient(135deg, ${service.categoryColor || '#6B7280'}, ${service.categoryColor || '#4B5563'})`,
        };
      default:
        break;
    }

    // 默认图标和颜色
    return {
      icon: <BusinessIcon sx={{ fontSize: 16 }} />,
      color: '#6B7280',
      bgColor: 'linear-gradient(135deg, #6B7280, #4B5563)',
    };
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left Panel - Service Selection & Appointment Selection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Tab Headers */}
              <Box display="flex" mb={3}>
                <Button
                  variant={activeTab === 'services' ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab('services')}
                  startIcon={<BusinessIcon />}
                  sx={{
                    mr: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    ...(activeTab === 'services' ? {
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                      },
                    } : {
                      borderColor: '#d1d5db',
                      color: '#6b7280',
                      '&:hover': {
                        borderColor: '#10B981',
                        color: '#10B981',
                      },
                    }),
                  }}
                >
                  {t('payments.selectServices')}
                </Button>
                <Button
                  variant={activeTab === 'appointments' ? 'contained' : 'outlined'}
                  onClick={() => setActiveTab('appointments')}
                  startIcon={<EventIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    ...(activeTab === 'appointments' ? {
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                      },
                    } : {
                      borderColor: '#d1d5db',
                      color: '#6b7280',
                      '&:hover': {
                        borderColor: '#10B981',
                        color: '#10B981',
                      },
                    }),
                  }}
                >
                  {t('payments.selectAppointment')}
                </Button>
              </Box>

              {/* Services Tab */}
              {activeTab === 'services' && (
                <>
                  {/* Search Bar */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder={t('payments.searchServices')}
                      value={serviceSearchTerm}
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        endAdornment: serviceSearchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setServiceSearchTerm('')}
                            >
                              <ClearIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#6366F1',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#6366F1',
                          },
                        },
                      }}
                    />
                  </Box>

                  {Array.isArray(filteredServices) && filteredServices.length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: '#f9fafb',
                        border: '2px dashed #d1d5db',
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {serviceSearchTerm ? t('payments.noServicesFound') : t('payments.noServicesAvailable')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {serviceSearchTerm ? t('payments.tryDifferentSearch') : t('payments.addServicesFirst')}
                      </Typography>
                    </Box>
                  )}

                  <Grid container spacing={2}>
                    {Array.isArray(filteredServices) && filteredServices.map((service) => (
                      <Grid item xs={12} sm={6} key={service.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            borderRadius: 2,
                            border: '2px solid transparent',
                            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 12px 32px rgba(99, 102, 241, 0.15)',
                              border: '2px solid #6366F1',
                              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                            },
                            '&:active': {
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => handleAddService(service)}
                        >
                          <CardContent sx={{ p: 2.5 }}>
                            {(() => {
                              const { icon, color, bgColor } = getServiceIconAndColor(service);
                              return (
                                <>
                                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                                    <Box
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1.5,
                                        background: bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                      }}
                                    >
                                      {icon}
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                      {service.name}
                                    </Typography>
                                  </Box>

                                  {service.description && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                                      {service.description}
                                    </Typography>
                                  )}

                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box
                                      sx={{
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        background: bgColor,
                                        color: 'white',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                        {CurrencyUtils.formatAmount(service.price)}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        bgcolor: '#f3f4f6',
                                        color: '#6b7280',
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                        {service.duration} min
                                      </Typography>
                                    </Box>
                                  </Box>
                                </>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <>
                  {/* Search Bar */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder={t('payments.searchAppointments')}
                      value={appointmentSearchTerm}
                      onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                        endAdornment: appointmentSearchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setAppointmentSearchTerm('')}
                            >
                              <ClearIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#10B981',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                      }}
                    />
                    {/* 今天预约提示 */}
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {t('payments.todayAppointmentsOnly')} ({t('payments.appointmentLimitInfo')})
                      </Typography>
                    </Box>
                  </Box>

                  {Array.isArray(filteredAppointments) && filteredAppointments.length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: '#f9fafb',
                        border: '2px dashed #d1d5db',
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {appointmentSearchTerm ? t('payments.noAppointmentsFound') : t('payments.noAppointmentsAvailable')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {appointmentSearchTerm ? t('payments.tryDifferentSearch') : t('payments.noConfirmedAppointments')}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ maxHeight: 450, overflowY: 'auto', pr: 0.5 }}>
                    {Array.isArray(filteredAppointments) && filteredAppointments.map((appointment) => (
                      <Card
                        key={appointment.id}
                        sx={{
                          mb: 1.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderRadius: 2,
                          border: selectedAppointment?.id === appointment.id ? '2px solid #10B981' : '1px solid #e5e7eb',
                          background: selectedAppointment?.id === appointment.id
                            ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                            : '#ffffff',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)',
                            border: '1px solid #10B981',
                          },
                        }}
                        onClick={() => handleSelectAppointment(appointment)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* 头部信息 - 客户和时间 */}
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1.5,
                                  background: 'linear-gradient(135deg, #10B981, #059669)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                }}
                              >
                                <EventIcon sx={{ fontSize: 14 }} />
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', lineHeight: 1.2 }}>
                                  {appointment.customerName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {appointment.customerPhone}
                                </Typography>
                              </Box>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981', fontSize: '0.9rem' }}>
                                {CurrencyUtils.formatAmount(appointment.totalAmount)}
                              </Typography>
                              <Chip
                                label={appointment.status}
                                size="small"
                                sx={{
                                  bgcolor: '#e0f2fe',
                                  color: '#0277bd',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                          </Box>

                          {/* 时间信息 */}
                          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <TimeIcon sx={{ fontSize: 12, color: '#6b7280' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {appointment.appointmentDate} {appointment.appointmentTime}
                            </Typography>
                          </Box>

                          {/* 服务信息 - 紧凑显示 */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem', mb: 0.5, display: 'block' }}>
                              {t('payments.services')} ({appointment.services.length}):
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {appointment.services.slice(0, 3).map((service, index) => (
                                <Chip
                                  key={service.id}
                                  label={`${service.name} (${service.duration}min)`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    borderColor: '#d1d5db',
                                    color: '#6b7280',
                                    '& .MuiChip-label': {
                                      px: 1,
                                    },
                                  }}
                                />
                              ))}
                              {appointment.services.length > 3 && (
                                <Chip
                                  label={`+${appointment.services.length - 3}`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                    bgcolor: '#f3f4f6',
                                    color: '#6b7280',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Order Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <PaymentIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1f2937' }}>
                  {t('payments.orderSummary')}
                </Typography>
              </Box>

              {/* Selected Appointment Info */}
              {selectedAppointment && isAppointmentBased && orderItems.length > 0 && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #d1fae5' }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <EventIcon sx={{ fontSize: 18, color: '#059669' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                      {t('payments.selectedAppointment')}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#374151', mb: 0.5 }}>
                    {selectedAppointment.customerName} - {selectedAppointment.customerPhone}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedAppointment.appointmentDate} {selectedAppointment.appointmentTime}
                  </Typography>
                </Box>
              )}

              {/* Customer Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                  {t('payments.customer')}
                </Typography>
                <Autocomplete
                  value={selectedCustomer}
                  onChange={(event, newValue) => {
                    setSelectedCustomer(newValue);
                    // 如果清除了客户，并且当前订单基于预约，则清除预约相关状态
                    if (!newValue && isAppointmentBased) {
                      setSelectedAppointment(null);
                      setIsAppointmentBased(false);
                    }
                  }}
                  inputValue={customerSearchTerm}
                  onInputChange={(event, newInputValue) => {
                    setCustomerSearchTerm(newInputValue);
                  }}
                  options={filteredCustomers}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} - ${option.phone}`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('payments.searchCustomer')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#6b7280' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#10B981',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                          },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.phone} {option.email && `• ${option.email}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  noOptionsText={t('payments.noCustomersFound')}
                />
              </Box>

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
                  {t('payments.noServicesSelected')}
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Pricing Details */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>{t('payments.subtotal')}</Typography>
                  {isEditingSubtotal ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <TextField
                        size="small"
                        type="number"
                        value={customSubtotal || 0}
                        onChange={(e) => setCustomSubtotal(Number(e.target.value))}
                        sx={{
                          width: 100,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            '& fieldset': {
                              borderColor: '#10B981',
                            },
                          },
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                      <IconButton size="small" onClick={handleSubtotalSave} sx={{ color: '#10B981' }}>
                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={handleSubtotalCancel} sx={{ color: '#ef4444' }}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {CurrencyUtils.formatAmount(calculateSubtotal())}
                      </Typography>
                      <IconButton size="small" onClick={handleSubtotalEdit} sx={{ color: '#6b7280' }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                {(() => {
                  const subtotal = calculateSubtotal();
                  const taxResult = calculateTax(subtotal);
                  return (
                    <>
                      {taxResult.gstAmount > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            GST/HST ({((taxResult.gstAmount / subtotal) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {CurrencyUtils.formatAmount(taxResult.gstAmount)}
                          </Typography>
                        </Box>
                      )}
                      {taxResult.pstAmount > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            PST ({((taxResult.pstAmount / subtotal) * 100).toFixed(1)}%)
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {CurrencyUtils.formatAmount(taxResult.pstAmount)}
                          </Typography>
                        </Box>
                      )}
                      {taxResult.totalTax > 0 && (
                        <Box display="flex" justifyContent="space-between" mb={2}>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600 }}>
                            {t('payments.totalTax')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {CurrencyUtils.formatAmount(taxResult.totalTax)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  );
                })()}
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>{t('payments.total')}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#10B981' }}>
                    {CurrencyUtils.formatAmount(calculateTotal())}
                  </Typography>
                </Box>
              </Box>

              {/* Payment Method */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                  {t('payments.paymentMethod')}
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#10B981',
                      },
                    }}
                  >
                    <MenuItem value="cash">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <CashIcon sx={{ color: '#059669' }} />
                        <Typography sx={{ fontWeight: 500 }}>{t('payments.cash')}</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="credit_card">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <CreditCardIcon sx={{ color: '#059669' }} />
                        <Typography sx={{ fontWeight: 500 }}>{t('payments.creditCard')}</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="debit_card">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <PaymentIcon sx={{ color: '#059669' }} />
                        <Typography sx={{ fontWeight: 500 }}>{t('payments.debitCard')}</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Notes */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#374151' }}>
                  {t('payments.notes')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={t('payments.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                      '&:hover fieldset': {
                        borderColor: '#10B981',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#10B981',
                      },
                    },
                  }}
                />
              </Box>

              {/* Create Order Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PaymentIcon />}
                onClick={handleCreateOrder}
                disabled={orderItems.length === 0}
                sx={{
                  py: 2,
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af',
                    boxShadow: 'none',
                  },
                }}
              >
                {t('payments.processPayment')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => paymentStatus === 'processing' ? null : setPaymentDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            pt: 3,
            background: paymentStatus === 'idle' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' :
              paymentStatus === 'processing' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' :
                paymentStatus === 'success' ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fee2e2, #fecaca)',
            borderBottom: '1px solid',
            borderColor: paymentStatus === 'idle' ? alpha('#10B981', 0.15) :
              paymentStatus === 'processing' ? alpha('#F59E0B', 0.15) :
                paymentStatus === 'success' ? alpha('#10B981', 0.15) : alpha('#EF4444', 0.15),
            position: 'relative'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2.5}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: paymentStatus === 'idle' ? 'linear-gradient(135deg, #10B981, #059669)' :
                    paymentStatus === 'processing' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                      paymentStatus === 'success' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {paymentStatus === 'idle' && <PaymentIcon sx={{ fontSize: 28 }} />}
                {paymentStatus === 'processing' && <CircularProgress size={28} sx={{ color: 'white' }} />}
                {paymentStatus === 'success' && <CheckCircleIcon sx={{ fontSize: 28 }} />}
                {paymentStatus === 'failed' && <ErrorIcon sx={{ fontSize: 28 }} />}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  {paymentStatus === 'idle' && t('payments.confirmPayment')}
                  {paymentStatus === 'processing' && t('payments.processingPayment')}
                  {paymentStatus === 'success' && t('payments.paymentSuccessful')}
                  {paymentStatus === 'failed' && t('payments.paymentFailed')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {paymentStatus === 'idle' && t('payments.reviewOrderDetails')}
                  {paymentStatus === 'processing' && t('payments.pleaseWait')}
                  {paymentStatus === 'success' && t('payments.transactionCompleted')}
                  {paymentStatus === 'failed' && t('payments.transactionFailed')}
                </Typography>
              </Box>
            </Box>
            {paymentStatus !== 'processing' && (
              <IconButton
                onClick={() => setPaymentDialog(false)}
                sx={{
                  color: 'text.secondary',
                  backgroundColor: alpha('#000', 0.04),
                  '&:hover': { backgroundColor: alpha('#000', 0.08) },
                  borderRadius: 2,
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {paymentStatus === 'idle' && (
            <Box>

              <Grid container spacing={2}>
                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#10B981', 0.2),
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                      height: '100%',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary" sx={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            fontWeight: 600,
                            color: '#10B981'
                          }}>
                            {t('payments.customer')}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                            {selectedCustomer
                              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                              : t('payments.walkInCustomer')}
                          </Typography>
                        </Box>
                      </Box>

                      {selectedCustomer && (
                        <Box sx={{
                          pl: 0,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: alpha('#10B981', 0.1)
                        }}>
                          {selectedCustomer.phone && (
                            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                              <PhoneIcon sx={{ fontSize: 16, color: '#10B981' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {selectedCustomer.phone}
                              </Typography>
                            </Box>
                          )}
                          {selectedCustomer.email && (
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <EmailIcon sx={{ fontSize: 16, color: '#10B981' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {selectedCustomer.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#6366F1', 0.2),
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                      height: '100%',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            background: paymentMethod === 'cash'
                              ? 'linear-gradient(135deg, #10B981, #059669)'
                              : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: paymentMethod === 'cash'
                              ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                              : '0 4px 12px rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          {paymentMethod === 'cash' ? <CashIcon sx={{ fontSize: 24 }} /> : <CreditCardIcon sx={{ fontSize: 24 }} />}
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary" sx={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            fontWeight: 600,
                            color: paymentMethod === 'cash' ? '#10B981' : '#6366F1'
                          }}>
                            {t('payments.paymentMethod')}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                            {paymentMethod === 'cash' ? t('payments.cash') :
                              paymentMethod === 'credit_card' ? t('payments.creditCard') :
                                paymentMethod === 'debit_card' ? t('payments.debitCard') :
                                  paymentMethod.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Amount Breakdown */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#10B981', 0.2),
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <CashIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary" sx={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            fontWeight: 600,
                            color: '#10B981'
                          }}>
                            {t('payments.orderSummary')}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                            {orderItems.length} {orderItems.length === 1 ? t('payments.service') : t('payments.services')}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: 'white',
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {CurrencyUtils.formatAmount(calculateTotal())}
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                          <Box sx={{
                            maxHeight: 140,
                            overflow: 'auto',
                            pr: 1,
                            border: '1px solid',
                            borderColor: alpha('#10B981', 0.1),
                            borderRadius: 2,
                            p: 2,
                            background: alpha('#10B981', 0.02)
                          }}>
                            {orderItems.map((item, index) => (
                              <Box
                                key={index}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                py={1.5}
                                sx={{
                                  borderBottom: index < orderItems.length - 1 ? '1px solid' : 'none',
                                  borderColor: alpha('#10B981', 0.1)
                                }}
                              >
                                <Box flex={1}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {item.quantity}x {item.serviceName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {CurrencyUtils.formatAmount(item.price)} each
                                  </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#10B981' }}>
                                  {CurrencyUtils.formatAmount(item.price * item.quantity)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Box sx={{
                            p: 3,
                            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                            borderRadius: 3,
                            border: '2px solid',
                            borderColor: alpha('#10B981', 0.2),
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                          }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                {t('payments.subtotal')}:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {CurrencyUtils.formatAmount(calculateSubtotal())}
                              </Typography>
                            </Box>
                            {(() => {
                              const subtotal = calculateSubtotal();
                              const taxResult = calculateTax(subtotal);
                              return (
                                <>
                                  {taxResult.gstAmount > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                      <Typography variant="body2" color="text.secondary">
                                        GST/HST ({((taxResult.gstAmount / subtotal) * 100).toFixed(1)}%):
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {CurrencyUtils.formatAmount(taxResult.gstAmount)}
                                      </Typography>
                                    </Box>
                                  )}
                                  {taxResult.pstAmount > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                      <Typography variant="body2" color="text.secondary">
                                        PST ({((taxResult.pstAmount / subtotal) * 100).toFixed(1)}%):
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {CurrencyUtils.formatAmount(taxResult.pstAmount)}
                                      </Typography>
                                    </Box>
                                  )}
                                  {taxResult.totalTax > 0 && (
                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('payments.totalTax')}:
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {CurrencyUtils.formatAmount(taxResult.totalTax)}
                                      </Typography>
                                    </Box>
                                  )}
                                </>
                              );
                            })()}
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              pt={2}
                              mt={2}
                              sx={{
                                borderTop: '2px solid',
                                borderColor: '#10B981'
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>
                                {t('payments.total')}:
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>
                                {CurrencyUtils.formatAmount(calculateTotal())}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {paymentStatus === 'processing' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body1">
                {paymentMethod === 'cash' ? t('payments.processingCashPayment') : t('payments.waitingCardPayment')}
              </Typography>
              {paymentMethod !== 'cash' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('payments.completePOSPayment')}
                </Typography>
              )}
            </Box>
          )}

          {paymentStatus === 'success' && (
            <Box display="flex" flexDirection="column" alignItems="center" py={3}>
              <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {t('payments.paymentCompletedSuccessfully')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('payments.orderNumber')}: #{orderResult?.orderNumber || 'N/A'}
              </Typography>
            </Box>
          )}

          {paymentStatus === 'failed' && (
            <Box>
              <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t('payments.paymentFailed')}
                </Typography>
              </Box>
              <Alert severity="error">
                {paymentError || t('payments.unknownError')}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            background: alpha('#F8FAFC', 0.5),
            borderTop: '1px solid',
            borderColor: alpha('#E2E8F0', 0.5),
            gap: 2,
            justifyContent: 'flex-end'
          }}
        >
          {paymentStatus === 'idle' && (
            <>
              <Button
                onClick={() => setPaymentDialog(false)}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  borderColor: alpha('#6B7280', 0.3),
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#6B7280',
                    backgroundColor: alpha('#6B7280', 0.05),
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleProcessPayment}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  backgroundColor: '#10B981',
                  fontWeight: 500,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
                  },
                }}
              >
                <PaymentIcon sx={{ mr: 1, fontSize: 18 }} />
                {t('payments.confirmPayment')}
              </Button>
            </>
          )}

          {paymentStatus === 'success' && (
            <Button
              variant="contained"
              onClick={handleNewOrder}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                backgroundColor: '#10B981',
                fontWeight: 500,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  backgroundColor: '#059669',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                },
              }}
            >
              <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
              {t('payments.complete')}
            </Button>
          )}

          {paymentStatus === 'failed' && (
            <>
              <Button
                onClick={() => setPaymentDialog(false)}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  borderColor: alpha('#6B7280', 0.3),
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#6B7280',
                    backgroundColor: alpha('#6B7280', 0.05),
                  },
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleProcessPayment}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  backgroundColor: '#EF4444',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  '&:hover': {
                    backgroundColor: '#DC2626',
                    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                  },
                }}
              >
                <PaymentIcon sx={{ mr: 1, fontSize: 18 }} />
                {t('payments.retryPayment')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentProcess;