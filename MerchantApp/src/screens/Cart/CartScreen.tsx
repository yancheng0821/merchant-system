import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Checkbox,
  Badge,
  Snackbar,
} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useCartStore} from '../../store';
import type {CartStackScreenProps} from '../../navigation/types';
import {designTokens} from '../../theme/theme';

type Props = CartStackScreenProps<'CartMain'>;

const {width} = Dimensions.get('window');

const CartScreen: React.FC<Props> = ({navigation}) => {
  const {t} = useTranslation();
  const {items, totalAmount, totalCount, removeItem, updateQuantity, clearCart} = useCartStore();
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id));
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 切换选中状态
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  // 计算选中商品的总价
  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 计算选中商品的总数
  const selectedCount = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.quantity, 0);

  // 删除商品
  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeItem(itemId);
    setSnackbarMessage(`已移除 ${itemName}`);
    setSnackbarVisible(true);
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  // 渲染购物车商品
  const renderCartItem = ({item}: any) => (
    <Surface style={styles.cartItem} elevation={1}>
      <View style={styles.itemContainer}>
        {/* 选择框 */}
        <Checkbox
          status={selectedItems.includes(item.id) ? 'checked' : 'unchecked'}
          onPress={() => toggleItemSelection(item.id)}
          color="#6366F1"
        />
        
        {/* 商品图片 */}
        <Image
          source={{uri: item.image || 'https://via.placeholder.com/100'}}
          style={styles.itemImage}
        />
        
        {/* 商品信息 */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.itemMeta}>
            <Badge style={styles.merchantBadge}>{item.merchantName}</Badge>
          </View>
          
          <View style={styles.itemFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceSymbol}>¥</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>
            
            {/* 数量调节 */}
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}>
                <Icon name="remove" size={18} color={item.quantity <= 1 ? '#cbd5e1' : '#64748b'} />
              </TouchableOpacity>
              
              <Text style={styles.quantity}>{item.quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Icon name="add" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* 删除按钮 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveItem(item.id, item.name)}>
          <Icon name="close" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  // 空购物车界面
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name="shopping-cart" size={80} color="#cbd5e1" />
        </View>
        <Text style={styles.emptyTitle}>购物车空空如也</Text>
        <Text style={styles.emptyDescription}>
          快去挑选心仪的服务吧
        </Text>
        <Button
          mode="contained"
          style={styles.goShoppingButton}
          buttonColor="#6366F1"
          onPress={() => navigation.navigate('Home' as any)}>
          去逛逛
        </Button>
      </View>
    );
  }

  // 推荐服务（可选）
  const recommendedServices = [
    {id: '1', name: '精品洗剪吹', price: 88, image: 'https://picsum.photos/200/150?random=901'},
    {id: '2', name: '日式头皮SPA', price: 168, image: 'https://picsum.photos/200/150?random=902'},
  ];

  return (
    <View style={styles.container}>
      {/* 顶部操作栏 */}
      <Surface style={styles.topBar} elevation={0}>
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
            <Checkbox
              status={selectedItems.length === items.length ? 'checked' : 'unchecked'}
              color="#6366F1"
            />
            <Text style={styles.selectAllText}>
              全选 ({selectedItems.length}/{items.length})
            </Text>
          </TouchableOpacity>
          
          {selectedItems.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                const itemsToRemove = items.filter(item => selectedItems.includes(item.id));
                itemsToRemove.forEach(item => removeItem(item.id));
                setSelectedItems([]);
                setSnackbarMessage(`已删除 ${itemsToRemove.length} 件商品`);
                setSnackbarVisible(true);
              }}>
              <Text style={styles.deleteAllText}>删除选中</Text>
            </TouchableOpacity>
          )}
        </View>
      </Surface>

      {/* 购物车列表 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FlatList
          data={items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.cartList}
        />
        
        {/* 推荐商品 */}
        <View style={styles.recommendSection}>
          <Text style={styles.recommendTitle}>猜你喜欢</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendedServices.map((service) => (
              <TouchableOpacity key={service.id} style={styles.recommendCard}>
                <Image source={{uri: service.image}} style={styles.recommendImage} />
                <Text style={styles.recommendName} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.recommendPrice}>¥{service.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 底部间距 */}
        <View style={{height: 100}} />
      </ScrollView>
      
      {/* 结算栏 */}
      <Surface style={styles.footer} elevation={8}>
        <View style={styles.footerContent}>
          <View style={styles.totalSection}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>合计：</Text>
              <View style={styles.totalPriceContainer}>
                <Text style={styles.totalSymbol}>¥</Text>
                <Text style={styles.totalPrice}>{selectedTotal.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.selectedCount}>
              已选 {selectedCount} 件
            </Text>
          </View>
          
          <Button
            mode="contained"
            style={styles.checkoutButton}
            buttonColor="#6366F1"
            disabled={selectedItems.length === 0}
            onPress={() => {
              const selectedCartItems = items.filter(item => selectedItems.includes(item.id));
              navigation.navigate('Checkout', {items: selectedCartItems});
            }}>
            去结算 {selectedItems.length > 0 && `(${selectedItems.length})`}
          </Button>
        </View>
      </Surface>

      {/* Snackbar 提示 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  deleteAllText: {
    fontSize: 14,
    color: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  cartList: {
    paddingTop: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
  },
  cartItem: {
    marginBottom: designTokens.spacing.md,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: designTokens.spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: designTokens.spacing.sm,
    backgroundColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: designTokens.spacing.md,
  },
  itemName: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#6366F1',
    fontSize: 11,
    paddingHorizontal: 8,
    height: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: 2,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendSection: {
    marginTop: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.lg,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: designTokens.spacing.md,
  },
  recommendCard: {
    width: 120,
    marginRight: designTokens.spacing.md,
  },
  recommendImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  recommendName: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  recommendPrice: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.lg,
  },
  totalSection: {
    flex: 1,
  },
  totalInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 4,
  },
  totalSymbol: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 22,
    color: '#ef4444',
    fontWeight: '700',
    marginLeft: 2,
  },
  selectedCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  checkoutButton: {
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
  },
  goShoppingButton: {
    borderRadius: 20,
    paddingHorizontal: 32,
  },
  snackbar: {
    backgroundColor: '#1e293b',
    marginBottom: 100,
  },
});

export default CartScreen;