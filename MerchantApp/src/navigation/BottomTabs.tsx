import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Badge} from 'react-native-paper';
import {View, StyleSheet, Platform} from 'react-native';
import {designTokens} from '../theme/theme';

// 导入堆栈导航
import HomeStack from './HomeStack';
import CategoriesStack from './CategoriesStack';
import CartStack from './CartStack';
import ProfileStack from './ProfileStack';

// 导入类型和状态
import type {MainTabParamList} from './types';
import {useCartStore} from '../store';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * 底部Tab导航组件
 */
const BottomTabs: React.FC = () => {
  const {t} = useTranslation();
  const {totalCount} = useCartStore();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home';
              break;
            case 'Categories':
              iconName = focused ? 'grid-view' : 'grid-view';
              break;
            case 'Cart':
              iconName = focused ? 'shopping-cart' : 'shopping-cart';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person';
              break;
            default:
              iconName = 'help';
          }

          // 购物车图标需要显示徽章
          if (route.name === 'Cart' && totalCount > 0) {
            return (
              <View style={styles.iconContainer}>
                <View style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive
                ]}>
                  <Icon name={iconName} size={size * 0.9} color={color} />
                </View>
                <Badge
                  visible={totalCount > 0}
                  size={16}
                  style={styles.badge}>
                  {totalCount > 99 ? '99+' : totalCount}
                </Badge>
              </View>
            );
          }

          return (
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconWrapper,
                focused && styles.iconWrapperActive
              ]}>
                <Icon name={iconName} size={size * 0.9} color={color} />
              </View>
            </View>
          );
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          paddingTop: Platform.OS === 'ios' ? designTokens.spacing.sm : designTokens.spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? designTokens.spacing.xl : designTokens.spacing.lg,
          height: Platform.OS === 'ios' ? 88 : 70,
          ...designTokens.shadows.large,
        },
        tabBarLabelStyle: {
          fontSize: designTokens.fontSize.xs,
          fontWeight: designTokens.fontWeight.semiBold,
          marginTop: designTokens.spacing.xs,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingTop: designTokens.spacing.sm,
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: t('navigation.home'),
          tabBarLabel: t('navigation.home'),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStack}
        options={{
          title: t('navigation.categories'),
          tabBarLabel: t('navigation.categories'),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartStack}
        options={{
          title: t('navigation.cart'),
          tabBarLabel: t('navigation.cart'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: t('navigation.profile'),
          tabBarLabel: t('navigation.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
  },
});

export default BottomTabs;