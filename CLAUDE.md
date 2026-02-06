# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 启动 Metro 开发服务器
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android

# 代码检查
npm run lint

# 运行测试
npm test

# 构建 iOS 包
npm run bundle:ios

# 构建 Android 分包（用于远程加载）
npm run bundle:android:chunk

# 构建 Android APK
npm run build:android        # release
npm run build-android:debug  # debug
```

## 项目架构

这是一个使用 React Native 0.83.1 + TypeScript 构建的移动应用，采用 Re.Pack 实现代码分割（code splitting）。

### 核心结构

- **入口文件**: `index.js` - 配置 Re.Pack ScriptManager，支持开发环境从 DevServer 加载分包，生产环境从远程服务器加载
- **主组件**: `App.tsx` - 根导航容器，配置 SafeAreaProvider 和 NavigationContainer
- **导航**: `src/navigation/RootNavigator.tsx` - 根导航器，包含登录页、Tab导航和分包页面
- **Tab导航**: `src/navigation/TabNavigator.tsx` - 底部Tab栏导航
- **屏幕目录**: `src/screens/` - 页面组件（LoginScreen, HomeScreen, SettingsScreen, ProfileScreen, ShopScreen 等）
- **组件目录**: `src/components/` - 共享组件（ChunkErrorBoundary, UpdateDialog, Toast, Dialog）
- **状态管理**: `src/store/useAppStore.ts` - 使用 Zustand，支持持久化到 AsyncStorage
- **服务层**: `src/services/BundleConfigService.ts` - 云端分包配置获取

### 代码分割配置

分包通过 webpackChunkName 命名：
- `settings` -> SettingsScreen
- `shop` -> ShopScreen
- `feature` -> FeatureScreen
- `update` -> UpdateTestScreen

开发模式（`__DEV__`）下分包直接内联到主包，生产环境从远程加载。

### 分包更新机制

1. 应用启动时从云端 API 获取分包配置（`fetchBundleConfigWithRetry`）
2. 用户进入分包页面时，ScriptManager 检查版本差异
3. 发现新版本时显示 UpdateDialog 提示用户
4. 用户确认后清除模块缓存并重新加载

### 技术栈

- React 19.2.0 + React Native 0.83.1
- TypeScript 5.0
- Zustand（状态管理）
- react-native-reanimated 4.2.1（动画库）
- @callstack/repack 5.2.3（代码分割）
- React Navigation 7.x（导航）
- Jest（测试）

### 动画组件

项目使用 react-native-reanimated 实现动画效果：

- `RollingNumber` - 数字翻滚动画组件（用于显示如 +24% 这样的数字）
- `AnimatedProgressBar` - 进度条动画组件（从左到右渐进效果）

示例用法：
```tsx
// 数字翻滚动画
<RollingNumber value={24} suffix="%" />

// 进度条动画
<AnimatedProgressBar progress={70} />
```
