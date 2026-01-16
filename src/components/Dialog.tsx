import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

export type DialogType = 'success' | 'warning' | 'update';

export interface DialogParams {
  type: DialogType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogRef {
  show: (params: DialogParams) => void;
  hide: () => void;
}

const Dialog = forwardRef<DialogRef, {}>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogParams>({ type: 'success', title: '', message: '' });
  
  const animValue = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useImperativeHandle(ref, () => ({
    show: (params: DialogParams) => {
      setConfig(params);
      setVisible(true);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // iOS 标准缓动曲线
        }),
      ]).start();
    },
    hide: handleHide,
  }));

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => {
      setVisible(false);
      scaleAnim.setValue(0.9);
    });
  };

  const handleConfirm = () => {
      config.onConfirm?.();
      handleHide();
  };

  const handleCancel = () => {
      config.onCancel?.();
      handleHide();
  };

  if (!visible) return null;

  // Visual Configuration based on Type
  let iconName = 'check-circle';
  let iconColor = '#22c55e'; // success
  let iconBg = 'rgba(34, 197, 94, 0.1)';
  
  if (config.type === 'warning') {
      iconName = 'warning';
      iconColor = '#f59e0b'; // warning
      iconBg = 'rgba(245, 158, 11, 0.1)';
  } else if (config.type === 'update') {
      iconName = 'system-update-alt';
      iconColor = '#135bec'; // primary
      iconBg = 'rgba(19, 91, 236, 0.1)'; // blue-50
  }

  const isUpdate = config.type === 'update';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleHide}>
      <View style={styles.overlay}>
         <Animated.View style={[styles.backdrop, { opacity: animValue }]} />
         
         <Animated.View style={[styles.dialogContainer, { opacity: animValue, transform: [{ scale: scaleAnim }] }]}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <MaterialIcons name={iconName} size={48} color={iconColor} />
            </View>

            {/* Text Content */}
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>

            {/* Buttons */}
            {config.type === 'success' && (
                <TouchableOpacity style={styles.fullButton} onPress={handleConfirm}>
                    <Text style={styles.fullButtonText}>{config.confirmText || '确定'}</Text>
                </TouchableOpacity>
            )}

            {config.type === 'warning' && (
                <View style={styles.rowButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>{config.cancelText || '取消'}</Text>
                    </TouchableOpacity>
                    <View style={{ width: 12 }} />
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmButtonText}>{config.confirmText || '确认'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {config.type === 'update' && (
                <View style={styles.columnButtons}>
                    <TouchableOpacity style={styles.fullButton} onPress={handleConfirm}>
                        <Text style={styles.fullButtonText}>{config.confirmText || '立即更新'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.textButton} onPress={handleCancel}>
                        <Text style={styles.textButtonText}>{config.cancelText || '以后再说'}</Text>
                    </TouchableOpacity>
                </View>
            )}

         </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // dark dim
  },
  dialogContainer: {
    width: width - 64, // mx-8 approx
    backgroundColor: '#ffffff',
    borderRadius: 24, // rounded-xl +
    padding: 32, // p-8
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24, // mb-6
  },
  title: {
    fontSize: 22, // text-xl
    fontWeight: 'bold',
    color: '#111318',
    marginBottom: 8, // mb-2
    textAlign: 'center',
  },
  message: {
    fontSize: 16, // text-base
    color: '#616f89', // slate-500 approx
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32, // mb-8
  },
  // Button Styles
  fullButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#135bec', // primary
    borderRadius: 24, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#f6f6f8', // background-light
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#111318',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#135bec',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  columnButtons: {
    width: '100%',
    gap: 12,
  },
  textButton: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  textButtonText: {
    color: '#616f89',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Dialog;
