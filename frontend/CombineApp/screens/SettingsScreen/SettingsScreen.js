import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/ConfirmationModal';

// Menü Elemanı (ProfileScreen'deki ile aynı mantık)
const SettingsMenuItem = ({ title, iconName, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemContent}>
      <Ionicons name={iconName} size={22} color={COLORS.primary} />
      <Text style={styles.menuItemText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={22} color={COLORS.gray} />
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View>
          {/* --- DÜZENLEME MENÜLERİ --- */}
          <View style={styles.menuContainer}>
            <SettingsMenuItem
              title="Edit Profile"
              iconName="person-outline"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingsMenuItem
              title="Edit Style and Colors"
              iconName="color-palette-outline"
              onPress={() => navigation.navigate('EditStyle')}
            />

            <SettingsMenuItem
              title="Change Password"
              iconName="lock-closed-outline"
              onPress={() => navigation.navigate('ChangePassword')}
            />
          </View>

          {/* --- LOGOUT BUTTON --- */}
          <View style={styles.logoutButtonContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={'#E74C3C'} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ConfirmationModal
          visible={showLogoutModal}
          title="Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
  },
  menuContainer: {
    // YENİ: Başlığın 'solid' olduğunu varsayarak 10px boşluk
    marginTop: 10,
    marginHorizontal: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginLeft: 15,
  },
  logoutButtonContainer: {
    marginHorizontal: 10,
    marginTop: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
  },
  logoutButtonText: {
    fontSize: 18,
    color: '#E74C3C',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default SettingsScreen;
