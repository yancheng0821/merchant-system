import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {StackScreenProps} from '@react-navigation/stack';

// 主堆栈导航参数
export type RootStackParamList = {
  // 认证相关
  AuthStack: undefined;
  
  // 主应用
  MainTabs: undefined;
  
  // 其他页面（不在底部导航中）
  ServiceDetail: {
    serviceId: string;
  };
  MerchantDetail: {
    merchantId: string;
  };
  OrderDetail: {
    orderId: string;
  };
  Checkout: {
    items?: any[]; // 结算商品列表
  };
  MapView: {
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    merchants?: any[];
  };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  OrderHistory: undefined;
  Search: {
    initialQuery?: string;
    categoryId?: string;
  };
  Notifications: undefined;
  Help: undefined;
  About: undefined;
};

// 认证堆栈导航参数
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyReset: {
    email: string;
  };
};

// 底部Tab导航参数
export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Profile: undefined;
};

// 主页堆栈导航参数
export type HomeStackParamList = {
  HomeMain: undefined;
  ServiceDetail: {
    serviceId: string;
  };
  MerchantDetail: {
    merchantId: string;
  };
  Search: {
    initialQuery?: string;
    categoryId?: string;
  };
};

// 分类堆栈导航参数
export type CategoriesStackParamList = {
  CategoriesMain: undefined;
  CategoryDetail: {
    categoryId: string;
    categoryName: string;
  };
  ServiceDetail: {
    serviceId: string;
  };
};

// 购物车堆栈导航参数
export type CartStackParamList = {
  CartMain: undefined;
  Checkout: {
    items?: any[];
  };
  OrderDetail: {
    orderId: string;
  };
};

// 个人中心堆栈导航参数
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  OrderHistory: undefined;
  OrderDetail: {
    orderId: string;
  };
  ChangePassword: undefined;
  Notifications: undefined;
  Help: undefined;
  About: undefined;
};

// 屏幕props类型定义
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    StackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<'Home'>
  >;

export type CategoriesStackScreenProps<T extends keyof CategoriesStackParamList> =
  CompositeScreenProps<
    StackScreenProps<CategoriesStackParamList, T>,
    MainTabScreenProps<'Categories'>
  >;

export type CartStackScreenProps<T extends keyof CartStackParamList> =
  CompositeScreenProps<
    StackScreenProps<CartStackParamList, T>,
    MainTabScreenProps<'Cart'>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'Profile'>
  >;

// 声明全局导航类型（用于useNavigation hook）
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}