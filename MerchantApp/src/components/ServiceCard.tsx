import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image, Dimensions} from 'react-native';
import {Text, Surface} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Service} from '../store/types';
import {designTokens} from '../theme/theme';

const {width} = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // Two columns with spacing

interface ServiceCardProps {
  service: Partial<Service> & {
    id: string;
    name: string;
    price: number;
    rating?: number;
    duration?: number;
    images?: string[];
    description?: string;
  };
  onPress?: () => void;
  onAddToCart?: () => void;
  style?: any;
  isFullWidth?: boolean;
}

/**
 * 服务卡片组件 - 现代化设计
 */
const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onAddToCart,
  style,
  isFullWidth = false,
}) => {
  // 默认图片占位符 - 使用更优雅的颜色
  const defaultImage = 'https://via.placeholder.com/400x300/A78BFA/ffffff?text=Service';
  const imageUrl = service.images && service.images.length > 0 ? service.images[0] : defaultImage;
  
  const cardWidth = isFullWidth ? width - 32 : CARD_WIDTH;

  return (
    <TouchableOpacity 
      style={[styles.container, {width: cardWidth}, style]} 
      onPress={onPress}
      activeOpacity={0.9}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.cardInner}>
          {/* 图片区域 */}
          <View style={styles.imageWrapper}>
          <Image
            source={{uri: imageUrl}}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* 渐变遮罩 - 让文字更清晰 */}
          <View style={styles.imageGradient} />
          
          {/* 顶部标签 */}
          <View style={styles.topBadges}>
            {service.rating && (
              <View style={styles.ratingBadge}>
                <Icon name="star" size={12} color="#FFC107" />
                <Text style={styles.ratingText}>{service.rating}</Text>
              </View>
            )}
            {service.duration && (
              <View style={styles.durationBadge}>
                <Icon name="schedule" size={11} color="#ffffff" />
                <Text style={styles.durationText}>{service.duration}分钟</Text>
              </View>
            )}
          </View>

          {/* 收藏按钮 */}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              // 添加收藏逻辑
            }}>
            <Icon name="favorite-border" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 内容区域 */}
        <View style={styles.content}>
          {/* 标题 */}
          <Text style={styles.title} numberOfLines={1}>
            {service.name}
          </Text>

          {/* 描述 */}
          {service.description && (
            <Text style={styles.description} numberOfLines={2}>
              {service.description}
            </Text>
          )}

          {/* 底部区域 */}
          <View style={styles.footer}>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>起</Text>
              <Text style={styles.price}>¥{service.price}</Text>
            </View>
            
            {onAddToCart && (
              <TouchableOpacity
                style={styles.cartButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                activeOpacity={0.8}>
                <Icon name="add" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: designTokens.spacing.sm,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    height: 140,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
  },
  topBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceLabel: {
    fontSize: 10,
    color: '#999',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  cartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    ...designTokens.shadows.small,
  },
});

export default ServiceCard;