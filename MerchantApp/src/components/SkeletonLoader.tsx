import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import {designTokens} from '../theme/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * 骨架屏加载组件
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = designTokens.borderRadius.md,
  style,
}) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerValue]);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * 商户卡片骨架屏
 */
export const MerchantCardSkeleton: React.FC = () => {
  return (
    <View style={styles.merchantCard}>
      <View style={styles.merchantHeader}>
        <SkeletonLoader width="60%" height={20} />
        <SkeletonLoader width={50} height={16} borderRadius={8} />
      </View>
      <SkeletonLoader width="80%" height={16} style={{marginBottom: 8}} />
      <View style={styles.merchantFooter}>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
        <SkeletonLoader width={40} height={16} />
      </View>
    </View>
  );
};

/**
 * 服务卡片骨架屏
 */
export const ServiceCardSkeleton: React.FC = () => {
  return (
    <View style={styles.serviceCard}>
      <SkeletonLoader width="100%" height={120} borderRadius={12} />
      <View style={styles.serviceContent}>
        <SkeletonLoader width="90%" height={18} />
        <SkeletonLoader width="40%" height={16} style={{marginTop: 4}} />
        <SkeletonLoader width={60} height={20} style={{marginTop: 4}} borderRadius={10} />
      </View>
    </View>
  );
};

/**
 * 分类卡片骨架屏
 */
export const CategoryCardSkeleton: React.FC = () => {
  return (
    <View style={styles.categoryCard}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <SkeletonLoader width="70%" height={16} style={{marginTop: 12}} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  merchantCard: {
    backgroundColor: '#ffffff',
    padding: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.small,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  merchantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCard: {
    width: 180,
    marginRight: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: '#ffffff',
    ...designTokens.shadows.medium,
    overflow: 'hidden',
  },
  serviceContent: {
    padding: designTokens.spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: designTokens.borderRadius.xl,
    ...designTokens.shadows.small,
  },
});

export default SkeletonLoader;