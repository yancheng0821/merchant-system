import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {Text} from 'react-native-paper';
import {designTokens} from '../theme/theme';

const {width: screenWidth} = Dimensions.get('window');

interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onBannerPress?: (banner: Banner) => void;
  style?: ViewStyle;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  height = 180,
  autoPlay = true,
  autoPlayInterval = 3000,
  onBannerPress,
  style,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // 自动轮播
  useEffect(() => {
    if (autoPlay && !isUserScrolling && banners.length > 1) {
      const timer = setInterval(() => {
        const nextIndex = (currentIndex + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * screenWidth,
          animated: true,
        });
        setCurrentIndex(nextIndex);
      }, autoPlayInterval);

      return () => clearInterval(timer);
    }
  }, [currentIndex, autoPlay, autoPlayInterval, isUserScrolling, banners.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
  };

  const handleScrollEndDrag = () => {
    // 3秒后恢复自动轮播
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  };

  return (
    <View style={[styles.container, {height}, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        bounces={false}>
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.95}
            onPress={() => onBannerPress?.(banner)}>
            <View style={[styles.bannerContainer, {height}]}>
              <Image
                source={{uri: banner.image}}
                style={[styles.bannerImage, {height}]}
                resizeMode="cover"
              />
              {(banner.title || banner.subtitle) && (
                <View style={styles.textOverlay}>
                  {banner.title && (
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                  )}
                  {banner.subtitle && (
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 指示器 */}
      {banners.length > 1 && (
        <View style={styles.indicatorContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bannerContainer: {
    width: screenWidth,
    position: 'relative',
  },
  bannerImage: {
    width: screenWidth,
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: designTokens.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: '#ffffff',
  },
});

export default BannerCarousel;