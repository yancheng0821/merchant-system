# Notification Management 颜色可见性修复

## 问题描述
Notification Management页面的颜色太浅，导致文字看不清楚，特别是页面标题的渐变文字。

## 解决方案

### 1. 主题色调整
- **原色**: `#F8BBD9` (太浅的粉色)
- **新色**: `#E91E63` (更深的粉色，Material Design Pink 500)

### 2. 渐变色优化

#### NotificationManagement.tsx
- **页面标题渐变**:
  - 原: `linear-gradient(45deg, #F8BBD9, #F3E8FF)`
  - 新: `linear-gradient(45deg, #E91E63, #F06292)`

#### NotificationLogManagement.tsx
- **搜索按钮渐变**:
  - 原: `linear-gradient(135deg, #F8BBD9, #F3E8FF)`
  - 新: `linear-gradient(135deg, #E91E63, #F06292)`
- **搜索按钮悬停渐变**:
  - 原: `linear-gradient(135deg, #F8BBD9, #E879F9)`
  - 新: `linear-gradient(135deg, #E91E63, #EC407A)`

## 颜色规范

### 新的颜色体系
- **主色**: `#E91E63` (Material Pink 500)
- **渐变浅色**: `#F06292` (Material Pink 300)
- **悬停色**: `#EC407A` (Material Pink 400)

### 优势
1. **更好的对比度**: 深色背景上的文字更清晰
2. **符合Material Design**: 使用标准的Material Design颜色
3. **保持渐变效果**: 前深后浅的渐变依然保持
4. **视觉层次清晰**: 文字和背景有足够的对比度

## 修改文件
- `merchant-admin/src/modules/notifications/NotificationManagement.tsx`
- `merchant-admin/src/modules/notifications/NotificationLogManagement.tsx`

## 验证要点
1. 页面标题文字应该清晰可见
2. 搜索按钮颜色应该有足够的对比度
3. 导航栏选中状态应该清晰
4. 整体视觉效果应该协调统一

## 完成状态
✅ 颜色已调整为更深的粉色
✅ 文字可见性问题已解决
✅ 保持了渐变效果和视觉美观