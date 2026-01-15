import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'text';

export interface ToastShowParams {
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastRef {
  show: (params: ToastShowParams) => void;
  hide: () => void; // Hides all
}

const ICONS = {
  success: { name: 'check-circle', color: '#10b981' },
  error: { name: 'cancel', color: '#ef4444' },
  warning: { name: 'warning', color: '#f59e0b' },
  info: { name: 'info', color: '#135bec' },
  loading: { name: 'hourglass-empty', color: '#135bec' },
  text: { name: '', color: '' },
};

const TOAST_HEIGHT = 48; // Base height estimate
const TOAST_GAP = 12; // Gap between toasts
const ITEM_HEIGHT = 64; // Approximate height for calculation (height + padding + margin)

interface InternalToast extends ToastShowParams {
  id: string;
}

const ToastItem = ({
  item,
  index,
  onHide,
  topOffset,
}: {
  item: InternalToast;
  index: number;
  onHide: (id: string) => void;
  topOffset: number;
}) => {
  const animValue = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const posAnim = useRef(new Animated.Value(index * ITEM_HEIGHT)).current; // Vertical Stack Position
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animate to new stack position when index changes
  useEffect(() => {
    Animated.spring(posAnim, {
      toValue: index * ITEM_HEIGHT,
      useNativeDriver: true,
      friction: 12,
      tension: 60,
    }).start();
  }, [index, posAnim]);

  // Entrance Animation
  useEffect(() => {
    Animated.spring(animValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
    }).start();

    // Auto-hide Timer
    if (item.duration !== 0 && item.type !== 'loading') { // Use 0 for infinite
        const duration = item.duration || 2500;
        const timer = setTimeout(() => {
            handleHide();
        }, duration);
        return () => clearTimeout(timer);
    }
  }, []);

  // Spinner Animation
  useEffect(() => {
    if (item.type === 'loading') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [item.type]);

  const handleHide = () => {
      Animated.timing(animValue, {
          toValue: 0,
          duration: 250,
          easing: Easing.ease,
          useNativeDriver: true,
      }).start(({ finished }) => {
          if (finished) onHide(item.id);
      });
  };

  // Interpolations
  const translateY = Animated.add(
      posAnim,
      animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, topOffset], // Start from -100 above, end at topOffset + stackPos
      })
  );

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isTextType = item.type === 'text';
  const iconConfig = ICONS[item.type];
  const bgColor = isTextType ? 'rgba(0,0,0,0.85)' : '#ffffff';
  const textColor = isTextType ? '#ffffff' : '#1e293b';
  const borderColor = isTextType ? 'transparent' : '#f8fafc';

  return (
    <Animated.View
      style={[
        styles.container,
        {
            transform: [{ translateY }],
            opacity,
            backgroundColor: bgColor,
            borderColor,
            zIndex: 999 - index, // Newer items below? No, we want stack logic.
        },
        !isTextType && styles.shadow,
      ]}
    >
        {!isTextType && (
            <View style={styles.iconContainer}>
            {item.type === 'loading' ? (
                <View style={styles.spinnerOrbit}>
                    <Animated.View style={[styles.spinnerWedge, { transform: [{ rotate: spin }] }]} />
                </View>
            ) : (
                <MaterialIcons name={iconConfig.name} size={24} color={iconConfig.color} />
            )}
            </View>
        )}
        <Text style={[styles.message, { color: textColor }]}>
            {item.message}
        </Text>
    </Animated.View>
  );
};

const Toast = forwardRef<ToastRef, {}>((props, ref) => {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<InternalToast[]>([]);

  useImperativeHandle(ref, () => ({
    show: (params: ToastShowParams) => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 5);
      // Prepend new toast so it appears at index 0 (top), pushing others down
      setToasts(prev => [{ ...params, id }, ...prev]);
    },
    hide: () => {
      setToasts([]); // Clear all
    },
  }));

  const removeToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Top offset calculation
  const topOffset = insets.top + 10;

  return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
         {toasts.map((toast, index) => (
             <ToastItem 
                key={toast.id} 
                item={toast} 
                index={index} 
                onHide={removeToast}
                topOffset={topOffset}
            />
         ))}
      </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 120,
    maxWidth: 340,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flexShrink: 1,
  },
  spinnerOrbit: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(19, 91, 236, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerWedge: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#135bec',
  },
});

export default Toast;
