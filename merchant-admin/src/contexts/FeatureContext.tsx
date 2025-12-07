import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  subscriptionApi,
  TenantSubscription,
  PlanFeatures,
  parsePlanFeatures
} from '../services/api';

// 模块名称类型
export type ModuleName = keyof PlanFeatures['modules'];

// 功能名称类型
export type FeatureName = keyof PlanFeatures['features'];

// 限制名称类型
export type LimitName = keyof PlanFeatures['limits'];

interface FeatureContextType {
  // 订阅信息
  subscription: TenantSubscription | null;
  planFeatures: PlanFeatures | null;
  loading: boolean;

  // 检查方法
  hasModule: (module: ModuleName) => boolean;
  hasFeature: (feature: FeatureName) => boolean;
  getLimit: (limit: LimitName) => number;
  isUnlimited: (limit: LimitName) => boolean;

  // 计划信息
  planCode: string | null;
  isPro: boolean;
  isElite: boolean;

  // 刷新订阅信息
  refreshSubscription: () => Promise<void>;
}

// 默认功能配置（当没有订阅时使用，相当于BASIC）
const DEFAULT_FEATURES: PlanFeatures = {
  limits: {
    maxStaff: 1,
    maxAppointmentsPerMonth: 100,
    maxEmailsPerMonth: 300,
    maxSmsPerMonth: 0,
  },
  modules: {
    dashboard: true,
    appointments: true,
    schedule: true,
    customers: true,
    orders: true,
    products: true,
    resources: true,
    settings: true,
    notifications: true,
    marketing: false,
    analytics: false,
    costs: false,
    rbac: true,
  },
  features: {
    appLogin: false,
    onlineBooking: false,
    notificationTemplateEdit: false,
    customerImport: false,
    smsNotification: false,
    auditLog: false,
    removeBranding: false,
    futureFeatures: false,
  },
};

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeature = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeature must be used within a FeatureProvider');
  }
  return context;
};

interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }

    try {
      const response = await subscriptionApi.getActiveSubscription(user.tenantId);
      if (response.success && response.data) {
        setSubscription(response.data);

        // 解析 features JSON
        const features = parsePlanFeatures(response.data.plan?.features);
        setPlanFeatures(features || DEFAULT_FEATURES);
      } else {
        // 没有订阅，使用默认配置
        setPlanFeatures(DEFAULT_FEATURES);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setPlanFeatures(DEFAULT_FEATURES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setPlanFeatures(null);
      setLoading(false);
    }
  }, [user?.tenantId]);

  // 检查是否有某个模块的访问权限
  const hasModule = (module: ModuleName): boolean => {
    if (!planFeatures) return DEFAULT_FEATURES.modules[module] ?? false;
    return planFeatures.modules[module] ?? false;
  };

  // 检查是否有某个功能的访问权限
  const hasFeature = (feature: FeatureName): boolean => {
    if (!planFeatures) return DEFAULT_FEATURES.features[feature] ?? false;
    return planFeatures.features[feature] ?? false;
  };

  // 获取某个限制的值
  const getLimit = (limit: LimitName): number => {
    if (!planFeatures) return DEFAULT_FEATURES.limits[limit] ?? 0;
    return planFeatures.limits[limit] ?? 0;
  };

  // 检查某个限制是否无限制（-1表示无限）
  const isUnlimited = (limit: LimitName): boolean => {
    return getLimit(limit) === -1;
  };

  // 计划代码
  const planCode = subscription?.plan?.planCode || null;

  // 是否是 PRO 或更高
  const isPro = planCode === 'PRO' || planCode === 'ELITE';

  // 是否是 ELITE
  const isElite = planCode === 'ELITE';

  const value: FeatureContextType = {
    subscription,
    planFeatures,
    loading,
    hasModule,
    hasFeature,
    getLimit,
    isUnlimited,
    planCode,
    isPro,
    isElite,
    refreshSubscription: fetchSubscription,
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

// FeatureGuard 组件 - 用于保护受限功能
interface FeatureGuardProps {
  module?: ModuleName;
  feature?: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  module,
  feature,
  children,
  fallback = null,
}) => {
  const { hasModule, hasFeature, loading } = useFeature();

  if (loading) {
    return null;
  }

  // 检查模块权限
  if (module && !hasModule(module)) {
    return <>{fallback}</>;
  }

  // 检查功能权限
  if (feature && !hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default FeatureContext;
