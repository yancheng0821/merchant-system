import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {Text} from 'react-native-paper';
import {designTokens} from '../theme/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

/**
 * 现代化加载动画组件
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#6366F1',
  text,
  overlay = false,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 淡入动画
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 旋转动画
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    spinAnimation.start();

    return () => {
      spinAnimation.stop();
    };
  }, [spinValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const containerStyle = overlay
    ? [styles.container, styles.overlay]
    : styles.container;

  return (
    <Animated.View style={[containerStyle, {opacity: fadeValue}]}>
      <View style={styles.spinnerContainer}>
        <Animated.View
          style={[
            styles.spinner,
            {
              width: getSize(),
              height: getSize(),
              borderColor: `${color}20`,
              borderTopColor: color,
              transform: [{rotate: spin}],
            },
          ]}
        />
        
        {/* 内部装饰圆圈 */}
        <View
          style={[
            styles.innerCircle,
            {
              width: getSize() * 0.3,
              height: getSize() * 0.3,
              backgroundColor: `${color}15`,
            },
          ]}
        />
      </View>
      
      {text && (
        <Text style={[styles.loadingText, {color}]}>
          {text}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 1000,
  },
  innerCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.fontSize.sm,
    fontWeight: designTokens.fontWeight.medium,
    textAlign: 'center',
  },
});

export default LoadingSpinner;