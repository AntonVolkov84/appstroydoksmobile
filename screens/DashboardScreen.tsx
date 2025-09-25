import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Button from "../components/Button";
import AppMenuBottomSheet from "../components/AppMenuBottomSheet";
import { Role } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ route, navigation }: Props) {
  const { user } = route.params ?? { user: null };
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (!currentUser) {
      navigation.replace("Login");
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    navigation.replace("Login");
  };

  const toggleRole = async () => {
    if (!currentUser) return;
    const newRole = currentUser.role === "foreman" ? "worker" : "foreman";
    const makeRequest = async (token: string) => {
      return axios.put(
        "https://api.stroydoks.ru/mobile/toggle-role",
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    };
    try {
      let accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) throw new Error("No access token");
      try {
        await makeRequest(accessToken);
      } catch (err: any) {
        if (err.response?.status === 403) {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token");
          const res = await axios.post("https://api.stroydoks.ru/mobile/refresh-token", { token: refreshToken });
          accessToken = res.data.accessToken;
          await AsyncStorage.setItem("accessToken", accessToken!);
          await makeRequest(accessToken!);
        } else {
          throw err;
        }
      }
      setCurrentUser((prev) => ({
        ...prev,
        role: prev.role === Role.foreman ? Role.worker : Role.foreman,
      }));
    } catch (err) {
      console.error("Failed to toggle role", err);
      Alert.alert("Ошибка", "Не удалось изменить роль. Попробуйте снова.");
    }
  };

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добро пожаловать!</Text>
      <Text style={styles.email}>
        {currentUser.name} {currentUser.surname}
      </Text>
      <AppMenuBottomSheet
        role={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleRole={toggleRole}
        onManageObjects={() => console.log("ManageObjects")}
        onManageWorkers={() => console.log("ManageWorkers")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f2", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  email: { fontSize: 18, fontWeight: "600", color: "#000", marginTop: 5 },
});
