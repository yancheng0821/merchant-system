/**
 * 前端时区工具函数
 * 用于处理 UTC 时间与商户本地时间的转换
 * 以及根据时区获取货币单位
 */

import { format, parseISO, formatISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

/**
 * 货币配置接口
 */
export interface CurrencyConfig {
  code: string;      // 货币代码 (USD, CAD, EUR, etc.)
  symbol: string;    // 货币符号 ($, €, £, ¥, etc.)
  name: string;      // 货币名称
  position: 'before' | 'after';  // 符号位置（金额前或后）
  decimals: number;  // 小数位数
}

/**
 * 支持的货币配置
 */
const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before', decimals: 2 },
  CAD: { code: 'CAD', symbol: '$', name: 'Canadian Dollar', position: 'before', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'before', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before', decimals: 2 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before', decimals: 0 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', position: 'before', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before', decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', position: 'before', decimals: 2 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', position: 'before', decimals: 2 },
};

/**
 * 时区到货币的映射
 * 只支持主流发达国家和中国，其他国家默认使用 USD
 */
const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  // 美国时区 -> USD
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'Pacific/Honolulu': 'USD',

  // 加拿大时区 -> CAD
  'America/Vancouver': 'CAD',
  'America/Edmonton': 'CAD',
  'America/Winnipeg': 'CAD',
  'America/Toronto': 'CAD',
  'America/Halifax': 'CAD',
  'America/St_Johns': 'CAD',
  'America/Regina': 'CAD',
  'America/Montreal': 'CAD',

  // 英国时区 -> GBP
  'Europe/London': 'GBP',

  // 欧元区时区 -> EUR
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Athens': 'EUR',

  // 瑞士时区 -> CHF
  'Europe/Zurich': 'CHF',

  // 日本时区 -> JPY
  'Asia/Tokyo': 'JPY',

  // 中国时区 -> CNY
  'Asia/Shanghai': 'CNY',
  'Asia/Chongqing': 'CNY',
  'Asia/Harbin': 'CNY',
  'Asia/Urumqi': 'CNY',

  // 香港时区 -> HKD
  'Asia/Hong_Kong': 'HKD',

  // 新加坡时区 -> SGD
  'Asia/Singapore': 'SGD',

  // 韩国时区 -> KRW
  'Asia/Seoul': 'KRW',

  // 澳大利亚时区 -> AUD
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
  'Australia/Adelaide': 'AUD',
  'Australia/Hobart': 'AUD',
  'Australia/Darwin': 'AUD',

  // 新西兰时区 -> NZD
  'Pacific/Auckland': 'NZD',
  'Pacific/Chatham': 'NZD',
};

/**
 * 根据时区获取货币代码
 * @param timezone - 时区字符串，如果不提供则使用商户时区
 * @returns 货币代码 (USD, CAD, EUR, etc.)
 */
export const getCurrencyCode = (timezone?: string): string => {
  const tz = timezone || getMerchantTimezone();
  return TIMEZONE_TO_CURRENCY[tz] || 'USD';
};

/**
 * 根据时区获取货币配置
 * @param timezone - 时区字符串
 * @returns 货币配置对象
 */
export const getCurrencyConfig = (timezone?: string): CurrencyConfig => {
  const code = getCurrencyCode(timezone);
  return CURRENCY_CONFIGS[code] || CURRENCY_CONFIGS.USD;
};

/**
 * 获取货币符号
 * @param timezone - 时区字符串
 * @returns 货币符号 ($, €, £, ¥, etc.)
 */
export const getCurrencySymbol = (timezone?: string): string => {
  return getCurrencyConfig(timezone).symbol;
};

/**
 * 格式化金额显示
 * @param amount - 金额数值
 * @param timezone - 时区字符串
 * @param showCode - 是否显示货币代码 (如 USD, CAD)
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  timezone?: string,
  showCode: boolean = false
): string => {
  if (amount === null || amount === undefined || amount === '') return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '';

  const config = getCurrencyConfig(timezone);
  const formattedNumber = numAmount.toFixed(config.decimals);

  let result: string;
  if (config.position === 'before') {
    result = `${config.symbol}${formattedNumber}`;
  } else {
    result = `${formattedNumber}${config.symbol}`;
  }

  if (showCode) {
    result = `${result} ${config.code}`;
  }

  return result;
};

/**
 * 获取商户货币符号（简便方法）
 * 直接返回当前商户的货币符号
 */
export const getMerchantCurrencySymbol = (): string => {
  return getCurrencySymbol();
};

/**
 * 格式化商户金额（简便方法）
 * 使用当前商户的货币配置格式化金额
 */
export const formatMerchantCurrency = (amount: number | string | null | undefined): string => {
  return formatCurrency(amount);
};

/**
 * 获取商户时区
 * 从 localStorage 或默认配置获取
 */
export const getMerchantTimezone = (): string => {
  // 从用户信息中获取时区
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.timezone) {
        return user.timezone;
      }
    } catch (e) {
      console.error('Failed to parse user info:', e);
    }
  }

  // 默认使用温哥华时区
  return 'America/Vancouver';
};

/**
 * 将 UTC 时间字符串转换为商户本地时间
 * @param utcTimeString - UTC 时间字符串 (ISO 8601 格式)
 * @param timezone - 商户时区，如果不提供则使用默认时区
 * @returns Date 对象（商户本地时间）
 */
