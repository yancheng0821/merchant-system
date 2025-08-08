import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Button,
  Surface,
  Badge,
  Snackbar,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 导入状态管理
import {useAuthStore, useCartStore} from '../../store';

// 导入导航类型
import type {HomeStackScreenProps} from '../../navigation/types';

// 导入主题
import {designTokens} from '../../theme/theme';

// 导入组件
import ServiceCard from '../../components/ServiceCard';
import BannerCarousel from '../../components/BannerCarousel';

type Props = HomeStackScreenProps<'HomeMain'>;

const {width} = Dimensions.get('window');

/**
 * 首页组件
 */
const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuthStore();
  const {addItem} = useCartStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 广告轮播图数据
  const banners = [
    {
      id: '1',
      image: 'https://picsum.photos/800/400?random=100',
      title: '新春特惠',
      subtitle: '全场服务8折起',
    },
    {
      id: '2',
      image: 'https://picsum.photos/800/400?random=101',
      title: '会员专享',
      subtitle: '充值送好礼',
    },
    {
      id: '3',
      image: 'https://picsum.photos/800/400?random=102',
      title: '限时秒杀',
      subtitle: '爆款服务1元起',
    },
    {
      id: '4',
      image: 'https://picsum.photos/800/400?random=103',
      title: '新店开业',
      subtitle: '进店有礼',
    },
  ];

  // 快速入口
  const quickEntries = [
    {id: '1', name: '热门服务', icon: 'local-fire-department', color: '#FF6B6B', route: 'HotServices'},
    {id: '2', name: '优惠券', icon: 'local-offer', color: '#4ECDC4', route: 'Coupons'},
    {id: '3', name: '会员卡', icon: 'card-membership', color: '#FFD93D', route: 'Membership'},
    {id: '4', name: '我的预约', icon: 'event', color: '#6366F1', route: 'Appointments'},
    {id: '5', name: '附近门店', icon: 'store', color: '#A78BFA', route: 'NearbyStores'},
    {id: '6', name: '积分商城', icon: 'stars', color: '#F97316', route: 'Points'},
    {id: '7', name: '客服中心', icon: 'headset-mic', color: '#10B981', route: 'Support'},
    {id: '8', name: '更多', icon: 'apps', color: '#94A3B8', route: 'More'},
  ];

  // 推荐服务
  const recommendedServices = [
    {
      id: '1',
      name: '精品洗剪吹',
      price: 88,
      originalPrice: 128,
      rating: 4.9,
      duration: 60,
      description: '资深发型师，打造完美造型',
      images: ['https://picsum.photos/400/300?random=21'],
      tag: '热门',
    },
    {
      id: '2',
      name: '日式头皮SPA',
      price: 168,
      originalPrice: 268,
      rating: 5.0,
      duration: 90,
      description: '深层清洁，舒缓头皮压力',
      images: ['https://picsum.photos/400/300?random=22'],
      tag: '新品',
    },
    {
      id: '3',
      name: '韩式纹理烫',
      price: 388,
      originalPrice: 588,
      rating: 4.8,
      duration: 180,
      description: '自然卷度，持久定型',
      images: ['https://picsum.photos/400/300?random=23'],
      tag: '特惠',
    },
    {
      id: '4',
      name: '染发护理套餐',
      price: 298,
      originalPrice: 398,
      rating: 4.7,
      duration: 120,
      description: '进口染发剂，不伤发质',
      images: ['https://picsum.photos/400/300?random=24'],
    },
  ];

  // 营销活动卡片
  const promotions = [
    {
      id: '1',
      title: '限时秒杀',
      subtitle: '每日10点开抢',
      icon: 'flash-on',
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E53'],
    },
    {
      id: '2',
      title: '拼团优惠',
      subtitle: '3人成团享8折',
      icon: 'group',
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D'],
    },
  ];

  // 刷新数据
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // 搜索处理
  const handleSearch = () => {
    navigation.navigate('Search' as any);
  };

  // 处理轮播图点击
  const handleBannerPress = (banner: any) => {
    console.log('Banner pressed:', banner);
    // 导航到相应页面或显示详情
  };

  // 处理快速入口点击
  const handleQuickEntryPress = (entry: any) => {
    if (entry.route === 'More') {
      navigation.navigate('Categories');
    } else {
      // 导航到相应功能页面
      console.log('Navigate to:', entry.route);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      
      {/* 搜索栏 */}
      <View style={styles.header}>
        <Searchbar
          placeholder="搜索服务、商家"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          onFocus={() => navigation.navigate('Search' as any)}
          style={styles.searchBar}
          iconColor="#6366F1"
        />
      </View>

      {/* 广告轮播图 */}
      <BannerCarousel
        banners={banners}
        height={180}
        onBannerPress={handleBannerPress}
        autoPlay={true}
        autoPlayInterval={3000}
      />

      {/* 快速入口 */}
      <Surface style={styles.quickEntryContainer} elevation={0}>
        <View style={styles.quickEntryGrid}>
          {quickEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.quickEntry}
              onPress={() => handleQuickEntryPress(entry)}
              activeOpacity={0.7}>
              <View style={[styles.quickEntryIcon, {backgroundColor: `${entry.color}15`}]}>
                <Icon name={entry.icon} size={28} color={entry.color} />
              </View>
              <Text style={styles.quickEntryText}>{entry.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Surface>

      {/* 营销活动区 */}
      <View style={styles.section}>
        <View style={styles.promotionContainer}>
          {promotions.map((promo) => (
            <TouchableOpacity
              key={promo.id}
              style={styles.promotionCard}
              activeOpacity={0.9}>
              <Surface style={[styles.promotionSurface, {backgroundColor: promo.color}]} elevation={2}>
                <Icon name={promo.icon} size={32} color="#ffffff" />
                <View style={styles.promotionText}>
                  <Text style={styles.promotionTitle}>{promo.title}</Text>
                  <Text style={styles.promotionSubtitle}>{promo.subtitle}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#ffffff" />
              </Surface>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 推荐服务 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            推荐服务
          </Text>
          <Button mode="text" onPress={() => navigation.navigate('Categories')}>
            更多
          </Button>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}>
          {recommendedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => navigation.navigate('ServiceDetail' as any, {serviceId: service.id})}
              onAddToCart={() => {
                addItem({
                  id: service.id,
                  name: service.name,
                  price: service.price,
                  image: service.images?.[0] || '',
                  merchantId: 'default',
                  merchantName: '默认商家',
                  quantity: 1,
                });
                setSnackbarMessage(`已将 ${service.name} 加入购物车`);
                setSnackbarVisible(true);
              }}
              style={styles.serviceCardCustom}
            />
          ))}
        </ScrollView>
      </View>

      {/* 预留功能区域 - 会员专区 */}
      <View style={styles.section}>
        <Surface style={styles.memberSection} elevation={1}>
          <View style={styles.memberHeader}>
            <Icon name="workspace-premium" size={24} color="#FFD700" />
            <Text style={styles.memberTitle}>会员专享特权</Text>
            <Badge style={styles.memberBadge}>PRO</Badge>
          </View>
          <Text style={styles.memberDescription}>
            开通会员享受更多优惠和专属服务
          </Text>
          <Button
            mode="contained"
            style={styles.memberButton}
            buttonColor="#6366F1"
            onPress={() => console.log('Open membership')}>
            立即开通
          </Button>
        </Surface>
      </View>

      {/* 预留功能区域 - 社区动态 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            社区动态
          </Text>
          <Text style={styles.comingSoon}>即将上线</Text>
        </View>
        <Surface style={styles.placeholderCard} elevation={1}>
          <Icon name="forum" size={48} color="#CBD5E1" />
          <Text style={styles.placeholderText}>
            分享美丽心得，发现更多精彩
          </Text>
        </Surface>
      </View>

      {/* 底部间距 */}
      <View style={styles.bottomSpace} />
      
      {/* Snackbar 提示 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        action={{
          label: '查看',
          onPress: () => {
            navigation.navigate('Cart' as any);
          },
        }}
        style={styles.snackbar}>
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: designTokens.spacing.md,
  },
  searchBar: {
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: '#f8f9fa',
    elevation: 0,
  },
  quickEntryContainer: {
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg,
  },
  quickEntryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: designTokens.spacing.md,
  },
  quickEntry: {
    width: '25%',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  quickEntryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  quickEntryText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginTop: designTokens.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    color: '#1e293b',
    fontWeight: designTokens.fontWeight.bold,
    fontSize: designTokens.fontSize.xl,
  },
  promotionContainer: {
    paddingHorizontal: designTokens.spacing.lg,
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  },
  promotionCard: {
    flex: 1,
  },
  promotionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.lg,
    gap: designTokens.spacing.md,
  },
  promotionText: {
    flex: 1,
  },
  promotionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  promotionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  horizontalScroll: {
    paddingLeft: designTokens.spacing.lg,
    paddingRight: designTokens.spacing.lg,
  },
  serviceCardCustom: {
    marginRight: designTokens.spacing.md,
  },
  memberSection: {
    marginHorizontal: designTokens.spacing.lg,
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: '#ffffff',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  memberBadge: {
    backgroundColor: '#FFD700',
    color: '#ffffff',
  },
  memberDescription: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: designTokens.spacing.md,
  },
  memberButton: {
    borderRadius: designTokens.borderRadius.md,
  },
  placeholderCard: {
    marginHorizontal: designTokens.spacing.lg,
    padding: designTokens.spacing.xl,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  placeholderText: {
    marginTop: designTokens.spacing.md,
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  comingSoon: {
    fontSize: 12,
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bottomSpace: {
    height: designTokens.spacing.xl,
  },
  snackbar: {
    backgroundColor: '#1e293b',
    marginBottom: 80,
  },
});

export default HomeScreen;