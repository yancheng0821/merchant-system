import React, {useState, useEffect} from 'react';
import {View, StyleSheet, FlatList, Dimensions, KeyboardAvoidingView, Platform} from 'react-native';
import {Searchbar, Chip, Text, ActivityIndicator} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ServiceCard from '../components/ServiceCard';
import {useCartStore} from '../store';
import {designTokens} from '../theme/theme';

const {width} = Dimensions.get('window');

const SearchScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {t} = useTranslation();
  const {addItem} = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState(['洗剪吹', '染发', '护理', '造型']);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 热门搜索
  const hotSearches = [
    '日式剪发', '韩式烫发', '染发', '护理',
    '美甲', 'SPA', '按摩', '造型设计'
  ];

  // 模拟搜索结果
  const mockSearchResults = [
    {
      id: '1',
      name: '精品洗剪吹',
      price: 88,
      rating: 4.8,
      duration: 60,
      description: '专业发型师精心设计，包含洗发、剪发、吹干造型',
      images: ['https://picsum.photos/400/300?random=11']
    },
    {
      id: '2',
      name: '韩式烫发',
      price: 388,
      rating: 4.9,
      duration: 180,
      description: '韩国最新烫发技术，打造自然卷度',
      images: ['https://picsum.photos/400/300?random=12']
    },
    {
      id: '3',
      name: '日式染发',
      price: 298,
      rating: 4.7,
      duration: 120,
      description: '日本进口染发剂，色彩持久不伤发',
      images: ['https://picsum.photos/400/300?random=13']
    },
  ];

  // 执行搜索
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // 模拟搜索延迟
      setTimeout(() => {
        setSearchResults(mockSearchResults);
        setIsSearching(false);
        // 添加到搜索历史
        if (!searchHistory.includes(searchQuery)) {
          setSearchHistory([searchQuery, ...searchHistory.slice(0, 9)]);
        }
      }, 1000);
    }
  };

  // 清除搜索历史
  const clearHistory = () => {
    setSearchHistory([]);
  };

  // 点击历史或热门搜索
  const handleQuickSearch = (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsSearching(false);
    }, 500);
  };

  const renderService = ({item}: any) => (
    <ServiceCard
      service={item}
      onPress={() => navigation.navigate('ServiceDetail', {serviceId: item.id})}
      onAddToCart={() => {
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.images?.[0] || '',
          merchantId: 'search',
          merchantName: '搜索结果',
          quantity: 1,
        });
      }}
      style={styles.serviceCard}
    />
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyContainer}>
      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>搜索历史</Text>
            <Text style={styles.clearButton} onPress={clearHistory}>清空</Text>
          </View>
          <View style={styles.tagContainer}>
            {searchHistory.map((item, index) => (
              <Chip
                key={index}
                mode="outlined"
                onPress={() => handleQuickSearch(item)}
                style={styles.tag}>
                {item}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* 热门搜索 */}
      <View style={styles.hotSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>热门搜索</Text>
          <Icon name="local-fire-department" size={20} color="#FF6B6B" />
        </View>
        <View style={styles.tagContainer}>
          {hotSearches.map((item, index) => (
            <Chip
              key={index}
              mode="outlined"
              onPress={() => handleQuickSearch(item)}
              style={styles.tag}
              textStyle={styles.hotTagText}>
              {item}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.searchHeader}>
        <Searchbar
          placeholder="搜索服务、商家"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          iconColor="#6366F1"
          autoFocus
        />
        
        {/* 筛选标签 */}
        {searchResults.length > 0 && (
          <View style={styles.filterContainer}>
            <Chip
              mode={selectedFilter === 'all' ? 'flat' : 'outlined'}
              selected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
              style={styles.filterChip}
              compact>
              全部
            </Chip>
            <Chip
              mode={selectedFilter === 'service' ? 'flat' : 'outlined'}
              selected={selectedFilter === 'service'}
              onPress={() => setSelectedFilter('service')}
              style={styles.filterChip}
              compact>
              服务
            </Chip>
            <Chip
              mode={selectedFilter === 'merchant' ? 'flat' : 'outlined'}
              selected={selectedFilter === 'merchant'}
              onPress={() => setSelectedFilter('merchant')}
              style={styles.filterChip}
              compact>
              商家
            </Chip>
          </View>
        )}
      </View>

      {/* 搜索中状态 */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>搜索中...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        /* 搜索结果 */
        <FlatList
          data={searchResults}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.resultList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* 空状态/搜索建议 */
        renderEmptySearch()
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    backgroundColor: '#ffffff',
    paddingBottom: designTokens.spacing.md,
    ...designTokens.shadows.small,
  },
  searchBar: {
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.xl,
    backgroundColor: '#f8f9fa',
    elevation: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
  filterChip: {
    borderRadius: designTokens.borderRadius.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    color: '#64748b',
  },
  resultList: {
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg,
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
  emptyContainer: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.xl,
  },
  historySection: {
    marginBottom: designTokens.spacing.xl,
  },
  hotSection: {
    marginBottom: designTokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  clearButton: {
    fontSize: 14,
    color: '#6366F1',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  tag: {
    marginBottom: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
  },
  hotTagText: {
    fontSize: 13,
  },
});

export default SearchScreen;