import React, {useState} from 'react';
import {View, StyleSheet, FlatList, Dimensions} from 'react-native';
import {Chip, Searchbar, FAB} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import type {CategoriesStackScreenProps} from '../../navigation/types';
import {designTokens} from '../../theme/theme';
import ServiceCard from '../../components/ServiceCard';
import {useCartStore} from '../../store';

type Props = CategoriesStackScreenProps<'CategoryDetail'>;

const {width} = Dimensions.get('window');

const CategoryDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {categoryId, categoryName} = route.params;
  const {t} = useTranslation();
  const {addItem} = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');

  // 模拟服务数据 - 实际应从API获取
  const services = [
    {
      id: '1', 
      name: '精致洗剪吹', 
      price: 88, 
      rating: 4.8,
      duration: 60,
      description: '专业造型师为您打造完美发型，包含洗发、剪发、吹干造型',
      images: ['https://picsum.photos/400/300?random=1']
    },
    {
      id: '2', 
      name: '日式造型设计', 
      price: 158, 
      rating: 4.9,
      duration: 90,
      description: '日系风格造型设计，适合各种脸型，打造自然清新的发型',
      images: ['https://picsum.photos/400/300?random=2']
    },
    {
      id: '3', 
      name: '染发护理套餐', 
      price: 288, 
      rating: 4.7,
      duration: 120,
      description: '专业染发服务，包含头皮护理、染发、护发素深层护理',
      images: ['https://picsum.photos/400/300?random=3']
    },
    {
      id: '4', 
      name: '烫发造型', 
      price: 388, 
      rating: 4.8,
      duration: 150,
      description: '韩式纹理烫、日式空气烫等多种烫发选择',
      images: ['https://picsum.photos/400/300?random=4']
    },
    {
      id: '5', 
      name: '头皮SPA护理', 
      price: 128, 
      rating: 5.0,
      duration: 45,
      description: '深层清洁头皮，改善头皮环境，促进头发健康生长',
      images: ['https://picsum.photos/400/300?random=5']
    },
    {
      id: '6', 
      name: '儿童理发', 
      price: 48, 
      rating: 4.9,
      duration: 30,
      description: '专业儿童理发师，温柔耐心，让宝宝理发不再哭闹',
      images: ['https://picsum.photos/400/300?random=6']
    },
  ];

  const sortOptions = [
    {key: 'popular', label: '人气最高'},
    {key: 'price-low', label: '价格最低'},
    {key: 'price-high', label: '价格最高'},
    {key: 'rating', label: '评分最高'},
  ];

  const renderService = ({item, index}: any) => (
    <ServiceCard
      service={item}
      onPress={() => navigation.navigate('ServiceDetail', {serviceId: item.id})}
      onAddToCart={() => {
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.images?.[0] || '',
          merchantId: 'default',
          merchantName: categoryName,
          quantity: 1,
        });
      }}
      style={styles.serviceCard}
    />
  );

  const ListHeader = () => (
    <View style={styles.header}>
      {/* 搜索栏 */}
      <Searchbar
        placeholder="搜索服务"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#6366F1"
      />
      
      {/* 排序选项 */}
      <View style={styles.sortContainer}>
        {sortOptions.map((option) => (
          <Chip
            key={option.key}
            mode={selectedSort === option.key ? 'flat' : 'outlined'}
            selected={selectedSort === option.key}
            onPress={() => setSelectedSort(option.key)}
            style={styles.sortChip}
            compact>
            {option.label}
          </Chip>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.serviceList}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
      />
      
      {/* 筛选按钮 */}
      <FAB
        icon="filter-list"
        style={styles.fab}
        onPress={() => {
          // 打开筛选模态框
        }}
        color="#ffffff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: designTokens.spacing.md,
  },
  searchBar: {
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
  },
  sortChip: {
    borderRadius: designTokens.borderRadius.md,
  },
  serviceList: {
    paddingHorizontal: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.xs,
  },
  serviceCard: {
    flex: 0.48,
    marginHorizontal: designTokens.spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366F1',
  },
});

export default CategoryDetailScreen;