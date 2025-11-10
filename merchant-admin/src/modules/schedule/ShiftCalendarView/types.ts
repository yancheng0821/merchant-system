/**
 * Schedule Module Type Definitions
 * 排班管理模块类型定义
 */

export interface ResourceShift {
  id: number;
  tenantId: number;
  resourceId: number;
  shiftName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  allowOnlineBooking: boolean;
  maxAppointments?: number;
  notes?: string;
  createdBy?: number;
}

export interface AppointmentService {
  serviceId: number;
  serviceName: string;
  price: number;
  duration?: number;
}

export interface Appointment {
  id: number;
  resourceId: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceId?: number; // 第一个服务ID（向后兼容）
  serviceIds?: number[]; // 所有服务ID数组（多服务支持）
  serviceName: string; // 服务名称（多个服务用逗号分隔）
  serviceDetails?: string;
  services?: AppointmentService[]; // 服务详情数组（包含价格）
  startTime: string;
  endTime: string;
  date: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  price: number;
  notes?: string;
  isNewPatient?: boolean;
  paid?: boolean;
  paidTime?: string;
  paymentMethod?: string;
}

export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  color: string;
  icon: string;
  staffIds: number[];
}

export interface ShiftCalendarViewProps {
  shifts: ResourceShift[];
  weekStart: Date;
  onEditShift: (shift: ResourceShift) => void;
  onDeleteShift: (shiftId: number) => void;
  onAddShift: () => void;
  loading: boolean;
}

// 预约布局信息
export interface AppointmentLayout extends Appointment {
  column: number;
  totalColumns: number;
}

// Snackbar 提示信息
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 预约对话框数据
export interface AppointmentDialogData {
  date: Date;
  startTime: string;
  endTime: string;
  resourceId: number;
  resourceName?: string;
}

// 视图模式
export type ViewMode = 'day' | 'week';

// 预约状态
export type AppointmentStatus = 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

// 班次状态
export type ShiftStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
