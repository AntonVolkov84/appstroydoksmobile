import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Alert, TextInput, TouchableOpacity, Modal } from "react-native";
import Button from "../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { User } from "../types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import api, { authRequest } from "../api";

type WorkersScreenProps = NativeStackScreenProps<RootStackParamList, "Workers">;

export default function WorkersScreen({ navigation }: WorkersScreenProps) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const fetchWorkers = async () => {
    try {
      const res = await authRequest((token) => api.get("/workers", { headers: { Authorization: `Bearer ${token}` } }));
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Ошибка", "Не удалось загрузить список рабочих");
    }
  };
  useEffect(() => {
    fetchWorkers();
  }, []);

  const addWorker = async () => {
    if (!newEmail) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      Alert.alert("Ошибка", "Введите корректный email");
      setNewEmail("");
      return;
    }
    try {
      await authRequest((token) =>
        api.post("/workers", { email: newEmail }, { headers: { Authorization: `Bearer ${token}` } })
      );
      fetchWorkers();
      setNewEmail("");
      setModalVisible(false);
    } catch (err: any) {
      console.error(err);
      const message = err.error || "Не удалось добавить рабочего";
      Alert.alert("Ошибка", message);
    }
  };
  const deleteWorker = (worker: User) => {
    Alert.alert("Удалить рабочего", `Вы уверены, что хотите удалить ${worker.name} ${worker.surname}?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await authRequest((token) =>
              api.delete(`/workers/${worker.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            );
            fetchWorkers();
          } catch (err) {
            console.error("Ошибка при удалении рабочего:", err);
            Alert.alert("Ошибка", "Не удалось удалить рабочего");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.workerItem} onLongPress={() => deleteWorker(item)}>
      <Text style={styles.workerText}>
        {item.name} {item.surname}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="Добавить рабочего" onPress={() => setModalVisible(true)} />
      <Text style={{ textAlign: "center", marginTop: 5 }}>Для удаления - долгое нажатие на рабочего</Text>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
      <Button containerStyle={{ marginBottom: 40 }} title="Назад" onPress={() => navigation.goBack()} />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить рабочего</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button title="Добавить" onPress={addWorker} containerStyle={{ marginBottom: 10 }} />
            <Button title="Отмена" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2", paddingTop: 70 },
  workerItem: { paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  workerText: { fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 },
});
