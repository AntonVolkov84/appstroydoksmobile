import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TextInput, Button, Switch, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocketObjects } from "../hooks/websockethooks";
import { WorkItem } from "../types";
import { authRequest } from "../api";

type Props = NativeStackScreenProps<RootStackParamList, "ObjectDetails">;

export default function ObjectDetailsScreen({ route }: Props) {
  const { objectId, currentUser } = route.params;
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");

  const fetchWorks = async () => {
    try {
      const data = await authRequest(async (token) => {
        const res = await axios.get<WorkItem[]>(`https://api.stroydoks.ru/mobile/objects/${objectId}/works`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      });
      setWorks(data);
    } catch (err: any) {
      console.error("Failed to fetch works", err);
      Alert.alert("Ошибка", "Не удалось загрузить работы");
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  useWebSocketObjects((newWork) => {
    if (newWork.type === "work") {
      if (newWork.object.objectId === objectId) {
        setWorks((prev) => [...prev, newWork.object]);
      }
    }
  });

  const addWork = async () => {
    try {
      await authRequest(async (token) => {
        await axios.post(
          `https://api.stroydoks.ru/mobile/objects/${objectId}/works`,
          { title, unit, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      setTitle("");
      setUnit("");
      setQuantity("");
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось добавить работу");
    }
  };

  const toggleAccept = async (workId: number, accepted: boolean) => {
    console.log("toggleAccept called", workId, accepted);
    try {
      await authRequest(async (token) => {
        console.log("Token:", token);
        const res = await axios.put(
          `https://api.stroydoks.ru/mobile/objects/works/${workId}/accept`,
          { accepted },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Server response:", res.data);
        return res.data;
      });
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, accepted } : w)));
    } catch (err) {
      console.error("toggleAccept error", err);
      Alert.alert("Ошибка", "Не удалось обновить статус");
    }
  };

  const exportReport = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await axios.get(`https://api.stroydoks.ru/mobile/objects/${objectId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      Alert.alert("Успех", "Отчет выгружен!");
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось выгрузить отчет");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput placeholder="Название" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput placeholder="Ед. изм." value={unit} onChangeText={setUnit} style={styles.input} />
        <TextInput
          placeholder="Количество"
          value={quantity}
          onChangeText={setQuantity}
          style={styles.input}
          keyboardType="numeric"
        />
        <Button title="Добавить" onPress={addWork} />
      </View>

      <FlatList
        data={works}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.workItem}>
            <Text>
              {item.title} ({item.unit}) - {item.quantity}
            </Text>
            {currentUser.role === "foreman" && (
              <Switch value={item.accepted} onValueChange={(val) => toggleAccept(item.id, val)} />
            )}
          </View>
        )}
      />

      {currentUser.role === "foreman" && works.length > 0 && works.every((w) => w.accepted) && (
        <Button title="Экспортировать отчет" onPress={exportReport} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  form: { marginBottom: 20, marginTop: 70 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 10, borderRadius: 6 },
  workItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