export const utcToMerchantTime = (
  utcTimeString: string | null | undefined,
  timezone?: string
): Date | null => {
  if (!utcTimeString) return null;

  try {
    const tz = timezone || getMerchantTimezone();

    // 如果时间字符串没有时区信息（没有Z或+/-），手动添加Z表示UTC时间
    let timeStr = utcTimeString.trim();

    // 检查是否已经有时区信息
    const hasTimezone = timeStr.endsWith('Z') ||
                       timeStr.includes('+') ||
                       timeStr.match(/[+-]\d{2}:\d{2}$/);

    if (!hasTimezone) {
      // 没有时区信息，需要添加Z表示UTC时间
      if (!timeStr.includes('T')) {
        // 格式：YYYY-MM-DD HH:mm:ss -> YYYY-MM-DDTHH:mm:ssZ
        timeStr = timeStr.replace(' ', 'T') + 'Z';
      } else {
        // 格式：YYYY-MM-DDTHH:mm:ss -> YYYY-MM-DDTHH:mm:ssZ
        timeStr = timeStr + 'Z';
      }
    }

    const utcDate = parseISO(timeStr);
    return utcToZonedTime(utcDate, tz);
  } catch (e) {
    console.error('Failed to convert UTC to merchant time:', e);
    return null;
  }
};

/**
 * 将商户本地时间转换为 UTC 时间字符串
 * @param localTime - 商户本地时间 (Date 对象或字符串)
 * @param timezone - 商户时区，如果不提供则使用默认时区
 * @returns UTC 时间字符串 (ISO 8601 格式)
 */
export const merchantTimeToUtc = (
  localTime: Date | string,
  timezone?: string
): string => {
  const tz = timezone || getMerchantTimezone();
  const date = typeof localTime === 'string' ? parseISO(localTime) : localTime;
  const utcDate = zonedTimeToUtc(date, tz);
  return formatISO(utcDate);
};

/**
 * 格式化 UTC 时间为商户本地时间字符串
 * @param utcTimeString - UTC 时间字符串
 * @param formatString - 格式字符串 (date-fns 格式)
 * @param timezone - 商户时区
 * @returns 格式化后的本地时间字符串
 */
export const formatUtcToMerchantTime = (
  utcTimeString: string | null | undefined,
  formatString: string = 'yyyy-MM-dd HH:mm:ss',
  timezone?: string
): string => {
  const localTime = utcToMerchantTime(utcTimeString, timezone);
  if (!localTime) return '';

  return format(localTime, formatString);
};

/**
 * 获取商户当前时间
 * @param timezone - 商户时区
 * @returns 商户当前时间 (Date 对象)
 */
export const getMerchantNow = (timezone?: string): Date => {
  const tz = timezone || getMerchantTimezone();
  return utcToZonedTime(new Date(), tz);
};

/**
 * 获取商户今天的日期（YYYY-MM-DD 格式）
 * @param timezone - 商户时区
 * @returns 今天的日期字符串
 */
export const getMerchantToday = (timezone?: string): string => {
  const now = getMerchantNow(timezone);
  return format(now, 'yyyy-MM-dd');
};

/**
 * 判断 UTC 时间是否为今天（基于商户时区）
 * @param utcTimeString - UTC 时间字符串
 * @param timezone - 商户时区
 * @returns 是否为今天
 */
export const isToday = (
  utcTimeString: string | null | undefined,
  timezone?: string
): boolean => {
  const localTime = utcToMerchantTime(utcTimeString, timezone);
  if (!localTime) return false;

  const today = getMerchantToday(timezone);
  const dateStr = format(localTime, 'yyyy-MM-dd');
  return dateStr === today;
};

/**
 * 格式化日期时间显示
 * 如果是今天，显示"今天 HH:mm"
 * 如果是昨天，显示"昨天 HH:mm"
 * 否则显示完整日期时间
 */
export const formatDateTimeDisplay = (
  utcTimeString: string | null | undefined,
  timezone?: string
): string => {
  const localTime = utcToMerchantTime(utcTimeString, timezone);
  if (!localTime) return '';

  const today = getMerchantToday(timezone);
  const dateStr = format(localTime, 'yyyy-MM-dd');
  const timeStr = format(localTime, 'HH:mm');

  if (dateStr === today) {
    return `今天 ${timeStr}`;
  }

  const yesterday = format(
    new Date(getMerchantNow(timezone).getTime() - 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  );

  if (dateStr === yesterday) {
    return `昨天 ${timeStr}`;
  }

  return format(localTime, 'yyyy-MM-dd HH:mm');
};

/**
 * 兼容性处理：检测时间字符串是否为 UTC 格式
 * 历史数据可能是温哥华时间，新数据是 UTC 时间
 * @param timeString - 时间字符串
 * @returns 是否为 UTC 格式（带 Z 后缀或 +00:00）
 */
export const isUtcFormat = (timeString: string | null | undefined): boolean => {
  if (!timeString) return false;
  return timeString.endsWith('Z') || timeString.includes('+00:00');
};

/**
 * 智能格式化时间（兼容历史数据）
 * 如果是 UTC 格式，进行时区转换
 * 如果不是，假设为本地时间，直接格式化
 */
export const smartFormatDateTime = (
  timeString: string | null | undefined,
  formatString: string = 'yyyy-MM-dd HH:mm:ss',
  timezone?: string
): string => {
  if (!timeString) return '';

  try {
    if (isUtcFormat(timeString)) {
      // UTC 时间，需要转换
      return formatUtcToMerchantTime(timeString, formatString, timezone);
    } else {
      // 历史数据，已经是本地时间
      const date = parseISO(timeString);
      return format(date, formatString);
    }
  } catch (e) {
    console.error('Failed to format date time:', e);
    return '';
  }
};
