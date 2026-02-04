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

/**
 * Tab 项数据结构
 */
export interface TabItem {
  key: string;       // 路由键名
  label: string;     // 显示标签
  icon: string;      // 图标名称
}

/**
 * 底部导航栏配置
 * 可在此处修改 tab 名称、图标
 */
const TABS: TabItem[] = [
  { key: 'Home', label: '首页', icon: 'home' },
  { key: 'Explore', label: '圈子', icon: 'explore' },
  { key: 'Notifications', label: '通知', icon: 'list-alt' },
  { key: 'Profile', label: '我的', icon: 'person-outline' },
];

/**
 * 样式常量配置
 */
// 导航栏高度
const TAB_BAR_HEIGHT = 56;
// 选中指示器宽度（蓝色胶囊背景长度）
const INDICATOR_WIDTH = 120;

/**
 * TabButton - 单个标签按钮组件
 * 功能：处理点击事件、显示图标和标签、播放选中/未选中动画
 */
function TabButton({
  route,
  isFocused,
  options,
  tab,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;       // 是否选中状态
  options: any;
  tab: TabItem;             // tab 数据
  onPress: () => void;      // 点击事件
  onLongPress: () => void;  // 长按事件
}) {
  // 缩放动画：选中时放大到 1，未选中缩小到 0.9
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  // 透明度动画：选中时显示标签(1)，未选中隐藏(0)
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  // 监听选中状态变化，触发动画
  useEffect(() => {
    if (isFocused) {
      // 选中时：图标弹跳放大 + 标签淡入
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,      // 弹性张力（越大越弹）
          friction: 8,       // 摩擦力（越小弹越久）
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,     // 淡入动画时长(ms)
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 未选中时：图标缩小 + 标签淡出
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,     // 淡出动画时长(ms)
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
        {/* 图标：选中时白色，未选中灰色 */}
        <MaterialIcons
          name={tab.icon}
          size={22}
          color={isFocused ? '#ffffff' : '#94a3b8'}
        />
        {/* 标签文字：仅选中时显示，带淡入淡出动画 */}
        {isFocused && (
          <Animated.Text style={[styles.tabLabel, { opacity: opacityAnim }]}>
            {tab.label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

/**
 * FloatingTabBar - 自定义底部导航栏组件
 * 特性：悬浮胶囊样式、滑动指示器、平滑过渡动画
 */
export default function FloatingTabBar({
  state,         // 当前路由状态
  descriptors,   // 路由描述信息
  navigation,    // 导航对象
}: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  // 导航栏距离屏幕左右的边距
  const horizontalPadding = 16;
  // 导航栏内部左右留白
  const tabBarPadding = 6;

  // 计算单个 tab 的宽度
  const tabBarWidth = width - horizontalPadding * 2 - tabBarPadding * 2;
  const tabWidth = tabBarWidth / TABS.length;

  // 指示器水平位置动画值
  const indicatorX = useRef(new Animated.Value(tabBarPadding)).current;

  // 监听选中索引变化，更新指示器位置
  useEffect(() => {
    // 计算指示器目标位置：居中于当前选中 tab
    const targetX = tabBarPadding + state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;

    // 使用弹性动画让指示器滑动更自然
    Animated.spring(indicatorX, {
      toValue: targetX,
      tension: 68,      // 张力
      friction: 10,     // 摩擦力
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.container, { width: width - horizontalPadding * 2 }]}>
      <View style={styles.tabBar}>
        {/* 滑动指示器 - 蓝色胶囊背景 */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: INDICATOR_WIDTH,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {/* 渲染所有 Tab 按钮 */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          // 匹配对应的 tab 配置
          const tab = TABS.find((t) => t.key === route.name) || TABS[index];

          // 点击处理
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

          // 长按处理
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

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器：绝对定位，悬浮在屏幕底部
  container: {
    position: 'absolute',
    bottom: 20,      // 距离底部距离
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  // 导航栏主体：白色圆角胶囊背景
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
    elevation: 8,    // Android 阴影
  },
  // 选中指示器：蓝色胶囊背景
  indicator: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT - 12,  // 略小于导航栏高度
    backgroundColor: '#6366f1',    // 选中颜色（主题蓝）
    borderRadius: (TAB_BAR_HEIGHT - 12) / 2,
  },
  // 单个 tab 按钮
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT - 12,
    borderRadius: (TAB_BAR_HEIGHT - 12) / 2,
    zIndex: 1,      // 确保按钮在指示器上方可点击
  },
  // tab 内容容器：水平排列图标和文字
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,         // 图标和文字间距
  },
  // 标签文字样式
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
