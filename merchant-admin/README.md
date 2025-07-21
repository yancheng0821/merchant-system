# 商户管理后台系统

这是一个基于React + MUI + TypeScript构建的中小型商户管理后台系统。

## 功能特性

- 🎨 基于Material-UI的现代化界面设计
- ✨ Inter字体 - 优雅现代的界面字体
- 📱 响应式布局，支持移动端
- 🔧 TypeScript支持，提供完整的类型检查
- 🌍 国际化支持，支持中英文切换
- 🔐 用户认证系统，支持登录/登出
- 👤 用户资料管理和编辑功能
- 📊 仪表盘数据展示
- 🛍️ 商品管理
- 📦 订单管理
- 👥 客户管理
- 📈 数据统计
- ⚙️ 系统设置

## 技术栈

- React 18
- Material-UI (MUI) 5
- TypeScript
- React Router Dom (路由管理)
- Emotion (CSS-in-JS)
- i18next + react-i18next (国际化)
- Context API (状态管理)

## 安装和运行

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

项目将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 项目结构

```
merchant-admin/
├── public/
│   └── index.html
├── src/
│   ├── components/            # 通用组件
│   │   ├── auth/             # 认证相关组件
│   │   │   ├── LoginPage.tsx # 登录页面
│   │   │   ├── UserProfile.tsx # 用户资料页面
│   │   │   └── index.ts      # 导出文件
│   │   └── index.ts          # 组件统一导出
│   ├── modules/              # 业务模块
│   │   ├── dashboard/        # 仪表盘模块
│   │   │   ├── Dashboard.tsx # 仪表盘主组件
│   │   │   └── index.ts      # 模块导出
│   │   ├── products/         # 商品管理模块
│   │   │   ├── ProductManagement.tsx
│   │   │   └── index.ts
│   │   ├── orders/           # 订单管理模块
│   │   │   ├── OrderManagement.tsx
│   │   │   └── index.ts
│   │   ├── customers/        # 客户管理模块
│   │   │   ├── CustomerManagement.tsx
│   │   │   └── index.ts
│   │   ├── analytics/        # 数据统计模块
│   │   │   ├── Analytics.tsx
│   │   │   └── index.ts
│   │   ├── settings/         # 系统设置模块
│   │   │   ├── Settings.tsx
│   │   │   └── index.ts
│   │   └── index.ts          # 模块统一导出
│   ├── contexts/
│   │   └── AuthContext.tsx   # 认证上下文
│   ├── i18n/
│   │   ├── config.ts         # i18n配置文件
│   │   └── locales/
│   │       ├── zh-CN.json    # 中文翻译
│   │       └── en-US.json    # 英文翻译
│   ├── App.tsx               # 主应用组件
│   ├── index.tsx             # 应用入口
│   └── index.css             # 基础样式
├── package.json
├── tsconfig.json
└── README.md
```

## 📁 项目架构

### 🏗️ 模块化设计

项目采用模块化架构，每个业务功能都有独立的文件夹：

#### **Components (通用组件)**
- `components/auth/` - 认证相关组件（登录、用户资料）
- 未来可扩展：通用UI组件、表单组件等

#### **Modules (业务模块)**
- `modules/dashboard/` - 数据可视化仪表盘
- `modules/products/` - 商品管理功能
- `modules/orders/` - 订单处理系统
- `modules/customers/` - 客户关系管理
- `modules/analytics/` - 数据统计分析
- `modules/settings/` - 系统配置管理

#### **支持系统**
- `contexts/` - React Context状态管理
- `i18n/` - 国际化多语言支持
- 每个模块都有独立的 `index.ts` 导出文件

### 🔧 开发指南

项目已配置好基础的开发环境，包括：

- **模块化架构** - 清晰的代码组织结构
- **TypeScript配置** - 完整的类型安全
- **MUI主题配置** - 统一的设计系统
- **Inter字体系统** - 专为数字界面优化的现代字体
- **响应式布局** - 适配各种设备
- **数据可视化** - 丰富的图表展示
- **国际化支持** - 中英文无缝切换
- **认证系统** - 完整的用户管理
- **模块导出** - 便于维护的导入体系

### ✨ 字体设计

项目使用 **Inter** 字体，这是一款专为数字界面设计的现代字体：

- **高可读性** - 在各种屏幕尺寸上都清晰易读
- **数字优化** - 等宽数字，表格和数据显示更整齐
- **字符精细调节** - 启用了cv02, cv03, cv04, cv11等字形变体
- **完整字重支持** - 从Light(300)到Bold(700)
- **系统后备** - 包含完整的系统字体后备栈

### 🔐 用户认证功能

项目已集成完整的用户认证系统：

#### 演示账号
- **系统管理员**: `admin` / `admin123`
- **商户管理员**: `merchant` / `merchant123`

#### 主要功能
- **登录页面**: 支持用户名密码登录，包含演示账号提示
- **自动登录**: 基于localStorage的会话保持
- **用户菜单**: 右上角用户头像下拉菜单
- **资料管理**: 完整的用户信息编辑功能
- **安全登出**: 清除本地会话数据

### 🌍 国际化功能

项目已集成了完整的国际化支持：

- **语言切换**：点击右上角的"语言"按钮可以在中英文之间切换
- **默认语言**：系统默认使用中文（zh-CN）
- **支持语言**：中文（zh-CN）和英文（en-US）
- **翻译文件位置**：`src/i18n/locales/`

#### 添加新翻译

要添加新的翻译文本，请：

1. 在 `src/i18n/locales/zh-CN.json` 中添加中文翻译
2. 在 `src/i18n/locales/en-US.json` 中添加对应的英文翻译
3. 在组件中使用 `t('翻译key')` 来显示文本

#### 使用示例

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('nav.title')}</h1>
    </div>
  );
}
```

### 🚀 模块扩展指南

#### 添加新的业务模块

1. **创建模块文件夹**
   ```bash
   mkdir src/modules/new-module
   ```

2. **创建主组件**
   ```tsx
   // src/modules/new-module/NewModule.tsx
   import React from 'react';
   import { useTranslation } from 'react-i18next';
   
   const NewModule: React.FC = () => {
     const { t } = useTranslation();
     return <div>{t('nav.newModule')}</div>;
   };
   
   export default NewModule;
   ```

3. **创建导出文件**
   ```tsx
   // src/modules/new-module/index.ts
   export { default as NewModule } from './NewModule';
   ```

4. **更新总导出**
   ```tsx
   // src/modules/index.ts
   export { NewModule } from './new-module';
   ```

5. **在App.tsx中使用**
   ```tsx
   import { NewModule } from './modules';
   // 在renderContent中添加case处理
   ```

#### 添加通用组件

1. 在 `src/components/` 下创建新的组件文件夹
2. 按照相同的模式创建组件和导出文件
3. 在 `src/components/index.ts` 中导出

这样的架构让项目**易于维护、扩展和团队协作**！ 