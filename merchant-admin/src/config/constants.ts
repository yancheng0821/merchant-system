// 系统常量配置
export const SYSTEM_CONFIG = {
  // 时区配置
  TIMEZONE: {
    // 系统默认时区 - 温哥华时间
    DEFAULT: 'America/Vancouver',
    // 时区显示名称
    DISPLAY_NAME: 'Vancouver Time (PST/PDT)',
  },
  
  // 货币配置
  CURRENCY: {
    // 货币符号
    SYMBOL: '$',
    // 货币代码
    CODE: 'CAD', // 加拿大元，与美元符号相同
    // 货币显示名称
    DISPLAY_NAME: 'Canadian Dollar',
    // 小数位数
    DECIMAL_PLACES: 2,
  },
  
  // 日期时间格式配置
  DATE_FORMAT: {
    // 日期格式
    DATE: 'YYYY-MM-DD',
    // 时间格式
    TIME: 'HH:mm',
    // 日期时间格式
    DATETIME: 'YYYY-MM-DD HH:mm',
    // 显示格式
    DISPLAY_DATE: 'MMM DD, YYYY',
    DISPLAY_TIME: 'h:mm A',
    DISPLAY_DATETIME: 'MMM DD, YYYY h:mm A',
  },
} as const;

// 时区工具函数
export const TimeZoneUtils = {
  /**
   * 获取当前温哥华时间
   */
  getCurrentVancouverTime: (): Date => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: SYSTEM_CONFIG.TIMEZONE.DEFAULT }));
  },

  /**
   * 将UTC时间转换为温哥华时间
   */
  convertToVancouverTime: (utcDate: string | Date): Date => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return new Date(date.toLocaleString("en-US", { timeZone: SYSTEM_CONFIG.TIMEZONE.DEFAULT }));
  },

  /**
   * 格式化日期为温哥华时区
   */
  formatVancouverDate: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: SYSTEM_CONFIG.TIMEZONE.DEFAULT,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    return dateObj.toLocaleDateString('en-CA', { ...defaultOptions, ...options });
  },

  /**
   * 格式化时间为温哥华时区
   */
  formatVancouverTime: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: SYSTEM_CONFIG.TIMEZONE.DEFAULT,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return dateObj.toLocaleTimeString('en-CA', { ...defaultOptions, ...options });
  },

  /**
   * 格式化日期时间为温哥华时区
   */
  formatVancouverDateTime: (date: string | Date): { date: string; time: string } => {
    return {
      date: TimeZoneUtils.formatVancouverDate(date),
      time: TimeZoneUtils.formatVancouverTime(date),
    };
  },

  /**
   * 获取今天的日期字符串（温哥华时区）
   */
  getTodayVancouverDateString: (): string => {
    return TimeZoneUtils.formatVancouverDate(new Date());
  },
};

// 货币工具函数
export const CurrencyUtils = {
  /**
   * 格式化金额显示
   */
  formatAmount: (amount: number, showSymbol: boolean = true): string => {
    const formatted = amount.toFixed(SYSTEM_CONFIG.CURRENCY.DECIMAL_PLACES);
    return showSymbol ? `${SYSTEM_CONFIG.CURRENCY.SYMBOL}${formatted}` : formatted;
  },

  /**
   * 格式化金额显示（带千分位分隔符）
   */
  formatAmountWithCommas: (amount: number, showSymbol: boolean = true): string => {
    const formatted = amount.toLocaleString('en-CA', {
      minimumFractionDigits: SYSTEM_CONFIG.CURRENCY.DECIMAL_PLACES,
      maximumFractionDigits: SYSTEM_CONFIG.CURRENCY.DECIMAL_PLACES,
    });
    return showSymbol ? `${SYSTEM_CONFIG.CURRENCY.SYMBOL}${formatted}` : formatted;
  },

  /**
   * 获取货币符号
   */
  getSymbol: (): string => {
    return SYSTEM_CONFIG.CURRENCY.SYMBOL;
  },

  /**
   * 获取货币代码
   */
  getCode: (): string => {
    return SYSTEM_CONFIG.CURRENCY.CODE;
  },
};