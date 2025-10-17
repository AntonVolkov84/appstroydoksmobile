import React, { useState } from "react";
import { View, Text, TextInput, Image, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import Button from "../components/Button";
import Logo from "../assets/LogoBrowserwithoutBG.png";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("https://api.stroydoks.ru/mobile/register", {
        username,
        name,
        surname,
        email: email.toLocaleLowerCase(),
        password,
      });
      Alert.alert("Успех", "Регистрация завершена. Проверьте почту и подтвердите email.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err: any) {
      Alert.alert("Ошибка регистрации", err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={Logo}></Image>
      <Text style={styles.titleName}>Stroydoks</Text>
      <Text style={styles.title}>Регистрация</Text>
      <TextInput placeholder="Логин" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Имя" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Фамилия" style={styles.input} value={surname} onChangeText={setSurname} />
      <TextInput placeholder="Email" style={styles.input} value={email.toLocaleLowerCase()} onChangeText={setEmail} />
      <TextInput
        placeholder="Пароль"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Зарегистрироваться" containerStyle={{ marginTop: 40 }} onPress={handleRegister} />
      <Button title="Логин" containerStyle={{ marginTop: 15 }} onPress={() => navigation.navigate("Login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
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
    width: 200,
    borderColor: "#ddd",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  image: {
    width: 100,
    height: 100,
    objectFit: "contain",
  },
  titleName: {
    fontSize: 30,
  },
});
