import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import AppMenuBottomSheet from "../components/AppMenuBottomSheet";
import { Role } from "../types";
import { useWebSocketObjects } from "../hooks/websockethooks";
import { ObjectItemData } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ route, navigation }: Props) {
  const { user } = route.params ?? { user: null };
  const [currentUser, setCurrentUser] = useState(user);
  const [objects, setObjects] = useState<ObjectItemData[]>([]);

  useWebSocketObjects((newObject) => {
    setObjects((prev) => [...prev, newObject]);
  });
  const fetchObjects = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const res = await axios.get("https://api.stroydoks.ru/mobile/objects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setObjects(res.data);
    } catch (err) {
      console.error("Failed to fetch objects", err);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchObjects();
    }, [])
  );

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
      <FlatList
        data={objects}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
        contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}
        renderItem={({ item, index }) => (
          <LinearGradient
            colors={["#6b73ff", "#000dff"]}
            start={[0, 0]}
            end={[1, 1]}
            style={{
              width: objects.length === 1 ? "100%" : "45%",
              borderRadius: 12,
              padding: 15,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={styles.objectTitle}>{item.title}</Text>
            <Text style={styles.objectAddress}>{item.address}</Text>
          </LinearGradient>
        )}
      />
      <AppMenuBottomSheet
        role={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleRole={toggleRole}
        onManageObjects={() => navigation.navigate("Objects")}
        onManageWorkers={() => navigation.navigate("Workers")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f2", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, marginTop: 70, textAlign: "center" },
  email: { fontSize: 18, fontWeight: "600", color: "#000", marginTop: 5 },

  objectTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 5,
    textAlign: "center",
  },
  objectAddress: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
