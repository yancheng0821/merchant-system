import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 应用设置状态接口
interface AppState {
  // 当前语言
  language: 'zh' | 'en';
  // 主题模式
  theme: 'light' | 'dark';
  // 首次使用标记
  isFirstTime: boolean;
  // 推送通知设置
  notificationsEnabled: boolean;
  // 位置权限状态
  locationPermissionGranted: boolean;
}

interface AppActions {
  // 切换语言
  setLanguage: (language: 'zh' | 'en') => void;
  // 切换主题
  setTheme: (theme: 'light' | 'dark') => void;
  // 设置首次使用完成
  setFirstTimeComplete: () => void;
  // 设置通知权限
  setNotificationsEnabled: (enabled: boolean) => void;
  // 设置位置权限
  setLocationPermission: (granted: boolean) => void;
  // 重置应用设置
  resetAppSettings: () => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      language: 'zh', // 默认中文
      theme: 'light', // 默认浅色主题
      isFirstTime: true,
      notificationsEnabled: true,
      locationPermissionGranted: false,

      // Actions
      setLanguage: (language: 'zh' | 'en') => {
        set({language});
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({theme});
      },

      setFirstTimeComplete: () => {
        set({isFirstTime: false});
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({notificationsEnabled: enabled});
      },

      setLocationPermission: (granted: boolean) => {
        set({locationPermissionGranted: granted});
      },

      resetAppSettings: () => {
        set({
          language: 'zh',
          theme: 'light',
          isFirstTime: true,
          notificationsEnabled: true,
          locationPermissionGranted: false,
        });
      },
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);