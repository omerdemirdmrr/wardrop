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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../colors";
import { useAuth } from "../../context/AuthContext";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";
import apiClient from "../../api/client";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login } = useAuth();
    const { showError } = useError();

    // Basit e-posta doğrulama
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Temel e-posta formatı
        return re.test(String(email).trim().toLowerCase()); // E-postayı normalize edip kontrol et
    };

    // --- GİRİŞ MANTIĞI ---
    const handleLogin = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!validateEmail(normalizedEmail)) {
            showError({
                title: 'Validation Error',
                message: 'Please enter a valid email address',
                category: 'VALIDATION'
            });
            return;
        }

        if (!password || password.trim() === "") {
            showError({
                title: 'Validation Error',
                message: 'Please enter your password',
                category: 'VALIDATION'
            });
            return;
        }

        // 1. Context içindeki login fonksiyonunu çağır (API isteği orada yapılır)
        const result = await login(normalizedEmail, password);

        // 2. Eğer giriş başarısızsa kullanıcıya hata göster
        if (!result.success) {
            // Check if error is email not verified
            if (result.error?.response?.data?.code === "EMAIL_NOT_VERIFIED" ||
                result.error?.response?.data?.message?.includes("Email not verified")) {
                
                // Show alert with resend option
                Alert.alert(
                    "Email Not Verified",
                    "Please verify your email before logging in. Would you like us to resend the verification email?",
                    [
                        {
                            text: "Cancel",
                            style: "cancel"
                        },
                        {
                            text: "Resend Email",
                            onPress: async () => {
                                try {
                                    await apiClient.post("/users/resend-verification", { email: normalizedEmail });
                                    Alert.alert("Success", "Verification email sent! Please check your inbox.");
                                } catch (error) {
                                    showError({
                                        title: 'Error',
                                        message: 'Failed to resend verification email',
                                        category: 'NETWORK'
                                    });
                                }
                            }
                        }
                    ]
                );
            } else {
                // Show normal error
                const standardError = errorHandler.handleApiError(result.error);
                showError(errorHandler.formatErrorForUser(standardError));
            }
        }
        // NOT: Eğer giriş başarılı olursa, App.js'teki 'token' state'i değişeceği için
        // uygulama otomatik olarak Ana Sayfa'ya (MainTabs) geçiş yapacaktır.
    };

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                {/* Klavye açıldığında ekranı yukarı itmek için */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                >
                    <View style={styles.innerContainer}>
                        <Text style={styles.title}>Combine</Text>
                        <Text style={styles.subtitle}>Welcome back!</Text>

                        {/* E-posta Giriş Alanı */}
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.gray}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address" // Klavye tipini e-postaya uygun açar
                            autoCapitalize="none" // Baş harfi otomatik büyütme (e-posta için önemlidir)
                            autoCorrect={false}
                        />

                        {/* Şifre Giriş Alanı */}
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={COLORS.gray}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true} // Şifreyi gizle (***)
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate("ForgotPassword")}
                            style={{ alignSelf: 'flex-end', marginBottom: 15 }}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Giriş Butonu */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                        >
                            <Text style={styles.buttonText}>Log in</Text>
                        </TouchableOpacity>

                        {/* Kayıt Ol Yönlendirmesi */}
                        <View style={styles.registerLinkContainer}>
                            <Text style={styles.registerText}>
                                Don't have an account?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate("Register")}
                            >
                                <Text style={styles.link}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

// --- STİLLER GÜNCELLENDİ (KOYU TEMA) ---
const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: "bold",
        color: COLORS.textPrimary, // Beyaz yazı
        fontFamily: Platform.OS === "ios" ? "Arial" : "sans-serif-condensed",
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary, // Gri yazı
        marginBottom: 40,
    },
    input: {
        width: "100%",
        height: 50,
        backgroundColor: COLORS.card, // Kart rengi
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.secondary, // Mor çerçeve
        color: COLORS.textPrimary, // Beyaz yazı
    },
    button: {
        width: "100%",
        height: 50,
        backgroundColor: COLORS.primary, // Açık lila buton
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.primaryText, // Siyah yazı
        fontSize: 18,
        fontWeight: "bold",
    },
    registerLinkContainer: {
        flexDirection: "row",
        marginTop: 20,
    },
    registerText: {
        color: COLORS.textSecondary, // Gri yazı
        fontSize: 16,
    },
    link: {
        color: COLORS.primary, // Açık lila link
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default LoginScreen;
