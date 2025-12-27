import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../colors";
import { Ionicons } from "@expo/vector-icons";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";
import { changePassword } from "../../api/users";

const ChangePasswordScreen = ({ navigation }) => {
    const { showError } = useError();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);

    // Şifre doğrulama: en az 6 karakter, en az 1 büyük, 1 küçük, 1 rakam ve 1 noktalama/özel karakter
    const validatePassword = (pwd) => {
        const re =
            /^(?=.{6,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).*$/;
        return re.test(pwd);
    };

    const isLengthValid = newPassword.length >= 6;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword);

    const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const isNewPasswordValid = isLengthValid && hasUpper && hasLower && hasDigit && hasSpecial;

    // --- ŞİFRE DEĞİŞTİRME MANTIĞI ---
    const handleChangePassword = async () => {
        // 1. Yeni şifre kurallara uyuyor mu?
        if (!validatePassword(newPassword)) {
            showError({
                title: 'Validation Error',
                message: 'Password must be at least 6 characters with uppercase, lowercase, digit, and special character',
                category: 'VALIDATION'
            });
            return;
        }

        // 2. Şifreler eşleşiyor mu kontrolü
        if (newPassword !== confirmPassword) {
            showError({
                title: 'Validation Error',
                message: 'Passwords do not match',
                category: 'VALIDATION'
            });
            return;
        }

        // 3. Boş alan kontrolü
        if (!oldPassword || !newPassword || !confirmPassword) {
            showError({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                category: 'VALIDATION'
            });
            return;
        }

        setLoading(true);
        const result = await changePassword(oldPassword, newPassword);
        setLoading(false);

        if (result.success) {
            Alert.alert("Success", "Password changed successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } else {
            showError(errorHandler.formatErrorForUser(result.error));
        }
    };

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.title}>Change Password</Text>
                        <Text style={styles.subtitle}>Update your security settings</Text>

                        {/* Eski Şifre */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Old Password"
                                placeholderTextColor={COLORS.gray}
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Yeni Şifre */}
                        {/* Yeni Şifre */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                placeholderTextColor={COLORS.gray}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                onFocus={() => setNewPasswordFocused(true)}
                                onBlur={() => setNewPasswordFocused(false)}
                                secureTextEntry
                            />
                            {isNewPasswordValid && (
                                <Ionicons 
                                    name="checkmark-circle" 
                                    size={24} 
                                    color="green" 
                                    style={styles.checkIcon}
                                />
                            )}
                        </View>

                        {/* Yeni Şifre Kuralları */}
                        {newPasswordFocused && (
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementsTitle}>
                                    Password Requirements
                                </Text>
                                
                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isLengthValid && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isLengthValid ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isLengthValid ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isLengthValid && styles.requirementLabelValid]}>
                                        At least 6 characters
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, hasUpper && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={hasUpper ? "checkmark" : "close"} 
                                            size={14} 
                                            color={hasUpper ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, hasUpper && styles.requirementLabelValid]}>
                                        At least 1 uppercase letter
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, hasLower && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={hasLower ? "checkmark" : "close"} 
                                            size={14} 
                                            color={hasLower ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, hasLower && styles.requirementLabelValid]}>
                                        At least 1 lowercase letter
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, hasDigit && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={hasDigit ? "checkmark" : "close"} 
                                            size={14} 
                                            color={hasDigit ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, hasDigit && styles.requirementLabelValid]}>
                                        At least 1 digit
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, hasSpecial && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={hasSpecial ? "checkmark" : "close"} 
                                            size={14} 
                                            color={hasSpecial ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, hasSpecial && styles.requirementLabelValid]}>
                                        At least 1 special character
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Yeni Şifre Tekrar */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                placeholderTextColor={COLORS.gray}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                            {isMatch && (
                                <Ionicons 
                                    name="checkmark-circle" 
                                    size={24} 
                                    color="green" 
                                    style={styles.checkIcon}
                                />
                            )}
                        </View>

                        {/* Şifreyi Değiştir Butonu */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    "Change Password"
                                )}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.primary,
        marginBottom: 10,
        marginTop: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#999090ff",
        marginBottom: 40,
        textAlign: "center",
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        height: 50,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        width: '100%',
    },
    checkIcon: {
        position: 'absolute',
        right: 15,
        top: 13, // Vertically centered roughly (50 height / 2) - half icon + padding
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30, // Add some bottom margin for scrolling
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "bold",
    },
    requirementsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(177, 59, 255, 0.2)',
    },
    requirementsTitle: {
        fontWeight: "bold",
        marginBottom: 12,
        color: COLORS.textPrimary,
        fontSize: 14,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    requirementIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderWidth: 1.5,
        borderColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    requirementIconValid: {
        backgroundColor: 'rgba(177, 59, 255, 0.15)',
        borderColor: COLORS.primary,
    },
    requirementLabel: {
        fontSize: 13,
        color: '#999',
        flex: 1,
    },
    requirementLabelValid: {
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
});

export default ChangePasswordScreen;
