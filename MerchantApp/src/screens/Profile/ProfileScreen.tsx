import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Badge,
  Switch,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAuthStore, useAppStore} from '../../store';
import {changeLanguage} from '../../i18n';
import type {ProfileStackScreenProps} from '../../navigation/types';
import {designTokens} from '../../theme/theme';

type Props = ProfileStackScreenProps<'ProfileMain'>;

const {width} = Dimensions.get('window');

const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {user, logout} = useAuthStore();
  const {language, setLanguage} = useAppStore();

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    setLanguage(newLanguage);
    changeLanguage(newLanguage);
  };

  const handleLogout = () => {
    logout();
  };

  // 用户统计数据
  const userStats = [
    {id: '1', label: '优惠券', value: '8', icon: 'local-offer', color: '#FF6B6B'},
    {id: '2', label: '积分', value: '1280', icon: 'stars', color: '#F97316'},
    {id: '3', label: '收藏', value: '23', icon: 'favorite', color: '#EC4899'},
    {id: '4', label: '足迹', value: '156', icon: 'history', color: '#6366F1'},
  ];

  // 订单状态
  const orderStatus = [
    {id: '1', label: '待付款', icon: 'payment', count: 2},
    {id: '2', label: '待使用', icon: 'schedule', count: 5},
    {id: '3', label: '待评价', icon: 'rate-review', count: 3},
    {id: '4', label: '售后', icon: 'autorenew', count: 0},
  ];

  // 菜单项配置
  const menuSections = [
    {
      title: '我的服务',
      items: [
        {id: '1', title: '全部订单', icon: 'receipt-long', badge: null, route: 'OrderHistory'},
        {id: '2', title: '我的预约', icon: 'event', badge: '3', route: 'Appointments'},
        {id: '3', title: '我的收藏', icon: 'favorite-border', badge: null, route: 'Favorites'},
        {id: '4', title: '浏览历史', icon: 'history', badge: null, route: 'BrowsingHistory'},
      ],
    },
    {
      title: '工具与服务',
      items: [
        {id: '5', title: '会员中心', icon: 'card-membership', badge: 'VIP', route: 'Membership'},
        {id: '6', title: '优惠券', icon: 'local-offer', badge: '8', route: 'Coupons'},
        {id: '7', title: '地址管理', icon: 'location-on', badge: null, route: 'AddressManagement'},
        {id: '8', title: '发票管理', icon: 'receipt', badge: null, route: 'InvoiceManagement'},
      ],
    },
    {
      title: '设置',
      items: [
        {id: '9', title: '账号设置', icon: 'manage-accounts', badge: null, route: 'Settings'},
        {id: '10', title: '通知设置', icon: 'notifications-none', badge: null, route: 'Notifications'},
        {id: '11', title: '隐私设置', icon: 'lock-outline', badge: null, route: 'Privacy'},
        {id: '12', title: '帮助与反馈', icon: 'help-outline', badge: null, route: 'Help'},
      ],
    },
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.route as any)}
      activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon name={item.icon} size={22} color="#6366F1" />
        </View>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <Badge style={styles.menuBadge}>{item.badge}</Badge>
        )}
        <Icon name="chevron-right" size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 用户信息头部 - 渐变背景 */}
      <View style={styles.headerWrapper}>
        <ImageBackground
          source={{uri: 'https://picsum.photos/800/400?random=400'}}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}>
          <View style={styles.headerOverlay} />
        
        <View style={styles.headerContent}>
          {/* 用户信息 */}
          <View style={styles.userSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.9}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.realName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.editIconContainer}>
                <Icon name="edit" size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.realName || user?.username || '用户'}
              </Text>
              <View style={styles.membershipBadge}>
                <Icon name="workspace-premium" size={14} color="#FFD700" />
                <Text style={styles.membershipText}>黄金会员</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.settingsButton}>
              <Icon name="settings" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 用户统计 */}
          <View style={styles.statsContainer}>
            {userStats.map((stat) => (
              <TouchableOpacity key={stat.id} style={styles.statItem} activeOpacity={0.7}>
                <View style={[styles.statIcon, {backgroundColor: `${stat.color}20`}]}>
                  <Icon name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </ImageBackground>
      </View>

      {/* 订单状态卡片 */}
      <Surface style={styles.orderCard} elevation={2}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>我的订单</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('OrderHistory')}>
            <Text style={styles.viewAllText}>查看全部</Text>
            <Icon name="arrow-forward" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.orderStatusContainer}>
          {orderStatus.map((status) => (
            <TouchableOpacity key={status.id} style={styles.orderStatusItem} activeOpacity={0.7}>
              <View style={styles.orderStatusIcon}>
                <Icon name={status.icon} size={24} color="#6366F1" />
                {status.count > 0 && (
                  <Badge style={styles.orderBadge}>{status.count}</Badge>
                )}
              </View>
              <Text style={styles.orderStatusLabel}>{status.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Surface>

      {/* 功能菜单 */}
      {menuSections.map((section) => (
        <Surface key={section.title} style={styles.menuSection} elevation={1}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map(renderMenuItem)}
        </Surface>
      ))}

      {/* 语言切换 */}
      <Surface style={styles.languageCard} elevation={1}>
        <View style={styles.languageItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Icon name="translate" size={22} color="#6366F1" />
            </View>
            <Text style={styles.menuItemTitle}>{t('profile.language')}</Text>
          </View>
          <View style={styles.languageSwitch}>
            <Text style={styles.languageText}>{language === 'zh' ? '中文' : 'EN'}</Text>
            <Switch
              value={language === 'en'}
              onValueChange={(value) => handleLanguageChange(value ? 'en' : 'zh')}
              color="#6366F1"
            />
          </View>
        </View>
      </Surface>

      {/* 退出登录 */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}>
        <Icon name="logout" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>

      {/* 版本信息 */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>版本 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerWrapper: {
    height: 200,
    marginBottom: designTokens.spacing.lg,
    overflow: 'hidden',
  },
  headerBackground: {
    height: '100%',
    width: '100%',
  },
  headerBackgroundImage: {
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.85)',
  },
  headerContent: {
    flex: 1,
    paddingTop: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
    marginLeft: designTokens.spacing.lg,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  membershipText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orderCard: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    borderRadius: 16,
    padding: designTokens.spacing.lg,
    backgroundColor: '#ffffff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6366F1',
  },
  orderStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  orderStatusItem: {
    alignItems: 'center',
    flex: 1,
  },
  orderStatusIcon: {
    position: 'relative',
    marginBottom: 8,
  },
  orderBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderStatusLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  menuSection: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    borderRadius: 16,
    padding: designTokens.spacing.lg,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: designTokens.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designTokens.spacing.md,
  },
  menuItemTitle: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBadge: {
    backgroundColor: '#6366F1',
    fontSize: 11,
    paddingHorizontal: 6,
    minWidth: 20,
    height: 20,
  },
  languageCard: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    borderRadius: 16,
    padding: designTokens.spacing.lg,
    backgroundColor: '#ffffff',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 14,
    color: '#64748b',
  },
  logoutButton: {
    marginHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: designTokens.spacing.lg,
    borderRadius: 16,
    gap: 8,
    ...designTokens.shadows.small,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: designTokens.spacing.xxxl,
  },
  versionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default ProfileScreen;