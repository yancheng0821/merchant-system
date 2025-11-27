/**
 * 货币 Hook
 * 用于在 React 组件中获取当前商户的货币配置
 */

import { useMemo } from 'react';
import {
  getCurrencySymbol,
  getCurrencyConfig,
  getCurrencyCode,
  formatCurrency,
  CurrencyConfig,
} from '../utils/timezoneUtils';

interface UseCurrencyReturn {
  /** 货币符号 ($, €, £, ¥, etc.) */
  symbol: string;
  /** 货币代码 (USD, CAD, EUR, etc.) */
  code: string;
  /** 完整货币配置 */
  config: CurrencyConfig;
  /** 格式化金额 */
  format: (amount: number | string | null | undefined, showCode?: boolean) => string;
}

/**
 * 获取当前商户的货币配置
 * @returns 货币配置和格式化函数
 *
 * @example
 * const { symbol, format } = useCurrency();
 * // symbol = 'C$' (加拿大商户)
 * // format(100) = 'C$100.00'
 */
export const useCurrency = (): UseCurrencyReturn => {
  const config = useMemo(() => getCurrencyConfig(), []);
  const symbol = useMemo(() => getCurrencySymbol(), []);
  const code = useMemo(() => getCurrencyCode(), []);

  const formatAmount = useMemo(() => {
    return (amount: number | string | null | undefined, showCode: boolean = false) => {
      return formatCurrency(amount, undefined, showCode);
    };
  }, []);

  return {
    symbol,
    code,
    config,
    format: formatAmount,
  };
};

export default useCurrency;
