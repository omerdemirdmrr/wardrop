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
import apiClient from "../../api/client"; // API istekleri için
import { FeOffset } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const RegisterScreen = ({ navigation }) => {
    // --- FORM STATE'LERİ ---
    const [username, setUsername] = useState("");
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false); // İşlem sırasında butonu kilitlemek için
    const [passwordFocused, setPasswordFocused] = useState(false); // şifre alanı focus kontrolü

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

        // Kullanıcı adı kontrolü
        if (!validateUsername(username)) {
            Alert.alert(
                "Invalid Username",
                "Username must be 3-20 characters; may contain letters, numbers, . _ -. Cannot start/end or contain consecutive . _ -, and cannot be all digits."
            );
            return;
        }

        // E-posta geçerli mi kontrol et
        if (!validateEmail(normalizedEmail)) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert(
                "Weak Password",
                "Password must be at least 6 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character."
            );
            return;
        }

        // 1. Şifreler eşleşiyor mu kontrolü
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match!");
            return;
        }

        // 2. Boş alan kontrolü
        if (!username || !normalizedEmail || !password) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        setLoading(true); // Yükleniyor başlat
        try {
            // 3. Backend'e kayıt isteği gönder (normalize edilmiş e-posta gönderiliyor)
            const response = await apiClient.post("/users/signup", {
                username: username.trim(),
                email: normalizedEmail,
                password,
            });

            // 4. Başarılı ise Login ekranına yönlendir
            if (response.data) {
                Alert.alert("Registration Successful!", "Please log in.");
                navigation.navigate("Login");
            }
        } catch (error) {
            // Hata mesajını yakala ve kullanıcıya göster
            const errorMessage =
                error.response?.data?.message ||
                "An unexpected error occurred.";
            Alert.alert("Registration Failed", errorMessage);
        } finally {
            setLoading(false); // Yükleniyor bitir
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
                            <View style={styles.passwordRequirements}>
                                <Text style={styles.requirementsTitle}>
                                    Username Rules:
                                </Text>

                                <Text
                                    style={[
                                        styles.requirementText,
                                        isUsernameLengthValid
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isUsernameLengthValid ? "✓ " : "• "}
                                    Length: 3–20 characters
                                </Text>

                                <Text
                                    style={[
                                        styles.requirementText,
                                        isUsernameAllowedChars
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isUsernameAllowedChars ? "✓ " : "• "}Only
                                    letters, numbers, . _ -
                                </Text>

                                <Text
                                    style={[
                                        styles.requirementText,
                                        isUsernameNoEdgeSpecial
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isUsernameNoEdgeSpecial ? "✓ " : "• "}
                                    Cannot start/end with . _ -
                                </Text>

                                <Text
                                    style={[
                                        styles.requirementText,
                                        isUsernameNoConsecutiveSpecial
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isUsernameNoConsecutiveSpecial
                                        ? "✓ "
                                        : "• "}
                                    Cannot have consecutive . _ -
                                </Text>

                                <Text
                                    style={[
                                        styles.requirementText,
                                        isUsernameNotAllDigits
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {isUsernameNotAllDigits ? "✓ " : "• "}Cannot
                                    be all digits
                                </Text>
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

                        <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor={COLORS.gray}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
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

                        {/* Şifre kuralları - sadece şifre alanı focus olduğunda görünür */}
                        {passwordFocused && (
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
                                    {isLengthValid ? "✓ " : "• "}At least 6
                                    characters
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasUpper
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasUpper ? "✓ " : "• "}At least 1 uppercase
                                    letter
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        hasLower
                                            ? styles.valid
                                            : styles.invalid,
                                    ]}
                                >
                                    {hasLower ? "✓ " : "• "}At least 1 lowercase
                                    letter
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
                                    {hasSpecial ? "✓ " : "• "}At least 1 special
                                    character
                                </Text>
                            </View>
                        )}

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
});

export default RegisterScreen;
