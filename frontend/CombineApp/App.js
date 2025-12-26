import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { COLORS } from "./colors";

// Ekranlar
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen/ForgotPasswordScreen";
import HomeScreen from "./screens/HomeScreen/HomeScreen";
import WardrobeScreen from "./screens/WardrobeScreen/WardrobeScreen";
import ProfileScreen from "./screens/ProfileScreen/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen/SettingsScreen";
import EditProfileScreen from "./screens/EditProfileScreen/EditProfileScreen";
import EditStyleScreen from "./screens/EditStyleScreen/EditStyleScreen";
import EditDatesScreen from "./screens/EditDatesScreen/EditDatesScreen";
import StatisticsScreen from "./screens/StatisticsScreen/StatisticsScreen";
import AddClothingScreen from "./screens/AddClothingScreen/AddClothingScreen";
import OutfitScreen from "./screens/OutfitScreen/OutfitScreen";
import CreateOutfitScreen from "./screens/CreateOutfitScreen/CreateOutfitScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen/ChangePasswordScreen";

const Stack = createStackNavigator(); // Ana Stack (Global sayfalar için)
const Tab = createBottomTabNavigator();
const WardrobeStack = createStackNavigator();

// --- BAŞLIK AYARLARI ---
const darkScreenOptions = {
  headerStyle: {
    backgroundColor: COLORS.gradient[0], // Koyu lacivert
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
    height: 56, // <-- Küçültmek için burayı değiştir (örnek: 56)
  },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontWeight: "bold",
    fontSize: 22,
  },
  headerTitleContainerStyle: {
    height: 56, // headerStyle.height ile eşleştir
    justifyContent: "center",
  },
  headerTitleAlign: "center",

  //headerBackTitleVisible: false, // Android/iOS'da metin kaldırır
  headerLeftContainerStyle: {
    paddingLeft: 0, // sola uzaklık
    paddingVertical: 27, // dikey konum için ayar (gerekirse değiştir)
  },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Gardırop Stack'i (Başlığı var)
function WardrobeNavigator() {
  return (
    <WardrobeStack.Navigator screenOptions={darkScreenOptions}>
      <WardrobeStack.Screen
        name="WardrobeMain"
        component={WardrobeScreen}
        options={{ title: "My Wardrobe" }}
      />
      <WardrobeStack.Screen
        name="AddClothing"
        component={AddClothingScreen}
        options={{ title: "Add New Item" }}
      />
    </WardrobeStack.Navigator>
  );
}

// --- ANA SEKMELER (DÜZELTİLDİ) ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primaryText,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 10,
          paddingBottom: 80,
          height: 90,
          marginTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeNavigator}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="cut-outline" size={28} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerShown: true,
          ...darkScreenOptions,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Outfits"
        component={OutfitScreen}
        options={{
          title: "My Outfits",
          headerShown: true,
          ...darkScreenOptions,
          tabBarIcon: ({ color }) => (
            <Ionicons name="shirt-outline" size={28} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- APP STACK (GLOBAL YAPI) ---
function AppStack() {
  return (
    <Stack.Navigator screenOptions={darkScreenOptions}>
      {/* 1. Ana Sekmeler (Header kapalı çünkü içerdekiler halledecek) */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      {/* 2. Global Sayfalar (Geri butonu çalışsın diye burada) */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
      <Stack.Screen
        name="EditStyle"
        component={EditStyleScreen}
        options={{ title: "Style & Colors" }}
      />
      <Stack.Screen
        name="EditDates"
        component={EditDatesScreen}
        options={{ title: "Important Dates" }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: "Statistics" }}
      />
      <Stack.Screen
        name="CreateOutfit"
        component={CreateOutfitScreen}
        options={{ title: "Create New Outfit" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Change Password" }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { token, restoreToken } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      await restoreToken();
      setLoading(false);
    };
    bootstrapAsync();
  }, [restoreToken]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    // login ekranı için true yerine token yazın
    <NavigationContainer>
      {true ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
