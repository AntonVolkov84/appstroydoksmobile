import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, Modal, TextInput, Switch, Alert, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocketObjects } from "../hooks/websockethooks";
import { WorkItem, WSMessage } from "../types";
import { authRequest } from "../api";
import Button from "../components/Button";
import { Pencil, Trash2, Copy } from "lucide-react-native";

type Props = NativeStackScreenProps<RootStackParamList, "ObjectDetails">;

export default function ObjectDetailsScreen({ route, navigation }: Props) {
  const { objectId, currentUser } = route.params;
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editWorkItem, setEditWorkItem] = useState<WorkItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editUnit, setEditUnit] = useState("");

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

  const openEditModal = (work: WorkItem) => {
    setEditWorkItem(work);
    setEditTitle(work.title);
    setEditUnit(work.unit);
    setEditQuantity(work.quantity.toString());
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editWorkItem) return;

    try {
      await authRequest(async (token) => {
        await axios.put(
          `https://api.stroydoks.ru/mobile/objects/works/${editWorkItem.id}`,
          {
            title: editTitle,
            unit: editUnit,
            quantity: editQuantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось изменить работу");
    }
  };

  useWebSocketObjects((msg: WSMessage) => {
    if (msg.type === "work") {
      if (!msg.object) {
        fetchWorks();
        return;
      }
      setWorks((prev) => {
        const exists = prev.some((w) => w.id === msg.object.id);
        if (exists) return prev;
        return [...prev, msg.object];
      });
    }
    if (msg.type === "work-update") {
      setWorks((prev) => prev.map((w) => (w.id === msg.object.id ? { ...w, ...msg.object } : w)));
    }
    if (msg.type === "work-deleted") {
      if (!msg.object) {
        fetchWorks();
        return;
      }
      setWorks((prev) => prev.filter((w) => w.id !== msg.object.workId));
    }
  });

  const deleteWork = async (workId: number) => {
    Alert.alert("Удалить работу?", "Это действие нельзя отменить", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await authRequest(async (token) => {
              await axios.delete(`https://api.stroydoks.ru/mobile/objects/works/${workId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            });
            setWorks((prev) => prev.filter((w) => w.id !== workId));
          } catch (err) {
            Alert.alert("Ошибка", "Не удалось удалить работу");
          }
        },
      },
    ]);
  };

  const copyWork = async (work: WorkItem) => {
    try {
      await authRequest(async (token) => {
        await axios.post(
          `https://api.stroydoks.ru/mobile/objects/${objectId}/works`,
          {
            title: work.title,
            unit: work.unit,
            quantity: work.quantity,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      });
      fetchWorks();
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось скопировать работу");
    }
  };

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
    try {
      await authRequest(async (token) => {
        const res = await axios.put(
          `https://api.stroydoks.ru/mobile/objects/works/${workId}/accept`,
          { accepted },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
      });
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, accepted } : w)));
    } catch (err) {
      console.error("toggleAccept error", err);
      Alert.alert("Ошибка", "Не удалось обновить статус");
    }
  };

  const hasAccepted = works.some((w) => w.accepted);
  const exportReport = async () => {
    try {
      await authRequest(async (token) => {
        const res = await axios.post(
          `https://api.stroydoks.ru/mobile/objects/${objectId}/export`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Export success:", res.data);
      });
      Alert.alert("Успех", "Отчет выгружен!");
    } catch (err: any) {
      console.error("exportReport error", err);
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
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {item.title} ({item.unit}) - {item.quantity}
              </Text>
            </View>
            <TouchableOpacity onPress={() => copyWork(item)}>
              <Copy size={20} color="#000" />
            </TouchableOpacity>
            {!item.accepted && (
              <>
                <TouchableOpacity onPress={() => openEditModal(item)}>
                  <Pencil size={20} color="#007AFF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteWork(item.id)}>
                  <Trash2 size={20} color="#FF3B30" />
                </TouchableOpacity>
              </>
            )}
            {currentUser.role === "foreman" && (
              <Switch value={item.accepted} onValueChange={(val) => toggleAccept(item.id, val)} />
            )}
          </View>
        )}
      />

      {currentUser.role === "foreman" && hasAccepted && (
        <Button containerStyle={{ marginBottom: 20 }} title="Экспортировать отчет" onPress={exportReport} />
      )}
      <Button containerStyle={{ marginBottom: 50 }} title="Назад" onPress={() => navigation.goBack()} />
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Редактировать работу</Text>
            <TextInput placeholder="Название" value={editTitle} onChangeText={setEditTitle} style={styles.input} />
            <TextInput placeholder="Ед. изм." value={editUnit} onChangeText={setEditUnit} style={styles.input} />
            <TextInput
              placeholder="Количество"
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <Button containerStyle={{ marginBottom: 10 }} title="Сохранить" onPress={saveEdit} />
            <Button title="Отмена" onPress={() => setEditModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    padding: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  titleContainer: {
    width: "45%",
  },
  titleText: {
    fontSize: 20,
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
});
