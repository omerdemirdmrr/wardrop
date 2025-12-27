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
import apiClient from "../../api/client";
import { Ionicons } from "@expo/vector-icons";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";

const ChangePasswordScreen = ({ navigation }) => {
    const { showError } = useError();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);
    const [isOldPasswordVerified, setIsOldPasswordVerified] = useState(false);

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

    // --- ESKİ ŞİFRE DOĞRULAMA ---
    const checkOldPassword = async () => {
        if (!oldPassword) return; // Boşsa kontrol etme

        try {
            const response = await apiClient.post("/auth/verify-password", {
                password: oldPassword
            });
            if (response.data && response.data.success) {
                setIsOldPasswordVerified(true);
            } else {
                setIsOldPasswordVerified(false);
            }
        } catch (error) {
            setIsOldPasswordVerified(false);
            // Hata göstermeye gerek yok, sadece tik çıkmayacak.
        }
    };

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
        
        // 4. Eski şifre doğru mu? (Backend'de tekrar kontrol edilecek ama UI için)
        if (!isOldPasswordVerified) {
             // Kullanıcıya bir şans daha verelim hemen kontrol edelim
             // (Belki blur olmadı)
             try {
                const verCheck = await apiClient.post("/auth/verify-password", { password: oldPassword });
                if (!verCheck.data.success) {
                    Alert.alert("Error", "Old password is incorrect");
                    return;
                }
             } catch (e) {
                 Alert.alert("Error", "Old password is incorrect or network error");
                 return;
             }
        }

        setLoading(true);
        try {
            const response = await apiClient.post("/auth/change-password", {
                oldPassword,
                newPassword,
            });

            if (response.data) {
                navigation.goBack();
            }
        } catch (error) {
            const standardError = errorHandler.handleApiError(error);
            showError(errorHandler.formatErrorForUser(standardError));
        } finally {
            setLoading(false);
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
                                onChangeText={(text) => {
                                    setOldPassword(text);
                                    setIsOldPasswordVerified(false); // Değişince tiki kaldır
                                }}
                                onBlur={checkOldPassword} // Odak kaybolunca kontrol et
                                secureTextEntry
                            />
                             {isOldPasswordVerified && (
                                <Ionicons 
                                    name="checkmark-circle" 
                                    size={24} 
                                    color="green" 
                                    style={styles.checkIcon}
                                />
                            )}
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
                            <View style={styles.passwordRequirements}>
                                <Text style={styles.requirementsTitle}>
                                    Password Rules:
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        isLengthValid
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isLengthValid ? "✓ " : "• "}At least 6 characters
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasUpper
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasUpper ? "✓ " : "• "}At least 1 uppercase letter
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasLower
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasLower ? "✓ " : "• "}At least 1 lowercase letter
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasDigit
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasDigit ? "✓ " : "• "}At least 1 digit
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasSpecial
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasSpecial ? "✓ " : "• "}At least 1 special character
                                </Text>
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
    passwordRequirements: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    requirementsTitle: {
        fontWeight: "bold",
        marginBottom: 10,
        color: COLORS.primary,
    },
    requirementText: {
        fontSize: 14,
        marginBottom: 5,
    },
    valid: {
        color: "green",
    },
    invalid: {
        color: "red",
    },
});

export default ChangePasswordScreen;
