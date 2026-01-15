/**
 * 导航参数类型定义
 * 定义每个屏幕可接收的参数
 */

export type RootStackParamList = {
  Home: undefined;
  Profile: { name: string };
};

// 声明全局类型，使 useNavigation 和 useRoute 具有类型安全
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
