import React from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {Card, Text, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Merchant} from '../store/types';
import {designTokens} from '../theme/theme';

interface MerchantCardProps {
  merchant: Partial<Merchant> & {
    id: string;
    name: string;
    address: string;
    rating?: number;
    distance?: number;
    workingHours?: {
      open: string;
      close: string;
    };
  };
  onPress?: () => void;
  style?: any;
}

/**
 * 商户卡片组件 - 用于显示商户信息
 */
const MerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  onPress,
  style,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };
  // 判断商户是否营业中
  const isOpen = () => {
    if (!merchant.workingHours) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = merchant.workingHours.open.split(':').map(Number);
    const [closeHour, closeMin] = merchant.workingHours.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  return (
    <Animated.View style={{transform: [{scale: scaleValue}]}}>
      <Card 
        style={[styles.card, style]} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
      <Card.Content>
        {/* 商户名称和评分 */}
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
            {merchant.name}
          </Text>
          
          {merchant.rating && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#ffc107" />
              <Text variant="bodySmall" style={styles.ratingText}>
                {merchant.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* 商户地址 */}
        <View style={styles.addressContainer}>
          <Icon name="location_on" size={16} color="#666" />
          <Text
            variant="bodySmall"
            style={styles.address}
            numberOfLines={2}>
            {merchant.address}
          </Text>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          {/* 营业状态 */}
          <Chip
            mode="flat"
            compact
            style={[
              styles.statusChip,
              isOpen() ? styles.openChip : styles.closedChip,
            ]}
            textStyle={[
              styles.statusText,
              isOpen() ? styles.openText : styles.closedText,
            ]}>
            {isOpen() ? '营业中' : '已打烊'}
          </Chip>

          {/* 距离信息 */}
          {merchant.distance !== undefined && (
            <View style={styles.distanceContainer}>
              <Icon name="directions_walk" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.distanceText}>
                {merchant.distance < 1 
                  ? `${Math.round(merchant.distance * 1000)}m` 
                  : `${merchant.distance.toFixed(1)}km`
                }
              </Text>
            </View>
          )}
        </View>

        {/* 营业时间 */}
        {merchant.workingHours && (
          <Text variant="bodySmall" style={styles.workingHours}>
            营业时间：{merchant.workingHours.open} - {merchant.workingHours.close}
          </Text>
        )}
      </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: '#ffffff',
    ...designTokens.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  name: {
    flex: 1,
    color: '#1e293b',
    fontWeight: designTokens.fontWeight.semiBold,
    marginRight: designTokens.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.sm,
  },
  ratingText: {
    marginLeft: designTokens.spacing.xs,
    color: '#f59e0b',
    fontSize: designTokens.fontSize.sm,
    fontWeight: designTokens.fontWeight.medium,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.xs,
  },
  address: {
    flex: 1,
    marginLeft: designTokens.spacing.xs,
    color: '#64748b',
    lineHeight: 20,
    fontSize: designTokens.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  statusChip: {
    height: 28,
    borderRadius: designTokens.borderRadius.md,
  },
  openChip: {
    backgroundColor: '#dcfce7',
  },
  closedChip: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: designTokens.fontSize.xs,
    fontWeight: designTokens.fontWeight.medium,
  },
  openText: {
    color: '#16a34a',
  },
  closedText: {
    color: '#dc2626',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.sm,
  },
  distanceText: {
    marginLeft: designTokens.spacing.xs,
    color: '#6366f1',
    fontSize: designTokens.fontSize.sm,
    fontWeight: designTokens.fontWeight.medium,
  },
  workingHours: {
    color: '#94a3b8',
    fontSize: designTokens.fontSize.xs,
    fontStyle: 'italic',
    marginTop: designTokens.spacing.xs,
  },
});

export default MerchantCard;