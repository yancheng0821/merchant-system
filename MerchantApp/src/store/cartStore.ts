import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CartState, CartItem} from './types';

interface CartActions {
  // 添加商品到购物车
  addItem: (item: CartItem) => void;
  // 移除购物车商品
  removeItem: (itemId: string) => void;
  // 更新商品数量
  updateQuantity: (itemId: string, quantity: number) => void;
  // 清空购物车
  clearCart: () => void;
  // 计算总数和总金额
  calculateTotals: () => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      items: [],
      totalCount: 0,
      totalAmount: 0,

      // Actions
      addItem: (newItem: CartItem) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(item => item.id === newItem.id);

        let updatedItems: CartItem[];
        if (existingItemIndex >= 0) {
          // 如果商品已存在，更新数量
          updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? {...item, quantity: item.quantity + newItem.quantity}
              : item,
          );
        } else {
          // 如果是新商品，直接添加
          updatedItems = [...items, newItem];
        }

        set({items: updatedItems});
        get().calculateTotals();
      },

      removeItem: (itemId: string) => {
        const items = get().items;
        const updatedItems = items.filter(item => item.id !== itemId);
        set({items: updatedItems});
        get().calculateTotals();
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const items = get().items;
        const updatedItems = items.map(item =>
          item.id === itemId ? {...item, quantity} : item,
        );
        set({items: updatedItems});
        get().calculateTotals();
      },

      clearCart: () => {
        set({
          items: [],
          totalCount: 0,
          totalAmount: 0,
        });
      },

      calculateTotals: () => {
        const items = get().items;
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        set({totalCount, totalAmount});
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);