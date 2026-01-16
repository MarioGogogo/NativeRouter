import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

export interface TabItem {
  key: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: 'Home', label: '首页', icon: 'home' },
  { key: 'Explore', label: '圈子', icon: 'explore' },
  { key: 'Notifications', label: '通知', icon: 'list-alt' },
  { key: 'Profile', label: '我的', icon: 'person-outline' },
];

const TAB_BAR_HEIGHT = 56;
const INDICATOR_WIDTH = 70;

// 独立的 TabButton 组件，拥有自己的动画状态
function TabButton({
  route,
  isFocused,
  options,
  tab,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;
  options: any;
  tab: TabItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  // 每个 tab 独立的缩放动画
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    if (isFocused) {
      // 选中时：弹跳放大 + 文字淡入
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 取消选中：缩小 + 文字淡出
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <Pressable
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <MaterialIcons
          name={tab.icon}
          size={22}
          color={isFocused ? '#ffffff' : '#94a3b8'}
        />
        {isFocused && (
          <Animated.Text style={[styles.tabLabel, { opacity: opacityAnim }]}>
            {tab.label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = 16;
  const tabBarPadding = 6;

  // 计算 tab 区域宽度
  const tabBarWidth = width - horizontalPadding * 2 - tabBarPadding * 2;
  const tabWidth = tabBarWidth / TABS.length;

  // 指示器动画值
  const indicatorX = useRef(new Animated.Value(tabBarPadding)).current;

  // 当选中项变化时，更新指示器位置
  useEffect(() => {
    const targetX = tabBarPadding + state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

    Animated.spring(indicatorX, {
      toValue: targetX,
      tension: 68,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.container, { width: width - horizontalPadding * 2 }]}>
      <View style={styles.tabBar}>
        {/* 滑动指示器 - 胶囊形状 */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: INDICATOR_WIDTH,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {/* Tab 内容 */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TABS.find((t) => t.key === route.name) || TABS[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, { merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              tab={tab}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: TAB_BAR_HEIGHT / 2,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  indicator: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT - 12,
    backgroundColor: '#6366f1',
    borderRadius: (TAB_BAR_HEIGHT - 12) / 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT - 12,
    borderRadius: (TAB_BAR_HEIGHT - 12) / 2,
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
