import React from 'react';
import {StyleSheet, ViewStyle, TextStyle, Animated} from 'react-native';
import {Button, ActivityIndicator} from 'react-native-paper';
import {designTokens} from '../theme/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  labelStyle?: TextStyle;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

/**
 * 自定义按钮组件 - 基于React Native Paper的Button进行封装
 */
const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  disabled = false,
  loading = false,
  icon,
  style,
  contentStyle,
  labelStyle,
  color,
  textColor,
  size = 'medium',
  fullWidth = false,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  // 根据尺寸计算样式
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  // 根据模式计算默认颜色
  const getDefaultColor = () => {
    if (color) return color;
    
    switch (mode) {
      case 'contained':
        return '#6366F1';
      case 'outlined':
        return 'transparent';
      default:
        return undefined;
    }
  };

  // 根据模式计算默认文本颜色
  const getDefaultTextColor = () => {
    if (textColor) return textColor;
    
    switch (mode) {
      case 'contained':
        return '#ffffff';
      case 'outlined':
        return '#6366F1';
      case 'text':
        return '#6366F1';
      default:
        return undefined;
    }
  };

  return (
    <Animated.View style={{transform: [{scale: scaleValue}]}}>
      <Button
        mode={mode}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        icon={loading ? undefined : icon}
        style={[
          getSizeStyle(),
          fullWidth && styles.fullWidth,
          styles.button,
          mode === 'contained' && styles.contained,
          mode === 'outlined' && styles.outlined,
          style,
        ]}
        contentStyle={[
          getSizeStyle(),
          contentStyle,
        ]}
        labelStyle={[
          styles.label,
          labelStyle,
          {color: getDefaultTextColor()},
        ]}
        buttonColor={getDefaultColor()}
        textColor={getDefaultTextColor()}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={mode === 'contained' ? '#ffffff' : '#6366f1'} 
          />
        ) : (
          title
        )}
      </Button>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: designTokens.borderRadius.md,
    ...designTokens.shadows.small,
  },
  contained: {
    ...designTokens.shadows.medium,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
  },
  label: {
    fontWeight: designTokens.fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  small: {
    paddingVertical: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.xl,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
});

export default CustomButton;