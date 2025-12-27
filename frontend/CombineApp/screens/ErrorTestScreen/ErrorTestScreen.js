import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../colors';
import { useError } from '../../context/ErrorContext';
import { ERROR_MESSAGES } from '../../utils';

const ErrorTestScreen = () => {
  const { showError } = useError();

  const testButtons = [
    {
      title: 'Network Error',
      icon: 'wifi-off',
      onPress: () => showError({
        title: 'Connection Error',
        message: ERROR_MESSAGES.NETWORK.NO_CONNECTION,
        category: 'NETWORK'
      })
    },
    {
      title: 'Auth Error',
      icon: 'lock-closed',
      onPress: () => showError({
        title: 'Authentication Error',
        message: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
        category: 'AUTH'
      })
    },
    {
      title: 'Validation Error',
      icon: 'alert-circle',
      onPress: () => showError({
        title: 'Validation Error',
        message: ERROR_MESSAGES.VALIDATION.MISSING_FIELDS,
        category: 'VALIDATION'
      })
    },
    {
      title: 'Server Error',
      icon: 'server',
      onPress: () => showError({
        title: 'Server Error',
        message: ERROR_MESSAGES.SERVER.INTERNAL_ERROR,
        category: 'SERVER'
      })
    },
    {
      title: 'AI Error',
      icon: 'bulb',
      onPress: () => showError({
        title: 'AI Error',
        message: ERROR_MESSAGES.AI.ANALYSIS_FAILED,
        category: 'AI'
      })
    },
    {
      title: 'Not Found Error',
      icon: 'search',
      onPress: () => showError({
        title: 'Not Found',
        message: ERROR_MESSAGES.CLOTHING.NOT_FOUND,
        category: 'NOT_FOUND'
      })
    },
    {
      title: 'Permission Error',
      icon: 'key',
      onPress: () => showError({
        title: 'Permission Required',
        message: ERROR_MESSAGES.PERMISSION.CAMERA_DENIED,
        category: 'PERMISSION'
      })
    },
  ];

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Error System Test</Text>
          <Text style={styles.subtitle}>Tap any button to test error toast</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          {testButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testButton}
              onPress={button.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={button.icon} size={24} color={COLORS.primary} />
              <Text style={styles.buttonText}>{button.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ✅ Toast should slide from top{'\n'}
            ✅ Auto-dismiss after 4 seconds{'\n'}
            ✅ Tap X to dismiss early
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ErrorTestScreen;
