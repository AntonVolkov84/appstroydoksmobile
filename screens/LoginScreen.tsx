import React, { useState } from "react";
import { View, Text, TextInput, Image, Alert, StyleSheet, TouchableOpacity } from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "../components/Button";
import Logo from "../assets/logo.png";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const saveTokens = async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
  };
  const handleLogin = async () => {
    try {
      const res = await axios.post("https://api.stroydoks.ru/mobile/login", {
        email: email.toLowerCase(),
        password,
      });
      const { accessToken, refreshToken, user } = res.data;
      if (!user.emailconfirmed) {
        Alert.alert("Ошибка", "Подтвердите email перед входом.");
        return;
      }
      await saveTokens(accessToken, refreshToken);
      navigation.replace("Dashboard", { user });
    } catch (err: any) {
      Alert.alert("Ошибка входа", err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={Logo}></Image>
      <Text style={styles.titleName}>Stroydoks</Text>
      <Text style={styles.title}>Вход</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Пароль"
          style={{ flex: 1, marginVertical: 0 }}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>
      <Button title="Войти" containerStyle={{ marginTop: 40 }} onPress={handleLogin} />
      <Button title="Регистрация" containerStyle={{ marginTop: 15 }} onPress={() => navigation.navigate("Register")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 80,
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    width: 200,
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  image: {
    width: 150,
    height: 150,
    objectFit: "contain",
  },
  titleName: {
    fontSize: 30,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 200,
    marginVertical: 8,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  eyeButton: {
    marginLeft: 8,
  },
});
