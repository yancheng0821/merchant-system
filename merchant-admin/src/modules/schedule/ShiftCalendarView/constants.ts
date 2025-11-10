/**
 * Schedule Module Constants
 * 排班管理模块常量定义
 */

// 系统主题颜色 - 与 Resource Management 一致
export const THEME_COLOR = '#3B82F6';

// Jane App 配色方案 - 原始配色
export const JANE_COLORS = {
  primary: '#5EBFB3',
  green: '#7BC68C',
  lightGreen: '#A8D5BA',
  blue: '#7FC3D8',
  lightBlue: '#B3E0EC',
  yellow: '#F5D76E',
  orange: '#FFB84D',
  pink: '#E8A4C0',
  purple: '#B7A4D5',
  gray: '#C5CDD1',
} as const;

// 状态颜色映射
export const STATUS_COLORS = {
  CONFIRMED: JANE_COLORS.green,
  CHECKED_IN: '#FF9800', // 橙色 - 已签到
  COMPLETED: JANE_COLORS.lightGreen,
  CANCELLED: JANE_COLORS.gray,
  NO_SHOW: JANE_COLORS.gray,
} as const;

// 日历时间配置
export const CALENDAR_CONFIG = {
  // 工作时间范围：早上10点到晚上10点
  START_HOUR: 10,
  END_HOUR: 22,

  // 每小时的像素高度 - 设置为200px，适合30分钟起步的服务
  HOUR_HEIGHT: 200,

  // 最小预约时长（分钟）
  MIN_APPOINTMENT_DURATION: 30,

  // 默认预约时长（分钟）
  DEFAULT_APPOINTMENT_DURATION: 60,

  // 预约之间的缓冲时间（分钟）
  BUFFER_MINUTES: 15,

  // 时间槽间隔（分钟）
  TIME_SLOT_INTERVAL: 15,
} as const;

// 生成时间槽 - 从早上10点到晚上10点
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = CALENDAR_CONFIG.START_HOUR; hour <= CALENDAR_CONFIG.END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

// 时间槽列表
export const TIME_SLOTS = generateTimeSlots();

// 预约状态标签（国际化 key）
export const APPOINTMENT_STATUS_LABELS = {
  CONFIRMED: 'appointments.confirmed',
  CHECKED_IN: 'appointments.checkedIn',
  COMPLETED: 'appointments.completed',
  CANCELLED: 'appointments.cancelled',
  NO_SHOW: 'appointments.noShow',
} as const;

// 班次状态标签（国际化 key）
export const SHIFT_STATUS_LABELS = {
  SCHEDULED: 'shifts.scheduled',
  COMPLETED: 'shifts.completed',
  CANCELLED: 'shifts.cancelled',
} as const;
