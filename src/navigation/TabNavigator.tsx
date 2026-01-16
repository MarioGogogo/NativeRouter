import React from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Screens
import RecommendScreen from '../screens/RecommendScreen';
import ChunkScreen from '../screens/ChunkScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Custom Tab Bar
import FloatingTabBar from '../components/FloatingTabBar';

export type TabParamList = {
  Home: undefined;
  Chunks: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// 自定义页面切换动画 - 平滑淡入淡出
const sceneAnimationEnabled = true;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        // 隐藏默认的 tab bar 背景
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={RecommendScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="grid-view" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chunks"
        component={ChunkScreen}
        options={{
          tabBarLabel: '分包',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="extension" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: '通知',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="notifications-none" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: '个人',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person-outline" size={28} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
