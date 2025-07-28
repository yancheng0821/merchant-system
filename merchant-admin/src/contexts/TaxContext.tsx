import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { merchantConfigApi } from '../services/api';

interface TaxSettings {
  gstRate: number;
  pstRate: number;
}

interface TaxContextType {
  taxSettings: TaxSettings;
  loading: boolean;
  refreshTaxSettings: () => Promise<void>;
  calculateTax: (amount: number) => {
    gstAmount: number;
    pstAmount: number;
    totalTax: number;
    totalWithTax: number;
  };
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const useTax = () => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    throw new Error('useTax must be used within a TaxProvider');
  }
  return context;
};

interface TaxProviderProps {
  children: ReactNode;
}

export const TaxProvider: React.FC<TaxProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    gstRate: 13,
    pstRate: 0
  });
  const [loading, setLoading] = useState(false);

  const refreshTaxSettings = async () => {
    if (!user?.tenantId) return;
    
    setLoading(true);
    try {
      const configResponse = await merchantConfigApi.getAllConfigs(user.tenantId);
      if (configResponse) {
        const gstConfig = configResponse.find((config: any) => config.configKey === 'gst_rate');
        const pstConfig = configResponse.find((config: any) => config.configKey === 'pst_rate');
        
        setTaxSettings({
          gstRate: gstConfig ? parseFloat(gstConfig.configValue) : 13,
          pstRate: pstConfig ? parseFloat(pstConfig.configValue) : 0
        });
      }
    } catch (error) {
      console.error('获取税务设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = (amount: number) => {
    const gstAmount = (amount * taxSettings.gstRate) / 100;
    const pstAmount = (amount * taxSettings.pstRate) / 100;
    const totalTax = gstAmount + pstAmount;
    const totalWithTax = amount + totalTax;

    return {
      gstAmount: Math.round(gstAmount * 100) / 100,
      pstAmount: Math.round(pstAmount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalWithTax: Math.round(totalWithTax * 100) / 100
    };
  };

  useEffect(() => {
    refreshTaxSettings();
  }, [user?.tenantId]);

  const value: TaxContextType = {
    taxSettings,
    loading,
    refreshTaxSettings,
    calculateTax
  };

  return (
    <TaxContext.Provider value={value}>
      {children}
    </TaxContext.Provider>
  );
};