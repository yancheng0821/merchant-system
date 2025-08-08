import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthState, User} from './types';

interface AuthActions {
  // 登录
  login: (token: string, user: User) => void;
  // 登出
  logout: () => void;
  // 更新用户信息
  updateUser: (user: Partial<User>) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 清除状态
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...userData,
            },
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({isLoading: loading});
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage', // 存储键名
      storage: createJSONStorage(() => AsyncStorage),
      // 持久化的字段（排除 isLoading）
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);