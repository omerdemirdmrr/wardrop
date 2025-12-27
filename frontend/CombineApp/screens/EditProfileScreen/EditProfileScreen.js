import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../colors";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";

import apiClient from "../../api/client";
import { useError } from "../../context/ErrorContext";
import { errorHandler } from "../../utils";

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const { showError } = useError();

    const [username, setUsername] = useState(user?.username || "");
    const [imageUri, setImageUri] = useState(user?.imageUrl || "");
    const [loading, setLoading] = useState(false);

    // useEffect kaldırıldı: Kullanıcı yazı yazarken location update gelince input siliniyordu.

    const handleSave = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', username);

            // Eğer yeni bir resim seçildiyse, dosya olarak ekle
            if (imageUri && imageUri !== user?.imageUrl) {
                const uriParts = imageUri.split('/');
                const fileName = uriParts[uriParts.length - 1];
                let fileType = 'image/jpeg';
                const fileTypeMatch = /\.(\w+)$/.exec(fileName);
                if (fileTypeMatch) {
                    fileType = `image/${fileTypeMatch[1]}`;
                }

                formData.append('image', {
                    uri: imageUri,
                    name: fileName,
                    type: fileType,
                });
            }

            const response = await apiClient.put("/users/profile", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Backend'den gelen user verisini mevcut verilerle birleştir
            if (response.data?.data?.user) {
                updateUser({
                    username: response.data.data.user.username,
                    imageUrl: response.data.data.user.imageUrl
                });
            } else {
                // Fallback: local değerleri kullan
                updateUser({
                    username: username,
                    imageUrl: imageUri
                });
            }
            navigation.goBack();
        } catch (error) {
            const standardError = errorHandler.handleApiError(error);
            showError(errorHandler.formatErrorForUser(standardError));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePhoto = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            showError({
                title: 'Permission Required',
                message: 'Gallery access permission is required',
                category: 'PERMISSION'
            });
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    // --- Render ---
    const placeholderImage = "https://via.placeholder.com/150/FFFFFF/1B1229?text=User";

    return (
        <LinearGradient colors={COLORS.gradient} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <ScrollView>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUri || placeholderImage }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity onPress={handleChangePhoto}>
                            <Text style={styles.changePhotoText}>
                                Change Photo
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Your username"
                            placeholderTextColor={COLORS.gray}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    imageContainer: {
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: "transparent",
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: COLORS.primary,
        marginBottom: 10,
    },
    changePhotoText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    formContainer: { padding: 20 },
    label: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 5,
    },
    input: {
        width: "100%",
        height: 50,
        backgroundColor: COLORS.card,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.secondary,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        marginHorizontal: 20,
        marginTop: 10,
    },
    saveButtonText: {
        color: COLORS.primaryText,
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default EditProfileScreen;
