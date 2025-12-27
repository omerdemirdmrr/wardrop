import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../screens/colors';

const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning', // 'warning', 'danger', 'info'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'help-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return '#FF6B6B';
      case 'warning':
        return '#FFB74D';
      case 'info':
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[COLORS.gradient[1], COLORS.gradient[2]]}
            style={styles.gradient}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon()} size={60} color={getIconColor()} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={type === 'danger' ? ['#FF6B6B', '#FF5252'] : [COLORS.primary, COLORS.secondary]}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  cancelText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    overflow: 'hidden',
  },
  confirmGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConfirmationModal;
