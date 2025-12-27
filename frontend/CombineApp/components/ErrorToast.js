import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../screens/colors';

const ErrorToast = ({ visible, title, message, category, onDismiss, duration = 4000 }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const getIconName = () => {
    switch (category) {
      case 'NETWORK':
        return 'wifi-off';
      case 'AUTH':
        return 'lock-closed';
      case 'VALIDATION':
        return 'alert-circle';
      case 'SERVER':
        return 'server';
      case 'AI':
        return 'bulb';
      case 'NOT_FOUND':
        return 'search';
      case 'PERMISSION':
        return 'key';
      default:
        return 'warning';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={24} color="#FF6B6B" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>

        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default ErrorToast;
