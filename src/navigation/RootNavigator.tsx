/**
 * 根导航器 - 包含登录页、Tab 导航和分包页面
 *
 * 起始页：LoginScreen（登录页面）
 * 主包：TabNavigator
 * 分包：SettingsScreen（生产环境）/ 主包（开发环境）
 */

import React, { Suspense, useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';

// 登录页面
import LoginScreen from '../screens/LoginScreen';
// 主包：Tab 导航
import TabNavigator from './TabNavigator';

// 分包页面：开发模式主包，生产模式分包
const SettingsScreen = __DEV__
  ? require('../screens/SettingsScreen').default
  : React.lazy(() => import(/* webpackChunkName: "settings" */ '../screens/SettingsScreen'));

const ShopScreen = __DEV__
  ? require('../screens/ShopScreen').default
  : React.lazy(() => import(/* webpackChunkName: "shop" */ '../screens/ShopScreen'));

const FeatureScreen = __DEV__
  ? require('../screens/FeatureScreen').default
  : React.lazy(() => import(/* webpackChunkName: "feature" */ '../screens/FeatureScreen'));

// 分包加载状态
function ChunkLoader() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f7' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Settings: undefined;
  shop: undefined;
  feature: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * iOS 标准的页面切换动画配置
 * 适用于所有非底部Tab栏切换的页面跳转
 *
 * 动画效果：
 * - iOS: 原生从右侧滑入动画
 * - Android: 模拟 iOS 的水平滑动动画（从右滑入，向左滑出）
 */
const stackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  // 统一使用滑动动画，让 Android 也有 iOS 风格的滑动效果
  animation: 'slide_from_right',
  // 确保使用原生的 iOS 动画类型
  gestureEnabled: true,
  // iOS 使用水平方向的滑动返回手势
  gestureDirection: 'horizontal',
  // 卡片式展示（iOS 默认）
  presentation: 'card',
  // 内容样式（iOS 默认卡片样式）
  contentStyle: {
    backgroundColor: '#f2f2f7',
  },
  // 确保动画类型为 iOS 原生
  animationTypeForReplace: 'push',
};

export default function RootNavigator() {
  const { isLoggedIn } = useAppStore();

  return (
    <Suspense fallback={<ChunkLoader />}>
      <Stack.Navigator
        screenOptions={stackScreenOptions}
        initialRouteName={isLoggedIn ? "MainTabs" : "Login"}
      >
        {/* 登录页面（起始页） */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />

        {/* 主包：Tab 导航（底部Tab栏切换不使用push动画） */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* 分包页面：开发模式主包，生产模式分包（使用iOS push动画） */}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="shop" component={ShopScreen} />
        <Stack.Screen name="feature" component={FeatureScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}
