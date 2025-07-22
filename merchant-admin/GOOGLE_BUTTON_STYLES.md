# Google登录按钮样式选项

## 可用样式变体

### 1. `default` - 标准Google样式
```tsx
<GoogleLoginButton
  variant="default"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```
- 使用Google官方推荐的白色背景和灰色边框
- 保持Google品牌一致性
- 适合需要严格遵循Google设计指南的场景

### 2. `themed` - 主题融合样式（推荐）
```tsx
<GoogleLoginButton
  variant="themed"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```
- 使用Google标准的浅灰色边框和颜色
- 半透明背景，与应用界面融合
- 保持Google图标的原始颜色
- 稳定的悬停效果，无布局变化

### 3. `gradient` - 完全主题化样式
```tsx
<GoogleLoginButton
  variant="gradient"
  onSuccess={handleSuccess}
  onError={handleError}
/>
```
- 使用应用的完整渐变背景
- 白色文字和图标
- 最大程度融合应用主题
- 适合希望完全统一视觉风格的场景

## 当前配置

在 `LoginPage.tsx` 中，当前使用的是 `themed` 样式：

```tsx
<GoogleLoginButton
  variant="themed"
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  disabled={loading}
/>
```

## 样式特性

所有样式都包含：
- 响应式设计
- 加载状态处理
- 禁用状态样式
- 平滑的过渡动画
- 悬停效果（使用阴影而非位移，避免布局变化）
- 无障碍支持
- 防止布局抖动的优化设计

## 自定义

如需进一步自定义，可以修改 `GoogleLoginButton.tsx` 中对应的样式对象。