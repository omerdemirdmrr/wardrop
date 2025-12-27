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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../colors";
import apiClient from "../../api/client";
import { FeOffset } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";

const RegisterScreen = ({ navigation }) => {
    const { showError } = useError();
    const [username, setUsername] = useState("");
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Basit e-posta doğrulama
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Temel e-posta formatı
        return re.test(String(email).trim().toLowerCase());
    };

    // Şifre doğrulama: en az 6 karakter, en az 1 büyük, 1 küçük, 1 rakam ve 1 noktalama/özel karakter
    const validatePassword = (pwd) => {
        const re =
            /^(?=.{6,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).*$/;
        return re.test(pwd);
    };

    // Kullanıcı adı doğrulama:
    // - Uzunluk: 3-20
    // - İzin: harf, rakam, . _ - içerebilir
    // - Başta/sonda . _ - olamaz
    // - Ardışık . _ - olamaz
    // - Tamamı rakam olamaz
    const validateUsername = (name) => {
        const trimmed = String(name).trim();
        const re =
            /^(?=.{3,20}$)(?![._-])(?!.*[._-]{2})(?!^\d+$)[A-Za-z0-9._-]+(?<![._-])$/;
        return re.test(trimmed);
    };

    const isLengthValid = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

    const isPasswordValid = isLengthValid && hasUpper && hasLower && hasDigit && hasSpecial;
    const isMatch = password && confirmPassword && password === confirmPassword;

    // --- Kullanıcı adı canlı kontrolleri (UI için) ---
    const trimmedUsername = String(username).trim();
    const isUsernameLengthValid =
        trimmedUsername.length >= 3 && trimmedUsername.length <= 20;
    const isUsernameAllowedChars =
        /^[A-Za-z0-9._-]+$/.test(trimmedUsername) || trimmedUsername === "";
    const isUsernameNoEdgeSpecial = !/^[._-]|[._-]$/.test(trimmedUsername);
    const isUsernameNoConsecutiveSpecial = !/[._-]{2}/.test(trimmedUsername);
    const isUsernameNotAllDigits = !/^\d+$/.test(trimmedUsername);
    const isUsernameValid =
        isUsernameLengthValid &&
        isUsernameAllowedChars &&
        isUsernameNoEdgeSpecial &&
        isUsernameNoConsecutiveSpecial &&
        isUsernameNotAllDigits;

    // --- KAYIT OLMA MANTIĞI ---
    const handleRegister = async () => {
        // Normalize edilmiş e-posta
        const normalizedEmail = email.trim().toLowerCase();

        if (!validateUsername(username)) {
            showError({
                title: 'Validation Error',
                message: 'Username must be 3-20 characters; may contain letters, numbers, . _ -',
                category: 'VALIDATION'
            });
            return;
        }

        if (!validateEmail(normalizedEmail)) {
            showError({
                title: 'Validation Error',
                message: 'Please enter a valid email address',
                category: 'VALIDATION'
            });
            return;
        }

        if (!validatePassword(password)) {
            showError({
                title: 'Validation Error',
                message: 'Password must be at least 6 characters with uppercase, lowercase, digit, and special character',
                category: 'VALIDATION'
            });
            return;
        }

        if (password !== confirmPassword) {
            showError({
                title: 'Validation Error',
                message: 'Passwords do not match',
                category: 'VALIDATION'
            });
            return;
        }

        if (!username || !normalizedEmail || !password) {
            showError({
                title: 'Validation Error',
                message: 'Please fill in all fields',
                category: 'VALIDATION'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post("/users/signup", {
                username: username.trim(),
                email: normalizedEmail,
                password,
            });

            if (response.data) {
                navigation.navigate("Login");
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
                    <View style={styles.innerContainer}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Let's get started!</Text>

                        {/* Form Alanları */}
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={COLORS.gray}
                            value={username}
                            onChangeText={setUsername}
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                            autoCapitalize="none"
                        />

                        {/* Kullanıcı adı kuralları - sadece kullanıcı adı alanı focus olduğunda görünür */}
                        {usernameFocused && (
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementsTitle}>
                                    Username Requirements
                                </Text>
                                
                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isUsernameLengthValid && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isUsernameLengthValid ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isUsernameLengthValid ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isUsernameLengthValid && styles.requirementLabelValid]}>
                                        3-20 characters
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isUsernameAllowedChars && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isUsernameAllowedChars ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isUsernameAllowedChars ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isUsernameAllowedChars && styles.requirementLabelValid]}>
                                        Only letters, numbers, . _ -
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isUsernameNoEdgeSpecial && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isUsernameNoEdgeSpecial ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isUsernameNoEdgeSpecial ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isUsernameNoEdgeSpecial && styles.requirementLabelValid]}>
                                        No . _ - at start/end
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isUsernameNoConsecutiveSpecial && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isUsernameNoConsecutiveSpecial ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isUsernameNoConsecutiveSpecial ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isUsernameNoConsecutiveSpecial && styles.requirementLabelValid]}>
                                        No consecutive . _ -
                                    </Text>
                                </View>

                                <View style={styles.requirementRow}>
                                    <View style={[styles.requirementIcon, isUsernameNotAllDigits && styles.requirementIconValid]}>
                                        <Ionicons 
                                            name={isUsernameNotAllDigits ? "checkmark" : "close"} 
                                            size={14} 
                                            color={isUsernameNotAllDigits ? COLORS.primary : "#FF6B6B"} 
                                        />
                                    </View>
                                    <Text style={[styles.requirementLabel, isUsernameNotAllDigits && styles.requirementLabelValid]}>
                                        Cannot be all numbers
                                    </Text>
                                </View>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.gray}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={COLORS.gray}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                secureTextEntry
                            />
                            {isPasswordValid && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="green"
                                    style={styles.checkIcon}
                                />
                            )}
                        </View>

                        {/* Şifre kuralları - password field'dan hemen sonra */}
                        {passwordFocused && (
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
                                        One uppercase letter
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
                                        One lowercase letter
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
                                        One digit
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
                                        One special character
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
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

                        {/* Kayıt Ol butonu */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading} // Yükleniyorsa butonu devre dışı bırak
                        >
                            <Text style={styles.buttonText}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    "Sign Up"
                                )}
                            </Text>
                        </TouchableOpacity>

                        {/* Zaten hesabım var, giriş yap butonu */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Login")}
                            style={styles.loginRedirect}
                        >
                            <Text style={styles.loginRedirectText}>
                                Already have an account? Log in
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        justifyContent: "center",
        padding: 20,
    },
    innerContainer: {
        flex: 1,
        justifyContent: "center",
        width: "100%",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#999090ff",
        marginBottom: 40,
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
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "bold",
    },
    loginRedirect: {
        marginTop: 15,
        alignItems: "center",
    },
    loginRedirectText: {
        color: COLORS.primary,
        color: "#999090ff", // istediğiniz renk (hex, rgb veya COLORS'dan bir değer)
        fontSize: 16,
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
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    checkIcon: {
        position: 'absolute',
        right: 15,
        top: 13,
    },
    // Modern requirement styles
    requirementsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(177, 59, 255, 0.2)',
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

export default RegisterScreen;
