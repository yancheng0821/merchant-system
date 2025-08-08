import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import {designTokens} from '../theme/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

const {width, height} = Dimensions.get('window');

/**
 * 现代化启动屏幕组件
 */
const SplashScreen: React.FC<SplashScreenProps> = ({onFinish}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // 启动动画序列
    Animated.sequence([
      // 1. Logo 缩放和淡入
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // 2. 文字上滑
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      // 3. 等待一段时间后淡出
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [fadeAnim, scaleAnim, slideAnim, onFinish]);

  return (
    <>
      <StatusBar backgroundColor="#6366F1" barStyle="light-content" />
      <View style={styles.container}>
        {/* 背景渐变效果 */}
        <View style={styles.backgroundGradient} />
        
        {/* Logo 区域 */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>
          
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{translateY: slideAnim}],
                opacity: fadeAnim,
              },
            ]}>
            <Text style={styles.appName}>MerchantApp</Text>
            <Text style={styles.tagline}>优质商户服务平台</Text>
          </Animated.View>
        </Animated.View>

        {/* 底部装饰 */}
        <View style={styles.bottomDecoration}>
          <View style={styles.decorationDot} />
          <View style={[styles.decorationDot, styles.decorationDotActive]} />
          <View style={styles.decorationDot} />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366F1',
    opacity: 0.95,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: designTokens.fontWeight.bold,
    color: '#ffffff',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: designTokens.fontSize['4xl'],
    fontWeight: designTokens.fontWeight.bold,
    color: '#ffffff',
    marginBottom: designTokens.spacing.sm,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: designTokens.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: designTokens.fontWeight.medium,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  decorationDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
    borderRadius: 12,
  },
});

export default SplashScreen;