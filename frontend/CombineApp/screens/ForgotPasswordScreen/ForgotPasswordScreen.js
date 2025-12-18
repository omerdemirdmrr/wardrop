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

const ForgotPasswordScreen = ({ navigation }) => {
    // --- STEPS: 1=Email, 2=Code, 3=NewPassword ---
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // --- FORM DATA ---
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // --- VALIDATION UI STATES (Step 3) ---
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);

    // --- VALIDATION LOGIC ---
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
    const isPasswordValid = isLengthValid && hasUpper && hasLower && hasDigit && hasSpecial;

    // --- HANDLERS ---

    // STEP 1: Send Code
    const handleSendCode = async () => {
        if (!email || !email.includes("@")) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            // Backend endpoint: /auth/forgot-password
            await apiClient.post("/auth/forgot-password", { email });
            Alert.alert("Success", "Verification code sent to your email. Please check your Inbox and Spam/Junk folder.");
            setStep(2);
        } catch (error) {
            const msg = error.response?.data?.message || "Could not send code.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify Code
    const handleVerifyCode = async () => {
        if (!code || code.length < 6) {
            Alert.alert("Invalid Code", "Please enter the 6-digit code.");
            return;
        }

        setLoading(true);
        try {
            // Backend endpoint: /auth/verify-code
            await apiClient.post("/auth/verify-code", { email, code });
            Alert.alert("Success", "Code verified.");
            setStep(3);
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid code.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: Reset Password
    const handleResetPassword = async () => {
        if (!validatePassword(newPassword)) {
            Alert.alert("Weak Password", "Please follow the password rules.");
            return;
        }
        if (!isMatch) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // Backend endpoint: /auth/reset-password
            await apiClient.post("/auth/reset-password", {
                email,
                code,
                newPassword
            });
            
            Alert.alert("Success", "Password reset successfully! You can now log in.");
            navigation.navigate("Login");
        } catch (error) {
            const msg = error.response?.data?.message || "Could not reset password.";
            Alert.alert("Error", msg);
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
                        <TouchableOpacity 
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                        </TouchableOpacity>

                        <Text style={styles.title}>
                            {step === 1 ? "Forgot Password" : step === 2 ? "Enter Code" : "Reset Password"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 1 
                                ? "Enter your email to receive a verification code."
                                : step === 2 
                                ? `We sent a code to ${email}`
                                : "Create a new strong password."
                            }
                        </Text>

                        {/* --- STEP 1: EMAIL --- */}
                        {step === 1 && (
                            <View style={styles.formSection}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor={COLORS.gray}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleSendCode}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Send Code</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* --- STEP 2: CODE --- */}
                        {step === 2 && (
                            <View style={styles.formSection}>
                                <TextInput
                                    style={[styles.input, { letterSpacing: 5, textAlign: 'center', fontSize: 24 }]}
                                    placeholder="000000"
                                    placeholderTextColor={COLORS.gray}
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleVerifyCode}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Verify Code</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* --- STEP 3: NEW PASSWORD --- */}
                        {step === 3 && (
                            <View style={styles.formSection}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="New Password"
                                        placeholderTextColor={COLORS.gray}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                        onFocus={() => setNewPasswordFocused(true)}
                                        onBlur={() => setNewPasswordFocused(false)}
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

                                {newPasswordFocused && (
                                    <View style={styles.passwordRequirements}>
                                        <Text style={styles.requirementsTitle}>Password Rules:</Text>
                                        <Text style={[styles.requirementText, isLengthValid ? styles.valid : styles.invalid]}>
                                            {isLengthValid ? "✓ " : "• "}At least 6 characters
                                        </Text>
                                        <Text style={[styles.requirementText, hasUpper ? styles.valid : styles.invalid]}>
                                            {hasUpper ? "✓ " : "• "}At least 1 uppercase letter
                                        </Text>
                                        <Text style={[styles.requirementText, hasLower ? styles.valid : styles.invalid]}>
                                            {hasLower ? "✓ " : "• "}At least 1 lowercase letter
                                        </Text>
                                        <Text style={[styles.requirementText, hasDigit ? styles.valid : styles.invalid]}>
                                            {hasDigit ? "✓ " : "• "}At least 1 digit
                                        </Text>
                                        <Text style={[styles.requirementText, hasSpecial ? styles.valid : styles.invalid]}>
                                            {hasSpecial ? "✓ " : "• "}At least 1 special character
                                        </Text>
                                    </View>
                                )}

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

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Change Password</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                        
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: "center",
    },
    backButton: {
        position: 'absolute',
        top: 20, // Adjust based on safe area if needed, but ScrollView padding handles some. 
        // Better: put it in a header row or just rely on standard positions.
        // Given 'justifyContent: center', absolute positioning at top might be weird if content is centered.
        // Let's just put it in the flow or top-left.
        left: 0,
        zIndex: 10,
        padding: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.primary,
        marginBottom: 10,
        marginTop: 60, // Space for back button
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#999090",
        marginBottom: 40,
        textAlign: "center",
    },
    formSection: {
        width: '100%',
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
        top: 13,
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
    valid: { color: "green" },
    invalid: { color: "red" },
});

export default ForgotPasswordScreen;
