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

# 构建 Android 包
npm run bundle:android

# 构建 Android 分包（用于远程加载）
npm run bundle:android:chunk

# 构建 Android APK
npm run build:android        # release
npm run build-android:debug  # debug
```

## 项目架构

这是一个使用 React Native 0.77.0 + TypeScript 构建的移动应用，采用 Re.Pack 实现代码分割（code splitting）。

### 核心结构

- **入口文件**: `index.js` - 配置 Re.Pack ScriptManager，支持开发环境从 DevServer 加载分包，生产环境从远程服务器加载
- **主组件**: `App.tsx` - 使用 React.lazy + Suspense 实现按需加载屏幕组件
- **屏幕目录**: `src/screens/` - 页面组件（HomeScreen, FeatureScreen, SettingsScreen, ProfileScreen, ShopScreen, ErrorScreen）
- **组件目录**: `src/components/` - 共享组件（ChunkErrorBoundary, BackButton）
- **状态管理**: `src/store/` - 使用 Zustand

### 代码分割配置

分包通过 webpackChunkName 命名：
- `feature` -> FeatureScreen
- `settings` -> SettingsScreen
- `profile` -> ProfileScreen
- `shop` -> ShopScreen

分包默认从 Gitee releases 加载：`https://gitee.com/webcc/doudizhu/releases/download/v1.1.0/{scriptId}.chunk.bundle`

### 技术栈

- React 18.3.1 + React Native 0.77.0
- TypeScript 5.0
- Zustand（状态管理）
- @callstack/repack 5.2.3（代码分割）
- Jest（测试）
