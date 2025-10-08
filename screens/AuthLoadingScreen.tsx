import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { authRequest } from "../api";

type Props = NativeStackScreenProps<RootStackParamList, "AuthLoading">;

export default function AuthLoading({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          navigation.replace("Login");
          return;
        }
        const res = await authRequest(async (token) => {
          return axios.get("https://api.stroydoks.ru/mobile/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        });

        const user = res.data;
        if (!user.emailconfirmed) {
          navigation.replace("Login");
          return;
        }

        navigation.replace("Dashboard", { user: user });
      } catch (err) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        navigation.replace("Login");
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
