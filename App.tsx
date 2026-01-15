/**
 * 主应用入口 - 支持多分包 + 错误处理 + 模块更新检测 + iOS 风格滑动动画
 *
 * @format
 */

import React, { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Dimensions, StatusBar, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import ChunkErrorBoundary from './src/components/ChunkErrorBoundary';
import UpdateDialog from './src/components/UpdateDialog';
import { useAppStore } from './src/store/useAppStore';
import { setVersionCheckCallback, confirmBundleUpdate } from './index';
import { ScriptManager } from '@callstack/repack/client';
import RNRestart from 'react-native-restart';

// 重启后自动导航的 key
const PENDING_NAVIGATION_KEY = 'pending_navigation_screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 分包屏幕类型（不包含 update，用于测试分包不存在的情况）
type ScreenName = 'feature' | 'settings' | 'profile' | 'shop';
type ScreensMap = Record<ScreenName, React.LazyExoticComponent<React.ComponentType<{ navigation: { goBack: () => void } }>>>;

// 创建 lazy 组件的工厂函数
const createLazyScreens = (): ScreensMap => ({
  feature: React.lazy(
    () => import(/* webpackChunkName: "feature" */ './src/screens/FeatureScreen'),
  ),
  settings: React.lazy(
    () => import(/* webpackChunkName: "settings" */ './src/screens/SettingsScreen'),
  ),
  profile: React.lazy(
    () => import(/* webpackChunkName: "profile" */ './src/screens/ProfileScreen'),
  ),
  shop: React.lazy(
    () => import(/* webpackChunkName: "shop" */ './src/screens/ShopScreen'),
  ),
  // 注意：update 分包故意不在此列表中，用于测试"分包不存在"的错误处理
});

// 动画配置 - iOS 风格
const ANIMATION_DURATION = 350;

import LoginScreen from './src/screens/LoginScreen';
import RecommendScreen from './src/screens/RecommendScreen';

function App(): React.JSX.Element {
  // 临时：直接渲染推荐页面以验证 UI 复刻效果
  return (
    <SafeAreaProvider>
      <RecommendScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
