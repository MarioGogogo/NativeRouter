/**
 * 根导航器 - 包含登录页、Tab 导航和分包页面
 *
 * 起始页：LoginScreen（登录页面）
 * 主包：TabNavigator
 * 分包：SettingsScreen（生产环境）/ 主包（开发环境）
 */

import React, { Suspense, useEffect } from 'react';
import { View, ActivityIndicator, Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

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

const UpdateScreen = __DEV__
  ? require('../screens/UpdateTestScreen').default
  : React.lazy(() => import(/* webpackChunkName: "update" */ '../screens/UpdateTestScreen'));

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
  update: undefined;
  BundleError: { bundleName: string };
};

// 分包错误页面组件
type BundleErrorProps = NativeStackScreenProps<RootStackParamList, 'BundleError'>;

function BundleErrorScreen({ route, navigation }: BundleErrorProps) {
  const { bundleName } = route.params;
  const { bundleConfigs } = useAppStore();

  // 从 bundleConfigs 中查找对应的配置信息
  const bundleConfig = bundleConfigs.find(b => b.screen === bundleName);
  const url = bundleConfig?.url || '未配置';
  const version = bundleConfig?.version || '-';

  return (
    <View style={bundleErrorStyles.container}>
      <Text style={bundleErrorStyles.emoji}>📦❌</Text>
      <Text style={bundleErrorStyles.title}>分包配置不存在</Text>
      <Text style={bundleErrorStyles.code}>404</Text>
      <Text style={bundleErrorStyles.message}>
        分包 "{bundleName}" 未在服务端配置{'\n'}请联系管理员添加该分包
      </Text>

      {/* 显示 URL 信息 */}
      {bundleConfig && (
        <View style={bundleErrorStyles.infoBox}>
          <Text style={bundleErrorStyles.infoLabel}>分包信息:</Text>
          <Text style={bundleErrorStyles.infoText}>名称: {bundleConfig.label || bundleName}</Text>
          <Text style={bundleErrorStyles.infoText}>版本: {version}</Text>
          <Text style={bundleErrorStyles.infoUrl} numberOfLines={2}>
            URL: {url}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={bundleErrorStyles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={bundleErrorStyles.buttonText}>← 返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const bundleErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    padding: 20,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  code: { fontSize: 64, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 16 },
  message: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 4 },
  infoUrl: { fontSize: 11, color: '#999', fontFamily: 'monospace' },
  button: { backgroundColor: '#6366f1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

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
        <Stack.Screen name="update" component={UpdateScreen} />

        {/* 分包错误页面 */}
        <Stack.Screen name="BundleError" component={BundleErrorScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}
