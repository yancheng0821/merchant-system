import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {Text, Searchbar, Surface, Badge} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {CategoriesStackScreenProps} from '../../navigation/types';
import {designTokens} from '../../theme/theme';

type Props = CategoriesStackScreenProps<'CategoriesMain'>;

const {width} = Dimensions.get('window');

const CategoriesScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  // 热门分类数据 - 更丰富的配色和图标
  const categories = [
    {
      id: '1',
      name: '美发造型',
      icon: 'content-cut',
      count: 156,
      color: '#FF6B6B',
      gradient: ['#FF6B6B', '#FF8E53'],
      badge: '热门',
      badgeColor: '#FF6B6B',
      image: 'https://picsum.photos/400/200?random=301',
    },
    {
      id: '2',
      name: '美容护肤',
      icon: 'face',
      count: 89,
      color: '#4ECDC4',
      gradient: ['#4ECDC4', '#44A08D'],
      badge: '推荐',
      badgeColor: '#4ECDC4',
      image: 'https://picsum.photos/400/200?random=302',
    },
    {
      id: '3',
      name: '按摩SPA',
      icon: 'spa',
      count: 67,
      color: '#6366F1',
      gradient: ['#6366F1', '#8B5CF6'],
      image: 'https://picsum.photos/400/200?random=303',
    },
    {
      id: '4',
      name: '健身运动',
      icon: 'fitness-center',
      count: 45,
      color: '#F97316',
      gradient: ['#F97316', '#F59E0B'],
      badge: '新',
      badgeColor: '#F97316',
      image: 'https://picsum.photos/400/200?random=304',
    },
    {
      id: '5',
      name: '美甲美睫',
      icon: 'colorize',
      count: 78,
      color: '#EC4899',
      gradient: ['#EC4899', '#F59E0B'],
      image: 'https://picsum.photos/400/200?random=305',
    },
    {
      id: '6',
      name: '纹身纹眉',
      icon: 'brush',
      count: 34,
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#EC4899'],
      image: 'https://picsum.photos/400/200?random=306',
    },
    {
      id: '7',
      name: '宠物护理',
      icon: 'pets',
      count: 23,
      color: '#10B981',
      gradient: ['#10B981', '#0891B2'],
      badge: '特色',
      badgeColor: '#10B981',
      image: 'https://picsum.photos/400/200?random=307',
    },
    {
      id: '8',
      name: '摄影写真',
      icon: 'photo-camera',
      count: 56,
      color: '#0891B2',
      gradient: ['#0891B2', '#6366F1'],
      image: 'https://picsum.photos/400/200?random=308',
    },
  ];

  // 标签数据
  const tabs = [
    {id: 'all', name: '全部分类', icon: 'apps'},
    {id: 'hot', name: '热门推荐', icon: 'local-fire-department'},
    {id: 'new', name: '新上服务', icon: 'new-releases'},
    {id: 'nearby', name: '附近门店', icon: 'near-me'},
  ];

  const handleCategoryPress = (category: any) => {
    navigation.navigate('CategoryDetail', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const renderCategory = ({item, index}: any) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.95}>
      <Surface style={styles.cardSurface} elevation={3}>
        <View style={styles.cardContent}>
          {/* 背景图片 */}
          <ImageBackground
            source={{uri: item.image}}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}>
            {/* 渐变遮罩 */}
            <View style={styles.cardOverlay} />
          
          {/* 徽章 */}
          {item.badge && (
            <View style={[styles.badge, {backgroundColor: item.badgeColor}]}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}

            {/* 内容区域 */}
            <View style={styles.cardContentInner}>
              <View style={styles.cardInfo}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <View style={styles.countContainer}>
                  <Text style={styles.countNumber}>{item.count}</Text>
                  <Text style={styles.countText}>项服务</Text>
                </View>
              </View>

              <Icon name="arrow-forward" size={20} color="#ffffff" />
            </View>
          </ImageBackground>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.header}>
        <Searchbar
          placeholder="搜索分类或服务"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6366F1"
        />
        
        {/* 标签栏 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(tab.id)}>
              <Icon
                name={tab.icon}
                size={18}
                color={selectedTab === tab.id ? '#6366F1' : '#64748b'}
              />
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextActive,
                ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 分类网格 */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoryList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 44, // 添加顶部安全区域padding
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: designTokens.spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...designTokens.shadows.small,
  },
  searchBar: {
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: '#f1f5f9',
    elevation: 0,
  },
  tabContainer: {
    paddingHorizontal: designTokens.spacing.lg,
    maxHeight: 40,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  categoryList: {
    paddingTop: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.xxxl,
  },
  categoryCard: {
    flex: 1,
    height: 180,
    marginBottom: designTokens.spacing.md,
  },
  leftCard: {
    marginRight: designTokens.spacing.sm,
  },
  rightCard: {
    marginLeft: designTokens.spacing.sm,
  },
  cardSurface: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  cardContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardBackgroundImage: {
    borderRadius: 20,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  cardContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designTokens.spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  countNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  countText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default CategoriesScreen;