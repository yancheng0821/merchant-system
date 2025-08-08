import {MD3LightTheme, configureFonts} from 'react-native-paper';

/**
 * 应用主题配置
 * 基于 Material Design 3
 */

// 字体配置
const fontConfig = {
  default: {
    fontFamily: 'System',
  },
};

// 自定义颜色主题 - 现代浅色系配色
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({config: fontConfig}),
  colors: {
    ...MD3LightTheme.colors,
    // 主色调 - 靛蓝色（来自你的后端配色）
    primary: '#6366F1', // 靛蓝色，统一各模块主色
    primaryContainer: '#eef2ff', // 靛蓝色容器
    // 次要色 - 粉色
    secondary: '#EC4899', // 粉色
    secondaryContainer: '#fdf2f8', // 粉色容器
    // 第三色 - 成功绿色
    tertiary: '#10B981', // 翠绿色
    tertiaryContainer: '#ecfdf5', // 绿色容器
    // 表面色彩 - 更纯净的白色系统
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9', // slate-100
    background: '#fafbfc', // 极淡的灰白色背景
    // 错误色彩
    error: '#EF4444', // 来自你的配色方案
    errorContainer: '#fef2f2', // 错误容器
    // 文字色彩 - 更好的对比度
    onPrimary: '#ffffff',
    onSecondary: '#ffffff', 
    onTertiary: '#ffffff',
    onSurface: '#0f172a', // slate-900
    onSurfaceVariant: '#475569', // slate-600
    onBackground: '#0f172a',
    onError: '#ffffff',
    onErrorContainer: '#991b1b', // red-800
    // 边框和分割线 - 更精细的层次
    outline: '#cbd5e1', // slate-300
    outlineVariant: '#e2e8f0', // slate-200
    // 阴影和遮罩
    shadow: '#000000',
    scrim: '#000000',
    // 反色
    inverseSurface: '#1e293b', // slate-800
    inverseOnSurface: '#f8fafc',
    inversePrimary: '#93c5fd', // blue-300
  },
  roundness: 20, // 更大的圆角，更现代
};

// 扩展的设计系统
export const designTokens = {
  // 间距系统 - 更精细的间距控制
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // 阴影系统 - 更丰富的阴影层次
  shadows: {
    none: {
      shadowOpacity: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 10,
    },
    colored: {
      shadowColor: '#6366f1',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  
  // 渐变色彩 - 基于你的浅色系配色方案
  gradients: {
    primary: ['#6366F1', '#8B5CF6'], // 靛蓝到紫色
    secondary: ['#EC4899', '#F59E0B'], // 粉色到橙色
    success: ['#10B981', '#0891B2'], // 翠绿到青蓝
    analytics: ['#0891B2', '#6366F1'], // 分析模块：青蓝到靛蓝
    ai: ['#6366F1', '#8B5CF6'], // AI 模块：靛蓝到紫色
    notification: ['#F97316', '#F59E0B'], // 通知模块：橙色渐变
    customer: ['#6366F1', '#EC4899'], // 客户模块：靛蓝到粉色
    appointment: ['#6366F1', '#10B981'], // 预约模块：靛蓝到绿色
    resource: ['#8B5CF6', '#EC4899'], // 资源模块：紫色到粉色
    payment: ['#F59E0B', '#EC4899'], // 支付模块：橙色到粉色
    order: ['#6366F1', '#0891B2'], // 订单模块：靛蓝到青蓝
    error: ['#EF4444', '#EC4899'], // 错误：红色到粉色
  },
  
  // 圆角系统
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  
  // 透明度系统
  opacity: {
    disabled: 0.4,
    hover: 0.8,
    pressed: 0.6,
    overlay: 0.5,
    background: 0.95,
  },
  
  // 字体权重
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  
  // 字体尺寸
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 40,
  },
  
  // 动画时间
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
};