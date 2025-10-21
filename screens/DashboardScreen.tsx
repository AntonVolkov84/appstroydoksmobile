import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppMenuBottomSheet from "../components/AppMenuBottomSheet";
import { LinearGradient } from "expo-linear-gradient";
import { ObjectItemData } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export default function DashboardScreen({ route, navigation }: Props) {
  const [objects, setObjects] = useState<ObjectItemData[]>([]);
  const { user: currentUser } = route.params ?? { user: null };

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

  if (!currentUser) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добро пожаловать!</Text>
      <Text style={styles.email}>
        {currentUser.name} {currentUser.surname}
      </Text>

      <View style={styles.blockButton}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Objects", { currentUser })}
          style={styles.shadow}
        >
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.btn}>
            <Text style={styles.btnText}>Мои объекты</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ObjectDetails", { currentUser })}
          style={styles.shadow}
        >
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.btn}>
            <Text style={styles.btnText}>Мои работы</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.blockButton}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ReceivedWorks", { currentUser })}
          style={styles.shadow}
        >
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.btn}>
            <Text style={styles.btnText}>Входящие работы, назначение объекта</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("FinishedWorks", { currentUser })}
          style={styles.shadow}
        >
          <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.btn}>
            <Text style={styles.btnText}>Принятые работы</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <AppMenuBottomSheet currentUser={currentUser} onLogout={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 70,
    textAlign: "center",
  },
  email: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 30,
  },
  blockButton: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  shadow: {
    width: "42%",
    aspectRatio: 1,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  btn: {
    flex: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
